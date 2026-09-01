'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import {
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  ChevronLeft,
  FileCheck,
  MessageSquare,
  ShieldAlert,
  Info,
  Laptop
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, Attempt } from '@/types';
import { getCategoryLabel, formatTime, formatDate } from '@/lib/utils';

export default function TrialDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [trial, setTrial] = useState<Trial | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trialRes, attemptsRes] = await Promise.all([
          api.get(`/competitions/trials/${id}/`),
          api.get('/attempts/my-history/').catch(() => ({ data: [] }))
        ]);

        setTrial(trialRes.data);
        const attemptsList = Array.isArray(attemptsRes.data)
          ? attemptsRes.data
          : (attemptsRes.data?.results || []);
        const myAttempt = attemptsList.find((a: Attempt) => a.trial === Number(id));
        setAttempt(myAttempt || null);
      } catch (err) {
        console.error('Failed to load trial detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !trial) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  const isCompleted = attempt && (attempt.status === 'submitted' || attempt.status === 'graded' || attempt.status === 'expired');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <a href="/trials" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à la liste des épreuves</span>
        </a>

        {/* Trial Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold rounded-md bg-blue-50 text-[#082F6A] dark:bg-blue-950 dark:text-cyan-300 font-mono">
                Épreuve #{trial.order}
              </span>
              <Badge variant="default">{getCategoryLabel(trial.category)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {trial.duration_minutes} minutes
              </span>
              <span className="font-bold text-[#082F6A] dark:text-cyan-400">
                Barème : {trial.max_score} pts
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {trial.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {trial.description}
            </p>
          </div>
        </div>

        {/* If Completed: Performance Breakdown */}
        {isCompleted && attempt ? (
          <div className="space-y-6">
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Résultats de votre tentative
                      </h2>
                      <p className="text-xs text-slate-500">
                        Soumise le {formatDate(attempt.submitted_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {attempt.total_score} <span className="text-sm font-normal text-slate-400">/ {trial.max_score} pts</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Taux de réussite : {attempt.percentage}%
                    </p>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <p className="text-xs text-slate-500 font-medium">Score Quiz Automatique</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {attempt.auto_score} pts
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <p className="text-xs text-slate-500 font-medium">Score Mission Pratique</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {attempt.manual_score} pts
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    <p className="text-xs text-slate-500 font-medium">Temps Utilisé</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                      {formatTime(attempt.time_spent_seconds)}
                    </p>
                  </div>
                </div>

                {/* Answers Breakdown / Jury Feedback */}
                {attempt.answers && attempt.answers.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Détails des questions et retours du jury
                    </h3>
                    <div className="space-y-2">
                      {attempt.answers.map((ans, idx) => (
                        <div
                          key={ans.id}
                          className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Question #{idx + 1}
                            </span>
                            {ans.original_filename && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                {ans.original_filename}
                              </p>
                            )}
                            {ans.jury_feedback && (
                              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] mt-1 border border-amber-200/60">
                                💬 <strong>Remarque du Jury :</strong> {ans.jury_feedback}
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white shrink-0">
                            {ans.score_awarded} pts
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* If Not Completed: Briefing and Start Button */
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#082F6A] dark:text-cyan-400" />
                  Règles & Consignes de passage
                </h3>
                <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                  <li>L'épreuve est chronométrée : vous disposez de <strong>{trial.duration_minutes} minutes</strong> dès que vous cliquez sur Démarrer.</li>
                  <li>Vos réponses sont automatiquement sauvegardées au fur et à mesure.</li>
                  <li>Pour les missions pratiques (Word, Excel, PowerPoint, Windows), réalisez le fichier sur votre poste et déposez-le dans la zone prévue avant de soumettre.</li>
                  <li>Une seule tentative est comptabilisée pour le classement officiel.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <a href={`/trials/${trial.id}/exam`}>
                  <Button size="lg" rightIcon={<PlayCircle className="w-5 h-5" />}>
                    {attempt?.status === 'in_progress' ? "Reprendre l'épreuve en cours" : "Démarrer l'épreuve maintenant"}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
