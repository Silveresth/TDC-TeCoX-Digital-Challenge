import os
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Attempt, Answer, AttemptStatus
from .grading import grade_objective_answer, grade_practical_answer, finalize_attempt
from .serializers import (
    AttemptParticipantSerializer,
    AttemptAdminSerializer,
    AnswerParticipantSerializer,
    AnswerAdminSerializer,
    GradePracticalAnswerSerializer
)
from apps.competitions.models import Trial, Question, Option, TrialStatus, QuestionType
from apps.competitions.serializers import QuestionParticipantSerializer
from apps.authentication.permissions import IsAdminUserRole, IsJuryOrAdmin

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

class StartOrResumeAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, trial_id):
        user = request.user
        try:
            trial = Trial.objects.get(id=trial_id)
        except Trial.DoesNotExist:
            return Response({'detail': 'Épreuve introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Check trial availability for participants
        if user.role == 'PARTICIPANT':
            if trial.status not in [TrialStatus.OPEN, TrialStatus.IN_PROGRESS]:
                return Response({'detail': f"Cette épreuve n'est pas ouverte ({trial.get_status_display()})."}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing attempt
        attempt, created = Attempt.objects.get_or_create(
            participant=user,
            trial=trial,
            defaults={
                'status': AttemptStatus.IN_PROGRESS,
                'ip_address': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:250],
                'max_possible_score': trial.max_score or trial.total_calculated_points or 100.0
            }
        )

        # Check if already submitted
        if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED]:
            serializer = AttemptParticipantSerializer(attempt)
            return Response({
                'attempt': serializer.data,
                'is_completed': True,
                'detail': 'Cette épreuve a déjà été soumise.'
            })

        # Check if timer expired
        if trial.duration_minutes > 0:
            now = timezone.now()
            elapsed_seconds = (now - attempt.started_at).total_seconds()
            allowed_seconds = trial.duration_minutes * 60
            if elapsed_seconds >= allowed_seconds:
                finalize_attempt(attempt, reason='expired')
                serializer = AttemptParticipantSerializer(attempt)
                return Response({
                    'attempt': serializer.data,
                    'is_completed': True,
                    'detail': 'Le temps alloué pour cette épreuve est écoulé.'
                })

        # Ensure all questions have an Answer initialized
        questions = trial.questions.all()
        existing_q_ids = set(attempt.answers.values_list('question_id', flat=True))
        for q in questions:
            if q.id not in existing_q_ids:
                Answer.objects.create(attempt=attempt, question=q)

        # Log start event
        if created:
            try:
                from apps.analytics.models import AuditLog
                AuditLog.objects.create(
                    user=user,
                    action='TRIAL_START',
                    description=f"{user.full_name} a débuté l'épreuve '{trial.title}'"
                )
            except Exception:
                pass

        # Prepare question list and current answers
        q_serializer = QuestionParticipantSerializer(questions, many=True)
        attempt_serializer = AttemptParticipantSerializer(attempt)

        return Response({
            'attempt': attempt_serializer.data,
            'questions': q_serializer.data,
            'is_completed': False
        })


class SaveAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = Attempt.objects.get(id=attempt_id, participant=request.user)
        except Attempt.DoesNotExist:
            return Response({'detail': 'Tentative introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status != AttemptStatus.IN_PROGRESS:
            return Response({'detail': 'Cette épreuve est déjà finalisée.'}, status=status.HTTP_400_BAD_REQUEST)

        # Server-side timer check
        if attempt.trial.duration_minutes > 0:
            now = timezone.now()
            elapsed = (now - attempt.started_at).total_seconds()
            if elapsed >= (attempt.trial.duration_minutes * 60):
                finalize_attempt(attempt, reason='expired')
                return Response({'detail': 'Temps écoulé ! Épreuve enregistrée automatiquement.', 'expired': True}, status=status.HTTP_400_BAD_REQUEST)

        question_id = request.data.get('question_id')
        option_ids = request.data.get('option_ids', [])
        text_answer = request.data.get('text_answer', '')

        try:
            question = Question.objects.get(id=question_id, trial=attempt.trial)
        except Question.DoesNotExist:
            return Response({'detail': 'Question introuvable pour cette épreuve.'}, status=status.HTTP_404_NOT_FOUND)

        answer, _ = Answer.objects.get_or_create(attempt=attempt, question=question)

        if question.question_type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE]:
            valid_options = Option.objects.filter(question=question, id__in=option_ids)
            answer.selected_options.set(valid_options)
        elif question.question_type in [QuestionType.SHORT_TEXT, QuestionType.NUMERIC]:
            answer.text_answer = str(text_answer).strip()

        answer.save()
        return Response({'detail': 'Réponse enregistrée.', 'saved_at': timezone.now().isoformat()})


class UploadPracticalFileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, attempt_id, question_id):
        try:
            attempt = Attempt.objects.get(id=attempt_id, participant=request.user)
        except Attempt.DoesNotExist:
            return Response({'detail': 'Tentative introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status != AttemptStatus.IN_PROGRESS:
            return Response({'detail': 'Cette tentative est déjà finalisée.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question = Question.objects.get(id=question_id, trial=attempt.trial, question_type=QuestionType.PRACTICAL)
        except Question.DoesNotExist:
            return Response({'detail': 'Mission pratique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extension check
        ext = os.path.splitext(file_obj.name)[1].lower()
        allowed = [e.strip().lower() for e in question.practical_allowed_extensions.split(',') if e.strip()]
        if allowed and ext not in allowed:
            return Response({'detail': f'Format non autorisé ({ext}). Formats acceptés : {", ".join(allowed)}'}, status=status.HTTP_400_BAD_REQUEST)

        answer, _ = Answer.objects.get_or_create(attempt=attempt, question=question)
        answer.file_upload = file_obj
        answer.original_filename = file_obj.name
        answer.file_size_bytes = file_obj.size
        answer.save()

        return Response({
            'detail': 'Fichier de mission téléversé avec succès.',
            'filename': file_obj.name,
            'size': file_obj.size,
            'file_url': answer.file_upload.url if answer.file_upload else None
        })


class SubmitAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = Attempt.objects.get(id=attempt_id, participant=request.user)
        except Attempt.DoesNotExist:
            return Response({'detail': 'Tentative introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        time_spent = request.data.get('time_spent_seconds')
        if time_spent is not None:
            try:
                attempt.time_spent_seconds = int(time_spent)
            except ValueError:
                pass

        finalize_attempt(attempt, reason='submitted')
        serializer = AttemptParticipantSerializer(attempt)
        return Response({
            'detail': 'Épreuve soumise avec succès !',
            'attempt': serializer.data
        })


class ParticipantAttemptsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        attempts = Attempt.objects.filter(participant=request.user).select_related('trial').order_by('trial__order')
        serializer = AttemptParticipantSerializer(attempts, many=True)
        return Response(serializer.data)


class AttemptAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Attempt.objects.all().select_related('participant', 'trial').prefetch_related('answers__question', 'answers__selected_options').order_by('-started_at')
    serializer_class = AttemptAdminSerializer
    permission_classes = [IsJuryOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        trial_id = self.request.query_params.get('trial')
        participant_id = self.request.query_params.get('participant')
        status_filter = self.request.query_params.get('status')
        pending_practical = self.request.query_params.get('pending_practical')

        if trial_id:
            qs = qs.filter(trial_id=trial_id)
        if participant_id:
            qs = qs.filter(participant_id=participant_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if pending_practical == 'true':
            qs = qs.filter(
                answers__question__question_type=QuestionType.PRACTICAL,
                answers__is_graded=False
            ).distinct()

        return qs

    @action(detail=False, methods=['post'], url_path='grade-answer/(?P<answer_id>[^/.]+)')
    def grade_practical(self, request, answer_id=None):
        """Grades a specific practical answer: score and feedback"""
        try:
            answer = Answer.objects.select_related('attempt', 'question').get(id=answer_id)
        except Answer.DoesNotExist:
            return Response({'detail': 'Réponse introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GradePracticalAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        score = serializer.validated_data['score']
        feedback = serializer.validated_data.get('feedback', '')

        grade_practical_answer(
            answer=answer,
            score=score,
            feedback=feedback,
            jury_user=request.user
        )

        return Response({
            'detail': 'Correction enregistrée avec succès.',
            'answer': AnswerAdminSerializer(answer).data,
            'attempt_score': answer.attempt.total_score,
            'attempt_percentage': answer.attempt.percentage,
            'attempt_status': answer.attempt.status
        })

    @action(detail=True, methods=['post'])
    def override_score(self, request, pk=None):
        """Manually adjust score of an attempt by Admin"""
        attempt = self.get_object()
        score = request.data.get('total_score')
        if score is None:
            return Response({'detail': 'Score total requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            attempt.total_score = float(score)
            if attempt.max_possible_score > 0:
                attempt.percentage = round((attempt.total_score / attempt.max_possible_score) * 100, 2)
            attempt.save(update_fields=['total_score', 'percentage'])
            return Response({'detail': 'Score mis à jour.', 'attempt': AttemptAdminSerializer(attempt).data})
        except ValueError:
            return Response({'detail': 'Score invalide.'}, status=status.HTTP_400_BAD_REQUEST)
