from django.urls import path
from .views import (
    LeaderboardView,
    DashboardStatsView,
    AuditLogListView,
    CompetitionSettingView,
    ExportResultsView
)

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('logs/', AuditLogListView.as_view(), name='audit_logs'),
    path('settings/', CompetitionSettingView.as_view(), name='competition_settings'),
    path('export/', ExportResultsView.as_view(), name='export_results'),
]
