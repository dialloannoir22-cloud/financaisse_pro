import React, { useState, useEffect } from 'react';
import { cloudStorage } from '../services/cloudStorage';
import { formatCurrency, formatDateFr } from '../utils/financeCalculations';
import { 
  History, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  Trash2, 
  Search, 
  RefreshCw,
  Building,
  TrendingUp,
  Download
} from 'lucide-react';

interface HistoryItem {
  date: string;
  totalStart: number;
  totalEnd: number;
  netDifference: number;
  transfersCount: number;
  seddoPartnersCount: number;
  updatedAt: string;
}

interface HistoryViewProps {
  onSelectDate: (date: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectDate }) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const list = await cloudStorage.fetchAllSummaries();
      setHistoryList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Confirmez-vous la suppression de la fiche du ${date} ?`)) {
      await cloudStorage.deleteRecord(date);
      await loadHistory();
    }
  };

  const filtered = historyList.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const dateFr = formatDateFr(item.date).toLowerCase();
    return item.date.includes(query) || dateFr.includes(query);
  });

  // Totaux globaux de l'historique
  const totalDays = historyList.length;
  const totalNetAccumulated = historyList.reduce((acc, h) => acc + (h.netDifference || 0), 0);
  const totalTransactionsAll = historyList.reduce((acc, h) => acc + (h.transfersCount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* En-tête de la mémoire Cloud */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Historique Complet &amp; Mémoire Cloud</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toutes vos journées sont automatiquement enregistrées sur le cloud. Cliquez sur n'importe quel jour pour le consulter ou reprendre ses données.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser Cloud</span>
        </button>
      </div>

      {/* 3 Cartes de synthèse de l'historique */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Journées Archivées
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
            {totalDays} jour{totalDays > 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Préservées en permanence</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Variation Nette Cumulée
          </span>
          <span className={`text-2xl font-black font-mono mt-1 block ${totalNetAccumulated >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {totalNetAccumulated > 0 && '+'}{formatCurrency(totalNetAccumulated)}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Bilan consolidé de toutes les journées</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Transferts RIA, WU, MG
          </span>
          <span className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400 mt-1 block">
            {totalTransactionsAll} opérations
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Enregistrées avec colonnes M1 &amp; M2</span>
        </div>
      </div>

      {/* Liste des journées avec recherche */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        
        {/* Barre de recherche */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-850">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une date (ex: 2026-10 ou Octobre)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {filtered.length} enregistrement(s) trouvé(s)
          </span>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date de la Journée</th>
                <th className="py-3 px-4 text-right">Solde Début</th>
                <th className="py-3 px-4 text-right">Solde Fin</th>
                <th className="py-3 px-4 text-right">Reliquat (Fins − Débuts)</th>
                <th className="py-3 px-4 text-center">Transferts RIA/WU/MG</th>
                <th className="py-3 px-4 text-center">Partenaires Seddo</th>
                <th className="py-3 px-4 text-right">Dernière Synchro</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                    Chargement de l'historique depuis le Cloud...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                    Aucune journée trouvée dans la mémoire Cloud.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr 
                    key={item.date} 
                    onClick={() => onSelectDate(item.date)}
                    className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateFr(item.date, 'full')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.date}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCurrency(item.totalStart)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.totalEnd)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {item.netDifference > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          +{formatCurrency(item.netDifference)}
                        </span>
                      ) : item.netDifference < 0 ? (
                        <span className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                          {formatCurrency(item.netDifference)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">0 F CFA</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded font-bold text-[11px] border border-transparent dark:border-blue-800/60">
                        {item.transfersCount} tx
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded font-bold text-[11px] border border-transparent dark:border-amber-800/60">
                        {item.seddoPartnersCount} clients
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectDate(item.date)}
                          title="Ouvrir et consulter cette journée"
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors border border-emerald-200/60 dark:border-emerald-800/60"
                        >
                          Ouvrir
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.date, e)}
                          title="Supprimer cette journée de l'archive"
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
