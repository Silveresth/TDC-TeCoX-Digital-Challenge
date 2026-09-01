from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StartOrResumeAttemptView,
    SaveAnswerView,
    UploadPracticalFileView,
    SubmitAttemptView,
    ParticipantAttemptsListView,
    AttemptAdminViewSet
)

router = DefaultRouter()
router.register(r'admin-attempts', AttemptAdminViewSet, basename='admin-attempts')

urlpatterns = [
    path('start/<int:trial_id>/', StartOrResumeAttemptView.as_view(), name='start_or_resume_attempt'),
    path('save/<int:attempt_id>/', SaveAnswerView.as_view(), name='save_answer'),
    path('upload/<int:attempt_id>/<int:question_id>/', UploadPracticalFileView.as_view(), name='upload_practical_file'),
    path('submit/<int:attempt_id>/', SubmitAttemptView.as_view(), name='submit_attempt'),
    path('my-history/', ParticipantAttemptsListView.as_view(), name='participant_attempts_history'),
    path('', include(router.urls)),
]
