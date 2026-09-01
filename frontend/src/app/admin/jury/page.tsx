'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import {
  UserCheck,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Power,
  Edit2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Award,
  Users
} from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminJuryPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [juryList, setJuryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJury, setEditingJury] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJury = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/auth/jury/', { params });
      setJuryList(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des membres du jury.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchJury();
    }
  }, [isAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJury();
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingJury) {
        await api.patch(`/auth/jury/${editingJury.id}/`, formData);
        showToast('Membre du jury mis à jour avec succès.', 'success');
      } else {
        await api.post('/auth/jury/', formData);
        showToast('Nouveau membre du jury créé avec succès !', 'success');
      }
      setShowAddModal(false);
      setEditingJury(null);
      resetForm();
      fetchJury();
    } catch (err: any) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.detail || 'Erreur lors de l’enregistrement.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (juryUser: any) => {
    try {
      const res = await api.post(`/auth/jury/${juryUser.id}/toggle_active/`);
      showToast(res.data.detail, 'info');
      fetchJury();
    } catch (err) {
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleResetPassword = async (juryUser: any) => {
    if (!confirm(`Réinitialiser le mot de passe de ${juryUser.full_name} à 'Jury@TDC2026!' ?`)) return;
    try {
      const res = await api.post(`/auth/jury/${juryUser.id}/reset_password/`, { password: 'Jury@TDC2026!' });
      showToast(res.data.detail, 'success');
    } catch (err) {
      showToast('Erreur lors de la réinitialisation.', 'error');
    }
  };

  const handleDelete = async (juryUser: any) => {
    if (!confirm(`Supprimer définitivement le compte du jury ${juryUser.full_name} ?`)) return;
    try {
      await api.delete(`/auth/jury/${juryUser.id}/`);
      showToast('Membre du jury supprimé.', 'success');
      fetchJury();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const openAddModal = () => {
    setEditingJury(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (j: any) => {
    setEditingJury(j);
    setFormData({
      first_name: j.first_name || '',
      last_name: j.last_name || '',
      username: j.username || '',
      email: j.email || '',
      phone_number: j.phone_number || '',
      password: '',
      notes: j.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone_number: '',
      password: '',
      notes: '',
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Accès Réservé aux Administrateurs</h2>
        <p className="text-sm text-slate-400">
          Seul un administrateur organisateur peut gérer les comptes des membres du jury.
        </p>
      </div>
    );
  }

  const activeCount = juryList.filter((j) => j.is_active).length;
  const totalGraded = juryList.reduce((acc, j) => acc + (j.graded_submissions_count || 0), 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            Gestion des Membres du Jury & Formateurs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ajoutez les évaluateurs habilités à corriger et noter les missions pratiques des candidats.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold border-none"
        >
          Ajouter un Membre du Jury
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-900">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Jurys Inscrits</p>
              <p className="text-xl font-bold text-white">{juryList.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-900">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Comptes Jurys Actifs</p>
              <p className="text-xl font-bold text-emerald-400">{activeCount}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-900">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Copies Déjà Corrigées</p>
              <p className="text-xl font-bold text-white">{totalGraded}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, identifiant ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Rechercher
          </Button>
        </form>
      </div>

      {/* Jury List Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : juryList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Aucun membre du jury trouvé</p>
            <p className="text-xs text-slate-500">
              Cliquez sur "Ajouter un Membre du Jury" pour créer un compte évaluateur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Membre du Jury</th>
                  <th className="px-5 py-3 font-semibold">Identifiant & Connexion</th>
                  <th className="px-5 py-3 font-semibold">Contact & Téléphone</th>
                  <th className="px-5 py-3 font-semibold text-center">Copies Corrigées</th>
                  <th className="px-5 py-3 font-semibold text-center">Statut</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {juryList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                          {j.first_name?.[0] || j.username?.[0] || 'J'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{j.full_name}</p>
                          <p className="text-[11px] text-slate-400">{j.notes || 'Évaluateur officiel TDC'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-cyan-300 font-semibold">{j.username}</p>
                      <p className="text-[11px] text-slate-400">{j.email || 'Pas d’email'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {j.phone_number || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant="outline" className="font-mono">
                        {j.graded_submissions_count || 0} copies
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {j.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(j)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(j)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Réinitialiser le mot de passe"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(j)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            j.is_active
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              : 'text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={j.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(j)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Jury Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingJury ? `Modifier le Jury : ${editingJury.full_name}` : 'Créer un Nouveau Membre du Jury'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Ex: Jean"
            />
            <Input
              label="Nom *"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Ex: Dupont"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Identifiant de connexion *"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
              placeholder="Ex: jean.dupont ou jury1"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: jean@tecox.org"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="Ex: +228 90 00 00 00"
            />
            <Input
              label={editingJury ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe initial'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingJury ? 'Laisser vide pour ne pas changer' : 'Par défaut : Jury@TDC2026!'}
            />
          </div>

          <Input
            label="Spécialité / Notes (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ex: Formateur Word & Excel, Correcteur principal"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              {editingJury ? 'Mettre à jour' : 'Créer le compte Jury'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
