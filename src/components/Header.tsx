import React from 'react';
import { 
  Cloud, 
  CloudOff, 
  Wallet, 
  ArrowLeftRight, 
  Users, 
  LayoutDashboard, 
  History,
  Printer,
  Download,
  RefreshCw,
  Sun,
  Moon,
  Coins,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { SyncStatus } from '../services/cloudStorage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab = 'compartments' | 'transfers' | 'seddo' | 'dashboard' | 'currency' | 'history';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  syncStatus: SyncStatus;
  onForceSave: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
  transfersCount: number;
  seddoCount: number;
  onOpenOfflineQueue?: () => void;
  onOpenAssistant?: () => void;
  onOpenResetModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  syncStatus,
  onForceSave,
  onPrint,
  onExportCSV,
  transfersCount,
  seddoCount,
  onOpenOfflineQueue,
  onOpenAssistant,
  onOpenResetModal,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { currentUser, appUser, isAdmin, isLoading: isAuthLoading, loginWithGoogle, logout } = useAuth();

  const hasPendingQueue = (syncStatus.pendingQueueCount || 0) > 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Barre supérieure principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Titre de l'application */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  AnnoirFinancePro
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Gestion Multiservices &amp; Transferts Financiers
              </p>
            </div>
          </div>

          {/* Onglets de navigation principale */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-transparent dark:border-slate-750">
            <button
              onClick={() => onTabChange('compartments')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'compartments'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Compartiments Début / Fin</span>
            </button>

            <button
              onClick={() => onTabChange('transfers')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'transfers'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Opérateurs (M1 / M2)</span>
              {transfersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-full font-bold">
                  {transfersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('seddo')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'seddo'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Partenaire Libre (Seddo)</span>
              {seddoCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] rounded-full font-bold">
                  {seddoCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard Résumé</span>
            </button>

            <button
              onClick={() => onTabChange('currency')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'currency'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Devises</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique</span>
            </button>
          </nav>

          {/* Zone d'actions, FinanCaisse AI, PWA Install, Bascule de thème & Sauvegarde */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Bouton d'Installation PWA (Écran d'accueil / Mode Standalone) */}
            <PWAInstallButton />

            {/* Bouton Assistant IA FinanCaisse */}
            {onOpenAssistant && (
              <button
                type="button"
                onClick={onOpenAssistant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                title="Ouvrir l'Assistant IA FinanCaisse avec audit et recherche Google"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                <span>Assistant IA</span>
              </button>
            )}

            {/* Bouton Réinitialiser à zéro */}
            {onOpenResetModal && (
              <button
                type="button"
                onClick={onOpenResetModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-900/60 transition-colors"
                title="Remettre toutes les sommes à zéro et démarrer une caisse neuve aujourd'hui"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repartir à zéro</span>
              </button>
            )}

            {/* Bascule de Thème (Dark Mode / Light Mode) */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label={isDark ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
              title={isDark ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre (faible luminosité)'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-xs font-semibold text-slate-200 hidden md:inline">Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700 hidden md:inline">Sombre</span>
                </>
              )}
            </button>

            {/* Badge de File d'Attente Hors-Ligne si des requêtes sont en attente */}
            {hasPendingQueue && (
              <button
                type="button"
                onClick={onOpenOfflineQueue}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all animate-pulse"
                title="Des modifications locales sont en attente de réseau."
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{syncStatus.pendingQueueCount} file</span>
              </button>
            )}

            {/* Statut Cloud & Connexion */}
            <div 
              onClick={() => {
                if (hasPendingQueue || syncStatus.state === 'offline') {
                  onOpenOfflineQueue?.();
                } else {
                  onForceSave();
                }
              }}
              title={
                hasPendingQueue 
                  ? `${syncStatus.pendingQueueCount} modification(s) en attente.`
                  : syncStatus.state === 'saving' 
                  ? 'Sauvegarde en cours...' 
                  : 'Cliquer pour synchroniser manuellement sur le Cloud'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border ${
                syncStatus.state === 'offline' || hasPendingQueue
                  ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
            >
              {syncStatus.isProcessingQueue ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hidden md:inline">Envoi...</span>
                </>
              ) : syncStatus.state === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 hidden md:inline">Sauvegarde...</span>
                </>
              ) : syncStatus.state === 'offline' || hasPendingQueue ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hidden md:inline">
                    Hors-ligne {hasPendingQueue ? `(${syncStatus.pendingQueueCount})` : ''}
                  </span>
                </>
              ) : syncStatus.state === 'error' ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[11px] font-medium text-red-700 dark:text-red-300 hidden md:inline">Erreur</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hidden md:inline">
                    Cloud Synchro
                  </span>
                </>
              )}
            </div>

            {/* Boutons d'export et impression */}
            <div className="flex items-center gap-1">
              <button
                onClick={onExportCSV}
                title="Exporter le bordereau en CSV / Excel"
                className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={onPrint}
                title="Imprimer le bordereau de clôture journalier"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            </div>

            {/* Authentification & Profil Utilisateur Firebase */}
            <div className="flex items-center ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || ''} 
                      className="w-6 h-6 rounded-full object-cover border border-emerald-500" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="flex flex-col text-left leading-tight hidden lg:flex">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {currentUser.displayName?.split(' ')[0] || 'Utilisateur'}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {isAdmin ? 'Super Admin' : (appUser?.role === 'manager' ? 'Gérant' : 'Caissier')}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    title="Se déconnecter"
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors ml-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  disabled={isAuthLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-xs"
                  title="Se connecter avec votre compte Google"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887C18.2 18 15.64 20.25 12.24 20.25c-4.65 0-8.4-3.75-8.4-8.25s3.75-8.25 8.4-8.25c2.4 0 4.5 0.9 6.07 2.4l3.15-3.15C19.46 1.15 16.1 0 12.24 0 5.49 0 0 5.49 0 12.25s5.49 12.25 12.24 12.25c7.05 0 12.18-4.95 12.18-12.25 0-.82-.08-1.53-.2-2.215H12.24z"/>
                  </svg>
                  <span className="hidden sm:inline">Connexion</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation intermédiaire pour tablettes */}
        <div className="hidden md:flex xl:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => onTabChange('compartments')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'compartments' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Compartiments
          </button>
          <button
            onClick={() => onTabChange('transfers')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'transfers' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Opérateurs ({transfersCount})
          </button>
          <button
            onClick={() => onTabChange('seddo')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'seddo' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Seddo ({seddoCount})
          </button>
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('currency')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'currency' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Devises
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'history' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Historique
          </button>
        </div>

      </div>
    </header>
  );
};
