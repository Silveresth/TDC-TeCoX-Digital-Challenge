'use client';

import React, { useEffect, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Trophy,
  Eye,
  EyeOff,
  Settings,
  Save,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import api from '@/lib/api';
import { LeaderboardEntry, CompetitionSetting } from '@/types';

export default function AdminLeaderboardControlPage() {
  const { showToast } = useNotification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<CompetitionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaderRes, settRes] = await Promise.all([
        api.get('/analytics/leaderboard/'),
        api.get('/analytics/settings/'),
      ]);
      setLeaderboard(leaderRes.data.leaderboard || []);
      setSettings(settRes.data);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePublic = async () => {
    if (!settings) return;
    setIsUpdatingSettings(true);
    try {
      const res = await api.patch('/analytics/settings/', {
        is_leaderboard_public: !settings.is_leaderboard_public,
      });
      setSettings(res.data);
      showToast(
        res.data.is_leaderboard_public
          ? 'Le classement est maintenant public pour les participants.'
          : 'Le classement est désormais masqué aux participants.',
        'success'
      );
    } catch (err) {
      showToast('Erreur lors de la mise à jour des paramètres.', 'error');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Contrôle du Classement & Compétition
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérez la visibilité du classement pour les participants et supervisez les scores en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={settings.is_leaderboard_public ? 'outline' : 'primary'}
            onClick={handleTogglePublic}
            isLoading={isUpdatingSettings}
            leftIcon={settings.is_leaderboard_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            className="text-xs"
          >
            {settings.is_leaderboard_public
              ? 'Masquer le classement aux participants'
              : 'Rendre le classement public'}
          </Button>

          <a href="/admin/export">
            <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Exporter
            </Button>
          </a>
        </div>
      </div>

      {/* Settings Card */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              État de diffusion du classement
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings.is_leaderboard_public
                ? '🟢 Le classement est visible en direct par tous les participants.'
                : '🔒 Le classement est masqué aux participants pendant le déroulement des épreuves.'}
            </p>
          </div>
          <Badge variant={settings.is_leaderboard_public ? 'success' : 'warning'}>
            {settings.is_leaderboard_public ? 'Public' : 'Masqué'}
          </Badge>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-14">Rang</th>
                <th className="p-3.5">Participant</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Groupe</th>
                <th className="p-3.5 text-center">Épreuves Terminées</th>
                <th className="p-3.5 text-right">Score Total</th>
                <th className="p-3.5 text-right">Pourcentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaderboard.map((entry) => (
                <tr key={entry.participant_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-center font-mono font-bold">
                    #{entry.rank}
                  </td>
                  <td className="p-3.5 font-semibold text-white">
                    {entry.full_name}
                  </td>
                  <td className="p-3.5 font-mono text-cyan-300">
                    {entry.participant_code}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {entry.team_group || '-'}
                  </td>
                  <td className="p-3.5 text-center font-mono text-slate-300">
                    {entry.completed_trials_count} / 8
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                    {entry.total_score} pts
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-400 font-semibold">
                    {entry.global_percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
