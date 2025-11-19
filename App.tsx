
import React, { useEffect, useState, useMemo } from 'react';
import { Trade, TradeStats, TradeFilter } from './types';
import { getStoredTrades, saveStoredTrades, getInitialCapital, saveInitialCapital, getStoredTheme, saveStoredTheme, getStoredLanguage, saveStoredLanguage } from './services/storage';
import { StatsOverview } from './components/StatsOverview';
import { PnLChart } from './components/PnLChart';
import { TradeForm } from './components/TradeForm';
import { TradeList } from './components/TradeList';
import { AIInsight } from './components/AIInsight';
import { TradeAnalysisModal } from './components/TradeAnalysisModal';
import { VoiceCoachModal } from './components/VoiceCoachModal';
import { EconomicCalendar } from './components/EconomicCalendar';
import { Toast, ToastType } from './components/Toast';
import { DownloadIcon, UploadIcon, TrashIcon, ChatBubbleLeftRightIcon, EditIcon, SunIcon, MoonIcon, CalendarDaysIcon } from './components/Icons';
import { Language, t } from './services/i18n';

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialCapital, setInitialCapital] = useState(1000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyzingTrade, setAnalyzingTrade] = useState<Trade | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachContextTrade, setCoachContextTrade] = useState<Trade | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [filter, setFilter] = useState<TradeFilter>({ symbol: "", strategy: "", from: "", to: "" });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lang, setLang] = useState<Language>('ar');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const notify = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Initial Load
  useEffect(() => {
    setTrades(getStoredTrades());
    setInitialCapital(getInitialCapital());
    setTheme(getStoredTheme());
    setLang(getStoredLanguage());
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Language Effect
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    saveStoredLanguage(lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  // Persistence
  useEffect(() => {
    saveStoredTrades(trades);
  }, [trades]);

  // Update Capital Logic
  const handleUpdateCapital = () => {
    setTempCapital(initialCapital.toString());
    setIsCapitalModalOpen(true);
  };

  const handleSaveCapital = () => {
    const val = Number(tempCapital);
    if (!isNaN(val) && val >= 0) {
      setInitialCapital(val);
      saveInitialCapital(val);
      setIsCapitalModalOpen(false);
      notify(t('capitalUpdated', lang), 'success');
    }
  };

  // CRUD Actions
  const handleSaveTrade = (data: Partial<Trade>) => {
    let savedTrade: Trade;
    if (editingId) {
      setTrades(prev => prev.map(t => {
        if (t.id === editingId) {
           savedTrade = { ...t, ...data } as Trade;
           return savedTrade;
        }
        return t;
      }));
      setEditingId(null);
      notify(lang === 'ar' ? 'تم تحديث الصفقة بنجاح' : 'Trade updated successfully', 'success');
    } else {
      const newTrade: Trade = {
        ...data as Trade,
        id: Date.now().toString(),
      };
      savedTrade = newTrade;
      setTrades(prev => [newTrade, ...prev]);
      notify(lang === 'ar' ? 'تم إضافة الصفقة بنجاح' : 'Trade added successfully', 'success');
      
      setTimeout(() => {
        setAnalyzingTrade(newTrade);
      }, 500);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDelete', lang))) {
      setTrades(prev => prev.filter(t => t.id !== id));
      notify(lang === 'ar' ? 'تم حذف الصفقة' : 'Trade deleted', 'info');
    }
  };

  const handleClearAll = () => {
    if (confirm(t('confirmClear', lang))) {
      setTrades([]);
      notify(lang === 'ar' ? 'تم مسح جميع البيانات' : 'All data cleared', 'info');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAnalyze = (trade: Trade) => {
    setAnalyzingTrade(trade);
  };

  const handleOpenCoach = (trade?: Trade) => {
    setCoachContextTrade(trade || null);
    setIsCoachOpen(true);
  };

  const handleSaveAnalysis = (id: string, analysis: string) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, aiAnalysis: analysis } : t));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const newTrades: Trade[] = [];
      
      for(let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if(parts.length < headers.length) continue;
        
        const trade: any = { id: Date.now().toString() + i };
        headers.forEach((h, idx) => {
          let val = parts[idx]?.replace(/"/g, '');
          if(['pnl', 'entry', 'exit', 'size', 'stopLoss', 'takeProfit'].includes(h)) {
            trade[h] = Number(val) || null;
          } else {
            trade[h] = val;
          }
        });
        if(trade.date && trade.symbol) {
            newTrades.push(trade as Trade);
        }
      }
      setTrades(prev => [...newTrades.reverse(), ...prev]);
      notify(t('importedMsg', lang).replace('{count}', newTrades.length.toString()), 'success');
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const headers = ["id", "date", "symbol", "type", "entry", "exit", "size", "pnl", "strategy", "notes", "entryReason", "emotions"];
    const rows = [headers.join(",")];
    trades.forEach(t => {
      const row = headers.map(h => {
        const val = t[h as keyof Trade];
        if(typeof val === 'string' && (val.includes(',') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? "";
      });
      rows.push(row.join(","));
    });
    
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(lang === 'ar' ? 'تم تصدير الملف' : 'File exported', 'success');
  };

  // Computed Stats
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
       if (filter.symbol && !t.symbol.toLowerCase().includes(filter.symbol.toLowerCase())) return false;
       if (filter.strategy && !t.strategy.toLowerCase().includes(filter.strategy.toLowerCase())) return false;
       if (filter.from && t.date < filter.from) return false;
       if (filter.to && t.date > filter.to) return false;
       return true;
    });
  }, [trades, filter]);

  const stats = useMemo((): TradeStats => {
    const s = {
      trades: filteredTrades.length,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPnL: 0,
      avgPnL: 0,
      profitFactor: 0,
      maxDrawdown: 0
    };
    
    if (s.trades === 0) return s;

    let grossProfit = 0;
    let grossLoss = 0;
    
    const timeline = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let peak = -Infinity;
    let maxDD = 0;
    let runningPnL = 0;

    filteredTrades.forEach(t => {
      s.totalPnL += t.pnl;
      if (t.pnl > 0) {
        s.wins++;
        grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        s.losses++;
        grossLoss += Math.abs(t.pnl);
      }
    });

    timeline.forEach(t => {
      runningPnL += t.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const dd = peak - runningPnL;
      if (dd > maxDD) maxDD = dd;
    });

    s.winRate = +( (s.wins / s.trades) * 100 ).toFixed(1);
    s.avgPnL = +( s.totalPnL / s.trades ).toFixed(2);
    s.profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : +(grossProfit / grossLoss).toFixed(2);
    s.maxDrawdown = -maxDD;

    return s;
  }, [filteredTrades]);

  const editingTrade = useMemo(() => trades.find(t => t.id === editingId), [trades, editingId]);
  const currentCapital = initialCapital + stats.totalPnL;

  const inputFilterClasses = "flex-1 min-w-[120px] px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors";

  return (
    <div className="min-h-screen bg-light-900 dark:bg-dark-900 pb-20 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Sidebar Calendar */}
      <EconomicCalendar isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} theme={theme} lang={lang} />

      {/* Navbar */}
      <header className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 shadow-sm dark:shadow-lg transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Trade<span className="text-brand-red">Tracker</span></h1>
              <span className="text-[11px] text-gray-500 font-medium leading-none">{t('appSubtitle', lang)}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-gray-50 dark:bg-dark-800 px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 mx-4 shadow-sm">
             <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{t('currentCapital', lang)}:</span>
             <span className={`font-bold text-lg ${currentCapital >= initialCapital ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} dir="ltr">
               ${currentCapital.toLocaleString()}
             </span>
             <button onClick={handleUpdateCapital} className="mr-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white" title={t('updateCapital', lang)}>
               <EditIcon className="w-3 h-3" />
             </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button 
               onClick={() => setIsCalendarOpen(!isCalendarOpen)}
               className="p-2 rounded-full bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 transition-all"
               title={t('economicCalendar', lang)}
             >
               <CalendarDaysIcon className="w-5 h-5" />
             </button>

             <button 
               onClick={toggleLang}
               className="p-2 rounded-full bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 transition-all font-bold text-xs w-9 h-9 flex items-center justify-center"
               title="Switch Language"
             >
               {t('changeLang', lang)}
             </button>

             <button 
               onClick={toggleTheme}
               className="p-2 rounded-full bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-dark-700 transition-all"
               title="Toggle Theme"
             >
               {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
             </button>

             <button 
               onClick={() => handleOpenCoach()} 
               className="flex items-center gap-2 px-3 py-2 bg-brand-red hover:bg-red-700 text-white rounded-full text-sm font-bold shadow-md shadow-red-900/30 transition-all"
             >
               <ChatBubbleLeftRightIcon className="w-5 h-5" />
               <span className="hidden sm:inline">{t('voiceCoach', lang)}</span>
             </button>
             <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block"></div>
             <button onClick={handleClearAll} className="p-2 text-brand-accent hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={t('clearAll', lang)}>
               <TrashIcon className="w-5 h-5" />
             </button>
             <div className="hidden sm:flex gap-1">
                <button onClick={handleExport} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white rounded-lg" title={t('exportCSV', lang)}>
                <DownloadIcon className="w-5 h-5" />
                </button>
                <label className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white rounded-lg cursor-pointer" title={t('importCSV', lang)}>
                <UploadIcon className="w-5 h-5" />
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                </label>
             </div>
          </div>
        </div>
        {/* Mobile Capital Display */}
        <div className="md:hidden bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-between items-center text-sm">
             <span className="text-gray-500 dark:text-gray-400">{t('currentCapital', lang)}:</span>
             <div className="flex items-center">
                <span className={`font-bold ${currentCapital >= initialCapital ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} dir="ltr">
                ${currentCapital.toLocaleString()}
                </span>
                <button onClick={handleUpdateCapital} className="mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    <EditIcon className="w-3 h-3" />
                </button>
             </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <StatsOverview stats={stats} lang={lang} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form & AI */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24 space-y-6">
               <TradeForm 
                 initialData={editingTrade} 
                 onSave={handleSaveTrade} 
                 onCancel={handleCancelEdit}
                 lang={lang}
                 notify={notify}
               />
               <AIInsight trades={filteredTrades} lang={lang} />
            </div>
          </div>

          {/* Right Column: List & Chart */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <PnLChart trades={filteredTrades} lang={lang} />
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md transition-colors">
              <div className="flex flex-wrap gap-4 mb-4">
                 <input 
                   placeholder={t('searchSymbol', lang)}
                   value={filter.symbol}
                   onChange={e => setFilter(f => ({...f, symbol: e.target.value}))}
                   className={inputFilterClasses}
                 />
                 <input 
                   placeholder={t('searchStrategy', lang)}
                   value={filter.strategy}
                   onChange={e => setFilter(f => ({...f, strategy: e.target.value}))}
                   className={inputFilterClasses}
                 />
                 <input 
                   type="date"
                   value={filter.from}
                   onChange={e => setFilter(f => ({...f, from: e.target.value}))}
                   className={inputFilterClasses}
                 />
              </div>
              <TradeList 
                trades={filteredTrades} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onAnalyze={handleAnalyze}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Analysis Modal */}
      {analyzingTrade && (
        <TradeAnalysisModal 
          trade={analyzingTrade} 
          onClose={() => setAnalyzingTrade(null)}
          onSaveAnalysis={handleSaveAnalysis}
          onOpenCoach={(t) => {
            setAnalyzingTrade(null);
            handleOpenCoach(t);
          }}
          lang={lang}
        />
      )}

      {/* Voice Coach Modal */}
      {isCoachOpen && (
        <VoiceCoachModal 
          onClose={() => setIsCoachOpen(false)} 
          lang={lang}
          trades={filteredTrades}
          contextTrade={coachContextTrade}
          notify={notify}
        />
      )}

      {/* Capital Edit Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('updateCapital', lang)}</h3>
            <input 
              type="number" 
              value={tempCapital}
              onChange={(e) => setTempCapital(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 text-lg font-bold text-center focus:ring-2 focus:ring-brand-red outline-none text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCapitalModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                {t('cancel', lang)}
              </button>
              <button 
                onClick={handleSaveCapital}
                className="flex-1 py-2.5 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
