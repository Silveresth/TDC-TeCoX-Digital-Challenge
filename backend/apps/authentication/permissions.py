from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to users with role='ADMIN' or is_staff/is_superuser.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class IsJuryOrAdmin(permissions.BasePermission):
    """
    Allows access to Admins and Jury/Graders.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['ADMIN', 'JURY'] or request.user.is_staff or request.user.is_superuser)
        )

class IsParticipant(permissions.BasePermission):
    """
    Allows access to participants.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'PARTICIPANT'
        )

class IsSelfOrAdmin(permissions.BasePermission):
    """
    Allows access to user's own resources, or full access to admin.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True
        if hasattr(obj, 'participant'):
            return obj.participant == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
