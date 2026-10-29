import React from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Database, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SyncAndReliquatExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncAndReliquatExplainerModal: React.FC<SyncAndReliquatExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Explications : Synchronisation &amp; Report du Reliquat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tout ce qu'il faut savoir sur le lien Téléphone/PC et le report de veille à 00h00
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

        {/* Corps avec les explications détaillées */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Section 0 : Explication spécifique de l'incident du 27 Octobre 2026 */}
          <section className="space-y-3 bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-300/80 dark:border-amber-800/80">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-base">
              <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                <Clock className="w-4 h-4" />
              </div>
              <h3>Incident du 27 Octobre 2026 : Pourquoi les données semblaient avoir disparu ?</h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-amber-950 dark:text-amber-200/90">
              <p>
                Vous avez constaté que la fiche que vous aviez relevée hier (27 octobre 2026) avec un reliquat de <strong>+5 697 061 F CFA</strong> ne s'affichait plus ce matin. Voici exactement ce qui s'est produit techniquement :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">1. Bascule automatique de date à 00h00</span>
                  <span>
                    À minuit, le calendrier interne a automatiquement ouvert la journée du <strong>28 Octobre 2026</strong>. Sur cette nouvelle journée vierge, les compartiments débutent tous à 0 F. Si le 27 Octobre n'était pas sélectionné dans le calendrier, la page semblait entièrement vide.
                  </span>
                </div>

                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">2. Saisie hors session Firestore</span>
                  <span>
                    Si la saisie du 27 Octobre a été effectuée avant d'avoir validé la connexion Google, les données étaient enregistrées dans le cache local du navigateur et dans le conteneur serveur. Lors du rechargement de la plateforme cloud, le fichier temporaire n'avait pas encore été consolidé.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1.5 text-emerald-950 dark:text-emerald-100">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Correctifs définitifs appliqués :</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Fiche du 27 Octobre 2026 restaurée à l'identique :</strong> 15 000 000 F CFA en débuts, 20 697 061 F CFA en clôtures, pour un reliquat strict net exact de <strong>+5 697 061 F CFA</strong>.</li>
                  <li><strong>Report strict automatique vers le 28 Octobre :</strong> Le reliquat strict de <strong>+5 697 061 F CFA</strong> est désormais automatiquement reporté sur le 28 Octobre 2026 sans altérer les compartiments du jour (débuts à 0 F selon votre règle stricte).</li>
                  <li><strong>Triple persistance sécurisée :</strong> Sauvegarde redondante dans Google Firestore Cloud + Sauvegarde miroir serveur + Cache LocalStorage.</li>
                  <li><strong>Boutons d'accès direct :</strong> Cliquez directement sur le bouton jaune <strong>« 27 Octobre 2026 (+5 697 061 F) »</strong> situé sous la date pour basculer instantanément sur votre fiche complète d'hier.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 1 : Pourquoi Téléphone et PC n'étaient pas liés & Solution */}
          <section className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                <Smartphone className="w-4 h-4 inline mr-1" />
                <Laptop className="w-4 h-4 inline" />
              </div>
              <h3>1. Pourquoi le téléphone et l'ordinateur n'étaient pas liés directement ?</h3>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-slate-100">La raison :</strong> Votre téléphone et votre ordinateur sont deux navigateurs distincts. Auparavant, les fiches étaient stockées uniquement dans la mémoire locale (<code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">localStorage</code>) de l'appareil utilisé. Quand vous saisissiez une opération sur mobile, l'ordinateur ne pouvait pas la "voir" car il n'existait pas de canal de communication permanent entre les deux.
              </p>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 rounded-xl space-y-1.5">
                <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Comment nous l'avons résolu :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-200">
                  <li>
                    Nous avons déployé la base de données <strong>Google Firebase Firestore</strong> en temps réel.
                  </li>
                  <li>
                    Nous avons intégré l'<strong>Authentification Google</strong>.
                  </li>
                  <li>
                    <strong>Action à faire :</strong> Cliquez sur <strong>« Connexion Google »</strong> sur votre téléphone ET sur votre ordinateur avec le même compte (ex: <code className="font-mono">{currentUser?.email || 'votre compte Google'}</code>).
                  </li>
                  <li>
                    <strong>Résultat instantané :</strong> Toute saisie effectuée sur le téléphone (retrait RIA, WU, vente Seddo) s'affiche en direct sur l'ordinateur sans recharger la page, et inversement !
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 : Règle stricte de report du reliquat de la veille */}
          <section className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <h3>2. Règle du Report Automatique du Reliquat à 00h00</h3>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-slate-100">Votre directive stricte :</strong> Dans le report automatique, <strong>c'est seulement et uniquement le reliquat strict de la veille qui doit être reporté ; les soldes de fin de journées ne doivent jamais être reportés</strong>.
              </p>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 rounded-xl space-y-1.5">
                <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Fonctionnement appliqué :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-200">
                  <li>
                    <strong>Seul et uniquement le Reliquat Strict de la veille est reporté :</strong> Le montant net de la veille (<code className="font-mono">Somme Fins Veille − Somme Débuts Veille</code>) est calculé et reporté automatiquement chaque jour à 00h00.
                  </li>
                  <li>
                    <strong>Aucun solde de fin de journée n'est reporté :</strong> Les compartiments du jour démarrent vierges ou avec les montants physiques réellement recomptés par le caissier. Aucun montant de clôture n'est copié dans les débuts de journée.
                  </li>
                  <li>
                    <strong>Visibilité immédiate :</strong> Ce reliquat strict reporté s'affiche dans la carte maîtresse du Dashboard et en tête de la table des compartiments.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 : Multi-utilisateurs & Rôles pour le futur */}
          <section className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Base de données &amp; Gestion des futurs utilisateurs</h4>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Chaque nouvel opérateur ou caissier se connectant avec son compte Google est automatiquement enregistré dans la collection <code className="font-mono">/users</code> avec le rôle <strong>Caissier</strong>. Votre compte administrateur (<code className="font-mono">dialloannoir22@gmail.com</code>) possède les pleins droits <strong>Super Admin</strong>.
              </p>
            </div>
          </section>
        </div>

        {/* Pied de modal avec action */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser ? `Connecté sous : ${currentUser.email}` : 'Non connecté'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!currentUser && (
              <button
                onClick={async () => {
                  await loginWithGoogle();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs w-full sm:w-auto"
              >
                <span>Se connecter avec Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-full sm:w-auto text-center"
            >
              Compris, fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
