import React from 'react';

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <img src="/logo-court.png" alt="TeCoX" className="h-6 w-auto object-contain" />
          <span>
            © 2026 <strong>TeCoX — Tech Community eXperience</strong>. Tous droits réservés.
          </span>
        </div>
        <div className="flex items-center gap-4 font-medium">
          <span>TeCoX Digital Challenge (TDC)</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-[#082F6A] dark:text-cyan-400 font-semibold">Édition 2026</span>
        </div>
      </div>
    </footer>
  );
}
