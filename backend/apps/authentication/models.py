import random
import string
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class TdcUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrateur / Organisateur'),
        ('JURY', 'Jury / Formateur'),
        ('PARTICIPANT', 'Participant TDC'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='PARTICIPANT',
        verbose_name=_('Rôle'),
        db_index=True
    )
    participant_code = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        null=True,
        verbose_name=_('Numéro / Code Participant'),
        db_index=True
    )
    team_group = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_('Groupe / Équipe')
    )
    phone_number = models.CharField(
        max_length=30,
        blank=True,
        default='',
        verbose_name=_('Numéro de téléphone')
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name=_('Photo de profil')
    )
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Notes administratives')
    )
    last_activity = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Dernière activité')
    )

    class Meta:
        verbose_name = _('Utilisateur TDC')
        verbose_name_plural = _('Utilisateurs TDC')
        ordering = ['last_name', 'first_name', 'username']

    def save(self, *args, **kwargs):
        if self.role == 'PARTICIPANT' and not self.participant_code:
            # Generate clean unique participant code e.g. TDC-2026-042
            count = TdcUser.objects.filter(role='PARTICIPANT').count() + 1
            code = f"TDC-2026-{count:03d}"
            while TdcUser.objects.filter(participant_code=code).exists():
                rand_suffix = ''.join(random.choices(string.digits, k=3))
                code = f"TDC-2026-{rand_suffix}"
            self.participant_code = code
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    def __str__(self):
        return f"{self.full_name} ({self.participant_code or self.username}) [{self.role}]"
