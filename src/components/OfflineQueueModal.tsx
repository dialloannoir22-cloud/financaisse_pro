import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cloud, 
  Trash2, 
  ShieldCheck, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { offlineQueue, QueuedMutation } from '../services/offlineQueue';
import { formatDateFr } from '../utils/financeCalculations';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSync, setLastSync] = useState<string | null>(offlineQueue.getLastSyncTime());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = offlineQueue.subscribe((updatedQueue, syncing) => {
      setQueue(updatedQueue);
      setIsSyncing(syncing);
      setLastSync(offlineQueue.getLastSyncTime());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'failed' || q.status === 'syncing').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  const handleManualSync = async () => {
    setSyncFeedback(null);
    if (!isOnline) {
      setSyncFeedback('Impossible de synchroniser : vous êtes actuellement hors-ligne.');
      return;
    }
    const res = await offlineQueue.processQueue();
    if (res.processed === 0) {
      setSyncFeedback('Aucune modification en attente.');
    } else if (res.failed === 0) {
      setSyncFeedback(`Succès : ${res.succeeded} modification(s) synchronisée(s) vers le Cloud.`);
    } else {
      setSyncFeedback(`${res.succeeded} réussie(s), ${res.failed} en échec. Réessai automatique prévu.`);
    }
  };

  const handleRetryFailed = () => {
    setSyncFeedback(null);
    offlineQueue.retryFailed();
  };

  const handleClear = () => {
    if (confirm('Voulez-vous vraiment vider la file d\'attente ? Les modifications non synchronisées ne seront pas transmises au cloud.')) {
      offlineQueue.clearQueue();
      setSyncFeedback('File d\'attente vidée.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
              isOnline ? 'bg-gradient-to-tr from-emerald-600 to-teal-500' : 'bg-gradient-to-tr from-amber-600 to-orange-500'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Gestionnaire Hors-Ligne &amp; File d'Attente
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                }`}>
                  {isOnline ? 'Connecté (En ligne)' : 'Hors-ligne (Réseau coupé)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Garantit que chaque saisie effectuée sans connexion est conservée et automatiquement expédiée dès le retour d'Internet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Cartes de synthèse */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                En attente Cloud
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black font-mono ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {pendingCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingCount <= 1 ? 'action' : 'actions'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Dernier succès Cloud
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {lastSync ? new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pas encore'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                État Réseau
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className={isOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                  {isOnline ? 'Synchronisation active' : 'File locale sécurisée'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback temporaire */}
          {syncFeedback && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
              <span>{syncFeedback}</span>
              <button onClick={() => setSyncFeedback(null)} className="text-blue-500 hover:text-blue-700 ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Liste des éléments dans la file d'attente */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Modifications en file d'attente ({queue.length})</span>
            </h3>

            <div className="flex items-center gap-2">
              {failedCount > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Réessayer {failedCount} échec(s)</span>
                </button>
              )}

              {queue.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  title="Vider la file"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vider</span>
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Toutes vos données sont à jour sur le Cloud !
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                La file d'attente est vide. Toute nouvelle saisie en cas de coupure Internet sera automatiquement empilée ici.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                    item.status === 'syncing'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : item.status === 'failed'
                      ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                      {item.status === 'syncing' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : item.status === 'failed' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {item.description}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.date}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Enregistré à : {new Date(item.timestamp).toLocaleTimeString('fr-FR')}</span>
                        {item.retryCount > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            (Tentatives : {item.retryCount})
                          </span>
                        )}
                      </div>
                      {item.lastError && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 block mt-1">
                          Erreur : {item.lastError}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => offlineQueue.removeItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Retirer cet élément"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Note d'information et de réassurance */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Résilience garantie en cas de coupure</span>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                Vous pouvez continuer à saisir les versements RIA, Western Union, règlements Seddo et billetterie même si le réseau mobile ou le wifi coupe. Vos données sont sécurisées dans le stockage local persistant et seront automatiquement transmises à Firestore et au serveur dès que la connexion redevient active.
              </p>
            </div>
          </div>
        </div>

        {/* Pied de modal avec boutons d'action */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pendingCount > 0 ? `${pendingCount} modification(s) en attente de réseau` : 'Synchronisation à jour'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || (!isOnline && pendingCount === 0)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-full sm:w-auto text-center"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
