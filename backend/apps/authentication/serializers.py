from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import TdcUser

class TdcUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = TdcUser
        fields = [
            'id', 'username', 'email', 'participant_code',
            'first_name', 'last_name', 'full_name',
            'role', 'team_group', 'phone_number',
            'avatar', 'is_active', 'last_activity', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'last_activity']

class ParticipantAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    total_score = serializers.SerializerMethodField()
    completed_trials = serializers.SerializerMethodField()

    class Meta:
        model = TdcUser
        fields = [
            'id', 'username', 'email', 'participant_code',
            'first_name', 'last_name', 'full_name',
            'role', 'team_group', 'phone_number',
            'avatar', 'is_active', 'notes', 'last_activity',
            'date_joined', 'password', 'total_score', 'completed_trials'
        ]
        read_only_fields = ['id', 'date_joined', 'last_activity']

    def get_total_score(self, obj):
        # We will calculate aggregated score from finalized attempts
        from apps.attempts.models import Attempt
        attempts = Attempt.objects.filter(participant=obj, is_final=True)
        return sum(a.total_score for a in attempts)

    def get_completed_trials(self, obj):
        from apps.attempts.models import Attempt
        return Attempt.objects.filter(
            participant=obj,
            status__in=['submitted', 'graded']
        ).values('trial_id').distinct().count()

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = TdcUser(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Default password if not provided
            user.set_password('Tdc2026!')
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenObtainPairSerializer(serializers.Serializer):
    login = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        login = attrs.get('login', '').strip()
        password = attrs.get('password', '')

        # Try to find user by username, email, or participant_code
        try:
            user = TdcUser.objects.get(
                Q(username__iexact=login) |
                Q(email__iexact=login) |
                Q(participant_code__iexact=login)
            )
        except TdcUser.DoesNotExist:
            raise serializers.ValidationError({"detail": "Identifiant ou code introuvable."})
        except TdcUser.MultipleObjectsReturned:
            user = TdcUser.objects.filter(
                Q(username__iexact=login) |
                Q(email__iexact=login) |
                Q(participant_code__iexact=login)
            ).first()

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Mot de passe incorrect."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Ce compte participant est désactivé. Veuillez contacter un administrateur."})

        # Update last activity
        from django.utils import timezone
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])

        # Log action in analytics
        try:
            from apps.analytics.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action='LOGIN',
                description=f"Connexion réussie de {user.full_name} ({user.role})"
            )
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        # Custom claims
        refresh['role'] = user.role
        refresh['username'] = user.username

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': TdcUserSerializer(user).data
        }

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
