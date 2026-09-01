'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  CheckSquare,
  Trophy,
  Activity,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
  Home
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { href: '/admin/participants', label: 'Participants & Import', icon: Users },
    { href: '/admin/jury', label: 'Membres du Jury', icon: UserCheck },
    { href: '/admin/trials', label: 'Épreuves & Barèmes', icon: Layers },
    { href: '/admin/grading', label: 'Corrections Missions', icon: CheckSquare },
    { href: '/admin/leaderboard', label: 'Classement TDC', icon: Trophy },
    { href: '/admin/logs', label: 'Journal d’Audit', icon: Activity },
    { href: '/admin/export', label: 'Exports Excel / CSV', icon: FileSpreadsheet },
  ];

  const juryLinks = [
    { href: '/admin/grading', label: 'Corrections Missions', icon: CheckSquare },
    { href: '/admin/leaderboard', label: 'Classement TDC', icon: Trophy },
    { href: '/admin/export', label: 'Exports Excel / CSV', icon: FileSpreadsheet },
  ];

  const links = isAdmin ? adminLinks : juryLinks;

  const isActive = (path: string) => pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 min-h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <a href={isAdmin ? "/admin/dashboard" : "/admin/grading"} className="flex items-center gap-3">
          <img
            src="/logo-court.png"
            alt="TeCoX"
            className="h-8 w-auto brightness-125"
          />
          <div>
            <h1 className="text-xs font-bold tracking-wider text-white uppercase">
              {isAdmin ? 'TDC Admin' : 'Espace Jury TDC'}
            </h1>
            <span className="text-[10px] text-cyan-400 font-mono">
              {isAdmin ? 'Organisateur' : 'Évaluation & Notes'}
            </span>
          </div>
        </a>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Administration & Concours' : 'Pôle Évaluation Jury'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#082F6A] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>

      {/* Footer Navigation Switch & Profile */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <a
          href="/dashboard"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Home className="w-3.5 h-3.5" />
            <span>Vue Participant</span>
          </span>
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </a>

        {/* User info */}
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#082F6A] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-cyan-400 uppercase font-mono">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
