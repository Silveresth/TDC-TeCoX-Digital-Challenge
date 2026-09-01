'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  KeyRound,
  Trash2,
  Power,
  Edit2,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminParticipantsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    participant_code: '',
    team_group: '',
    phone_number: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedTeam) params.team = selectedTeam;
      const res = await api.get('/auth/participants/', { params });
      setParticipants(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des participants.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [selectedTeam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParticipants();
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingParticipant) {
        await api.patch(`/auth/participants/${editingParticipant.id}/`, formData);
        showToast('Participant mis à jour avec succès.', 'success');
      } else {
        await api.post('/auth/participants/', formData);
        showToast('Nouveau participant créé avec succès.', 'success');
      }
      setShowAddModal(false);
      setEditingParticipant(null);
      resetForm();
      fetchParticipants();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de l\'enregistrement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (participant: User) => {
    try {
      const res = await api.post(`/auth/participants/${participant.id}/toggle_active/`);
      showToast(res.data.detail, 'info');
      fetchParticipants();
    } catch (err) {
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleResetPassword = async (participant: User) => {
    if (!confirm(`Réinitialiser le mot de passe de ${participant.full_name} à 'Tdc2026!' ?`)) return;
    try {
      const res = await api.post(`/auth/participants/${participant.id}/reset_password/`, { password: 'Tdc2026!' });
      showToast(res.data.detail, 'success');
    } catch (err) {
      showToast('Erreur lors de la réinitialisation.', 'error');
    }
  };

  const handleDelete = async (participant: User) => {
    if (!confirm(`Supprimer définitivement le compte de ${participant.full_name} ?`)) return;
    try {
      await api.delete(`/auth/participants/${participant.id}/`);
      showToast('Participant supprimé.', 'success');
      fetchParticipants();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      showToast('Veuillez sélectionner un fichier CSV.', 'error');
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('file', csvFile);

    try {
      const res = await api.post('/auth/participants/import_csv/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.detail, 'success');
      setShowImportModal(false);
      setCsvFile(null);
      fetchParticipants();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de l\'importation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      participant_code: '',
      team_group: '',
      phone_number: '',
      password: '',
    });
  };

  const openEditModal = (p: User) => {
    setEditingParticipant(p);
    setFormData({
      first_name: p.first_name,
      last_name: p.last_name,
      username: p.username,
      email: p.email,
      participant_code: p.participant_code || '',
      team_group: p.team_group || '',
      phone_number: p.phone_number || '',
      password: '',
    });
    setShowAddModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Accès Réservé aux Administrateurs</h2>
        <p className="text-sm text-slate-400">
          Seul un administrateur organisateur peut gérer les comptes des participants.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Gestion des Participants TDC
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Création de comptes, attribution des codes, import en masse CSV et suivi individuel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setShowImportModal(true)}
            className="bg-slate-900 border-slate-700 text-slate-200"
          >
            Importer CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setEditingParticipant(null);
              setShowAddModal(true);
            }}
          >
            Nouveau Participant
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <Input
            placeholder="Rechercher nom, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-950 border-slate-700 text-white"
          />
        </form>

        <div className="w-full sm:w-60">
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white"
          >
            <option value="">Tous les groupes</option>
            <option value="Alpha">Équipe Alpha</option>
            <option value="Beta">Équipe Beta</option>
            <option value="Gamma">Équipe Gamma</option>
            <option value="Delta">Équipe Delta</option>
          </Select>
        </div>
      </div>

      {/* Participants Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Nom & Prénom</th>
                <th className="p-3.5">Email / Contact</th>
                <th className="p-3.5">Groupe</th>
                <th className="p-3.5 text-center">Épreuves</th>
                <th className="p-3.5 text-right">Score Total</th>
                <th className="p-3.5 text-center">Statut</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Aucun participant trouvé.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-cyan-300">
                      {p.participant_code || '-'}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {p.full_name}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      <div>{p.email || '-'}</div>
                      <div className="text-[10px] text-slate-500">{p.phone_number || ''}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {p.team_group || 'Individuel'}
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-300">
                      {p.completed_trials || 0} / 8
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      {p.total_score || 0} pts
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          p.is_active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                        }`}
                      >
                        {p.is_active ? 'Actif' : 'Désactivé'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(p)}
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Réinitialiser le mot de passe"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add or Edit Participant */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingParticipant(null);
        }}
        title={editingParticipant ? `Modifier ${editingParticipant.full_name}` : 'Nouveau Participant TDC'}
        description="Renseignez les détails du participant. Le code sera généré automatiquement si laissé vide."
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Nom"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom d'utilisateur (Identifiant)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Ex: eloge.gomina"
              required
            />
            <Input
              label="Code Participant (optionnel)"
              value={formData.participant_code}
              onChange={(e) => setFormData({ ...formData, participant_code: e.target.value })}
              placeholder="Ex: TDC-2026-042"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Téléphone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+228 90 00 00 00"
            />
          </div>

          <Input
            label="Groupe / Équipe"
            value={formData.team_group}
            onChange={(e) => setFormData({ ...formData, team_group: e.target.value })}
            placeholder="Ex: Équipe Alpha"
          />

          {!editingParticipant && (
            <Input
              label="Mot de passe initial"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Par défaut: Tdc2026!"
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                setEditingParticipant(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              {editingParticipant ? 'Enregistrer les modifications' : 'Créer le participant'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Batch CSV Import */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importation en masse par fichier CSV"
        description="Téléversez un fichier CSV contenant la liste de vos participants."
      >
        <form onSubmit={handleCsvImport} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Format attendu des colonnes CSV :
            </h4>
            <p className="font-mono text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              prenom,nom,identifiant,email,groupe,telephone,mot_de_passe,code
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2">
            <Upload className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs text-slate-400">
              {csvFile ? csvFile.name : 'Sélectionnez votre fichier .csv'}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#082F6A] file:text-white hover:file:bg-[#061D42]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              Lancer l'importation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
