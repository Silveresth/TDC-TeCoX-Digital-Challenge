from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomLoginView,
    CurrentUserProfileView,
    ChangePasswordView,
    ParticipantViewSet,
    JuryViewSet
)

router = DefaultRouter()
router.register(r'participants', ParticipantViewSet, basename='participants')
router.register(r'jury', JuryViewSet, basename='jury')

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserProfileView.as_view(), name='current_user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('', include(router.urls)),
]
