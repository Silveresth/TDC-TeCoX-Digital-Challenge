from django.utils import timezone
from .models import Answer, Attempt, AttemptStatus
from apps.competitions.models import QuestionType

def grade_objective_answer(answer: Answer) -> float:
    """
    Grades an individual answer automatically for non-practical question types.
    Returns the awarded score (float).
    """
    question = answer.question
    q_type = question.question_type
    points = float(question.points)

    if q_type == QuestionType.PRACTICAL:
        # Practical tasks require manual jury grading
        return answer.score_awarded

    score = 0.0
    is_correct = False

    if q_type in [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE]:
        selected = answer.selected_options.first()
        if selected and selected.is_correct:
            score = points
            is_correct = True
        else:
            score = 0.0
            is_correct = False

    elif q_type == QuestionType.MULTIPLE_CHOICE:
        correct_options = set(question.options.filter(is_correct=True).values_list('id', flat=True))
        selected_options = set(answer.selected_options.values_list('id', flat=True))

        if correct_options:
            if selected_options == correct_options:
                score = points
                is_correct = True
            elif selected_options.issubset(correct_options) and len(selected_options) > 0:
                # Partial credit: proportion of correct options selected without wrong picks
                score = round((len(selected_options) / len(correct_options)) * points, 2)
                is_correct = False
            else:
                score = 0.0
                is_correct = False
        else:
            score = points if not selected_options else 0.0

    elif q_type == QuestionType.SHORT_TEXT:
        expected = question.correct_text_answer.strip()
        actual = answer.text_answer.strip()

        if question.is_case_sensitive:
            matched = (actual == expected)
        else:
            matched = (actual.lower() == expected.lower())

        if matched and expected:
            score = points
            is_correct = True
        else:
            score = 0.0
            is_correct = False

    elif q_type == QuestionType.NUMERIC:
        expected_str = question.correct_text_answer.strip().replace(',', '.')
        actual_str = answer.text_answer.strip().replace(',', '.')
        try:
            exp_val = float(expected_str)
            act_val = float(actual_str)
            if abs(exp_val - act_val) < 0.001:
                score = points
                is_correct = True
            else:
                score = 0.0
                is_correct = False
        except (ValueError, TypeError):
            score = 0.0
            is_correct = False

    answer.score_awarded = score
    answer.is_correct = is_correct
    answer.is_graded = True
    answer.save(update_fields=['score_awarded', 'is_correct', 'is_graded', 'updated_at'])
    return score


def grade_practical_answer(answer: Answer, score: float, feedback: str = '', jury_user = None) -> Answer:
    """
    Applies manual evaluation by a jury or administrator for practical mission answers.
    """
    max_pts = answer.question.points
    clamped_score = max(0.0, min(float(score), float(max_pts)))

    answer.score_awarded = round(clamped_score, 2)
    answer.is_correct = (clamped_score >= (max_pts * 0.5))
    answer.is_graded = True
    answer.jury_feedback = feedback
    answer.graded_by = jury_user
    answer.graded_at = timezone.now()
    answer.save(update_fields=[
        'score_awarded', 'is_correct', 'is_graded',
        'jury_feedback', 'graded_by', 'graded_at', 'updated_at'
    ])

    # Recalculate whole attempt score
    answer.attempt.recalculate_score()

    # Log action
    try:
        from apps.analytics.models import AuditLog
        AuditLog.objects.create(
            user=jury_user,
            action='GRADE_PRACTICAL',
            description=f"Correction manuelle de la mission Q{answer.question.order} pour {answer.attempt.participant.full_name} : {answer.score_awarded}/{max_pts} pts"
        )
    except Exception:
        pass

    return answer


def finalize_attempt(attempt: Attempt, reason: str = 'submitted'):
    """
    Finalizes an attempt (submitted by user or expired by timer).
    Runs automatic grading on all objective questions and updates attempt status.
    """
    if attempt.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED]:
        return attempt

    # Auto-grade all objective answers
    for ans in attempt.answers.all():
        if ans.question.question_type != QuestionType.PRACTICAL:
            grade_objective_answer(ans)

    attempt.submitted_at = timezone.now()
    if reason == 'expired':
        attempt.status = AttemptStatus.EXPIRED
    else:
        attempt.status = AttemptStatus.SUBMITTED

    attempt.recalculate_score()

    # Log submission
    try:
        from apps.analytics.models import AuditLog
        action_name = 'TRIAL_EXPIRED' if reason == 'expired' else 'TRIAL_SUBMITTED'
        AuditLog.objects.create(
            user=attempt.participant,
            action=action_name,
            description=f"Épreuve '{attempt.trial.title}' finalisée par {attempt.participant.full_name} (Score auto: {attempt.auto_score} pts)"
        )
    except Exception:
        pass

    return attempt
