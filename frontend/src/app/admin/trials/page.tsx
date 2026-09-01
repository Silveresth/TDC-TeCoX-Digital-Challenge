'use client';

import React, { useEffect, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  Layers,
  Plus,
  Clock,
  Award,
  Edit2,
  CheckCircle2,
  Play,
  Pause,
  ArrowRight,
  HelpCircle,
  Laptop
} from 'lucide-react';
import api from '@/lib/api';
import { Trial, TrialStatus } from '@/types';
import { getCategoryLabel, getStatusBadge } from '@/lib/utils';

export default function AdminTrialsPage() {
  const { showToast } = useNotification();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competitions/trials/');
      setTrials(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des épreuves.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, []);

  const handleStatusChange = async (trialId: number, newStatus: TrialStatus) => {
    try {
      const res = await api.post(`/competitions/trials/${trialId}/set_status/`, { status: newStatus });
      showToast(res.data.detail, 'success');
      fetchTrials();
    } catch (err) {
      showToast('Erreur lors du changement de statut.', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Épreuves & Barèmes du TDC 2026
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les 8 épreuves officielles, activez/désactivez leur statut et configurez leurs questions.
          </p>
        </div>

        <a href="/admin/trials/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Créer une Épreuve
          </Button>
        </a>
      </div>

      {/* Trials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : (
          trials.map((trial) => {
            const badge = getStatusBadge(trial.status);
            return (
              <Card key={trial.id} className="bg-slate-900 border-slate-800 text-white flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-blue-950 text-cyan-300 border border-blue-800 flex items-center justify-center text-sm font-mono font-bold">
                        #{trial.order}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {trial.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {getCategoryLabel(trial.category)}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold rounded border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {trial.description || 'Aucune description saisie.'}
                  </p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {trial.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-cyan-300">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {trial.question_count || trial.questions?.length || 0} questions
                    </span>
                    <span className="font-bold text-amber-400">
                      Barème: {trial.max_score} pts
                    </span>
                  </div>
                </CardContent>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Statut :</span>
                    <select
                      value={trial.status}
                      onChange={(e) => handleStatusChange(trial.id, e.target.value as TrialStatus)}
                      className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="DRAFT">Brouillon</option>
                      <option value="OPEN">Ouverte</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="COMPLETED">Terminée</option>
                      <option value="ARCHIVED">Archivée</option>
                    </select>
                  </div>

                  <a href={`/admin/trials/${trial.id}`}>
                    <Button size="sm" variant="outline" className="text-xs bg-slate-900 border-slate-700 text-slate-200">
                      Gérer Questions ({trial.question_count || 0})
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
