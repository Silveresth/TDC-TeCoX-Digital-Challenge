import io
from django.http import HttpResponse
from django.db.models import Avg, Count, Max, Min, Q
from django.utils import timezone
from rest_framework import views, status, permissions
from rest_framework.response import Response

from .models import CompetitionSetting, AuditLog
from .serializers import CompetitionSettingSerializer, AuditLogSerializer
from .exporters import export_leaderboard_excel, export_leaderboard_csv
from apps.authentication.models import TdcUser
from apps.competitions.models import Trial, TrialStatus, QuestionType
from apps.attempts.models import Attempt, AttemptStatus, Answer
from apps.authentication.permissions import IsAdminUserRole, IsJuryOrAdmin

class LeaderboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings = CompetitionSetting.get_settings()
        user = request.user

        # If leaderboard is hidden by admin and user is not admin/jury
        if not settings.is_leaderboard_public and user.role == 'PARTICIPANT':
            return Response({
                'is_hidden': True,
                'message': 'Le classement est temporairement masqué par les organisateurs.',
                'settings': CompetitionSettingSerializer(settings).data
            })

        trial_id = request.query_params.get('trial_id')
        team_filter = request.query_params.get('team')
        search = request.query_params.get('search')

        trials = list(Trial.objects.all().order_by('order', 'id'))
        participants_qs = TdcUser.objects.filter(role='PARTICIPANT', is_active=True)

        if team_filter:
            participants_qs = participants_qs.filter(team_group__icontains=team_filter)
        if search:
            participants_qs = participants_qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(participant_code__icontains=search)
            )

        participants = list(participants_qs)
        total_possible_all_trials = sum(t.max_score for t in trials) or 1.0

        # Build rank list
        ranking_list = []
        for p in participants:
            attempts_map = {a.trial_id: a for a in Attempt.objects.filter(participant=p, is_final=True)}
            p_total_score = 0.0
            p_total_seconds = 0
            p_completed_count = 0
            trial_scores_dict = {}

            for t in trials:
                att = attempts_map.get(t.id)
                if att and att.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED]:
                    trial_scores_dict[t.id] = {
                        'score': att.total_score,
                        'max_score': att.max_possible_score,
                        'percentage': att.percentage,
                        'status': att.status,
                        'time_spent': att.time_spent_seconds
                    }
                    p_total_score += att.total_score
                    p_total_seconds += att.time_spent_seconds
                    p_completed_count += 1
                else:
                    trial_scores_dict[t.id] = {
                        'score': 0.0,
                        'max_score': t.max_score,
                        'percentage': 0.0,
                        'status': 'not_started',
                        'time_spent': 0
                    }

            global_pct = round((p_total_score / total_possible_all_trials) * 100, 2)

            ranking_list.append({
                'participant_id': p.id,
                'participant_code': p.participant_code or '',
                'full_name': p.full_name,
                'team_group': p.team_group or '',
                'avatar': p.avatar.url if p.avatar else None,
                'total_score': round(p_total_score, 2),
                'max_possible_score': total_possible_all_trials,
                'global_percentage': global_pct,
                'completed_trials_count': p_completed_count,
                'total_time_seconds': p_total_seconds,
                'trials': trial_scores_dict
            })

        # Sort: specific trial score OR global total score
        if trial_id:
            try:
                t_id_int = int(trial_id)
                ranking_list.sort(
                    key=lambda x: (
                        x['trials'].get(t_id_int, {}).get('score', 0),
                        -x['trials'].get(t_id_int, {}).get('time_spent', 999999)
                    ),
                    reverse=True
                )
            except ValueError:
                ranking_list.sort(key=lambda x: (x['total_score'], -x['total_time_seconds']), reverse=True)
        else:
            ranking_list.sort(key=lambda x: (x['total_score'], -x['total_time_seconds']), reverse=True)

        # Assign ranks
        for idx, item in enumerate(ranking_list, start=1):
            item['rank'] = idx

        # Podium
        podium = ranking_list[:3]

        return Response({
            'is_hidden': False,
            'settings': CompetitionSettingSerializer(settings).data,
            'total_participants': len(participants),
            'trials': [{'id': t.id, 'title': t.title, 'order': t.order, 'max_score': t.max_score, 'category': t.category} for t in trials],
            'podium': podium,
            'leaderboard': ranking_list
        })


class DashboardStatsView(views.APIView):
    permission_classes = [IsJuryOrAdmin]

    def get(self, request):
        total_participants = TdcUser.objects.filter(role='PARTICIPANT').count()
        active_participants = TdcUser.objects.filter(role='PARTICIPANT', is_active=True).count()
        
        # Connected/recent participants (active in last 30 minutes)
        thirty_mins_ago = timezone.now() - timezone.timedelta(minutes=30)
        online_participants = TdcUser.objects.filter(role='PARTICIPANT', last_activity__gte=thirty_mins_ago).count()

        total_trials = Trial.objects.count()
        open_trials = Trial.objects.filter(status=TrialStatus.OPEN).count()
        in_progress_trials = Trial.objects.filter(status=TrialStatus.IN_PROGRESS).count()
        completed_trials = Trial.objects.filter(status=TrialStatus.COMPLETED).count()

        attempts_qs = Attempt.objects.filter(is_final=True)
        total_attempts = attempts_qs.count()
        submitted_attempts = attempts_qs.filter(status__in=[AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED]).count()

        # Pending practical answers to grade
        pending_practicals = Answer.objects.filter(
            question__question_type=QuestionType.PRACTICAL,
            is_graded=False,
            attempt__status__in=[AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED]
        ).count()

        # Average percentage and scores
        avg_pct_data = attempts_qs.filter(status__in=[AttemptStatus.SUBMITTED, AttemptStatus.GRADED]).aggregate(avg=Avg('percentage'))
        avg_percentage = round(avg_pct_data['avg'] or 0.0, 1)

        # Top participant
        participants = TdcUser.objects.filter(role='PARTICIPANT', is_active=True)
        top_user = None
        top_score = -1
        for p in participants:
            p_score = sum(a.total_score for a in p.attempts.filter(is_final=True))
            if p_score > top_score:
                top_score = p_score
                top_user = p

        top_participant_data = None
        if top_user and top_score > 0:
            top_participant_data = {
                'id': top_user.id,
                'name': top_user.full_name,
                'code': top_user.participant_code,
                'score': round(top_score, 2),
                'avatar': top_user.avatar.url if top_user.avatar else None
            }

        # Trial performance breakdown
        trial_stats = []
        for t in Trial.objects.all().order_by('order'):
            t_attempts = t.attempts.filter(status__in=[AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED])
            t_avg = t_attempts.aggregate(avg=Avg('percentage'), avg_time=Avg('time_spent_seconds'), count=Count('id'))
            trial_stats.append({
                'id': t.id,
                'order': t.order,
                'title': t.title,
                'category': t.category,
                'status': t.status,
                'max_score': t.max_score,
                'attempts_count': t_avg['count'] or 0,
                'average_score_pct': round(t_avg['avg'] or 0.0, 1),
                'average_time_minutes': round((t_avg['avg_time'] or 0) / 60, 1)
            })

        # Easiest & hardest trial
        valid_trials_with_scores = [ts for ts in trial_stats if ts['attempts_count'] > 0]
        easiest_trial = max(valid_trials_with_scores, key=lambda x: x['average_score_pct']) if valid_trials_with_scores else None
        hardest_trial = min(valid_trials_with_scores, key=lambda x: x['average_score_pct']) if valid_trials_with_scores else None

        # Score distribution brackets
        distribution = {
            '0_49': attempts_qs.filter(percentage__lt=50).count(),
            '50_69': attempts_qs.filter(percentage__gte=50, percentage__lt=70).count(),
            '70_84': attempts_qs.filter(percentage__gte=70, percentage__lt=85).count(),
            '85_100': attempts_qs.filter(percentage__gte=85).count(),
        }

        # Recent activities (audit log preview)
        recent_logs = AuditLog.objects.select_related('user')[:10]
        recent_logs_data = AuditLogSerializer(recent_logs, many=True).data

        return Response({
            'kpis': {
                'total_participants': total_participants,
                'active_participants': active_participants,
                'online_participants': online_participants,
                'total_trials': total_trials,
                'open_trials': open_trials,
                'in_progress_trials': in_progress_trials,
                'completed_trials': completed_trials,
                'total_attempts': total_attempts,
                'submitted_attempts': submitted_attempts,
                'pending_practicals': pending_practicals,
                'average_percentage': avg_percentage,
            },
            'top_participant': top_participant_data,
            'easiest_trial': easiest_trial,
            'hardest_trial': hardest_trial,
            'trial_stats': trial_stats,
            'distribution': distribution,
            'recent_logs': recent_logs_data
        })


class AuditLogListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = AuditLog.objects.select_related('user')
        action_filter = request.query_params.get('action')
        search = request.query_params.get('search')

        if action_filter:
            qs = qs.filter(action=action_filter)
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search)
            )

        logs = qs[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class CompetitionSettingView(views.APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get(self, request):
        settings = CompetitionSetting.get_settings()
        serializer = CompetitionSettingSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings = CompetitionSetting.get_settings()
        serializer = CompetitionSettingSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Log settings update
            try:
                AuditLog.objects.create(
                    user=request.user,
                    action='SETTINGS_CHANGE',
                    description=f"Paramètres de compétition mis à jour par {request.user.full_name}"
                )
            except Exception:
                pass

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExportResultsView(views.APIView):
    permission_classes = [IsJuryOrAdmin]

    def get(self, request):
        format_type = (
            request.query_params.get('export_type')
            or request.query_params.get('format')
            or request.query_params.get('type')
            or 'excel'
        ).lower()

        if format_type == 'csv':
            csv_content = export_leaderboard_csv()
            response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = 'attachment; filename="resultats_tdc_2026.csv"'
            return response

        # Default Excel (.xlsx)
        excel_buffer = export_leaderboard_excel()
        response = HttpResponse(
            excel_buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="resultats_complets_tdc_2026.xlsx"'
        return response
