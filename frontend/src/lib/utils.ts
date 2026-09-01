import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrialCategory, TrialStatus, QuestionType, DifficultyLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString;
  }
}

export function getCategoryLabel(category: TrialCategory): string {
  switch (category) {
    case 'INFORM_GEN': return 'Informatique Générale';
    case 'SMARTPHONE': return 'Smartphone & Mobile';
    case 'ORDINATEUR': return 'Ordinateur & Matériel';
    case 'WINDOWS': return 'Système Windows';
    case 'WORD': return 'Microsoft Word';
    case 'EXCEL': return 'Microsoft Excel';
    case 'POWERPOINT': return 'Microsoft PowerPoint';
    case 'GRAND_CHALLENGE': return 'Grand Challenge TDC';
    default: return 'Général';
  }
}

export function getStatusBadge(status: TrialStatus | string): { label: string; className: string } {
  switch (status) {
    case 'OPEN':
    case 'open':
      return { label: 'Ouverte', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'IN_PROGRESS':
    case 'in_progress':
      return { label: 'En cours', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'COMPLETED':
    case 'graded':
      return { label: 'Terminée / Corrigée', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'submitted':
      return { label: 'Soumise (En attente)', className: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'SCHEDULED':
      return { label: 'Programmée', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'DRAFT':
      return { label: 'Brouillon', className: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'expired':
      return { label: 'Expirée', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getDifficultyBadge(diff: DifficultyLevel): { label: string; className: string } {
  switch (diff) {
    case 'EASY':
      return { label: 'Facile', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'MEDIUM':
      return { label: 'Moyen', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'HARD':
      return { label: 'Difficile', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: diff, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'SINGLE_CHOICE': return 'QCM Choix Unique';
    case 'MULTIPLE_CHOICE': return 'QCM Choix Multiples';
    case 'TRUE_FALSE': return 'Vrai / Faux';
    case 'SHORT_TEXT': return 'Réponse Courte';
    case 'NUMERIC': return 'Réponse Numérique';
    case 'PRACTICAL': return 'Mission Pratique (Dépôt de fichier)';
    default: return type;
  }
}
