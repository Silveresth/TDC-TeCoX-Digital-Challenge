import os
import sys
import django
from django.utils import timezone

# Setup django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tdc_backend.settings')

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

django.setup()

from apps.authentication.models import TdcUser
from apps.competitions.models import Trial, Question, Option, TrialCategory, TrialStatus, QuestionType, DifficultyLevel
from apps.attempts.models import Attempt, Answer, AttemptStatus
from apps.analytics.models import CompetitionSetting, AuditLog

def seed_database():
    print("--- 1. Initializing Competition Settings ---")
    settings = CompetitionSetting.get_settings()
    settings.competition_name = "TeCoX Digital Challenge 2026"
    settings.edition = "Édition 2026"
    settings.is_leaderboard_public = True
    settings.is_competition_active = True
    settings.banner_message = "Bienvenue au TeCoX Digital Challenge (TDC) 2026 ! Donnez le meilleur de vous-même."
    settings.save()

    print("--- 2. Creating Admin & Jury Users ---")
    admin_user, _ = TdcUser.objects.get_or_create(
        username='admin',
        defaults={
            'first_name': 'Organisateur',
            'last_name': 'TeCoX',
            'email': 'admin@tecox.org',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    admin_user.set_password('Admin@TDC2026!')
    admin_user.save()
    print("  -> Admin created: admin / Admin@TDC2026!")

    jury_user, _ = TdcUser.objects.get_or_create(
        username='jury',
        defaults={
            'first_name': 'Formateur',
            'last_name': 'Jury',
            'email': 'jury@tecox.org',
            'role': 'JURY',
            'is_staff': True,
        }
    )
    jury_user.set_password('Jury@TDC2026!')
    jury_user.save()
    print("  -> Jury created: jury / Jury@TDC2026!")

    print("--- 3. Creating the 8 Official TDC Trials & Questions ---")
    trials_data = [
        {
            'order': 1,
            'title': "Découverte de l'informatique",
            'category': TrialCategory.INFORM_GEN,
            'description': "Évaluation des notions fondamentales de l'informatique, données, traitements et systèmes.",
            'instructions': "Répondez aux questions avec précision. Une seule tentative autorisée.",
            'duration_minutes': 15,
            'max_score': 100.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Qu'est-ce que l'informatique par définition ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 20,
                    'difficulty': DifficultyLevel.EASY,
                    'explanation': "L'informatique est la science du traitement automatique et rationnel de l'information.",
                    'options': [
                        ("La science du traitement automatique et rationnel de l'information", True),
                        ("L'art de réparer des composants électroniques", False),
                        ("Uniquement la programmation de jeux vidéo", False),
                        ("L'utilisation exclusive des réseaux sociaux", False)
                    ]
                },
                {
                    'prompt': "Quelles sont les composantes essentielles d'un système informatique ? (Plusieurs réponses possibles)",
                    'type': QuestionType.MULTIPLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Le matériel (Hardware)", True),
                        ("Les logiciels (Software)", True),
                        ("Les utilisateurs humains", True),
                        ("Un abonnement Netflix obligatoire", False)
                    ]
                },
                {
                    'prompt': "Un octet (byte) est composé exactement de 8 bits.",
                    'type': QuestionType.TRUE_FALSE,
                    'points': 15,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Vrai", True),
                        ("Faux", False)
                    ]
                },
                {
                    'prompt': "Combien de kilo-octets (Ko) contient exactement 1 Méga-octet (Mo) en base binaire standard ?",
                    'type': QuestionType.NUMERIC,
                    'correct_text': "1024",
                    'points': 20,
                    'difficulty': DifficultyLevel.MEDIUM,
                },
                {
                    'prompt': "Quel acronyme désigne l'unité centrale de traitement, souvent appelée le 'cerveau' de l'ordinateur ?",
                    'type': QuestionType.SHORT_TEXT,
                    'correct_text': "CPU",
                    'points': 20,
                    'difficulty': DifficultyLevel.EASY,
                }
            ]
        },
        {
            'order': 2,
            'title': "Téléphone portable & Smartphone",
            'category': TrialCategory.SMARTPHONE,
            'description': "Gestion du smartphone, paramètres, sécurité mobile, stockage et connectivité.",
            'instructions': "Lisez attentivement chaque scénario d'usage mobile.",
            'duration_minutes': 15,
            'max_score': 100.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quel système d'exploitation mobile est développé par Google et basé sur le noyau Linux ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Android", True),
                        ("iOS", False),
                        ("Windows Phone", False),
                        ("Symbian", False)
                    ]
                },
                {
                    'prompt': "Pour libérer de l'espace de stockage sur un smartphone sans perdre ses photos, quelle est la meilleure pratique ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Sauvegarder les photos sur le Cloud / support externe puis supprimer les originaux locaux", True),
                        ("Éteindre et rallumer le smartphone", False),
                        ("Désactiver le Bluetooth", False),
                        ("Formater la carte SIM", False)
                    ]
                },
                {
                    'prompt': "Quelles actions renforcent la sécurité d'un smartphone ? (Plusieurs réponses)",
                    'type': QuestionType.MULTIPLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Activer le verrouillage par schéma, PIN ou biométrie", True),
                        ("Installer des applications uniquement depuis les stores officiels", True),
                        ("Effectuer les mises à jour de sécurité système régulières", True),
                        ("Partager son mot de passe par SMS", False)
                    ]
                },
                {
                    'prompt': "Le mode 'Avion' coupe toutes les transmissions sans fil (Wi-Fi, cellulaire, Bluetooth).",
                    'type': QuestionType.TRUE_FALSE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Vrai", True),
                        ("Faux", False)
                    ]
                }
            ]
        },
        {
            'order': 3,
            'title': "Ordinateur & Périphériques",
            'category': TrialCategory.ORDINATEUR,
            'description': "Architecture matérielle de l'ordinateur, mémoire RAM, stockage ROM/SSD et périphériques.",
            'instructions': "Identifiez les rôles des différents organes de l'ordinateur.",
            'duration_minutes': 20,
            'max_score': 100.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quelle est la principale caractéristique de la mémoire vive (RAM) ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Elle est volatile : son contenu s'efface lors de la mise hors tension", True),
                        ("Elle conserve définitivement les fichiers même sans électricité", False),
                        ("Elle remplace complètement le disque dur", False),
                        ("Elle sert uniquement à afficher des vidéos", False)
                    ]
                },
                {
                    'prompt': "Parmi les éléments suivants, lesquels sont des périphériques de sortie ? (Sélectionnez toutes les bonnes réponses)",
                    'type': QuestionType.MULTIPLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("L'écran / Moniteur", True),
                        ("L'imprimante", True),
                        ("Les haut-parleurs", True),
                        ("Le scanner", False),
                        ("Le clavier", False)
                    ]
                },
                {
                    'prompt': "Un disque SSD est généralement beaucoup plus rapide et résistant aux chocs qu'un disque dur mécanique HDD.",
                    'type': QuestionType.TRUE_FALSE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Vrai", True),
                        ("Faux", False)
                    ]
                },
                {
                    'prompt': "Quel port standard est aujourd'hui universellement utilisé pour connecter clés de stockage, souris et chargeurs rapides ?",
                    'type': QuestionType.SHORT_TEXT,
                    'correct_text': "USB",
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                }
            ]
        },
        {
            'order': 4,
            'title': "Système d'exploitation Windows",
            'category': TrialCategory.WINDOWS,
            'description': "Navigation dans Windows, explorateur de fichiers, raccourcis clavier, gestionnaire de tâches et arborescences.",
            'instructions': "Démontrez votre maîtrise de l'environnement Windows.",
            'duration_minutes': 20,
            'max_score': 150.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quel raccourci clavier permet d'ouvrir directement l'Explorateur de fichiers sous Windows ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 30,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Touche Windows + E", True),
                        ("Ctrl + Alt + E", False),
                        ("Touche Windows + F", False),
                        ("Alt + F4", False)
                    ]
                },
                {
                    'prompt': "Quel outil Windows permet de forcer l'arrêt d'une application bloquée et de surveiller les ressources (CPU, RAM) ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 30,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Le Gestionnaire des tâches (Ctrl + Maj + Échap)", True),
                        ("La Calculatrice Windows", False),
                        ("Le Bloc-notes", False),
                        ("Windows Media Player", False)
                    ]
                },
                {
                    'prompt': "Quels raccourcis clavier sont corrects pour les opérations fondamentales sous Windows ? (Plusieurs réponses)",
                    'type': QuestionType.MULTIPLE_CHOICE,
                    'points': 40,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Ctrl + C : Copier", True),
                        ("Ctrl + V : Coller", True),
                        ("Ctrl + Z : Annuler la dernière action", True),
                        ("Ctrl + X : Couper", True),
                        ("Ctrl + P : Éteindre le PC", False)
                    ]
                },
                {
                    'prompt': "Mission Pratique Windows : Créer sur votre bureau une arborescence complète contenant un dossier 'TDC_2026' avec 3 sous-dossiers ('Documents', 'Tableurs', 'Présentations'). Compressez le dossier en archive ZIP et déposez-le ici.",
                    'type': QuestionType.PRACTICAL,
                    'points': 50,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'practical_instructions': "1. Créez un dossier nommé 'TDC_2026'.\n2. À l'intérieur, créez les sous-dossiers 'Documents', 'Tableurs', 'Présentations'.\n3. Compressez le dossier au format .zip.\n4. Téléversez le fichier .zip ci-dessous.",
                    'practical_allowed_extensions': ".zip,.rar,.7z"
                }
            ]
        },
        {
            'order': 5,
            'title': "Microsoft Word — Traitement de texte",
            'category': TrialCategory.WORD,
            'description': "Mise en page, styles, insertion de tableaux, lettrines, en-têtes et production de documents professionnels.",
            'instructions': "Effectuez le quiz théorique puis réalisez la mission pratique Word demandée.",
            'duration_minutes': 25,
            'max_score': 150.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quel est le format de fichier standard par défaut des documents Microsoft Word modernes ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        (".docx", True),
                        (".xlsx", False),
                        (".pptx", False),
                        (".pdf", False)
                    ]
                },
                {
                    'prompt': "Pour générer automatiquement une table des matières dynamique dans Word, que devez-vous appliquer obligatoirement à vos titres ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 35,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Les styles prédéfinis de titres (Titre 1, Titre 2, Titre 3)", True),
                        ("Mettre les titres en couleur rouge manuellement", False),
                        ("Augmenter simplement la taille de police à 18", False),
                        ("Souligner les phrases en gras", False)
                    ]
                },
                {
                    'prompt': "Mission Pratique Word : Rédigez une lettre officielle de remerciement pour le TeCoX Digital Challenge. Le document doit comporter : un en-tête avec vos coordonnées, un titre centré 'Lettre de Remerciement', 2 paragraphes justifiés, un tableau récapitulatif de 3 lignes x 2 colonnes, et votre signature. Déposez votre fichier .docx.",
                    'type': QuestionType.PRACTICAL,
                    'points': 90,
                    'difficulty': DifficultyLevel.HARD,
                    'practical_instructions': "Consignes à respecter impérativement :\n- Format Word (.docx)\n- En-tête avec nom, prénom et contact\n- Titre de niveau 1 centré\n- Texte avec interligne 1.15 et alignement justifié\n- Un tableau propre avec bordures et en-tête coloré\n- Enregistrez sous le nom 'Word_TDC_VotreNom.docx' puis téléversez.",
                    'practical_allowed_extensions': ".docx,.doc,.pdf"
                }
            ]
        },
        {
            'order': 6,
            'title': "Microsoft Excel — Tableur & Formules",
            'category': TrialCategory.EXCEL,
            'description': "Calculs, formules SOMME, MOYENNE, SI, RECHERCHEV, mise en forme conditionnelle et graphiques.",
            'instructions': "Résolvez les formules et réalisez le tableau pratique complet.",
            'duration_minutes': 25,
            'max_score': 150.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Toute formule ou calcul dans Microsoft Excel doit obligatoirement commencer par quel symbole ?",
                    'type': QuestionType.SHORT_TEXT,
                    'correct_text': "=",
                    'points': 20,
                    'difficulty': DifficultyLevel.EASY,
                    'explanation': "En Excel, toute formule commence impérativement par le signe égal (=)."
                },
                {
                    'prompt': "Quelle formule calcule correctement la moyenne des cellules de A1 jusqu'à A10 ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 30,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("=MOYENNE(A1:A10)", True),
                        ("=TOTAL(A1..A10)/10", False),
                        ("=AVERAGE[A1-A10]", False),
                        ("=CALCUL(A1:A10)", False)
                    ]
                },
                {
                    'prompt': "Le symbole '$' dans une référence de cellule (ex: $A$1) sert à figer la ligne et la colonne (référence absolue) lors de la recopie incrémentée.",
                    'type': QuestionType.TRUE_FALSE,
                    'points': 20,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Vrai", True),
                        ("Faux", False)
                    ]
                },
                {
                    'prompt': "Mission Pratique Excel : Créez un tableau de suivi des ventes hebdomadaires pour 5 produits. Le classeur doit contenir : Colonnes (Produit, Prix Unitaire, Quantité Vendue, Total HT, TVA 18%, Total TTC). Utilisez des formules automatisées (=PRODUIT, =SOMME, =MOYENNE) et insérez un graphique en barres représentant le Total TTC par produit. Déposez votre fichier .xlsx.",
                    'type': QuestionType.PRACTICAL,
                    'points': 80,
                    'difficulty': DifficultyLevel.HARD,
                    'practical_instructions': "Consignes :\n1. Saisir 5 lignes de produits avec données fictives cohérentes.\n2. Calculer automatiquement Total HT = Quantité * Prix Unitaire.\n3. Calculer TVA 18% et Total TTC.\n4. Appliquer le format Monétaire (FCFA ou EUR) aux montants.\n5. Insérer un graphique clair.\n6. Déposer le fichier .xlsx.",
                    'practical_allowed_extensions': ".xlsx,.xls,.csv"
                }
            ]
        },
        {
            'order': 7,
            'title': "Microsoft PowerPoint — Présentations Dynamiques",
            'category': TrialCategory.POWERPOINT,
            'description': "Conception de diapositives percutantes, masques de diapositives, transitions, animations et règles de communication visuelle.",
            'instructions': "Répondez aux questions et concevez le diaporama demandé.",
            'duration_minutes': 25,
            'max_score': 150.0,
            'weight': 1.0,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quelle touche permet de lancer directement le diaporama en plein écran depuis la première diapositive ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 25,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("F5", True),
                        ("F1", False),
                        ("Ctrl + P", False),
                        ("Échap", False)
                    ]
                },
                {
                    'prompt': "Quelles sont les bonnes pratiques d'une présentation PowerPoint réussie ? (Plusieurs réponses)",
                    'type': QuestionType.MULTIPLE_CHOICE,
                    'points': 35,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Limiter la quantité de texte par diapositive (règle des 6x6)", True),
                        ("Assurer un bon contraste entre le texte et l'arrière-plan", True),
                        ("Utiliser des visuels et schémas de haute qualité", True),
                        ("Mettre 10 animations différentes clignotantes sur chaque phrase", False),
                        ("Écrire tous les paragraphes en police taille 8", False)
                    ]
                },
                {
                    'prompt': "Mission Pratique PowerPoint : Réalisez une présentation moderne de 4 diapositives sur le thème 'L'impact du numérique chez les jeunes en Afrique'. Diapo 1: Titre & Présentateur; Diapo 2: Les opportunités; Diapo 3: Les défis; Diapo 4: Conclusion. Appliquez une transition fluide et une mise en page soignée. Déposez votre fichier .pptx.",
                    'type': QuestionType.PRACTICAL,
                    'points': 90,
                    'difficulty': DifficultyLevel.HARD,
                    'practical_instructions': "Consignes :\n- 4 diapositives structurées.\n- Respect de la charte visuelle (titres lisibles, icônes/images).\n- Utilisation de puces ou SmartArt.\n- Transitions élégantes.\n- Téléversez au format .pptx.",
                    'practical_allowed_extensions': ".pptx,.ppt,.pdf"
                }
            ]
        },
        {
            'order': 8,
            'title': "🏆 Grand Challenge TDC — Finale Compétition",
            'category': TrialCategory.GRAND_CHALLENGE,
            'description': "Grande épreuve synthétique finale combinant culture numérique, résolution de problèmes informatiques, bureautique intégrée et rapidité.",
            'instructions': "Épreuve ultime du TDC 2026. Concentration maximale requise !",
            'duration_minutes': 30,
            'max_score': 200.0,
            'weight': 1.2,
            'status': TrialStatus.OPEN,
            'questions': [
                {
                    'prompt': "Quelle technologie permet de relier des ordinateurs entre eux au niveau mondial pour échanger des informations via le protocole TCP/IP ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 30,
                    'difficulty': DifficultyLevel.EASY,
                    'options': [
                        ("Internet", True),
                        ("Le Bluetooth", False),
                        ("Une clé USB", False),
                        ("Un câble HDMI", False)
                    ]
                },
                {
                    'prompt': "Parmi les propositions suivantes, quelle est la méthode la plus sûre pour créer un mot de passe robuste ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 30,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Une phrase de passe longue avec majuscules, minuscules, chiffres et caractères spéciaux, unique à chaque service", True),
                        ("Sa date de naissance écrite à l'envers", False),
                        ("Le mot 'password123456'", False),
                        ("Le prénom de son animal de compagnie répété deux fois", False)
                    ]
                },
                {
                    'prompt': "Quelle combinaison de touches permet de verrouiller instantanément sa session Windows lorsqu'on quitte son poste de travail ?",
                    'type': QuestionType.SINGLE_CHOICE,
                    'points': 40,
                    'difficulty': DifficultyLevel.MEDIUM,
                    'options': [
                        ("Touche Windows + L", True),
                        ("Touche Windows + D", False),
                        ("Ctrl + Alt + Suppr puis fermer l'écran", False),
                        ("Alt + Tab", False)
                    ]
                },
                {
                    'prompt': "Mission Finale Grand Challenge : Téléchargez le modèle d'étude de cas fourni, analysez les données chiffrées d'un centre de formation et synthétisez vos recommandations dans un rapport argumenté d'une page au format Word ou PDF. Déposez votre document final.",
                    'type': QuestionType.PRACTICAL,
                    'points': 100,
                    'difficulty': DifficultyLevel.HARD,
                    'practical_instructions': "Consignes finales :\n- Intégrez un résumé exécutif.\n- Formulez 3 recommandations stratégiques numériques précises.\n- Soignez rigoureusement l'orthographe et la mise en page.",
                    'practical_allowed_extensions': ".docx,.pdf,.xlsx"
                }
            ]
        }
    ]

    for t_data in trials_data:
        questions_data = t_data.pop('questions')
        trial, created = Trial.objects.get_or_create(
            order=t_data['order'],
            defaults=t_data
        )
        if not created:
            for k, v in t_data.items():
                setattr(trial, k, v)
            trial.save()

        print(f"  -> Trial {trial.order}: {trial.title} (Max: {trial.max_score} pts)")

        for q_idx, q_data in enumerate(questions_data, start=1):
            opts_data = q_data.pop('options', [])
            correct_text = q_data.pop('correct_text', '')
            practical_inst = q_data.pop('practical_instructions', '')
            practical_ext = q_data.pop('practical_allowed_extensions', '')

            q, _ = Question.objects.get_or_create(
                trial=trial,
                order=q_idx,
                defaults={
                    'prompt': q_data['prompt'],
                    'question_type': q_data['type'],
                    'points': q_data['points'],
                    'difficulty': q_data.get('difficulty', DifficultyLevel.MEDIUM),
                    'explanation': q_data.get('explanation', ''),
                    'correct_text_answer': correct_text,
                    'practical_instructions': practical_inst,
                    'practical_allowed_extensions': practical_ext or ".docx,.xlsx,.pptx,.pdf,.zip"
                }
            )

            # Recreate options if provided
            if opts_data:
                q.options.all().delete()
                for o_idx, (opt_text, is_corr) in enumerate(opts_data, start=1):
                    Option.objects.create(
                        question=q,
                        text=opt_text,
                        is_correct=is_corr,
                        order=o_idx
                    )

    print("--- 4. Creating Realistic Demo Participants & Submissions ---")
    participants_seed = [
        ("eloge.gomina", "Éloge", "Gomina", "eloge.gomina@gmail.com", "TDC-2026-001", "Équipe Alpha", "+228 90 11 22 33"),
        ("marie.akpalo", "Marie", "Akpalo", "marie.akpalo@yahoo.fr", "TDC-2026-002", "Équipe Alpha", "+228 91 22 33 44"),
        ("jean.tossou", "Jean", "Tossou", "jean.tossou@outlook.com", "TDC-2026-003", "Équipe Beta", "+228 92 33 44 55"),
        ("sarah.mensah", "Sarah", "Mensah", "sarah.mensah@gmail.com", "TDC-2026-004", "Équipe Beta", "+228 93 44 55 66"),
        ("paul.kodjo", "Paul", "Kodjo", "paul.kodjo@gmail.com", "TDC-2026-005", "Équipe Gamma", "+228 94 55 66 77"),
        ("esther.adjo", "Esther", "Adjo", "esther.adjo@gmail.com", "TDC-2026-006", "Équipe Gamma", "+228 95 66 77 88"),
        ("david.kouame", "David", "Kouamé", "david.kouame@gmail.com", "TDC-2026-007", "Équipe Delta", "+228 96 77 88 99"),
        ("aicha.traore", "Aïcha", "Traoré", "aicha.traore@gmail.com", "TDC-2026-008", "Équipe Delta", "+228 97 88 99 00"),
        ("emmanuel.koffi", "Emmanuel", "Koffi", "emmanuel.koffi@gmail.com", "TDC-2026-009", "Équipe Alpha", "+228 98 99 00 11"),
        ("grace.lawson", "Grâce", "Lawson", "grace.lawson@gmail.com", "TDC-2026-010", "Équipe Beta", "+228 99 00 11 22"),
    ]

    all_trials = list(Trial.objects.all().order_by('order'))

    for uname, fname, lname, email, code, team, phone in participants_seed:
        user, created = TdcUser.objects.get_or_create(
            username=uname,
            defaults={
                'first_name': fname,
                'last_name': lname,
                'email': email,
                'participant_code': code,
                'team_group': team,
                'phone_number': phone,
                'role': 'PARTICIPANT',
                'is_active': True,
                'last_activity': timezone.now()
            }
        )
        user.set_password('Tdc2026!')
        user.participant_code = code
        user.save()

        # Seed realistic attempts for the first 5 participants
        if code in ["TDC-2026-001", "TDC-2026-002", "TDC-2026-003", "TDC-2026-004", "TDC-2026-005"]:
            for t_idx, trial in enumerate(all_trials[:6]): # First 6 trials completed
                attempt, _ = Attempt.objects.get_or_create(
                    participant=user,
                    trial=trial,
                    defaults={
                        'status': AttemptStatus.GRADED,
                        'started_at': timezone.now() - timezone.timedelta(hours=2),
                        'submitted_at': timezone.now() - timezone.timedelta(hours=1, minutes=45),
                        'time_spent_seconds': 500 + (trial.order * 60) + (int(code[-1]) * 35),
                        'max_possible_score': trial.max_score
                    }
                )

                # Answers
                for q in trial.questions.all():
                    ans, _ = Answer.objects.get_or_create(attempt=attempt, question=q)
                    if q.question_type == QuestionType.SINGLE_CHOICE:
                        corr_opt = q.options.filter(is_correct=True).first()
                        if corr_opt:
                            ans.selected_options.set([corr_opt])
                            ans.score_awarded = q.points
                            ans.is_correct = True
                            ans.is_graded = True
                    elif q.question_type == QuestionType.TRUE_FALSE:
                        corr_opt = q.options.filter(is_correct=True).first()
                        if corr_opt:
                            ans.selected_options.set([corr_opt])
                            ans.score_awarded = q.points
                            ans.is_correct = True
                            ans.is_graded = True
                    elif q.question_type == QuestionType.MULTIPLE_CHOICE:
                        corr_opts = q.options.filter(is_correct=True)
                        ans.selected_options.set(corr_opts)
                        ans.score_awarded = q.points
                        ans.is_correct = True
                        ans.is_graded = True
                    elif q.question_type == QuestionType.SHORT_TEXT:
                        ans.text_answer = q.correct_text_answer
                        ans.score_awarded = q.points
                        ans.is_correct = True
                        ans.is_graded = True
                    elif q.question_type == QuestionType.NUMERIC:
                        ans.text_answer = q.correct_text_answer
                        ans.score_awarded = q.points
                        ans.is_correct = True
                        ans.is_graded = True
                    elif q.question_type == QuestionType.PRACTICAL:
                        # Give realistic practical score
                        score_ratio = 0.85 if code == "TDC-2026-002" else (0.80 if code == "TDC-2026-001" else 0.72)
                        ans.score_awarded = round(q.points * score_ratio, 1)
                        ans.is_graded = True
                        ans.is_correct = True
                        ans.jury_feedback = "Très bon travail technique, consignes respectées avec précision."
                        ans.graded_by = admin_user
                        ans.graded_at = timezone.now()
                        ans.original_filename = f"mission_tdc_q{q.order}.docx"
                    ans.save()

                attempt.recalculate_score()

    print("--- 5. Creating Audit Logs ---")
    AuditLog.objects.create(
        user=admin_user,
        action='LOGIN',
        description="Connexion initiale de l'administrateur système"
    )
    AuditLog.objects.create(
        user=admin_user,
        action='TRIAL_STATUS_CHANGE',
        description="Ouverture officielle de toutes les épreuves du TDC 2026"
    )

    print("\n✅ TDC Database Seeding Completed Successfully!")
    print("=" * 60)
    print("ADMIN CREDENTIALS:")
    print("  Username : admin  (or admin@tecox.org)")
    print("  Password : Admin@TDC2026!")
    print("\nJURY CREDENTIALS:")
    print("  Username : jury   (or jury@tecox.org)")
    print("  Password : Jury@TDC2026!")
    print("\nPARTICIPANT CREDENTIALS (e.g.):")
    print("  Code / User : TDC-2026-001  (or eloge.gomina)")
    print("  Password    : Tdc2026!")
    print("=" * 60)

if __name__ == '__main__':
    seed_database()
