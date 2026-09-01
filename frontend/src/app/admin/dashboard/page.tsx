'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Users,
  Layers,
  Award,
  Clock,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Flame,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard-stats/');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const { kpis, top_participant, easiest_trial, hardest_trial, trial_stats, recent_logs } = stats;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Tableau de Bord Administrateur TDC
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#082F6A] text-cyan-300 border border-blue-800">
              Édition 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervision globale, gestion des épreuves, corrections en direct et statistiques.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Actualiser
          </Button>
          <a href="/admin/export">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              Exporter les résultats
            </Button>
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-950 text-cyan-400 border border-blue-900 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Participants</p>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {kpis.total_participants}{' '}
                <span className="text-xs text-emerald-400 font-medium">({kpis.online_participants} actifs)</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-900 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Épreuves</p>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {kpis.total_trials}{' '}
                <span className="text-xs text-purple-300 font-medium">({kpis.open_trials} ouvertes)</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-900 shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Corrections Jury</p>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {kpis.pending_practicals}{' '}
                <span className="text-xs text-amber-400 font-medium">en attente</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-900 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moyenne Globale</p>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {kpis.average_percentage}%
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlights: Top Performer, Easiest & Hardest Trial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {top_participant && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                🥇 Meilleur Participant Actuel
              </p>
              <h3 className="text-lg font-bold text-white">{top_participant.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {top_participant.code} • <strong className="text-cyan-300">{top_participant.score} pts</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {easiest_trial && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                💻 Épreuve la Plus Réussie
              </p>
              <h3 className="text-base font-bold text-white line-clamp-1">{easiest_trial.title}</h3>
              <p className="text-xs text-emerald-400 font-medium">
                Moyenne de score : {easiest_trial.average_score_pct}%
              </p>
            </CardContent>
          </Card>
        )}

        {hardest_trial && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
                📊 Épreuve la Plus Difficile
              </p>
              <h3 className="text-base font-bold text-white line-clamp-1">{hardest_trial.title}</h3>
              <p className="text-xs text-rose-400 font-medium">
                Moyenne de score : {hardest_trial.average_score_pct}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trial Performance Breakdown Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="border-slate-800">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
            Performances Détaillées par Épreuve
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5">Épreuve</th>
                <th className="p-3.5">Catégorie</th>
                <th className="p-3.5 text-center">Tentatives</th>
                <th className="p-3.5 text-right">Score Moyen (%)</th>
                <th className="p-3.5 text-right">Temps Moyen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trial_stats.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                    {t.order}
                  </td>
                  <td className="p-3.5 font-semibold text-white">
                    {t.title}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {getCategoryLabel(t.category)}
                  </td>
                  <td className="p-3.5 text-center font-mono text-cyan-400">
                    {t.attempts_count}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                    {t.average_score_pct}%
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    {t.average_time_minutes} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Real-time Audit Logs Preview */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Événements Récents en Direct
          </CardTitle>
          <a href="/admin/logs" className="text-xs text-cyan-400 hover:underline">
            Voir tout l'historique
          </a>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {recent_logs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <p className="text-slate-200 font-medium">{log.description}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {log.user?.full_name || 'Système'} • {formatDate(log.created_at)}
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {log.action_display}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
