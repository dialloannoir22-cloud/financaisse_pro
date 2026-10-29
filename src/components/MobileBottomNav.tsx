import React from 'react';
import { 
  Wallet, 
  ArrowLeftRight, 
  Users, 
  LayoutDashboard, 
  Coins, 
  History 
} from 'lucide-react';
import { ActiveTab } from './Header';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  transfersCount: number;
  seddoCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  transfersCount,
  seddoCount,
}) => {
  const tabs = [
    {
      id: 'compartments' as ActiveTab,
      label: 'Caisse',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'transfers' as ActiveTab,
      label: 'Transferts',
      icon: ArrowLeftRight,
      badge: transfersCount > 0 ? transfersCount : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'seddo' as ActiveTab,
      label: 'Seddo',
      icon: Users,
      badge: seddoCount > 0 ? seddoCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'currency' as ActiveTab,
      label: 'Devises',
      icon: Coins,
      badge: null,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Historique',
      icon: History,
      badge: null,
    },
  ];

  return (
    <nav 
      aria-label="Navigation principale mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-colors no-print"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-6 items-center px-1 pt-1.5 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {tab.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-black rounded-full shadow-xs ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-0.5 truncate w-full text-center ${
                  isActive ? 'font-bold' : 'font-normal'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className="w-4 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
