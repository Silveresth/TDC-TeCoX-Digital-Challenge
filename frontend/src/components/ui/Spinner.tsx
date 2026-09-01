'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-slate-200 border-t-[#082F6A] dark:border-slate-700 dark:border-t-cyan-400',
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ message = 'Chargement en cours...' }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
