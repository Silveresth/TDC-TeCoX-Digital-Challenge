'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Users,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Shield
} from 'lucide-react';
import api from '@/lib/api';
import { Attempt } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useNotification();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await api.get('/attempts/my-history/');
        setAttempts(Array.isArray(res.data) ? res.data : (res.data?.results || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAttempts(false);
      }
    };
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Le nouveau mot de passe et sa confirmation ne correspondent pas.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Le nouveau mot de passe doit comporter au moins 6 caractères.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      showToast('Mot de passe mis à jour avec succès !', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.old_password?.[0] || 'Erreur lors du changement de mot de passe.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mon Profil Participant TDC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consultez vos informations personnelles, votre historique et mettez à jour votre sécurité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Identity Card */}
          <div className="md:col-span-5 space-y-6">
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[#082F6A] text-white flex items-center justify-center text-2xl font-bold ring-4 ring-blue-50 dark:ring-slate-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    user.first_name?.[0] || 'P'
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {user.full_name}
                  </h2>
                  <div className="inline-block mt-1">
                    <Badge variant="primary" size="md">
                      {user.participant_code || user.username}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-left text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" /> Email
                    </span>
                    <span className="font-medium">{user.email || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4" /> Téléphone
                    </span>
                    <span className="font-medium">{user.phone_number || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" /> Groupe
                    </span>
                    <span className="font-medium">{user.team_group || 'Individuel'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" /> Inscrit le
                    </span>
                    <span className="font-medium">{formatDate(user.date_joined)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Modifier mon mot de passe</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Mot de passe actuel"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Nouveau mot de passe"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button type="submit" size="sm" isLoading={isChangingPassword} className="w-full">
                    Mettre à jour le mot de passe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right: Detailed Attempts History */}
          <div className="md:col-span-7 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Historique complet de mes épreuves
            </h2>

            {loadingAttempts ? (
              <div className="text-center py-8">
                <Spinner size="md" />
              </div>
            ) : attempts.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-500">
                Vous n'avez pas encore passé d'épreuve.
              </Card>
            ) : (
              <div className="space-y-3">
                {attempts.map((att) => (
                  <Card key={att.id}>
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{att.trial_order}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {att.trial_title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          Passée le {formatDate(att.submitted_at || att.started_at)} • {formatTime(att.time_spent_seconds)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {att.total_score} / {att.max_possible_score} pts
                        </p>
                        <p className="text-[11px] text-slate-500">{att.percentage}% de réussite</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
