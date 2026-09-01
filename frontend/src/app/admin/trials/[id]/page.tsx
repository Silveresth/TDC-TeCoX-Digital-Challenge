'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  HelpCircle,
  Clock,
  Award,
  CheckCircle2,
  Save,
  FileCheck
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, Question, Option, QuestionType, DifficultyLevel, TrialCategory, TrialStatus } from '@/types';
import { getQuestionTypeLabel, getDifficultyBadge } from '@/lib/utils';

export default function AdminTrialQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();

  const [trial, setTrial] = useState<Trial | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Question Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Question Form State
  const [qFormData, setQFormData] = useState({
    question_type: 'SINGLE_CHOICE' as QuestionType,
    prompt: '',
    points: 10,
    order: 1,
    difficulty: 'MEDIUM' as DifficultyLevel,
    explanation: '',
    correct_text_answer: '',
    practical_instructions: '',
    practical_allowed_extensions: '.docx,.xlsx,.pptx,.pdf,.zip',
    options: [
      { text: '', is_correct: true, order: 1 },
      { text: '', is_correct: false, order: 2 },
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrialData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/competitions/trials/${id}/`);
      setTrial(res.data);
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement de l\'épreuve.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialData();
  }, [id]);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQFormData({
      question_type: 'SINGLE_CHOICE',
      prompt: '',
      points: 20,
      order: questions.length + 1,
      difficulty: 'MEDIUM',
      explanation: '',
      correct_text_answer: '',
      practical_instructions: '',
      practical_allowed_extensions: '.docx,.xlsx,.pptx,.pdf,.zip',
      options: [
        { text: '', is_correct: true, order: 1 },
        { text: '', is_correct: false, order: 2 },
      ]
    });
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQFormData({
      question_type: q.question_type,
      prompt: q.prompt,
      points: q.points,
      order: q.order,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      correct_text_answer: q.correct_text_answer || '',
      practical_instructions: q.practical_instructions || '',
      practical_allowed_extensions: q.practical_allowed_extensions || '.docx,.xlsx,.pptx,.pdf,.zip',
      options: q.options && q.options.length > 0 ? q.options.map(o => ({ text: o.text, is_correct: Boolean(o.is_correct), order: o.order })) : [
        { text: '', is_correct: true, order: 1 },
        { text: '', is_correct: false, order: 2 },
      ]
    });
    setShowQuestionModal(true);
  };

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...qFormData.options];
    updated[index].text = text;
    setQFormData({ ...qFormData, options: updated });
  };

  const handleOptionCorrectToggle = (index: number) => {
    const updated = [...qFormData.options];
    if (qFormData.question_type === 'SINGLE_CHOICE' || qFormData.question_type === 'TRUE_FALSE') {
      updated.forEach((o, i) => {
        o.is_correct = (i === index);
      });
    } else {
      updated[index].is_correct = !updated[index].is_correct;
    }
    setQFormData({ ...qFormData, options: updated });
  };

  const handleAddOption = () => {
    setQFormData({
      ...qFormData,
      options: [
        ...qFormData.options,
        { text: '', is_correct: false, order: qFormData.options.length + 1 }
      ]
    });
  };

  const handleRemoveOption = (index: number) => {
    if (qFormData.options.length <= 2) return;
    setQFormData({
      ...qFormData,
      options: qFormData.options.filter((_, i) => i !== index)
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      trial: Number(id),
      question_type: qFormData.question_type,
      prompt: qFormData.prompt,
      points: qFormData.points,
      order: qFormData.order,
      difficulty: qFormData.difficulty,
      explanation: qFormData.explanation,
      correct_text_answer: qFormData.correct_text_answer,
      practical_instructions: qFormData.practical_instructions,
      practical_allowed_extensions: qFormData.practical_allowed_extensions,
      options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(qFormData.question_type)
        ? qFormData.options
        : []
    };

    try {
      if (editingQuestion) {
        await api.put(`/competitions/questions/${editingQuestion.id}/`, payload);
        showToast('Question mise à jour avec succès.', 'success');
      } else {
        await api.post('/competitions/questions/', payload);
        showToast('Nouvelle question ajoutée.', 'success');
      }
      setShowQuestionModal(false);
      fetchTrialData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de l\'enregistrement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Supprimer définitivement cette question ?')) return;
    try {
      await api.delete(`/competitions/questions/${qId}/`);
      showToast('Question supprimée.', 'success');
      fetchTrialData();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  if (loading || !trial) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto text-white">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-800">
        <a href="/admin/trials" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Retour aux épreuves</span>
        </a>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-[#082F6A] text-cyan-300 text-xs font-mono font-bold">
                Épreuve #{trial.order}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {trial.title}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Durée: {trial.duration_minutes} min • Barème total: {trial.max_score} pts • {questions.length} question(s)
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddQuestion}
          >
            Ajouter une Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
            Aucune question configurée pour cette épreuve. Cliquez sur "Ajouter une Question".
          </Card>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id} className="bg-slate-900 border-slate-800 text-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-300 flex items-center justify-center text-xs font-mono font-bold">
                      Q{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-400">
                        {getQuestionTypeLabel(q.question_type)}
                      </span>
                      <span className="mx-2 text-slate-600">•</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {q.points} points
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-200 whitespace-pre-line leading-relaxed">
                  {q.prompt}
                </p>

                {/* Options display */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                          opt.is_correct
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <span>{opt.is_correct ? '✓' : '○'}</span>
                        <span className="truncate">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct text answer */}
                {q.correct_text_answer && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <strong>Réponse attendue :</strong> <span className="font-mono text-cyan-300">{q.correct_text_answer}</span>
                  </div>
                )}

                {/* Practical instructions preview */}
                {q.practical_instructions && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-cyan-400 uppercase text-[10px]">Consignes de la mission pratique :</p>
                    <p className="text-[11px] text-slate-400 font-mono line-clamp-2">{q.practical_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Add or Edit Question */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title={editingQuestion ? `Modifier Question #${editingQuestion.order}` : 'Ajouter une Question / Mission'}
        description="Configurez l'énoncé, le type d'exercice, les options et le barème."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 text-slate-900 dark:text-white">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Select
                label="Type de Question"
                value={qFormData.question_type}
                onChange={(e) => setQFormData({ ...qFormData, question_type: e.target.value as QuestionType })}
              >
                <option value="SINGLE_CHOICE">QCM Choix Unique</option>
                <option value="MULTIPLE_CHOICE">QCM Choix Multiples</option>
                <option value="TRUE_FALSE">Vrai / Faux</option>
                <option value="SHORT_TEXT">Réponse Courte Textuelle</option>
                <option value="NUMERIC">Réponse Numérique</option>
                <option value="PRACTICAL">Mission Pratique (Dépôt de fichier)</option>
              </Select>
            </div>

            <Input
              label="Points"
              type="number"
              value={qFormData.points}
              onChange={(e) => setQFormData({ ...qFormData, points: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Énoncé de la question
            </label>
            <textarea
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#082F6A]"
              rows={3}
              value={qFormData.prompt}
              onChange={(e) => setQFormData({ ...qFormData, prompt: e.target.value })}
              placeholder="Saisissez l'énoncé de la question..."
              required
            />
          </div>

          {/* If MCQ / True-False: Options Builder */}
          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(qFormData.question_type) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Options de réponse (Cochez la/les bonne(s) réponse(s))</span>
                {qFormData.question_type !== 'TRUE_FALSE' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[#082F6A] dark:text-cyan-400 font-bold hover:underline"
                  >
                    + Ajouter une option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {qFormData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type={qFormData.question_type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={() => handleOptionCorrectToggle(idx)}
                      className="w-4 h-4 text-[#082F6A] focus:ring-[#082F6A] rounded"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Texte de l'option ${idx + 1}...`}
                      className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                      required
                    />
                    {qFormData.options.length > 2 && qFormData.question_type !== 'TRUE_FALSE' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Short Text or Numeric */}
          {['SHORT_TEXT', 'NUMERIC'].includes(qFormData.question_type) && (
            <Input
              label="Réponse exacte attendue pour notation automatique"
              value={qFormData.correct_text_answer}
              onChange={(e) => setQFormData({ ...qFormData, correct_text_answer: e.target.value })}
              placeholder="Ex: CPU ou 1024"
              required
            />
          )}

          {/* If Practical Task */}
          {qFormData.question_type === 'PRACTICAL' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Consignes détaillées de la mission pratique
                </label>
                <textarea
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#082F6A]"
                  rows={4}
                  value={qFormData.practical_instructions}
                  onChange={(e) => setQFormData({ ...qFormData, practical_instructions: e.target.value })}
                  placeholder="1. Créez un document Word avec un tableau...&#10;2. Enregistrez sous le format..."
                  required
                />
              </div>

              <Input
                label="Extensions de fichiers autorisées"
                value={qFormData.practical_allowed_extensions}
                onChange={(e) => setQFormData({ ...qFormData, practical_allowed_extensions: e.target.value })}
                placeholder=".docx,.xlsx,.pptx,.pdf,.zip"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowQuestionModal(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              {editingQuestion ? 'Mettre à jour' : 'Ajouter la question'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
