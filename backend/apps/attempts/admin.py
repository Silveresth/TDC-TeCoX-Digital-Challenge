from django.contrib import admin
from .models import Attempt, Answer

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    fields = ('question', 'score_awarded', 'is_graded', 'is_correct', 'file_upload')
    readonly_fields = ('question', 'is_correct')
    show_change_link = True

@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('participant', 'trial', 'status', 'total_score', 'max_possible_score', 'percentage', 'started_at', 'submitted_at')
    list_filter = ('status', 'trial', 'is_final')
    search_fields = ('participant__username', 'participant__first_name', 'participant__last_name', 'participant__participant_code')
    inlines = [AnswerInline]
    ordering = ('-started_at',)

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'score_awarded', 'is_graded', 'is_correct', 'graded_by', 'graded_at')
    list_filter = ('is_graded', 'is_correct', 'question__trial')
    search_fields = ('attempt__participant__username', 'text_answer', 'jury_feedback')
