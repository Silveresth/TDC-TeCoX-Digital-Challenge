from rest_framework import serializers
from .models import Trial, Question, Option

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct', 'order']

class OptionParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'order']

class QuestionAdminSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'trial', 'question_type', 'prompt',
            'image', 'attachment', 'attachment_name',
            'points', 'order', 'difficulty', 'explanation',
            'practical_instructions', 'practical_allowed_extensions',
            'correct_text_answer', 'is_case_sensitive', 'created_at',
            'options'
        ]

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for opt in options_data:
            Option.objects.create(question=question, **opt)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if options_data is not None:
            # Replace existing options
            instance.options.all().delete()
            for opt in options_data:
                Option.objects.create(question=instance, **opt)
        return instance

class QuestionParticipantSerializer(serializers.ModelSerializer):
    options = OptionParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'prompt',
            'image', 'attachment', 'attachment_name',
            'points', 'order', 'difficulty',
            'practical_instructions', 'practical_allowed_extensions',
            'options'
        ]

class TrialAdminSerializer(serializers.ModelSerializer):
    questions = QuestionAdminSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    total_calculated_points = serializers.FloatField(read_only=True)

    class Meta:
        model = Trial
        fields = [
            'id', 'title', 'slug', 'category', 'description',
            'instructions', 'duration_minutes', 'max_score',
            'weight', 'order', 'status', 'starts_at', 'ends_at',
            'allow_multiple_attempts', 'shuffle_questions',
            'show_results_immediately', 'question_count',
            'total_calculated_points', 'created_at', 'updated_at',
            'questions'
        ]

class TrialParticipantSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    user_attempt = serializers.SerializerMethodField()

    class Meta:
        model = Trial
        fields = [
            'id', 'title', 'slug', 'category', 'description',
            'instructions', 'duration_minutes', 'max_score',
            'weight', 'order', 'status', 'starts_at', 'ends_at',
            'question_count', 'user_attempt'
        ]

    def get_user_attempt(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'PARTICIPANT':
            from apps.attempts.models import Attempt
            attempt = Attempt.objects.filter(trial=obj, participant=request.user).order_by('-id').first()
            if attempt:
                return {
                    'id': attempt.id,
                    'status': attempt.status,
                    'total_score': attempt.total_score,
                    'percentage': attempt.percentage,
                    'started_at': attempt.started_at,
                    'submitted_at': attempt.submitted_at,
                    'time_spent_seconds': attempt.time_spent_seconds,
                    'is_final': attempt.is_final
                }
        return None
