'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import {
  Trophy,
  Award,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  TrendingUp,
  User as UserIcon,
  Laptop,
  Smartphone,
  FileText,
  Table as TableIcon,
  Presentation,
  Flame,
  Info
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, LeaderboardEntry, Attempt } from '@/types';
import { getCategoryLabel, formatTime } from '@/lib/utils';

export default function ParticipantDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [trials, setTrials] = useState<Trial[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [trialsRes, attemptsRes, leaderRes] = await Promise.all([
          api.get('/competitions/trials/').catch(() => ({ data: [] })),
          api.get('/attempts/my-history/').catch(() => ({ data: [] })),
          api.get('/analytics/leaderboard/').catch(() => ({ data: { leaderboard: [] } }))
        ]);

        const trialsList = Array.isArray(trialsRes.data)
          ? trialsRes.data
          : (trialsRes.data?.results || []);
        const attemptsList = Array.isArray(attemptsRes.data)
          ? attemptsRes.data
          : (attemptsRes.data?.results || []);
        const leaderList = Array.isArray(leaderRes.data?.leaderboard)
          ? leaderRes.data.leaderboard
          : [];

        setTrials(trialsList);
        setAttempts(attemptsList);
        setLeaderboard(leaderList);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
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

  // Calculate aggregated stats safely
  const trialsArray = Array.isArray(trials) ? trials : [];
  const attemptsArray = Array.isArray(attempts) ? attempts : [];
  const leaderboardArray = Array.isArray(leaderboard) ? leaderboard : [];

  const totalMaxPoints = trialsArray.reduce((acc, t) => acc + (t.max_score || 100), 0) || 1100;
  const attemptsMap = new Map(attemptsArray.map((a) => [a.trial, a]));

  let totalScoreObtained = 0;
  let completedCount = 0;
  let totalTimeSeconds = 0;

  trialsArray.forEach((t) => {
    const att = attemptsMap.get(t.id);
    if (att && (att.status === 'submitted' || att.status === 'graded' || att.status === 'expired')) {
      totalScoreObtained += att.total_score;
      totalTimeSeconds += att.time_spent_seconds;
      completedCount += 1;
    }
  });

  const globalPercentage = totalMaxPoints > 0 ? (totalScoreObtained / totalMaxPoints) * 100 : 0;

  // Find user's rank
  const myLeaderboardEntry = leaderboard.find((e) => e.participant_id === user?.id);
  const myRank = myLeaderboardEntry ? myLeaderboardEntry.rank : '-';

  const getTrialIcon = (order: number) => {
    switch (order) {
      case 1: return <Laptop className="w-5 h-5 text-blue-600" />;
      case 2: return <Smartphone className="w-5 h-5 text-cyan-600" />;
      case 3: return <Laptop className="w-5 h-5 text-indigo-600" />;
      case 4: return <Layers className="w-5 h-5 text-sky-600" />;
      case 5: return <FileText className="w-5 h-5 text-blue-700" />;
      case 6: return <TableIcon className="w-5 h-5 text-emerald-600" />;
      case 7: return <Presentation className="w-5 h-5 text-amber-600" />;
      case 8: return <Trophy className="w-5 h-5 text-amber-500" />;
      default: return <Award className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#082F6A] text-white flex items-center justify-center text-xl font-bold ring-4 ring-blue-50 dark:ring-slate-700 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user?.first_name?.[0] || 'P'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.full_name}
                </h1>
                <Badge variant="primary" size="sm">
                  {user?.participant_code}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {user?.team_group || 'Candidat individuel'} • TeCoX Digital Challenge 2026
              </p>
            </div>
          </div>

          {/* Quick overall percentage summary */}
          <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-500">Progression globale TDC</span>
              <span className="font-bold text-[#082F6A] dark:text-cyan-400">
                {globalPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={globalPercentage} max={100} showPercentage={false} color="primary" />
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#082F6A] dark:text-cyan-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Total</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {totalScoreObtained.toFixed(1)}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {totalMaxPoints} pts</span>
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classement Actuel</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  #{myRank}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {leaderboard.length || 1}</span>
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Épreuves Réalisées</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {completedCount}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {trials.length}</span>
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temps Passé</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatTime(totalTimeSeconds)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2-Columns Layout: Trials List + Leaderboard Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: The Épreuves List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Épreuves de la compétition
                </h2>
                <p className="text-xs text-slate-500">
                  Passez chaque épreuve dans le temps imparti. Les scores sont calculés automatiquement.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {trials.map((trial) => {
                const attempt = attemptsMap.get(trial.id);
                const isCompleted = attempt && (attempt.status === 'submitted' || attempt.status === 'graded' || attempt.status === 'expired');
                const isInProgress = attempt && attempt.status === 'in_progress';

                return (
                  <div
                    key={trial.id}
                    className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700/60 shrink-0">
                        {getTrialIcon(trial.order)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{trial.order}
                          </span>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                            {trial.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {trial.duration_minutes} min
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {trial.max_score} pts max
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                      {isCompleted ? (
                        <div className="text-left sm:text-right">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                            Score : {attempt?.total_score} / {trial.max_score} pts ({attempt?.percentage}%)
                          </span>
                        </div>
                      ) : isInProgress ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          En cours de passage
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300">
                          Non commencée
                        </span>
                      )}

                      <a href={isCompleted ? `/trials/${trial.id}` : `/trials/${trial.id}/exam`} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant={isCompleted ? 'outline' : isInProgress ? 'primary' : 'primary'}
                          className="w-full sm:w-auto text-xs"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          {isCompleted ? 'Voir détails' : isInProgress ? 'Reprendre' : 'Commencer'}
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Leaderboard Preview Widget */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Classement TDC (Top 5)
              </h2>
              <a href="/leaderboard" className="text-xs font-semibold text-[#082F6A] dark:text-cyan-400 hover:underline">
                Voir tout
              </a>
            </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                {leaderboard.slice(0, 5).map((entry, idx) => {
                  const isMe = entry.participant_id === user?.id;
                  return (
                    <div
                      key={entry.participant_id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        isMe
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className={`text-xs font-semibold ${isMe ? 'text-[#082F6A] dark:text-cyan-300' : 'text-slate-900 dark:text-white'}`}>
                            {entry.full_name} {isMe && '(Moi)'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {entry.participant_code}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {entry.total_score} pts
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {entry.global_percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
