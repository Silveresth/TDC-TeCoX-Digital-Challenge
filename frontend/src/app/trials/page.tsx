'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Layers,
  Clock,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  Laptop,
  Smartphone,
  FileText,
  Table as TableIcon,
  Presentation,
  Trophy,
  Award
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, Attempt } from '@/types';
import { getCategoryLabel } from '@/lib/utils';

export default function TrialsListPage() {
  const { user } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const [trialsRes, attemptsRes] = await Promise.all([
          api.get('/competitions/trials/').catch(() => ({ data: [] })),
          api.get('/attempts/my-history/').catch(() => ({ data: [] }))
        ]);
        const trialsList = Array.isArray(trialsRes.data)
          ? trialsRes.data
          : (trialsRes.data?.results || []);
        const attemptsList = Array.isArray(attemptsRes.data)
          ? attemptsRes.data
          : (attemptsRes.data?.results || []);
        setTrials(trialsList);
        setAttempts(attemptsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrials();
  }, []);

  const attemptsArray = Array.isArray(attempts) ? attempts : [];
  const attemptsMap = new Map(attemptsArray.map((a) => [a.trial, a]));
  const trialsArray = Array.isArray(trials) ? trials : [];

  const getTrialIcon = (order: number) => {
    switch (order) {
      case 1: return <Laptop className="w-6 h-6 text-blue-600" />;
      case 2: return <Smartphone className="w-6 h-6 text-cyan-600" />;
      case 3: return <Laptop className="w-6 h-6 text-indigo-600" />;
      case 4: return <Layers className="w-6 h-6 text-sky-600" />;
      case 5: return <FileText className="w-6 h-6 text-blue-700" />;
      case 6: return <TableIcon className="w-6 h-6 text-emerald-600" />;
      case 7: return <Presentation className="w-6 h-6 text-amber-600" />;
      case 8: return <Trophy className="w-6 h-6 text-amber-500" />;
      default: return <Award className="w-6 h-6 text-blue-600" />;
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Les Épreuves du TeCoX Digital Challenge
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complétez les 8 épreuves pour figurer au classement final et remporter le trophée TDC 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trials.map((trial) => {
            const att = attemptsMap.get(trial.id);
            const isCompleted = att && (att.status === 'submitted' || att.status === 'graded' || att.status === 'expired');
            const isInProgress = att && att.status === 'in_progress';

            return (
              <Card key={trial.id} hover className="flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 shrink-0">
                      {getTrialIcon(trial.order)}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Épreuve #{trial.order}
                      </span>
                      <p className="text-xs font-bold text-[#082F6A] dark:text-cyan-400">
                        {trial.max_score} points max
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {trial.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {trial.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Durée : {trial.duration_minutes} minutes
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {getCategoryLabel(trial.category)}
                    </span>
                  </div>
                </CardContent>

                <div className="p-6 pt-0 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  {isCompleted ? (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Score : {att?.total_score} / {trial.max_score} pts ({att?.percentage}%)
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">{att?.status}</p>
                    </div>
                  ) : isInProgress ? (
                    <div>
                      <p className="text-xs font-semibold text-amber-600">En cours de passage</p>
                      <p className="text-[11px] text-slate-400">Chronomètre actif</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Non commencée</p>
                      <p className="text-[11px] text-slate-400">Prêt à débuter</p>
                    </div>
                  )}

                  <a href={isCompleted ? `/trials/${trial.id}` : `/trials/${trial.id}/exam`}>
                    <Button
                      size="sm"
                      variant={isCompleted ? 'outline' : 'primary'}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isCompleted ? 'Détails & Résultats' : isInProgress ? 'Reprendre l’épreuve' : 'Commencer l’épreuve'}
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
