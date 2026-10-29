import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, History, Sparkles } from 'lucide-react';
import { formatDateFr, getTodayDateString } from '../utils/financeCalculations';

interface DateSelectorProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  availableDates?: string[];
  onOpenAssistant?: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  currentDate,
  onDateChange,
  availableDates = [],
  onOpenAssistant,
}) => {
  const today = getTodayDateString();
  const isToday = currentDate === today;

  const handlePrevDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const prevYear = dateObj.getFullYear();
    const prevMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const prevDay = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${prevYear}-${prevMonth}-${prevDay}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextYear = dateObj.getFullYear();
    const nextMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextDay = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  // Filtrer les dates disponibles différentes de la date courante pour les raccourcis
  const otherDates = availableDates.filter((d) => d !== currentDate).slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Journée sélectionnée
              </span>
              {isToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Aujourd'hui (Nouveau départ)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Journée passée
                </span>
              )}
            </div>
            <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white capitalize">
              {formatDateFr(currentDate, 'full')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevDay}
            title="Jour précédent"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleNextDay}
            title="Jour suivant"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => onDateChange(today)}
              className="flex items-center gap-1 ml-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aujourd'hui</span>
            </button>
          )}

          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1 ml-1 px-2.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-xs transition-all active:scale-95"
              title="Ouvrir FinanCaisse AI (Assistant & Audit)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FinanCaisse AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Raccourcis rapides d'accès aux dates clés */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
          <History className="w-3 h-3" /> Accès direct :
        </span>

        <button
          type="button"
          onClick={() => onDateChange('2026-10-27')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            currentDate === '2026-10-27'
              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-bold'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <span>27 Octobre</span>
          <span className="font-mono text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold">
            +5 697 061 F
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDateChange('2026-10-28')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            currentDate === '2026-10-28'
              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold'
              : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>28 Octobre (Hier)</span>
        </button>

        <button
          type="button"
          onClick={() => onDateChange('2026-10-29')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            currentDate === '2026-10-29'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
              : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>29 Octobre (Aujourd'hui)</span>
        </button>
      </div>
    </div>
  );
};
