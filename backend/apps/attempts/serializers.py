from rest_framework import serializers
from django.utils import timezone
from .models import Attempt, Answer, AttemptStatus
from apps.competitions.models import Trial, Question, Option, QuestionType
from apps.competitions.serializers import QuestionParticipantSerializer, OptionParticipantSerializer, QuestionAdminSerializer
from apps.authentication.serializers import TdcUserSerializer

class AnswerParticipantSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='question.id', read_only=True)
    selected_option_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Option.objects.all(),
        source='selected_options',
        required=False
    )

    class Meta:
        model = Answer
        fields = [
            'id', 'question_id', 'selected_option_ids',
            'text_answer', 'file_upload', 'original_filename',
            'score_awarded', 'is_graded', 'is_correct',
            'jury_feedback', 'updated_at'
        ]
        read_only_fields = ['id', 'question_id', 'score_awarded', 'is_graded', 'is_correct', 'jury_feedback', 'updated_at']

class AnswerAdminSerializer(serializers.ModelSerializer):
    question = QuestionAdminSerializer(read_only=True)
    selected_options = OptionParticipantSerializer(many=True, read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.full_name', read_only=True)

    class Meta:
        model = Answer
        fields = [
            'id', 'question', 'selected_options',
            'text_answer', 'file_upload', 'original_filename',
            'file_size_bytes', 'score_awarded', 'is_graded',
            'is_correct', 'jury_feedback', 'graded_by_name',
            'graded_at', 'updated_at'
        ]

class AttemptParticipantSerializer(serializers.ModelSerializer):
    trial_title = serializers.CharField(source='trial.title', read_only=True)
    trial_order = serializers.IntegerField(source='trial.order', read_only=True)
    trial_category = serializers.CharField(source='trial.category', read_only=True)
    remaining_seconds = serializers.SerializerMethodField()
    answers = AnswerParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = [
            'id', 'trial', 'trial_title', 'trial_order', 'trial_category',
            'status', 'started_at', 'submitted_at', 'time_spent_seconds',
            'remaining_seconds', 'auto_score', 'manual_score',
            'total_score', 'max_possible_score', 'percentage',
            'is_final', 'answers'
        ]
        read_only_fields = [
            'id', 'trial_title', 'trial_order', 'trial_category',
            'status', 'started_at', 'submitted_at',
            'auto_score', 'manual_score', 'total_score',
            'max_possible_score', 'percentage', 'is_final'
        ]

    def get_remaining_seconds(self, obj):
        if obj.status != AttemptStatus.IN_PROGRESS:
            return 0
        if obj.trial.duration_minutes <= 0:
            return 999999 # unlimited
        now = timezone.now()
        elapsed = (now - obj.started_at).total_seconds()
        total_allowed = obj.trial.duration_minutes * 60
        remaining = max(0, int(total_allowed - elapsed))
        return remaining

class AttemptAdminSerializer(serializers.ModelSerializer):
    participant = TdcUserSerializer(read_only=True)
    trial_title = serializers.CharField(source='trial.title', read_only=True)
    trial_order = serializers.IntegerField(source='trial.order', read_only=True)
    answers = AnswerAdminSerializer(many=True, read_only=True)
    pending_practical_count = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = [
            'id', 'participant', 'trial', 'trial_title', 'trial_order',
            'status', 'started_at', 'submitted_at', 'time_spent_seconds',
            'auto_score', 'manual_score', 'total_score', 'max_possible_score',
            'percentage', 'is_final', 'ip_address', 'answers',
            'pending_practical_count'
        ]

    def get_pending_practical_count(self, obj):
        return obj.answers.filter(
            question__question_type=QuestionType.PRACTICAL,
            is_graded=False
        ).count()

class SaveAnswerRequestSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(required=True)
    option_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    text_answer = serializers.CharField(required=False, allow_blank=True, default='')

class GradePracticalAnswerSerializer(serializers.Serializer):
    score = serializers.FloatField(required=True, min_value=0.0)
    feedback = serializers.CharField(required=False, allow_blank=True, default='')
