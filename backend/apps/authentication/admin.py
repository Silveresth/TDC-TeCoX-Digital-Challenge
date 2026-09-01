from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import TdcUser

@admin.register(TdcUser)
class TdcUserAdmin(UserAdmin):
    list_display = ('participant_code', 'username', 'full_name', 'role', 'team_group', 'is_active', 'last_activity')
    list_filter = ('role', 'is_active', 'team_group')
    search_fields = ('username', 'first_name', 'last_name', 'participant_code', 'email')
    ordering = ('participant_code', 'last_name', 'first_name')

    fieldsets = UserAdmin.fieldsets + (
        ('Informations TDC', {
            'fields': ('role', 'participant_code', 'team_group', 'phone_number', 'avatar', 'notes', 'last_activity')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations TDC', {
            'fields': ('role', 'participant_code', 'team_group', 'phone_number', 'first_name', 'last_name', 'email')
        }),
    )
