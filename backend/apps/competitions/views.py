from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q

from .models import Trial, Question, Option, TrialStatus
from .serializers import (
    TrialAdminSerializer,
    TrialParticipantSerializer,
    QuestionAdminSerializer,
    QuestionParticipantSerializer,
    OptionSerializer
)
from apps.authentication.permissions import IsAdminUserRole, IsJuryOrAdmin

class TrialViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'participant_view']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_serializer_class(self):
        if self.request.user.is_authenticated and (self.request.user.role == 'ADMIN' or self.request.user.is_staff):
            return TrialAdminSerializer
        return TrialParticipantSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.role in ['ADMIN', 'JURY'] or user.is_staff):
            return Trial.objects.all().prefetch_related('questions__options').order_by('order', 'id')
        # Participants only see trials that are OPEN, IN_PROGRESS, or COMPLETED
        return Trial.objects.filter(status__in=[TrialStatus.OPEN, TrialStatus.IN_PROGRESS, TrialStatus.COMPLETED]).order_by('order', 'id')

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def set_status(self, request, pk=None):
        trial = self.get_object()
        new_status = request.data.get('status')
        if new_status not in TrialStatus.values:
            return Response({'detail': f'Statut invalide. Choix: {TrialStatus.values}'}, status=status.HTTP_400_BAD_REQUEST)
        trial.status = new_status
        trial.save(update_fields=['status', 'updated_at'])

        # Log action
        try:
            from apps.analytics.models import AuditLog
            AuditLog.objects.create(
                user=request.user,
                action='TRIAL_STATUS_CHANGE',
                description=f"Statut de l'épreuve '{trial.title}' changé à '{trial.get_status_display()}'"
            )
        except Exception:
            pass

        return Response({'detail': f"Statut mis à jour : {trial.get_status_display()}", 'status': trial.status})

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUserRole])
    def bulk_reorder(self, request):
        """Expects payload: [{'id': 1, 'order': 1}, {'id': 2, 'order': 2}, ...]"""
        items = request.data.get('orders', [])
        for item in items:
            trial_id = item.get('id')
            order_num = item.get('order')
            if trial_id and order_num is not None:
                Trial.objects.filter(id=trial_id).update(order=order_num)
        return Response({'detail': 'Ordre des épreuves mis à jour avec succès.'})


class QuestionViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_serializer_class(self):
        if self.request.user.is_authenticated and (self.request.user.role in ['ADMIN', 'JURY'] or self.request.user.is_staff):
            return QuestionAdminSerializer
        return QuestionParticipantSerializer

    def get_queryset(self):
        queryset = Question.objects.all().prefetch_related('options')
        trial_id = self.request.query_params.get('trial')
        if trial_id:
            queryset = queryset.filter(trial_id=trial_id)
        return queryset.order_by('order', 'id')

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUserRole])
    def bulk_reorder(self, request):
        """Expects payload: [{'id': 1, 'order': 1}, ...]"""
        items = request.data.get('orders', [])
        for item in items:
            q_id = item.get('id')
            order_num = item.get('order')
            if q_id and order_num is not None:
                Question.objects.filter(id=q_id).update(order=order_num)
        return Response({'detail': 'Ordre des questions mis à jour avec succès.'})


class OptionViewSet(viewsets.ModelViewSet):
    queryset = Option.objects.all().order_by('order', 'id')
    serializer_class = OptionSerializer
    permission_classes = [IsAdminUserRole]
