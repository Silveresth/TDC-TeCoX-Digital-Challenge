'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  Trophy,
  Award,
  Search,
  Filter,
  Medal,
  Clock,
  CheckCircle2,
  Users,
  EyeOff,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import api from '@/lib/api';
import { LeaderboardEntry, Trial } from '@/types';
import { formatTime } from '@/lib/utils';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [trials, setTrials] = useState<{ id: number; title: string; order: number; max_score: number }[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [hiddenMessage, setHiddenMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedTrial) params.trial_id = selectedTrial;
      if (selectedTeam) params.team = selectedTeam;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/analytics/leaderboard/', { params });
      if (res.data.is_hidden) {
        setIsHidden(true);
        setHiddenMessage(res.data.message);
      } else {
        setIsHidden(false);
        setLeaderboard(res.data.leaderboard || []);
        setPodium(res.data.podium || []);
        setTrials(res.data.trials || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTrial, selectedTeam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Classement Officiel en Direct</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Classement TDC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Résultats calculés en temps réel d'après les barèmes officiels de chaque épreuve.
          </p>
        </div>

        {isHidden ? (
          <Card className="max-w-md mx-auto p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <EyeOff className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Classement masqué
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {hiddenMessage || 'Le classement est temporairement masqué par les organisateurs pendant les épreuves.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Podium (Top 3) */}
            {podium.length >= 3 && !selectedTrial && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 max-w-4xl mx-auto">
                {/* 2nd Place (Silver) */}
                <div className="order-2 md:order-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs text-center space-y-3 relative overflow-hidden">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-200">
                    🥈
                  </div>
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      2e Place
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {podium[1].full_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{podium[1].participant_code}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                      {podium[1].total_score} pts
                    </p>
                    <p className="text-xs text-slate-500">{podium[1].global_percentage}%</p>
                  </div>
                </div>

                {/* 1st Place (Gold Champion) */}
                <div className="order-1 md:order-2 bg-white dark:bg-slate-800 rounded-2xl p-7 border-2 border-amber-400 dark:border-amber-500 shadow-lg text-center space-y-3 relative overflow-hidden -translate-y-2">
                  <div className="absolute top-0 right-0 left-0 bg-amber-400 text-slate-950 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                    🏆 Champion Actuel
                  </div>
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center text-3xl font-bold mt-2">
                    🥇
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {podium[0].full_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{podium[0].participant_code}</p>
                  </div>
                  <div className="pt-2 border-t border-amber-100 dark:border-amber-900/60">
                    <p className="text-2xl font-black text-[#082F6A] dark:text-cyan-400">
                      {podium[0].total_score} pts
                    </p>
                    <p className="text-xs font-semibold text-slate-500">{podium[0].global_percentage}% de réussite</p>
                  </div>
                </div>

                {/* 3rd Place (Bronze) */}
                <div className="order-3 md:order-3 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs text-center space-y-3 relative overflow-hidden">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-600/40 flex items-center justify-center text-xl font-bold text-amber-700">
                    🥉
                  </div>
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      3e Place
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {podium[2].full_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{podium[2].participant_code}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                      {podium[2].total_score} pts
                    </p>
                    <p className="text-xs text-slate-500">{podium[2].global_percentage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="w-full md:w-72">
                <Input
                  placeholder="Rechercher par nom ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </form>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="w-full sm:w-60">
                  <Select
                    value={selectedTrial}
                    onChange={(e) => setSelectedTrial(e.target.value)}
                  >
                    <option value="">🏆 Classement Général (Total)</option>
                    {trials.map((t) => (
                      <option key={t.id} value={t.id}>
                        Épreuve #{t.order}: {t.title}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="w-full sm:w-44">
                  <Select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <option value="">Tous les groupes</option>
                    <option value="Alpha">Équipe Alpha</option>
                    <option value="Beta">Équipe Beta</option>
                    <option value="Gamma">Équipe Gamma</option>
                    <option value="Delta">Équipe Delta</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Full Ranking Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-16">Rang</th>
                      <th className="px-4 py-3.5">Participant</th>
                      <th className="px-4 py-3.5">Groupe</th>
                      {!selectedTrial && (
                        <th className="px-4 py-3.5 text-center">Épreuves</th>
                      )}
                      <th className="px-4 py-3.5 text-right">Score Obtenu</th>
                      <th className="px-4 py-3.5 text-right">Pourcentage</th>
                      <th className="px-4 py-3.5 text-right">Temps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboard.map((entry) => {
                      const isMe = entry.participant_id === user?.id;
                      const trialScore = selectedTrial ? entry.trials?.[Number(selectedTrial)]?.score || 0 : entry.total_score;
                      const trialPct = selectedTrial ? entry.trials?.[Number(selectedTrial)]?.percentage || 0 : entry.global_percentage;
                      const trialTime = selectedTrial ? entry.trials?.[Number(selectedTrial)]?.time_spent || 0 : entry.total_time_seconds;

                      return (
                        <tr
                          key={entry.participant_id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center font-bold">
                            {entry.rank === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs">
                                1
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 inline-flex items-center justify-center text-xs">
                                2
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono">#{entry.rank}</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#082F6A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {entry.full_name[0]}
                              </div>
                              <div>
                                <p className={`text-sm ${isMe ? 'text-[#082F6A] dark:text-cyan-300 font-bold' : 'text-slate-900 dark:text-white font-medium'}`}>
                                  {entry.full_name} {isMe && '(Moi)'}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {entry.participant_code}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                            {entry.team_group || '-'}
                          </td>

                          {!selectedTrial && (
                            <td className="px-4 py-3.5 text-center text-xs font-medium text-slate-700 dark:text-slate-300">
                              {entry.completed_trials_count} / {trials.length}
                            </td>
                          )}

                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono">
                            {trialScore} pts
                          </td>

                          <td className="px-4 py-3.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {trialPct}%
                          </td>

                          <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-500">
                            {formatTime(trialTime)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
