import csv
import io
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import TdcUser
from .serializers import (
    TdcUserSerializer,
    ParticipantAdminSerializer,
    JuryAdminSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
)
from .permissions import IsAdminUserRole, IsJuryOrAdmin

class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = TdcUserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = TdcUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': ['Mot de passe actuel incorrect.']}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Mot de passe mis à jour avec succès.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ParticipantViewSet(viewsets.ModelViewSet):
    serializer_class = ParticipantAdminSerializer
    permission_classes = [IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = TdcUser.objects.filter(role='PARTICIPANT')
        search = self.request.query_params.get('search', None)
        team = self.request.query_params.get('team', None)
        active = self.request.query_params.get('active', None)

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search) |
                Q(participant_code__icontains=search) |
                Q(email__icontains=search)
            )
        if team:
            queryset = queryset.filter(team_group__icontains=team)
        if active is not None:
            queryset = queryset.filter(is_active=(active.lower() == 'true'))

        return queryset.order_by('participant_code', 'last_name')

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """Import participants from CSV file: first_name,last_name,email,username,team_group,phone_number,password"""
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Fichier CSV requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file_obj.read().decode('utf-8-sig').splitlines()
            reader = csv.DictReader(decoded_file)
            created_count = 0
            updated_count = 0
            errors = []

            for row_idx, row in enumerate(reader, start=2):
                # Clean headers and values
                cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                username = cleaned_row.get('username') or cleaned_row.get('identifiant')
                first_name = cleaned_row.get('first_name') or cleaned_row.get('prenom', '')
                last_name = cleaned_row.get('last_name') or cleaned_row.get('nom', '')
                email = cleaned_row.get('email', '')
                team_group = cleaned_row.get('team_group') or cleaned_row.get('groupe', '')
                phone_number = cleaned_row.get('phone_number') or cleaned_row.get('telephone', '')
                password = cleaned_row.get('password') or cleaned_row.get('mot_de_passe', 'Tdc2026!')
                code = cleaned_row.get('participant_code') or cleaned_row.get('code', '')

                if not username:
                    if first_name and last_name:
                        base = f"{first_name.lower()}.{last_name.lower()}".replace(' ', '')
                        username = base
                    else:
                        errors.append(f"Ligne {row_idx}: Identifiant ou Nom/Prénom requis.")
                        continue

                user, created = TdcUser.objects.get_or_create(
                    username=username,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'email': email,
                        'role': 'PARTICIPANT',
                        'team_group': team_group,
                        'phone_number': phone_number,
                    }
                )
                if created:
                    if code:
                        user.participant_code = code
                    user.set_password(password)
                    user.save()
                    created_count += 1
                else:
                    user.first_name = first_name or user.first_name
                    user.last_name = last_name or user.last_name
                    user.email = email or user.email
                    user.team_group = team_group or user.team_group
                    user.phone_number = phone_number or user.phone_number
                    if code:
                        user.participant_code = code
                    user.save()
                    updated_count += 1

            return Response({
                'created': created_count,
                'updated': updated_count,
                'errors': errors,
                'detail': f"{created_count} participant(s) créé(s), {updated_count} mis à jour."
            })
        except Exception as e:
            return Response({'detail': f"Erreur lors de la lecture du fichier : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        participant = self.get_object()
        new_password = request.data.get('password', 'Tdc2026!')
        participant.set_password(new_password)
        participant.save()
        return Response({'detail': f'Mot de passe réinitialisé pour {participant.full_name}.'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        participant = self.get_object()
        participant.is_active = not participant.is_active
        participant.save()
        status_str = "activé" if participant.is_active else "désactivé"
        return Response({'detail': f'Compte {status_str}.', 'is_active': participant.is_active})


class JuryViewSet(viewsets.ModelViewSet):
    serializer_class = JuryAdminSerializer
    permission_classes = [IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = TdcUser.objects.filter(role='JURY')
        search = self.request.query_params.get('search', None)
        active = self.request.query_params.get('active', None)

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )
        if active is not None:
            queryset = queryset.filter(is_active=(active.lower() == 'true'))

        return queryset.order_by('last_name', 'first_name')

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        jury_user = self.get_object()
        new_password = request.data.get('password', 'Jury@TDC2026!')
        jury_user.set_password(new_password)
        jury_user.save()
        return Response({'detail': f'Mot de passe réinitialisé pour le membre du jury {jury_user.full_name}.'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        jury_user = self.get_object()
        jury_user.is_active = not jury_user.is_active
        jury_user.save()
        status_str = "activé" if jury_user.is_active else "désactivé"
        return Response({'detail': f'Compte jury {status_str}.', 'is_active': jury_user.is_active})
