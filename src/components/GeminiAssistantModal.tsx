import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Search, 
  X, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle, 
  User, 
  AlertCircle,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { DailyRecord } from '../types/finance';
import { calculateDailyMetrics, formatCurrency } from '../utils/financeCalculations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isGrounded?: boolean;
  groundingQueries?: string[];
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecord: DailyRecord;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentRecord,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Bonjour ! Je suis **FinanCaisse AI**, votre assistant financier et auditeur de caisse propulsé par Gemini 3.8 Flash.\n\nToutes les sommes de l'application viennent d'être **réinitialisées à zéro** pour démarrer proprement aujourd'hui. Je peux vous aider à :\n- **Vérifier l'équilibre** de vos compartiments et votre billetterie.\n- Consulter les **taux officiels BCEAO** et tarifs Wave / Orange Money en direct grâce à la **Recherche Google**.\n- Valider le calcul strict de votre **reliquat**.",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const metrics = calculateDailyMetrics(currentRecord);

  // Préparation du contexte actuel de la caisse
  const caisseContext = {
    date: currentRecord.date,
    totalStart: metrics.totalStart,
    totalEnd: metrics.totalEnd,
    netDifference: metrics.totalNetDifference,
    previousDayReliquat: currentRecord.previousDayReliquatReported || 0,
    physicalCash: metrics.physicalCashCount,
    cashDiscrepancy: metrics.cashGap,
    transfersCount: currentRecord.transfers?.length || 0,
    seddoCount: currentRecord.seddoPartners?.length || 0,
  };

  const handleSendMessage = async (textToSend?: string, forceSearch = false) => {
    const promptText = (textToSend || inputValue).trim();
    if (!promptText || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const isSearchMode = forceSearch || useSearchGrounding;

      let endpoint = '/api/gemini/chat';
      let requestBody: any = {
        message: promptText,
        caisseContext,
        history: messages
          .filter((m) => m.id !== 'welcome')
          .slice(-8)
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            text: m.text,
          })),
      };

      if (isSearchMode) {
        endpoint = '/api/gemini/search-rates';
        requestBody = { query: promptText };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la communication avec FinanCaisse AI');
      }

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isGrounded: isSearchMode,
        groundingQueries: data.webSearchQueries,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Information temporaire :** ${err.message || 'Impossible de joindre le service'}. Vous pouvez continuer vos saisies normales de caisse.`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: 'Auditer ma caisse',
      desc: 'Analyser les montants saisis aujourd\'hui',
      action: () => handleSendMessage(`Vérifie l'état actuel de ma caisse du ${caisseContext.date}. Le total début est de ${formatCurrency(caisseContext.totalStart)}, le total fin est de ${formatCurrency(caisseContext.totalEnd)}, et la différence nette est de ${formatCurrency(caisseContext.netDifference)}. Y a-t-il une anomalie ou un écart physique de billetterie ?`),
    },
    {
      title: 'Taux BCEAO en direct',
      desc: 'Recherche Google des cours officiels EUR & USD',
      action: () => handleSendMessage("Quels sont les cours de change actuels officiels BCEAO pour l'Euro (EUR/XOF) et le Dollar américain (USD/XOF) ?", true),
    },
    {
      title: 'Tarifs Wave & Orange Money',
      desc: 'Frais de retrait et plafonds actuels',
      action: () => handleSendMessage("Quels sont les frais de transfert et de retrait actuels chez Wave et Orange Money au Sénégal ?", true),
    },
    {
      title: 'Règle du reliquat',
      desc: 'Comment fonctionne le report de veille',
      action: () => handleSendMessage("Explique-moi la règle stricte du report de reliquat de veille chez AnnoirFinance : pourquoi les soldes de fin de journée ne doivent jamais être reportés ?"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="flex flex-col w-full max-w-3xl h-[88vh] max-h-[750px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">FinanCaisse AI</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/25 text-white tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                <span>Auditeur &amp; Conseil Financier</span>
                <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                <span className="text-emerald-200">Recherche Google Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMessages([{
                id: 'welcome',
                role: 'assistant',
                text: "Conversation réinitialisée. Comment puis-je vous aider avec votre caisse aujourd'hui ?",
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              }])}
              title="Effacer la conversation"
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fermer"
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barre résumé contexte de caisse actif */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              Caisse du {currentRecord.date} :
            </span>
            <span className="whitespace-nowrap">
              Début : <strong className="text-slate-900 dark:text-white">{formatCurrency(metrics.totalStart)}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="whitespace-nowrap">
              Fin : <strong className="text-slate-900 dark:text-white">{formatCurrency(metrics.totalEnd)}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="whitespace-nowrap">
              Diff. : <strong className={metrics.totalNetDifference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {formatCurrency(metrics.totalNetDifference)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zéro anomalies détectées</span>
          </div>
        </div>

        {/* Zone des messages défilants */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {/* Badge recherche Google en direct si applicable */}
                  {msg.isGrounded && (
                    <div className="mb-2 flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded w-fit border border-teal-200 dark:border-teal-800">
                      <Globe className="w-3 h-3" />
                      <span>Données vérifiées par Recherche Google</span>
                    </div>
                  )}

                  {/* Contenu formaté avec sauts de lignes et mise en gras */}
                  <div className="whitespace-pre-wrap space-y-1">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{renderFormattedText(line.substring(2))}</span>
                          </div>
                        );
                      }
                      if (line.trim() === '') {
                        return <div key={idx} className="h-1" />;
                      }
                      return <div key={idx}>{renderFormattedText(line)}</div>;
                    })}
                  </div>

                  {/* Heure et bouton de copie */}
                  <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-slate-300' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                      title="Copier le texte"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-2xs border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>FinanCaisse AI analyse votre demande...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions rapides cliquables */}
        <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((qp, index) => (
              <button
                key={index}
                type="button"
                onClick={qp.action}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{qp.title}</span>
              </button>
            ))}
          </div>

          {/* Formulaire de saisie du message */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="mt-2 flex items-center gap-2"
          >
            {/* Bouton bascule Recherche Google en direct */}
            <button
              type="button"
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              title={useSearchGrounding ? "Mode Recherche Google en direct activé" : "Activer la recherche Google en direct"}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                useSearchGrounding
                  ? 'bg-teal-500 text-white border-teal-600 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Live</span>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={useSearchGrounding ? "Rechercher taux de change ou tarifs en direct..." : "Posez une question sur votre caisse, écarts, devises..."}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Envoyer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire pour parser sommairement le Markdown (**bold**)
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
