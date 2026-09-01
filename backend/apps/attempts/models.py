from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.competitions.models import Trial, Question, Option

class AttemptStatus(models.TextChoices):
    NOT_STARTED = 'not_started', _('Non commencée')
    IN_PROGRESS = 'in_progress', _('En cours')
    SUBMITTED = 'submitted', _('Soumise (En attente de correction)')
    GRADED = 'graded', _('Corrigée')
    EXPIRED = 'expired', _('Expirée (Temps écoulé)')
    ABANDONED = 'abandoned', _('Abandonnée')

class Attempt(models.Model):
    participant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attempts',
        verbose_name=_('Participant')
    )
    trial = models.ForeignKey(
        Trial,
        on_delete=models.CASCADE,
        related_name='attempts',
        verbose_name=_('Épreuve')
    )
    status = models.CharField(
        max_length=20,
        choices=AttemptStatus.choices,
        default=AttemptStatus.IN_PROGRESS,
        verbose_name=_('Statut de la tentative'),
        db_index=True
    )
    started_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Débutée le'))
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Soumise le'))
    time_spent_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Temps passé (secondes)')
    )
    auto_score = models.FloatField(
        default=0.0,
        verbose_name=_('Score automatique (QCM/Direct)')
    )
    manual_score = models.FloatField(
        default=0.0,
        verbose_name=_('Score manuel (Missions pratiques)')
    )
    total_score = models.FloatField(
        default=0.0,
        verbose_name=_('Score total obtenu'),
        db_index=True
    )
    max_possible_score = models.FloatField(
        default=100.0,
        verbose_name=_('Score total maximum possible')
    )
    percentage = models.FloatField(
        default=0.0,
        verbose_name=_('Pourcentage de réussite (%)')
    )
    is_final = models.BooleanField(
        default=True,
        verbose_name=_('Tentative retenue pour le classement final')
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('Adresse IP'))
    user_agent = models.TextField(blank=True, default='', verbose_name=_('User Agent / Navigateur'))

    class Meta:
        verbose_name = _('Tentative')
        verbose_name_plural = _('Tentatives')
        ordering = ['-started_at']
        unique_together = ('participant', 'trial')

    def recalculate_score(self):
        """Calculates total score and percentage from all answers."""
        answers = self.answers.all()
        auto_total = 0.0
        manual_total = 0.0
        all_graded = True

        for ans in answers:
            if ans.question.question_type == 'PRACTICAL':
                manual_total += ans.score_awarded
                if not ans.is_graded:
                    all_graded = False
            else:
                auto_total += ans.score_awarded
                if not ans.is_graded:
                    all_graded = False

        self.auto_score = round(auto_total, 2)
        self.manual_score = round(manual_total, 2)
        self.total_score = round(auto_total + manual_total, 2)

        trial_max = self.trial.max_score or self.trial.total_calculated_points or 100.0
        self.max_possible_score = trial_max

        if self.max_possible_score > 0:
            self.percentage = round((self.total_score / self.max_possible_score) * 100, 2)
        else:
            self.percentage = 0.0

        if self.status in [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED]:
            if all_graded:
                self.status = AttemptStatus.GRADED

        self.save(update_fields=['auto_score', 'manual_score', 'total_score', 'max_possible_score', 'percentage', 'status'])

    def __str__(self):
        return f"{self.participant.full_name} - {self.trial.title} : {self.total_score}/{self.max_possible_score} ({self.get_status_display()})"


class Answer(models.Model):
    attempt = models.ForeignKey(
        Attempt,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('Tentative')
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('Question')
    )
    selected_options = models.ManyToManyField(
        Option,
        blank=True,
        related_name='selected_in_answers',
        verbose_name=_('Options cochées')
    )
    text_answer = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Réponse textuelle ou numérique saisie')
    )
    file_upload = models.FileField(
        upload_to='participant_submissions/%Y/%m/',
        null=True,
        blank=True,
        verbose_name=_('Fichier déposé pour la mission')
    )
    original_filename = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name=_('Nom du fichier original')
    )
    file_size_bytes = models.BigIntegerField(
        default=0,
        verbose_name=_('Taille du fichier (octets)')
    )
    score_awarded = models.FloatField(
        default=0.0,
        verbose_name=_('Points attribués')
    )
    is_graded = models.BooleanField(
        default=False,
        verbose_name=_('Est corrigée')
    )
    is_correct = models.BooleanField(
        null=True,
        blank=True,
        verbose_name=_('Est correcte (évaluation auto)')
    )
    jury_feedback = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Commentaire / Remarque du Jury')
    )
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_answers',
        verbose_name=_('Corrigé par')
    )
    graded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Date/Heure de correction')
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Réponse')
        verbose_name_plural = _('Réponses')
        unique_together = ('attempt', 'question')
        ordering = ['question__order', 'id']

    def __str__(self):
        return f"Rép: {self.attempt.participant.username} -> Q{self.question.order} ({self.score_awarded}/{self.question.points} pts)"
