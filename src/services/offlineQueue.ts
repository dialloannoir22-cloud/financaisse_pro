import { DailyRecord } from '../types/finance';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export type MutationActionType = 'SAVE_RECORD' | 'DELETE_RECORD';

export interface QueuedMutation {
  id: string;
  type: MutationActionType;
  date: string;
  payload?: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  description: string;
}

const QUEUE_STORAGE_KEY = 'financaisse_offline_queue_v1';
const QUEUE_LAST_SYNC_KEY = 'financaisse_last_queue_sync';

type QueueListener = (queue: QueuedMutation[], isSyncing: boolean) => void;

class OfflineQueueManager {
  private queue: QueuedMutation[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupNetworkListeners();
  }

  /**
   * Charge la file d'attente persistée depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Réinitialiser les statuts 'syncing' en 'pending' en cas de fermeture brutale
          this.queue = parsed.map(item => ({
            ...item,
            status: item.status === 'syncing' ? 'pending' : item.status,
          }));
        }
      }
    } catch (e) {
      console.warn('[OfflineQueue] Erreur lecture file d\'attente:', e);
      this.queue = [];
    }
  }

  /**
   * Sauvegarde la file d'attente dans localStorage
   */
  private persistToStorage(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('[OfflineQueue] Erreur persistance file d\'attente:', e);
    }
  }

  /**
   * Écoute les changements de connectivité réseau du navigateur
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Connexion Internet rétablie ! Traitement immédiat de la file d\'attente...');
      this.processQueue();
    });

    window.addEventListener('focus', () => {
      if (navigator.onLine && this.getPendingCount() > 0) {
        this.processQueue();
      }
    });

    // Polling régulier de sécurité (toutes les 25 secondes si des éléments attendent)
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && this.getPendingCount() > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 25000);
  }

  /**
   * S'abonne aux modifications de la file d'attente
   */
  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getQueue(), this.isProcessing);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentQueue = this.getQueue();
    this.listeners.forEach(fn => fn(currentQueue, this.isProcessing));
  }

  /**
   * Récupère la copie actuelle de la file d'attente
   */
  public getQueue(): QueuedMutation[] {
    return [...this.queue];
  }

  /**
   * Nombre de modifications en attente de synchronisation
   */
  public getPendingCount(): number {
    return this.queue.filter(q => q.status === 'pending' || q.status === 'failed' || q.status === 'syncing').length;
  }

  /**
   * Date du dernier succès de synchronisation de la file
   */
  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(QUEUE_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Ajoute ou consolide une modification dans la file d'attente
   */
  public enqueue(item: {
    type: MutationActionType;
    date: string;
    payload?: any;
    description?: string;
  }): QueuedMutation {
    const now = new Date().toISOString();
    
    // Déduplication & consolidation intelligente :
    // Si une sauvegarde existe déjà pour la même date en attente, on fusionne avec la dernière version
    const existingIndex = this.queue.findIndex(
      q => q.date === item.date && q.type === item.type && (q.status === 'pending' || q.status === 'failed')
    );

    let mutation: QueuedMutation;

    if (existingIndex !== -1) {
      mutation = {
        ...this.queue[existingIndex],
        payload: item.payload,
        timestamp: now,
        status: 'pending',
        description: item.description || `Mise à jour consolidée du ${item.date}`,
        lastError: undefined,
      };
      this.queue[existingIndex] = mutation;
      console.log(`[OfflineQueue] Fusion de la modification pour ${item.date} dans la file d'attente.`);
    } else {
      mutation = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: item.type,
        date: item.date,
        payload: item.payload,
        timestamp: now,
        retryCount: 0,
        status: 'pending',
        description: item.description || (item.type === 'SAVE_RECORD' ? `Fiche journalière du ${item.date}` : `Suppression de la date ${item.date}`),
      };
      this.queue.push(mutation);
      console.log(`[OfflineQueue] Nouvelle opération ajoutée à la file pour ${item.date} (${this.queue.length} en attente).`);
    }

    this.persistToStorage();
    this.notify();

    // Si on est en ligne, tenter de synchroniser immédiatement
    if (navigator.onLine && !this.isProcessing) {
      setTimeout(() => this.processQueue(), 200);
    }

    return mutation;
  }

  /**
   * Traite et vide la file d'attente vers Firestore et le serveur
   */
  public async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Traitement déjà en cours, requête ignorée.');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const pendingItems = this.queue.filter(q => q.status === 'pending' || q.status === 'failed');
    if (pendingItems.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[OfflineQueue] Appareil hors-ligne, report de la synchronisation.');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    this.notify();

    console.log(`[OfflineQueue] Démarrage de la synchronisation de ${pendingItems.length} modification(s)...`);

    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems) {
      item.status = 'syncing';
      this.notify();

      let itemSuccess = false;
      let errorMsg = '';

      try {
        if (item.type === 'SAVE_RECORD' && item.payload) {
          const record = item.payload as DailyRecord;
          const enrichedRecord: DailyRecord = {
            ...record,
            id: record.date,
            userId: auth.currentUser ? auth.currentUser.uid : (record.userId || 'anonymous'),
            updatedAt: new Date().toISOString(),
          };

          // 1. Sauvegarder dans Firestore si connecté
          if (auth.currentUser) {
            try {
              const docRef = doc(db, 'records', enrichedRecord.date);
              await setDoc(docRef, enrichedRecord, { merge: true });
            } catch (err: any) {
              console.warn(`[OfflineQueue] Avertissement Firestore pour ${item.date}:`, err?.message);
              try {
                handleFirestoreError(err, OperationType.WRITE, `records/${enrichedRecord.date}`);
              } catch {}
            }
          }

          // 2. Sauvegarder sur le serveur Node/Express
          const res = await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrichedRecord),
          });

          if (!res.ok) {
            throw new Error(`Serveur HTTP ${res.status}`);
          }

          itemSuccess = true;
        } else if (item.type === 'DELETE_RECORD') {
          if (auth.currentUser) {
            try {
              await deleteDoc(doc(db, 'records', item.date));
            } catch (err: any) {
              console.warn(`[OfflineQueue] Avertissement suppression Firestore ${item.date}:`, err?.message);
            }
          }

          const res = await fetch(`/api/records/${item.date}`, { method: 'DELETE' });
          if (!res.ok && res.status !== 404) {
            throw new Error(`Serveur HTTP ${res.status}`);
          }

          itemSuccess = true;
        }
      } catch (err: any) {
        errorMsg = err?.message || 'Erreur inconnue de synchronisation';
        console.error(`[OfflineQueue] Échec synchronisation item ${item.id} (${item.date}):`, errorMsg);
      }

      if (itemSuccess) {
        succeeded++;
        item.status = 'synced';
        // Supprimer l'élément traité de la file
        this.queue = this.queue.filter(q => q.id !== item.id);
        console.log(`[OfflineQueue] ✓ Succès pour ${item.date} (${item.type}).`);
      } else {
        failed++;
        item.status = 'failed';
        item.retryCount += 1;
        item.lastError = errorMsg;
      }

      this.persistToStorage();
      this.notify();
    }

    if (succeeded > 0) {
      try {
        localStorage.setItem(QUEUE_LAST_SYNC_KEY, new Date().toISOString());
      } catch {}
    }

    this.isProcessing = false;
    this.persistToStorage();
    this.notify();

    console.log(`[OfflineQueue] Fin de synchronisation : ${succeeded} réussie(s), ${failed} échec(s).`);

    return {
      processed: pendingItems.length,
      succeeded,
      failed,
    };
  }

  /**
   * Supprime manuellement un élément de la file
   */
  public removeItem(id: string): void {
    this.queue = this.queue.filter(q => q.id !== id);
    this.persistToStorage();
    this.notify();
  }

  /**
   * Réinitialise / vide entièrement la file d'attente
   */
  public clearQueue(): void {
    this.queue = [];
    this.persistToStorage();
    this.notify();
  }

  /**
   * Réessaie tous les éléments en échec
   */
  public retryFailed(): void {
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
      }
    });
    this.persistToStorage();
    this.notify();
    this.processQueue();
  }
}

export const offlineQueue = new OfflineQueueManager();
