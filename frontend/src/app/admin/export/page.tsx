'use client';

import React, { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  Table,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';

export default function AdminExportPage() {
  const { showToast } = useNotification();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const handleDownload = async (format: 'excel' | 'csv') => {
    if (format === 'excel') setIsExportingExcel(true);
    else setIsExportingCsv(true);

    try {
      const res = await api.get(`/analytics/export/?format=${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        format === 'excel' ? 'resultats_complets_tdc_2026.xlsx' : 'resultats_tdc_2026.csv'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(`Fichier ${format.toUpperCase()} téléchargé avec succès !`, 'success');
    } catch (err) {
      showToast('Erreur lors du téléchargement des résultats.', 'error');
    } finally {
      setIsExportingExcel(false);
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto text-white">
      {/* Header */}
      <div className="space-y-1 pb-6 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          Export des Résultats Officiels TDC 2026
        </h1>
        <p className="text-xs text-slate-400">
          Téléchargez les rapports complets pour le jury, l'archivage et l'annonce des lauréats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel (.xlsx) Card */}
        <Card className="bg-slate-900 border-slate-800 text-white flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-900">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <Badge variant="success">Recommandé</Badge>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Rapport Complet Microsoft Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Classeur complet avec mise en page officielle, en-tête TeCoX, mise en valeur du podium (Or/Argent/Bronze), notes détaillées par épreuve et totaux automatisés.
              </p>
            </div>

            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800 list-disc pl-4">
              <li>Classement général trié par score décroissant</li>
              <li>Scores détaillés des 8 épreuves</li>
              <li>Calculs de pourcentages et temps cumulés</li>
              <li>Prêt pour impression ou projection</li>
            </ul>
          </CardContent>

          <div className="p-6 pt-0">
            <Button
              variant="success"
              className="w-full"
              isLoading={isExportingExcel}
              onClick={() => handleDownload('excel')}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Télécharger le rapport Excel (.xlsx)
            </Button>
          </div>
        </Card>

        {/* CSV Card */}
        <Card className="bg-slate-900 border-slate-800 text-white flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-950 text-cyan-400 border border-blue-900">
                <Table className="w-8 h-8" />
              </div>
              <Badge variant="primary">Format Brut</Badge>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Données Brutes CSV (.csv)
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Fichier texte délimité standard UTF-8, idéal pour l'import dans d'autres systèmes de gestion ou pour du traitement automatisé de données.
              </p>
            </div>

            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800 list-disc pl-4">
              <li>Format léger compatible avec tous logiciels</li>
              <li>Encodage UTF-8 avec BOM</li>
              <li>Facilement intégrable dans Google Sheets / Python</li>
            </ul>
          </CardContent>

          <div className="p-6 pt-0">
            <Button
              variant="primary"
              className="w-full"
              isLoading={isExportingCsv}
              onClick={() => handleDownload('csv')}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Télécharger le fichier CSV (.csv)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
