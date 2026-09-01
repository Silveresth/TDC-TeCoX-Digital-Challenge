from django.contrib import admin
from .models import Trial, Question, Option

class OptionInline(admin.TabularInline):
    model = Option
    extra = 4

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    show_change_link = True

@admin.register(Trial)
class TrialAdmin(admin.ModelAdmin):
    list_display = ('order', 'title', 'category', 'status', 'duration_minutes', 'max_score', 'weight')
    list_filter = ('category', 'status')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('order', 'id')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('order', 'trial', 'question_type', 'prompt', 'points', 'difficulty')
    list_filter = ('trial', 'question_type', 'difficulty')
    search_fields = ('prompt', 'explanation', 'practical_instructions')
    inlines = [OptionInline]
    ordering = ('trial', 'order', 'id')

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ('question', 'text', 'is_correct', 'order')
    list_filter = ('is_correct', 'question__trial')
    search_fields = ('text',)
