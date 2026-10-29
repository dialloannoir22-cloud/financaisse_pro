import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DailyRecord, 
  CompartmentEntry, 
  OperatorTransferTransaction, 
  SeddoPartnerEntry, 
  CashBreakdown,
  DEFAULT_COMPARTMENTS
} from './types/finance';
import { 
  createEmptyDailyRecord, 
  getTodayDateString, 
  exportRecordToCSV,
  calculateDailyMetrics,
  formatCurrency,
  formatDateFr
} from './utils/financeCalculations';
import { Clock, CheckCircle2, X, Sparkles, Smartphone, Laptop, HelpCircle, WifiOff, Wifi, Layers, RefreshCw } from 'lucide-react';
import { cloudStorage, SyncStatus } from './services/cloudStorage';
import { offlineQueue } from './services/offlineQueue';
import { useAuth } from './context/AuthContext';
import { Header, ActiveTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DateSelector } from './components/DateSelector';
import { CompartmentsTable } from './components/CompartmentsTable';
import { TransferOperatorsSection } from './components/TransferOperatorsSection';
import { SeddoPartnersSection } from './components/SeddoPartnersSection';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { CashCounterModal } from './components/CashCounterModal';
import { PrintableDailySheet } from './components/PrintableDailySheet';
import { ReceiptModal, ReceiptData } from './components/ReceiptModal';
import { PrintableReceipt } from './components/PrintableReceipt';
import { CurrencyConverter } from './components/CurrencyConverter';
import { SyncAndReliquatExplainerModal } from './components/SyncAndReliquatExplainerModal';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';

export default function App() {
  const { currentUser, loginWithGoogle } = useAuth();
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [record, setRecord] = useState<DailyRecord>(createEmptyDailyRecord(getTodayDateString()));
  const [activeTab, setActiveTab] = useState<ActiveTab>('compartments');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ 
    state: 'synced',
    pendingQueueCount: offlineQueue.getPendingCount(),
  });
  const [showCashCounter, setShowCashCounter] = useState<boolean>(false);
  const [showAssistantModal, setShowAssistantModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);
  const [yesterdayRecord, setYesterdayRecord] = useState<DailyRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExplainerModal, setShowExplainerModal] = useState<boolean>(false);
  const [showOfflineQueueModal, setShowOfflineQueueModal] = useState<boolean>(false);
  const [onlineBanner, setOnlineBanner] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [autoReportNotice, setAutoReportNotice] = useState<{
    date: string;
    sourceDate: string;
    reliquat: number;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Charger la fiche lors du changement de date
  useEffect(() => {
    let isCancelled = false;

    const fetchDateRecord = async () => {
      setIsLoading(true);
      setAutoReportNotice(null);
      try {
        let loadedRecord = await cloudStorage.loadRecord(currentDate);

        // Vérifier s'il existe une veille disponible
        const prev = await cloudStorage.getPreviousDayRecord(currentDate);
        if (!isCancelled) {
          setYesterdayRecord(prev);

          // RÈGLE STRICTE ANNOIRFINANCE :
          // "Dans le report automatique c'est seulement et uniquement le reliquat strict de la veille
          // qui doit être reporté; les soldes de fin de journées ne doivent jamais être reportés."
          if (prev) {
            const prevTotalStart = prev.compartments.reduce((acc, c) => acc + (c.startOfDay || 0), 0);
            const prevTotalEnd = prev.compartments.reduce((acc, c) => acc + (c.endOfDay || 0), 0);
            const prevStrictReliquat = prevTotalEnd - prevTotalStart;

            console.log(`[Auto-Report à 00h00] Reliquat strict de la veille (${prev.date}) reporté vers (${currentDate}) : ${prevStrictReliquat} F CFA (Les soldes de fin de journée ne sont jamais reportés)`);

            // Mémoriser uniquement le reliquat strict de veille sans JAMAIS altérer les compartiments du jour
            if (loadedRecord.previousDayReliquatReported !== prevStrictReliquat) {
              loadedRecord = {
                ...loadedRecord,
                previousDayReliquatReported: prevStrictReliquat,
                updatedAt: new Date().toISOString(),
              };
              cloudStorage.saveRecord(loadedRecord);
            }

            setAutoReportNotice({
              date: currentDate,
              sourceDate: prev.date,
              reliquat: prevStrictReliquat,
            });
          }

          setRecord(loadedRecord);
          setSyncStatus({ state: 'synced', lastSavedAt: loadedRecord.updatedAt });
        }
      } catch (err) {
        console.error('Erreur chargement fiche date:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    fetchDateRecord();

    return () => {
      isCancelled = true;
    };
  }, [currentDate, currentUser]);


  // Gestionnaire de réinitialisation complète manuelle
  const handleFullReset = async () => {
    setIsResetting(true);
    try {
      const clean = await cloudStorage.resetAllDataToZero();
      setRecord(clean);
      setCurrentDate(clean.date);
      setYesterdayRecord(null);
      setAutoReportNotice(null);
      setSyncStatus({ state: 'synced', lastSavedAt: clean.updatedAt });
      setShowResetModal(false);
      setOnlineBanner({
        message: 'Caisse entièrement réinitialisée à zéro ! Nouveau départ démarré avec succès.',
        type: 'success',
      });
    } catch (e: any) {
      console.error('Erreur réinitialisation:', e);
    } finally {
      setIsResetting(false);
    }
  };

  // Sauvegarder et consolider l'historique sur Firestore dès la connexion pour lier téléphone & ordinateur
  useEffect(() => {
    if (!currentUser) return;
    const syncCertifiedHistoryToFirestore = async () => {
      try {
        const doc27 = await cloudStorage.loadRecord('2026-10-27');
        if (doc27) await cloudStorage.saveRecord(doc27);
        const doc28 = await cloudStorage.loadRecord('2026-10-28');
        if (doc28) await cloudStorage.saveRecord(doc28);
      } catch (e) {
        console.warn('Erreur synchronisation historique vers Firestore:', e);
      }
    };
    syncCertifiedHistoryToFirestore();
  }, [currentUser]);

  // Synchronisation en temps réel Firestore (liaison instantanée Téléphone <-> Ordinateur)
  useEffect(() => {
    if (!currentUser) return;

    let isCancelled = false;
    const unsubscribe = cloudStorage.subscribeToRecord(
      currentDate,
      (firestoreRecord) => {
        if (isCancelled || !firestoreRecord) return;
        const cloudTime = new Date(firestoreRecord.updatedAt || 0).getTime();
        const localTime = new Date(record.updatedAt || 0).getTime();

        // Si la fiche a été mise à jour depuis le téléphone ou un autre ordinateur
        if (cloudTime > localTime) {
          console.log(`[Firestore Live] Synchronisation immédiate reçue pour le ${currentDate}`);
          setRecord(firestoreRecord);
          setSyncStatus({ state: 'synced', lastSavedAt: firestoreRecord.updatedAt, isCloudConnected: true });
        }
      },
      (err) => {
        console.warn('Erreur écouteur Firestore:', err);
      }
    );

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [currentDate, currentUser, record.updatedAt]);

  // Synchronisation en direct multi-appareils (téléphone <-> ordinateur)
  useEffect(() => {
    let isCancelled = false;

    const checkServerUpdates = async () => {
      // Ne pas synchroniser si l'utilisateur est en cours de saisie/sauvegarde
      if (syncStatus.state === 'saving') return;

      try {
        const res = await fetch(`/api/records/${currentDate}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.record && !isCancelled) {
          const serverUpdated = new Date(data.record.updatedAt).getTime();
          const localUpdated = new Date(record.updatedAt).getTime();

          // Si le serveur a une version plus récente (enregistrée depuis un autre appareil / téléphone / PC)
          if (serverUpdated > localUpdated) {
            console.log(`[Multi-Appareil] Synchronisation : Nouvelle version détectée pour le ${currentDate}`);
            setRecord(data.record);
            cloudStorage.saveLocally(data.record);
            setSyncStatus({ state: 'synced', lastSavedAt: data.record.updatedAt });
          }
        }
      } catch (e) {
        // Mode hors ligne ou réseau temporairement indisponible
      }
    };

    // 1. Vérification dès que l'utilisateur déverrouille le téléphone ou active la fenêtre
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerUpdates();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkServerUpdates);

    // 2. Polling automatique toutes les 8 secondes pour synchronisation quasi-temps réel
    const interval = setInterval(checkServerUpdates, 8000);

    return () => {
      isCancelled = true;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkServerUpdates);
      clearInterval(interval);
    };
  }, [currentDate, record.updatedAt, syncStatus.state]);

  // Gestion robuste de la file d'attente hors-ligne et synchronisation automatique lors du rétablissement du réseau
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((queue, isProcessing) => {
      const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'failed' || q.status === 'syncing').length;
      setSyncStatus(prev => ({
        ...prev,
        pendingQueueCount: pendingCount,
        isProcessingQueue: isProcessing,
        state: typeof navigator !== 'undefined' && !navigator.onLine 
          ? 'offline' 
          : (pendingCount > 0 ? (isProcessing ? 'saving' : 'offline') : 'synced'),
      }));
    });

    const handleOnline = async () => {
      console.log('[App] Événement réseau : Connexion Internet rétablie.');
      const pending = offlineQueue.getPendingCount();
      if (pending > 0) {
        setOnlineBanner({
          type: 'info',
          message: `Connexion Internet rétablie : synchronisation automatique de ${pending} modification(s) en attente...`,
        });
        const res = await offlineQueue.processQueue();
        if (res.succeeded > 0) {
          setOnlineBanner({
            type: 'success',
            message: `Connexion rétablie : ${res.succeeded} modification(s) synchronisée(s) avec succès sur le Cloud !`,
          });
          setTimeout(() => setOnlineBanner(null), 5500);
        }
      } else {
        setOnlineBanner({
          type: 'success',
          message: 'Connexion Internet rétablie. Vos données sont synchronisées avec le Cloud.',
        });
        setTimeout(() => setOnlineBanner(null), 4000);
      }
    };

    const handleOffline = () => {
      console.log('[App] Événement réseau : Déconnexion détectée.');
      setSyncStatus(prev => ({ ...prev, state: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sauvegarde automatique avec debounce dès qu'une modification survient
  const triggerAutoSave = useCallback((updatedRecord: DailyRecord) => {
    setRecord(updatedRecord);
    setSyncStatus(prev => ({ ...prev, state: 'saving' }));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await cloudStorage.saveRecord(updatedRecord);
        const pending = offlineQueue.getPendingCount();
        setSyncStatus(prev => ({
          ...prev,
          state: res.isOffline ? 'offline' : 'synced',
          lastSavedAt: res.savedAt,
          pendingQueueCount: pending,
        }));
      } catch (err) {
        setSyncStatus(prev => ({ ...prev, state: 'error', errorMessage: 'Erreur lors de la sauvegarde cloud' }));
      }
    }, 450); // 450ms debounce pour fluidité maximale sans surcharger
  }, []);

  // Forcer la sauvegarde manuelle immédiate et vider la file
  const handleForceSave = async () => {
    setSyncStatus(prev => ({ ...prev, state: 'saving' }));
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine && offlineQueue.getPendingCount() > 0) {
        await offlineQueue.processQueue();
      }
      const res = await cloudStorage.saveRecord(record);
      const pending = offlineQueue.getPendingCount();
      setSyncStatus(prev => ({
        ...prev,
        state: res.isOffline ? 'offline' : 'synced',
        lastSavedAt: res.savedAt,
        pendingQueueCount: pending,
      }));
    } catch (e) {
      setSyncStatus(prev => ({ ...prev, state: 'error' }));
    }
  };

  // Mise à jour d'un compartiment (startOfDay ou endOfDay)
  const handleUpdateCompartment = (id: string, field: 'startOfDay' | 'endOfDay' | 'notes', value: any) => {
    const updatedCompartments = record.compartments.map(comp => {
      if (comp.id === id) {
        const updated = { ...comp, [field]: value };
        // Recalculer automatiquement la différence nette
        updated.netDifference = (updated.endOfDay || 0) - (updated.startOfDay || 0);
        return updated;
      }
      return comp;
    });

    const updatedRecord: DailyRecord = {
      ...record,
      compartments: updatedCompartments,
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Ajout d'un compartiment personnalisé
  const handleAddCompartment = (name: string, category: CompartmentEntry['category']) => {
    const newComp: CompartmentEntry = {
      id: `custom_${Date.now()}`,
      name,
      category,
      startOfDay: 0,
      endOfDay: 0,
      netDifference: 0,
      isCustom: true,
    };

    const updatedRecord: DailyRecord = {
      ...record,
      compartments: [...record.compartments, newComp],
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Suppression d'un compartiment personnalisé
  const handleDeleteCompartment = (id: string) => {
    const updatedCompartments = record.compartments.filter(c => c.id !== id);
    const updatedRecord: DailyRecord = {
      ...record,
      compartments: updatedCompartments,
      updatedAt: new Date().toISOString(),
    };
    triggerAutoSave(updatedRecord);
  };

  // Actualisation manuelle du report strict du reliquat de la veille
  // RÈGLE STRICTE : Seul et uniquement le reliquat strict est reporté, les soldes de fin de journée ne sont JAMAIS reportés
  const handleRefreshYesterdayReliquat = () => {
    if (!yesterdayRecord) return;
    const prevTotalStart = yesterdayRecord.compartments.reduce((acc, c) => acc + (c.startOfDay || 0), 0);
    const prevTotalEnd = yesterdayRecord.compartments.reduce((acc, c) => acc + (c.endOfDay || 0), 0);
    const prevStrictReliquat = prevTotalEnd - prevTotalStart;

    const updatedRecord: DailyRecord = {
      ...record,
      previousDayReliquatReported: prevStrictReliquat,
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
    setAutoReportNotice({
      date: currentDate,
      sourceDate: yesterdayRecord.date,
      reliquat: prevStrictReliquat,
    });
  };

  // Remise à zéro de tous les débuts de journée (commencer de zéro)
  const handleResetStartOfDayToZero = () => {
    const updatedCompartments = record.compartments.map(comp => ({
      ...comp,
      startOfDay: 0,
      netDifference: comp.endOfDay || 0,
    }));

    const updatedRecord: DailyRecord = {
      ...record,
      compartments: updatedCompartments,
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Ajout d'une transaction de transfert international (RIA, WU, MG)
  const handleAddTransfer = (txData: Omit<OperatorTransferTransaction, 'id' | 'tax'>) => {
    const tax = txData.type === 'retrait' && txData.m2 !== undefined 
      ? Math.max(0, txData.m1 - txData.m2) 
      : 0;
    const newTx: OperatorTransferTransaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tax,
    };

    const updatedRecord: DailyRecord = {
      ...record,
      transfers: [newTx, ...record.transfers],
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Suppression d'une transaction transfert
  const handleDeleteTransfer = (id: string) => {
    const updatedRecord: DailyRecord = {
      ...record,
      transfers: record.transfers.filter(t => t.id !== id),
      updatedAt: new Date().toISOString(),
    };
    triggerAutoSave(updatedRecord);
  };

  // Ajout d'un partenaire libre (Seddo)
  const handleAddPartner = (partnerData: Omit<SeddoPartnerEntry, 'id'>) => {
    const newPartner: SeddoPartnerEntry = {
      ...partnerData,
      id: `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    const updatedRecord: DailyRecord = {
      ...record,
      seddoPartners: [...record.seddoPartners, newPartner],
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Suppression d'un partenaire Seddo
  const handleDeletePartner = (id: string) => {
    const updatedRecord: DailyRecord = {
      ...record,
      seddoPartners: record.seddoPartners.filter(p => p.id !== id),
      updatedAt: new Date().toISOString(),
    };
    triggerAutoSave(updatedRecord);
  };

  // Mise à jour inline d'un partenaire Seddo
  const handleUpdatePartner = (id: string, field: 'partnerName' | 'amount' | 'paymentMode', value: any) => {
    const updatedPartners = record.seddoPartners.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });

    const updatedRecord: DailyRecord = {
      ...record,
      seddoPartners: updatedPartners,
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Application du comptage d'espèces physique au compartiment Liquidités
  const handleSaveCashBreakdown = (breakdown: CashBreakdown, totalCash: number) => {
    const updatedCompartments = record.compartments.map(comp => {
      if (comp.id === 'liquidites') {
        return {
          ...comp,
          endOfDay: totalCash,
          netDifference: totalCash - (comp.startOfDay || 0),
        };
      }
      return comp;
    });

    const updatedRecord: DailyRecord = {
      ...record,
      compartments: updatedCompartments,
      cashBreakdown: breakdown,
      updatedAt: new Date().toISOString(),
    };

    triggerAutoSave(updatedRecord);
  };

  // Exporter en CSV
  const handleExportCSV = () => {
    const csvContent = exportRecordToCSV(record, yesterdayRecord);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bordereau_Caisse_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Imprimer la fiche
  const handlePrint = () => {
    window.print();
  };

  const metrics = calculateDailyMetrics(record, yesterdayRecord);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* 1. Header principal avec navigation et statut Cloud */}
      <div className="no-print">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          syncStatus={syncStatus}
          onForceSave={handleForceSave}
          onPrint={handlePrint}
          onExportCSV={handleExportCSV}
          transfersCount={record.transfers.length}
          seddoCount={record.seddoPartners.length}
          onOpenOfflineQueue={() => setShowOfflineQueueModal(true)}
          onOpenAssistant={() => setShowAssistantModal(true)}
          onOpenResetModal={() => setShowResetModal(true)}
        />
      </div>

      {/* 2. Corps de l'application */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-8 flex-1 space-y-6 no-print">
        
        {/* Barre de sélection de la date du jour actif */}
        {activeTab !== 'dashboard' && activeTab !== 'currency' && (
          <DateSelector
            currentDate={currentDate}
            onDateChange={(newDate) => setCurrentDate(newDate)}
            onOpenAssistant={() => setShowAssistantModal(true)}
          />
        )}

        {/* Bannière de reconnexion et synchronisation automatique de la file d'attente */}
        {onlineBanner && (
          <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs transition-all ${
            onlineBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700/80 text-blue-900 dark:text-blue-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl text-white shrink-0 ${onlineBanner.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {onlineBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
              </span>
              <div>
                <span className="font-bold block">{onlineBanner.message}</span>
              </div>
            </div>
            <button
              onClick={() => setOnlineBanner(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bannière Mode Hors-Ligne & File d'attente persistante */}
        {(typeof navigator !== 'undefined' && (!navigator.onLine || (syncStatus.pendingQueueCount || 0) > 0)) && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                {typeof navigator !== 'undefined' && !navigator.onLine ? <WifiOff className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-950 dark:text-amber-100">
                    {typeof navigator !== 'undefined' && !navigator.onLine ? 'Mode Hors-Ligne Actif' : 'Modifications en File d\'Attente'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {syncStatus.pendingQueueCount || 0} en attente
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Toutes vos saisies continuent normalement et sont sécurisées localement. Elles seront automatiquement envoyées vers Firestore et le serveur dès le retour d'Internet.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowOfflineQueueModal(true)}
                className="px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-850 rounded-xl border border-amber-300 dark:border-amber-700 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Gérer la file d'attente</span>
              </button>
            </div>
          </div>
        )}

        {/* Bannière d'état et d'explication de liaison multi-appareils (Téléphone <-> Ordinateur) */}
        {currentUser ? (
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs transition-all">
            <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-medium">
                <strong>Base Cloud Firestore Active</strong> : Téléphone &amp; Ordinateur reliés en direct via <strong className="font-mono">{currentUser.email}</strong>.
              </span>
            </div>
            <button
              onClick={() => setShowExplainerModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline shrink-0"
              title="Comprendre le fonctionnement du lien multi-appareils et du reliquat"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pourquoi &amp; Comment</span>
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-900/60 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                <Smartphone className="w-4 h-4 inline mr-1" />
                <Laptop className="w-4 h-4 inline" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Liez votre téléphone et votre ordinateur en direct !
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Connectez-vous avec Google pour activer la synchronisation instantanée Firestore entre tous vos écrans et la base de données.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowExplainerModal(true)}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pourquoi non liés ?</span>
              </button>
              <button
                onClick={loginWithGoogle}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Connexion Google</span>
              </button>
            </div>
          </div>
        )}

        {/* Bannière de confirmation du report automatique à 00h00 */}
        {autoReportNotice && autoReportNotice.date === currentDate && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs transition-all">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 shrink-0">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </span>
              <div>
                <span className="font-extrabold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Report Automatique du Reliquat Strict de Veille à 00h00</span>
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block mt-0.5">
                  Seul et uniquement le Reliquat Strict de la veille du <strong>{formatDateFr(autoReportNotice.sourceDate, 'day-month')}</strong> a été reporté : <strong className="font-mono text-emerald-950 dark:text-emerald-100 font-black">{autoReportNotice.reliquat > 0 && '+'}{formatCurrency(autoReportNotice.reliquat)}</strong>. Conformément aux consignes, aucun solde de fin de journée n'est reporté.
                </span>
              </div>
            </div>
            <button
              onClick={() => setAutoReportNotice(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shrink-0"
              title="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'compartments' && (
          <CompartmentsTable
            compartments={record.compartments}
            onUpdateCompartment={handleUpdateCompartment}
            onAddCompartment={handleAddCompartment}
            onDeleteCompartment={handleDeleteCompartment}
            onRefreshYesterdayReliquat={handleRefreshYesterdayReliquat}
            onResetStartToZero={handleResetStartOfDayToZero}
            onOpenCashCounter={() => setShowCashCounter(true)}
            yesterdayAvailable={!!yesterdayRecord}
            dailyReliquat={metrics.reliquat}
            previousDayReliquat={metrics.previousDayReliquat}
            previousRecord={yesterdayRecord}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferOperatorsSection
            transfers={record.transfers}
            currentDate={currentDate}
            onAddTransfer={handleAddTransfer}
            onDeleteTransfer={handleDeleteTransfer}
            onOpenReceipt={(receiptData) => setActiveReceipt(receiptData)}
          />
        )}

        {activeTab === 'seddo' && (
          <SeddoPartnersSection
            seddoPartners={record.seddoPartners}
            seddoCompartment={record.compartments.find(c => c.id === 'seddo')}
            currentDate={currentDate}
            onAddPartner={handleAddPartner}
            onDeletePartner={handleDeletePartner}
            onUpdatePartner={handleUpdatePartner}
            onOpenReceipt={(receiptData) => setActiveReceipt(receiptData)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            record={record}
            previousRecord={yesterdayRecord}
            currentDate={currentDate}
            onDateChange={(d) => setCurrentDate(d)}
            onUpdateCompartment={handleUpdateCompartment}
            onPrint={handlePrint}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'currency' && (
          <CurrencyConverter />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onSelectDate={(selectedDate) => {
              setCurrentDate(selectedDate);
              setActiveTab('dashboard');
            }}
          />
        )}

      </main>

      {/* 3. Modal de billetterie d'espèces */}
      {showCashCounter && (
        <CashCounterModal
          initialBreakdown={record.cashBreakdown}
          onSave={handleSaveCashBreakdown}
          onClose={() => setShowCashCounter(false)}
        />
      )}

      {/* 4. Modal de ticket / reçu client interactif (Numérique, image, partage, impression) */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* 5. Feuille d'impression thermique du ticket client (80mm) */}
      <PrintableReceipt receipt={activeReceipt} />

      {/* 6. Feuille d'impression du bordereau global journalier (A4) */}
      <PrintableDailySheet record={record} previousRecord={yesterdayRecord} />

      {/* 5. Footer minimaliste et informatif */}
      <footer className="no-print mt-auto py-4 mb-16 md:mb-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AnnoirFinancePro — Système de gestion de caisse et transferts financiers</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Calculs automatiques en temps réel · Sauvegarde Cloud instantanée</p>
        </div>
      </footer>

      {/* 6. Barre de Navigation Inférieure Mobile Native (Wave / Orange Money style) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        transfersCount={record.transfers.length}
        seddoCount={record.seddoPartners.length}
      />

      {/* 7. Modal explicatif Synchronisation & Report du Reliquat */}
      <SyncAndReliquatExplainerModal
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
      />

      {/* 8. Modal du Gestionnaire de File d'Attente Hors-Ligne */}
      <OfflineQueueModal
        isOpen={showOfflineQueueModal}
        onClose={() => setShowOfflineQueueModal(false)}
      />

      {/* 9. Modal FinanCaisse AI Assistant (Gemini 3.8 Flash + Recherche Google) */}
      <GeminiAssistantModal
        isOpen={showAssistantModal}
        onClose={() => setShowAssistantModal(false)}
        currentRecord={record}
      />

      {/* 10. Modal de Confirmation de Remise à Zéro Intégrale */}
      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleFullReset}
        isResetting={isResetting}
      />

    </div>
  );
}
