from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

class TrialCategory(models.TextChoices):
    INFORM_GEN = 'INFORM_GEN', _('Informatique Générale')
    SMARTPHONE = 'SMARTPHONE', _('Téléphone Portable / Smartphone')
    ORDINATEUR = 'ORDINATEUR', _('Ordinateur & Matériel')
    WINDOWS = 'WINDOWS', _('Système Windows')
    WORD = 'WORD', _('Microsoft Word')
    EXCEL = 'EXCEL', _('Microsoft Excel')
    POWERPOINT = 'POWERPOINT', _('Microsoft PowerPoint')
    GRAND_CHALLENGE = 'GRAND_CHALLENGE', _('Grand Challenge TDC')
    AUTRE = 'AUTRE', _('Autre Compétence')

class TrialStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Brouillon')
    SCHEDULED = 'SCHEDULED', _('Programmée')
    OPEN = 'OPEN', _('Ouverte (Prête)')
    IN_PROGRESS = 'IN_PROGRESS', _('En cours de passage')
    COMPLETED = 'COMPLETED', _('Terminée')
    ARCHIVED = 'ARCHIVED', _('Archivée')

class QuestionType(models.TextChoices):
    SINGLE_CHOICE = 'SINGLE_CHOICE', _('QCM Choix Unique')
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', _('QCM Choix Multiples')
    TRUE_FALSE = 'TRUE_FALSE', _('Vrai / Faux')
    SHORT_TEXT = 'SHORT_TEXT', _('Réponse Courte')
    NUMERIC = 'NUMERIC', _('Réponse Numérique')
    PRACTICAL = 'PRACTICAL', _('Mission Pratique (Dépôt de fichier)')

class DifficultyLevel(models.TextChoices):
    EASY = 'EASY', _('Facile')
    MEDIUM = 'MEDIUM', _('Moyen')
    HARD = 'HARD', _('Difficile')

class Trial(models.Model):
    title = models.CharField(max_length=200, verbose_name=_('Titre de l\'épreuve'))
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.CharField(
        max_length=30,
        choices=TrialCategory.choices,
        default=TrialCategory.INFORM_GEN,
        verbose_name=_('Catégorie')
    )
    description = models.TextField(blank=True, default='', verbose_name=_('Description'))
    instructions = models.TextField(blank=True, default='', verbose_name=_('Consignes générales'))
    duration_minutes = models.PositiveIntegerField(
        default=20,
        verbose_name=_('Durée allouée (en minutes)'),
        help_text=_('0 pour illimité')
    )
    max_score = models.FloatField(
        default=100.0,
        verbose_name=_('Score barème maximum')
    )
    weight = models.FloatField(
        default=1.0,
        verbose_name=_('Poids / Coefficient de l\'épreuve')
    )
    order = models.PositiveIntegerField(
        default=1,
        verbose_name=_('Ordre d\'affichage / Épreuve N°')
    )
    status = models.CharField(
        max_length=20,
        choices=TrialStatus.choices,
        default=TrialStatus.DRAFT,
        verbose_name=_('Statut')
    )
    starts_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Date/Heure de début'))
    ends_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Date/Heure de fin'))
    allow_multiple_attempts = models.BooleanField(
        default=False,
        verbose_name=_('Autoriser plusieurs tentatives')
    )
    shuffle_questions = models.BooleanField(
        default=False,
        verbose_name=_('Mélanger l\'ordre des questions')
    )
    show_results_immediately = models.BooleanField(
        default=False,
        verbose_name=_('Afficher le corrigé immédiatement après soumission')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Épreuve')
        verbose_name_plural = _('Épreuves')
        ordering = ['order', 'id']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or 'epreuve'
            slug = base_slug
            counter = 1
            while Trial.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def total_calculated_points(self):
        return sum(q.points for q in self.questions.all())

    def __str__(self):
        return f"Épreuve {self.order} : {self.title} ({self.get_status_display()})"


class Question(models.Model):
    trial = models.ForeignKey(
        Trial,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_('Épreuve')
    )
    question_type = models.CharField(
        max_length=25,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE,
        verbose_name=_('Type de question')
    )
    prompt = models.TextField(verbose_name=_('Énoncé de la question'))
    image = models.ImageField(
        upload_to='questions/images/',
        null=True,
        blank=True,
        verbose_name=_('Image / Schéma d\'illustration')
    )
    attachment = models.FileField(
        upload_to='trial_attachments/',
        null=True,
        blank=True,
        verbose_name=_('Fichier / Ressource à télécharger par le participant')
    )
    attachment_name = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name=_('Nom affiché de la ressource')
    )
    points = models.FloatField(
        default=10.0,
        verbose_name=_('Nombre de points attribués')
    )
    order = models.PositiveIntegerField(
        default=1,
        verbose_name=_('Ordre d\'apparition')
    )
    difficulty = models.CharField(
        max_length=15,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.MEDIUM,
        verbose_name=_('Niveau de difficulté')
    )
    explanation = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Explication / Corrigé pour le jury ou participant')
    )
    practical_instructions = models.TextField(
        blank=True,
        default='',
        verbose_name=_('Consignes précises de la mission pratique')
    )
    practical_allowed_extensions = models.CharField(
        max_length=100,
        default='.docx,.xlsx,.pptx,.pdf,.zip,.png,.jpg',
        verbose_name=_('Extensions de fichiers autorisées pour le dépôt')
    )
    correct_text_answer = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name=_('Réponse textuelle ou numérique exacte attendue')
    )
    is_case_sensitive = models.BooleanField(
        default=False,
        verbose_name=_('Sensible à la casse (majuscules/minuscules)')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Question / Mission')
        verbose_name_plural = _('Questions & Missions')
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q{self.order} [{self.get_question_type_display()}] : {self.prompt[:60]}... ({self.points} pts)"


class Option(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name=_('Question')
    )
    text = models.CharField(max_length=500, verbose_name=_('Texte du choix'))
    is_correct = models.BooleanField(
        default=False,
        verbose_name=_('Est la bonne réponse')
    )
    order = models.PositiveIntegerField(
        default=1,
        verbose_name=_('Ordre')
    )

    class Meta:
        verbose_name = _('Option de réponse')
        verbose_name_plural = _('Options de réponses')
        ordering = ['order', 'id']

    def __str__(self):
        status_flag = "✓" if self.is_correct else "✗"
        return f"[{status_flag}] {self.text[:50]}"
