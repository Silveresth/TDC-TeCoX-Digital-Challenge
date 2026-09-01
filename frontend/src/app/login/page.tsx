'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Lock, User, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useNotification();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(loginInput, password);
    setIsLoading(false);

    if (res.success) {
      showToast('Connexion réussie ! Bienvenue sur le TDC 2026.', 'success');
      if (res.role === 'ADMIN' || res.role === 'JURY') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.error || 'Identifiant ou mot de passe incorrect.');
    }
  };

  const handleQuickDemoLogin = async (type: 'participant' | 'admin') => {
    if (type === 'participant') {
      setLoginInput('TDC-2026-001');
      setPassword('Tdc2026!');
      setIsLoading(true);
      const res = await login('TDC-2026-001', 'Tdc2026!');
      setIsLoading(false);
      if (res.success) {
        showToast('Connecté en tant que Éloge Gomina (Participant)', 'success');
        router.push('/dashboard');
      }
    } else {
      setLoginInput('admin');
      setPassword('Admin@TDC2026!');
      setIsLoading(true);
      const res = await login('admin', 'Admin@TDC2026!');
      setIsLoading(false);
      if (res.success) {
        showToast('Connecté en tant qu’Administrateur TeCoX', 'success');
        router.push('/admin/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-900">
      {/* Background Decor */}
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block">
            <img
              src="/logo-long.png"
              alt="TeCoX Logo"
              className="h-12 w-auto mx-auto object-contain dark:brightness-110"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Espace Compétition TDC 2026
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saisissez votre code participant ou votre identifiant officiel
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Identifiant ou Code Participant"
                placeholder="Ex: TDC-2026-001 ou eloge.gomina"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Se connecter au Challenge
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Connexion Rapide Démo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('participant')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Participant</p>
                  <p className="text-[10px] text-slate-500 font-mono">TDC-2026-001</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-[#082F6A] dark:text-cyan-400">Admin TeCoX</p>
                  <p className="text-[10px] text-slate-500 font-mono">admin</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Besoin d'aide ou mot de passe oublié ? Contactez le jury TeCoX sur place.
        </p>
      </div>
    </div>
  );
}
