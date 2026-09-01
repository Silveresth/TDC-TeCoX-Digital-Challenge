'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Layers,
  Sparkles,
  Award,
  Laptop,
  Smartphone,
  FileText,
  Table as TableIcon,
  Presentation,
  Flame,
  Clock
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, LeaderboardEntry } from '@/types';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trialsRes, leaderRes] = await Promise.all([
          api.get('/competitions/trials/').catch(() => ({ data: [] })),
          api.get('/analytics/leaderboard/').catch(() => ({ data: { podium: [] } }))
        ]);
        const trialsList = Array.isArray(trialsRes.data)
          ? trialsRes.data
          : (trialsRes.data?.results || []);
        const podiumList = Array.isArray(leaderRes.data?.podium)
          ? leaderRes.data.podium
          : [];
        setTrials(trialsList.slice(0, 8));
        setPodium(podiumList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-[#082F6A] dark:text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Plateforme Officielle de Compétition — Édition 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                TeCoX Digital Challenge <br />
                <span className="text-[#082F6A] dark:text-cyan-400">Mesurez vos compétences numériques</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Participez aux 8 épreuves officielles du TDC : informatique générale, smartphone, système Windows, suite bureautique Microsoft Office (Word, Excel, PowerPoint) et le Grand Challenge final.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <a href="/dashboard">
                    <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Accéder à mon tableau de bord
                    </Button>
                  </a>
                ) : (
                  <a href="/login">
                    <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Se connecter avec mon Code TDC
                    </Button>
                  </a>
                )}
                <a href="/leaderboard">
                  <Button variant="outline" size="lg" leftIcon={<Trophy className="w-5 h-5 text-amber-500" />}>
                    Voir le Classement en direct
                  </Button>
                </a>
              </div>

              {/* Key badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-lg">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">8</p>
                  <p className="text-xs text-slate-500 font-medium">Épreuves officielles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">1 100</p>
                  <p className="text-xs text-slate-500 font-medium">Points au barème</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#082F6A] dark:text-cyan-400">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Temps réel & Sécurisé</p>
                </div>
              </div>
            </div>

            {/* Right Card Presentation */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src="/logo-court.png" alt="TeCoX" className="h-10 w-auto brightness-125" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">TDC 2026</h3>
                      <p className="text-xs text-cyan-400">TeCoX Digital Challenge</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>

                <div className="py-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Top 3 Actuel — Podium TDC
                  </h4>
                  {podium.length > 0 ? (
                    podium.map((p, idx) => (
                      <div
                        key={p.participant_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : 'bg-amber-700 text-white'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.participant_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-cyan-300">{p.total_score} pts</p>
                          <p className="text-[11px] text-slate-400">{p.global_percentage}%</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      En attente des premières soumissions d'épreuves.
                    </div>
                  )}
                </div>

                <a href="/leaderboard" className="block pt-2">
                  <Button variant="secondary" size="sm" className="w-full bg-slate-800 text-white hover:bg-slate-700 border-slate-700">
                    Consulter le tableau complet
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 8 Official Trials Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5" />
            <span>Structure de la compétition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Les 8 Épreuves Officielles du TDC
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chaque épreuve évalue une dimension clé de la formation numérique dispensée par TeCoX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trials.map((trial) => (
            <Card key={trial.id} hover className="flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60">
                    {getTrialIcon(trial.order)}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Épreuve #{trial.order}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {trial.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {trial.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {trial.duration_minutes} min
                  </span>
                  <span className="font-bold text-[#082F6A] dark:text-cyan-400">
                    {trial.max_score} points
                  </span>
                </div>
              </CardContent>

              <div className="px-5 pb-5 pt-0">
                <a href={user ? `/trials/${trial.id}` : `/login`} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    {user ? "Voir l'épreuve" : "Se connecter pour participer"}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
