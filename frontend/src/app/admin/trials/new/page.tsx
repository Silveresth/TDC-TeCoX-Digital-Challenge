'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ChevronLeft, Plus } from 'lucide-react';
import api from '@/lib/api';
import { TrialCategory, TrialStatus } from '@/types';

export default function AdminNewTrialPage() {
  const router = useRouter();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    category: 'INFORM_GEN' as TrialCategory,
    description: '',
    instructions: '',
    duration_minutes: 20,
    max_score: 100,
    weight: 1.0,
    order: 1,
    status: 'DRAFT' as TrialStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post('/competitions/trials/', formData);
      showToast('Épreuve créée avec succès !', 'success');
      router.push(`/admin/trials/${res.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de la création.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl w-full mx-auto text-white">
      <div className="space-y-2 pb-6 border-b border-slate-800">
        <a href="/admin/trials" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Retour aux épreuves</span>
        </a>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Créer une Nouvelle Épreuve TDC
        </h1>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Titre de l'épreuve"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Microsoft Excel — Tableur & Formules"
                required
                className="bg-slate-950 border-slate-700 text-white"
              />

              <Select
                label="Catégorie"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TrialCategory })}
                className="bg-slate-950 border-slate-700 text-white"
              >
                <option value="INFORM_GEN">Informatique Générale</option>
                <option value="SMARTPHONE">Téléphone Portable & Smartphone</option>
                <option value="ORDINATEUR">Ordinateur & Matériel</option>
                <option value="WINDOWS">Système Windows</option>
                <option value="WORD">Microsoft Word</option>
                <option value="EXCEL">Microsoft Excel</option>
                <option value="POWERPOINT">Microsoft PowerPoint</option>
                <option value="GRAND_CHALLENGE">Grand Challenge TDC</option>
                <option value="AUTRE">Autre Compétence</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description synthétique
              </label>
              <textarea
                className="w-full text-xs rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#082F6A]"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description des compétences mesurées..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Durée (minutes)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                required
                className="bg-slate-950 border-slate-700 text-white"
              />

              <Input
                label="Barème Max (pts)"
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: Number(e.target.value) })}
                required
                className="bg-slate-950 border-slate-700 text-white"
              />

              <Input
                label="Coefficient / Poids"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                required
                className="bg-slate-950 border-slate-700 text-white"
              />

              <Input
                label="Ordre N°"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                required
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <a href="/admin/trials">
                <Button type="button" variant="ghost" size="sm">
                  Annuler
                </Button>
              </a>
              <Button type="submit" size="md" variant="primary" isLoading={isSubmitting}>
                Créer l'épreuve et ajouter des questions
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
