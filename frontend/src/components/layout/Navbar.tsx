'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Award,
  Trophy,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  X,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function Navbar() {
  const { user, logout, isAdmin, isJury } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Mon Espace', icon: LayoutDashboard },
    { href: '/trials', label: 'Épreuves', icon: Layers },
    { href: '/leaderboard', label: 'Classement', icon: Trophy },
    { href: '/results', label: 'Palmarès Final', icon: Award },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-3">
              <div className="relative h-10 w-36 sm:w-44 flex items-center">
                <img
                  src="/logo-long.png"
                  alt="TeCoX Logo"
                  className="h-9 w-auto object-contain dark:brightness-110"
                />
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-[#082F6A] dark:bg-blue-950 dark:text-cyan-300 rounded border border-blue-200 dark:border-blue-800">
                TDC 2026
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-[#082F6A] text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Portal Shortcut */}
            {(isAdmin || isJury) && (
              <a
                href="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Administration</span>
              </a>
            )}

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <a
                  href="/profile"
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#082F6A] text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-100 dark:ring-slate-700">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.first_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block leading-tight">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {user.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {user.participant_code || user.role}
                    </p>
                  </div>
                </a>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-[#082F6A] rounded-lg hover:bg-[#061D42] transition-colors"
              >
                Connexion
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                  active
                    ? 'bg-[#082F6A] text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </a>
            );
          })}

          {(isAdmin || isJury) && (
            <a
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Espace Administration</span>
            </a>
          )}

          {user && (
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#082F6A] text-white flex items-center justify-center text-xs font-bold">
                  {user.first_name?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{user.full_name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{user.participant_code}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
