'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Spinner } from '@/components/ui/Spinner';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isJury } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && !isJury))) {
      router.push('/login');
    }
  }, [user, isLoading, isAdmin, isJury, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin && !isJury) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Accès Restreint</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Cet espace est exclusivement réservé aux administrateurs et membres du jury TeCoX.
        </p>
        <a href="/dashboard" className="text-xs text-cyan-400 hover:underline">
          Retourner à mon tableau de bord participant
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
