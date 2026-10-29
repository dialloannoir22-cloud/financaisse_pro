import React, { useState } from 'react';
import { CashBreakdown } from '../types/finance';
import { formatCurrency, parseNumber } from '../utils/financeCalculations';
import { Banknote, X, Check } from 'lucide-react';

interface CashCounterModalProps {
  initialBreakdown?: CashBreakdown;
  onSave: (breakdown: CashBreakdown, totalCash: number) => void;
  onClose: () => void;
}

export const CashCounterModal: React.FC<CashCounterModalProps> = ({
  initialBreakdown,
  onSave,
  onClose,
}) => {
  const [b10000, setB10000] = useState<number>(initialBreakdown?.b10000 || 0);
  const [b5000, setB5000] = useState<number>(initialBreakdown?.b5000 || 0);
  const [b2000, setB2000] = useState<number>(initialBreakdown?.b2000 || 0);
  const [b1000, setB1000] = useState<number>(initialBreakdown?.b1000 || 0);
  const [b500, setB500] = useState<number>(initialBreakdown?.b500 || 0);
  const [coins, setCoins] = useState<number>(initialBreakdown?.coins || 0);

  const actualTotal = 
    b10000 * 10000 +
    b5000 * 5000 +
    b2000 * 2000 +
    b1000 * 1000 +
    b500 * 500 +
    coins;

  const handleApply = () => {
    onSave(
      {
        b10000,
        b5000,
        b2000,
        b1000,
        b500,
        coins,
      },
      actualTotal
    );
    onClose();
  };

  const denominations = [
    { label: 'Billets de 10 000 F', multiplier: 10000, value: b10000, setter: setB10000, bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' },
    { label: 'Billets de 5 000 F', multiplier: 5000, value: b5000, setter: setB5000, bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' },
    { label: 'Billets de 2 000 F', multiplier: 2000, value: b2000, setter: setB2000, bg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300' },
    { label: 'Billets de 1 000 F', multiplier: 1000, value: b1000, setter: setB1000, bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' },
    { label: 'Billets de 500 F', multiplier: 500, value: b500, setter: setB500, bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Billetterie Caisse (Comptage Espèces)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculez le montant physique total du tiroir-caisse
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grille des coupures */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {denominations.map(denom => (
            <div key={denom.multiplier} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${denom.bg}`}>
                {denom.label}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">x</span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={denom.value === 0 ? '' : denom.value}
                  placeholder="0"
                  onChange={(e) => denom.setter(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center font-mono font-bold bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
                />
                <span className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs tabular-nums">
                  = {formatCurrency(denom.value * denom.multiplier)}
                </span>
              </div>
            </div>
          ))}

          {/* Pièces de monnaie totales */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              Pièces de Monnaie (Montant total)
            </span>

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                min="0"
                value={coins === 0 ? '' : coins}
                placeholder="0"
                onChange={(e) => setCoins(parseNumber(e.target.value))}
                className="w-32 text-right font-mono font-bold bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              />
              <span className="w-16 text-right text-xs font-medium text-slate-400 dark:text-slate-500">FCFA</span>
            </div>
          </div>
        </div>

        {/* Total physique calculé */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border border-transparent dark:border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">
              Total Espèces Comptées
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(actualTotal)}
            </span>
          </div>

          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Valider pour Fin de Journée</span>
          </button>
        </div>

      </div>
    </div>
  );
};
