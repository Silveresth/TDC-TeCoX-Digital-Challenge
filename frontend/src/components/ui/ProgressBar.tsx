'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'cyan' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    primary: 'bg-[#082F6A]',
    cyan: 'bg-[#00D2BA]',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold text-slate-900 dark:text-white">{percentage.toFixed(1)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
