'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Trophy,
  Award,
  Sparkles,
  Medal,
  Users,
  CheckCircle2,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import api from '@/lib/api';
import { LeaderboardEntry } from '@/types';

export default function ChampionshipResultsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/analytics/leaderboard/');
        setLeaderboard(res.data?.leaderboard || []);
        setPodium(res.data?.podium || []);

        // Fire celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const champion = podium[0];
  const second = podium[1];
  const third = podium[2];

  const totalParticipants = leaderboard.length;
  const avgScore = totalParticipants > 0
    ? (leaderboard.reduce((acc, curr) => acc + curr.global_percentage, 0) / totalParticipants).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white select-none">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header Ceremony Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Palmarès & Cérémonie de Clôture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            TeCoX Digital Challenge 2026
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Proclamation officielle des résultats finaux et remise des distinctions.
          </p>
        </div>

        {/* Grand Champion Hero Card */}
        {champion && (
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-slate-800 to-slate-850 p-8 sm:p-10 rounded-3xl border-2 border-amber-400 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="inline-block px-4 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest">
              🥇 Grand Champion TDC 2026
            </div>

            <div className="w-28 h-28 mx-auto rounded-3xl bg-amber-400/20 border-4 border-amber-400 flex items-center justify-center text-5xl">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                {champion.full_name}
              </h2>
              <p className="text-sm text-cyan-400 font-mono font-bold">
                {champion.participant_code} • {champion.team_group || 'TeCoX Academy'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-700 max-w-lg mx-auto">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400">Score Final</p>
                <p className="text-xl font-extrabold text-amber-300 mt-0.5">{champion.total_score} pts</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400">Réussite</p>
                <p className="text-xl font-extrabold text-cyan-300 mt-0.5">{champion.global_percentage}%</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">Épreuves</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{champion.completed_trials_count} / 8</p>
              </div>
            </div>
          </div>
        )}

        {/* 2nd & 3rd Place Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {second && (
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 text-center space-y-3">
              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-xs font-bold uppercase">
                🥈 2e Place (Vice-Champion)
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{second.full_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{second.participant_code}</p>
              <div className="pt-3 border-t border-slate-700 flex justify-around text-xs">
                <div>
                  <span className="text-slate-400">Score:</span>{' '}
                  <strong className="text-white font-mono text-sm">{second.total_score} pts</strong>
                </div>
                <div>
                  <span className="text-slate-400">Pourcentage:</span>{' '}
                  <strong className="text-cyan-300 font-mono text-sm">{second.global_percentage}%</strong>
                </div>
              </div>
            </div>
          )}

          {third && (
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 text-center space-y-3">
              <span className="px-3 py-1 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/50 text-xs font-bold uppercase">
                🥉 3e Place (Podium Bronze)
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{third.full_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{third.participant_code}</p>
              <div className="pt-3 border-t border-slate-700 flex justify-around text-xs">
                <div>
                  <span className="text-slate-400">Score:</span>{' '}
                  <strong className="text-white font-mono text-sm">{third.total_score} pts</strong>
                </div>
                <div>
                  <span className="text-slate-400">Pourcentage:</span>{' '}
                  <strong className="text-cyan-300 font-mono text-sm">{third.global_percentage}%</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Statistics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 border-t border-slate-800">
          <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/80 text-center">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Participants</p>
            <p className="text-3xl font-extrabold text-white mt-1">{totalParticipants}</p>
          </div>
          <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/80 text-center">
            <p className="text-xs font-semibold uppercase text-slate-400">Score Moyen Global</p>
            <p className="text-3xl font-extrabold text-cyan-400 mt-1">{avgScore}%</p>
          </div>
          <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/80 text-center">
            <p className="text-xs font-semibold uppercase text-slate-400">Épreuves Officielles</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">8</p>
          </div>
        </div>

        {/* Top 10 Table */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Top 10 — Classement Général
          </h3>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-700 text-xs text-slate-400 uppercase">
                <tr>
                  <th className="p-4 text-center w-16">Rang</th>
                  <th className="p-4">Participant</th>
                  <th className="p-4">Groupe</th>
                  <th className="p-4 text-right">Score Total</th>
                  <th className="p-4 text-right">Réussite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {leaderboard.slice(0, 10).map((entry) => (
                  <tr key={entry.participant_id} className="hover:bg-slate-700/30">
                    <td className="p-4 text-center font-bold font-mono">
                      #{entry.rank}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {entry.full_name}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {entry.team_group || '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-cyan-300">
                      {entry.total_score} pts
                    </td>
                    <td className="p-4 text-right text-xs text-slate-300">
                      {entry.global_percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
