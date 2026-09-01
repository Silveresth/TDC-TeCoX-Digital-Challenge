from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CompetitionSetting(models.Model):
    competition_name = models.CharField(
        max_length=200,
        default='TeCoX Digital Challenge 2026',
        verbose_name=_('Nom officiel de la compétition')
    )
    edition = models.CharField(
        max_length=50,
        default='Édition 2026',
        verbose_name=_('Édition')
    )
    is_leaderboard_public = models.BooleanField(
        default=True,
        verbose_name=_('Rendre le classement public pour les participants')
    )
    is_competition_active = models.BooleanField(
        default=True,
        verbose_name=_('Compétition active en cours')
    )
    allow_registrations = models.BooleanField(
        default=False,
        verbose_name=_('Autoriser les inscriptions publiques')
    )
    banner_message = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Message d\'annonce / Bannière générale')
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Paramètres de la compétition')
        verbose_name_plural = _('Paramètres de la compétition')

    def save(self, *args, **kwargs):
        self.pk = 1  # Singleton pattern
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.competition_name


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('LOGIN', 'Connexion Utilisateur'),
        ('TRIAL_START', 'Démarrage d\'une épreuve'),
        ('TRIAL_SUBMITTED', 'Soumission d\'épreuve'),
        ('TRIAL_EXPIRED', 'Expiration du chronomètre'),
        ('GRADE_PRACTICAL', 'Notation manuelle par le jury'),
        ('TRIAL_STATUS_CHANGE', 'Modification du statut d\'une épreuve'),
        ('SETTINGS_CHANGE', 'Modification des paramètres de compétition'),
        ('OTHER', 'Autre action'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_('Utilisateur concerné')
    )
    action = models.CharField(max_length=40, choices=ACTION_CHOICES, default='OTHER', verbose_name=_('Action'))
    description = models.TextField(verbose_name=_('Détails de l\'action'))
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('Adresse IP'))
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name=_('Date & Heure'))

    class Meta:
        verbose_name = _('Journal d\'activité (Audit Log)')
        verbose_name_plural = _('Journaux d\'activités')
        ordering = ['-created_at']

    def __str__(self):
        u = self.user.username if self.user else 'Système'
        return f"[{self.created_at.strftime('%H:%M:%S')}] {u} - {self.action}: {self.description[:50]}"
