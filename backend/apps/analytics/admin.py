from django.contrib import admin
from .models import CompetitionSetting, AuditLog

@admin.register(CompetitionSetting)
class CompetitionSettingAdmin(admin.ModelAdmin):
    list_display = ('competition_name', 'edition', 'is_leaderboard_public', 'is_competition_active', 'updated_at')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action', 'description', 'ip_address')
    list_filter = ('action', 'created_at')
    search_fields = ('description', 'user__username', 'user__first_name', 'user__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'user', 'action', 'description', 'ip_address')
