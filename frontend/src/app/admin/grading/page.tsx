'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import {
  CheckSquare,
  FileCheck,
  Download,
  Award,
  Clock,
  User as UserIcon,
  MessageSquare,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { Attempt, Answer } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

export default function AdminGradingHubPage() {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(true);

  // Grading Modal State
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [juryFeedback, setJuryFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterPending) params.pending_practical = 'true';
      const res = await api.get('/attempts/admin-attempts/', { params });
      setAttempts(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des soumissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filterPending]);

  const openGradingModal = (att: Attempt, ans: Answer) => {
    setSelectedAttempt(att);
    setSelectedAnswer(ans);
    setGradeScore(ans.score_awarded || (ans.question?.points ? ans.question.points * 0.8 : 0));
    setJuryFeedback(ans.jury_feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/attempts/admin-attempts/grade-answer/${selectedAnswer.id}/`, {
        score: Number(gradeScore),
        feedback: juryFeedback,
      });

      showToast('Note et appréciation du jury enregistrées !', 'success');
      setSelectedAnswer(null);
      fetchSubmissions();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de la notation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Pôle d'Évaluation & Corrections Jury TDC
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consultez les fichiers déposés par les participants (Word, Excel, PowerPoint, Windows) et attribuez les notes manuelles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={filterPending ? 'primary' : 'outline'}
            onClick={() => setFilterPending(!filterPending)}
            className="text-xs"
          >
            {filterPending ? 'Afficher toutes les tentatives' : 'Filtrer uniquement non corrigées'}
          </Button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : attempts.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-400">
            {filterPending
              ? 'Toutes les missions pratiques sont actuellement corrigées ! 🎉'
              : 'Aucune tentative enregistrée pour le moment.'}
          </Card>
        ) : (
          attempts.map((att) => {
            const practicalAnswers = att.answers?.filter(
              (a) => a.question?.question_type === 'PRACTICAL'
            ) || [];

            return (
              <Card key={att.id} className="bg-slate-900 border-slate-800 text-white">
                <CardContent className="p-6 space-y-4">
                  {/* Attempt Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#082F6A] text-white flex items-center justify-center font-bold text-sm">
                        {att.participant?.first_name?.[0] || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {att.participant?.full_name}
                          </h3>
                          <Badge variant="primary" size="sm">
                            {att.participant?.participant_code}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          Épreuve #{att.trial_order}: {att.trial_title} • Soumise le {formatDate(att.submitted_at || att.started_at)}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-emerald-400 font-mono">
                        Score actuel : {att.total_score} / {att.max_possible_score} pts
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        Statut : {att.status}
                      </p>
                    </div>
                  </div>

                  {/* Practical Tasks in this Attempt */}
                  {practicalAnswers.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Missions pratiques à évaluer ({practicalAnswers.length}) :
                      </h4>

                      {practicalAnswers.map((ans, idx) => (
                        <div
                          key={ans.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-cyan-400">
                                Mission Q{ans.question?.order || idx + 1}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({ans.question?.points} pts max)
                              </span>
                              {ans.is_graded ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  Noté : {ans.score_awarded} pts
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800">
                                  En attente de notation
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-2">
                              {ans.question?.prompt}
                            </p>

                            {ans.file_upload && (
                              <div className="flex items-center gap-3 pt-1">
                                <a
                                  href={ans.file_upload}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-950 text-cyan-300 border border-blue-800 text-xs font-mono hover:bg-blue-900 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Télécharger {ans.original_filename || 'le fichier soumis'}</span>
                                </a>
                              </div>
                            )}

                            {ans.jury_feedback && (
                              <p className="text-[11px] text-amber-300/90 pt-1">
                                💬 <em>{ans.jury_feedback}</em>
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant={ans.is_graded ? 'outline' : 'primary'}
                            onClick={() => openGradingModal(att, ans)}
                            leftIcon={<Award className="w-3.5 h-3.5" />}
                            className="shrink-0"
                          >
                            {ans.is_graded ? 'Modifier la note' : 'Attribuer la note'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Cette épreuve ne contient pas de mission pratique avec fichier (notation 100% automatique).
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Grading Evaluation Modal */}
      <Modal
        isOpen={Boolean(selectedAnswer)}
        onClose={() => setSelectedAnswer(null)}
        title={`Évaluation Jury — ${selectedAttempt?.participant?.full_name}`}
        description={`Épreuve : ${selectedAttempt?.trial_title}`}
        maxWidth="lg"
      >
        {selectedAnswer && (
          <form onSubmit={handleSaveGrade} className="space-y-4 text-slate-900 dark:text-white">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Énoncé & Barème :
              </p>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {selectedAnswer.question?.prompt}
              </p>
              <div className="pt-2 flex items-center justify-between font-mono font-bold text-[#082F6A] dark:text-cyan-400">
                <span>Barème maximum : {selectedAnswer.question?.points} points</span>
              </div>
            </div>

            {selectedAnswer.file_upload && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">Fichier du candidat :</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedAnswer.original_filename}</p>
                </div>
                <a href={selectedAnswer.file_upload} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    Télécharger
                  </Button>
                </a>
              </div>
            )}

            <Input
              label={`Note attribuée (sur ${selectedAnswer.question?.points} points)`}
              type="number"
              step="0.5"
              min="0"
              max={selectedAnswer.question?.points || 100}
              value={gradeScore}
              onChange={(e) => setGradeScore(Number(e.target.value))}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Commentaire / Remarques du Jury pour le candidat
              </label>
              <textarea
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#082F6A]"
                rows={3}
                value={juryFeedback}
                onChange={(e) => setJuryFeedback(e.target.value)}
                placeholder="Remarques constructives sur la mise en forme, formules, respect des consignes..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAnswer(null)}>
                Annuler
              </Button>
              <Button type="submit" size="md" variant="primary" isLoading={isSubmitting}>
                Valider et recalculer le score
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
