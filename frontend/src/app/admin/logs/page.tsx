'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Activity, Search, RefreshCw, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/analytics/logs/', { params });
      setLogs(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <Badge variant="primary" size="sm">Connexion</Badge>;
      case 'TRIAL_START':
        return <Badge variant="info" size="sm">Début Épreuve</Badge>;
      case 'TRIAL_SUBMITTED':
        return <Badge variant="success" size="sm">Soumission</Badge>;
      case 'TRIAL_EXPIRED':
        return <Badge variant="warning" size="sm">Temps Écoulé</Badge>;
      case 'GRADE_PRACTICAL':
        return <Badge variant="danger" size="sm">Correction Jury</Badge>;
      case 'TRIAL_STATUS_CHANGE':
        return <Badge variant="default" size="sm">Statut Épreuve</Badge>;
      default:
        return <Badge variant="default" size="sm">{action}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Accès Réservé aux Administrateurs</h2>
        <p className="text-sm text-slate-400">
          Seuls les administrateurs ont accès au journal d'audit et à la traçabilité des actions système.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Journal d'Audit & Événements Système
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traçabilité complète des actions : connexions, soumissions d'épreuves, notations et modifications.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchLogs}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="bg-slate-900 border-slate-700 text-slate-200"
        >
          Actualiser
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <Input
            placeholder="Rechercher utilisateur, détails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-950 border-slate-700 text-white"
          />
        </form>

        <div className="w-full sm:w-64">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white"
          >
            <option value="">Toutes les actions</option>
            <option value="LOGIN">Connexions utilisateurs</option>
            <option value="TRIAL_START">Démarrages d'épreuves</option>
            <option value="TRIAL_SUBMITTED">Soumissions d'épreuves</option>
            <option value="TRIAL_EXPIRED">Expirations de temps</option>
            <option value="GRADE_PRACTICAL">Corrections Jury</option>
            <option value="TRIAL_STATUS_CHANGE">Changements de statut</option>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-36">Horodatage</th>
                <th className="p-3.5 w-44">Utilisateur</th>
                <th className="p-3.5 w-36">Type d'action</th>
                <th className="p-3.5">Détails de l'événement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Aucun log enregistré pour ces critères.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {log.user?.full_name || 'Système'}
                      {log.user?.participant_code && (
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {log.user.participant_code}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
