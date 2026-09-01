from rest_framework import serializers
from .models import CompetitionSetting, AuditLog
from apps.authentication.serializers import TdcUserSerializer

class CompetitionSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionSetting
        fields = [
            'id', 'competition_name', 'edition',
            'is_leaderboard_public', 'is_competition_active',
            'allow_registrations', 'banner_message', 'updated_at'
        ]

class AuditLogSerializer(serializers.ModelSerializer):
    user = TdcUserSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'action_display', 'description', 'ip_address', 'created_at']
