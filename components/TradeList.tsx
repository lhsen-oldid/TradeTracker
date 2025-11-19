
import React from 'react';
import { Trade, TradeType } from '../types';
import { TrashIcon, EditIcon, PhotoIcon, RobotIcon, SpeakerWaveIcon } from './Icons';
import { Language, t } from '../services/i18n';

interface Props {
  trades: Trade[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAnalyze: (trade: Trade) => void;
  lang: Language;
}

export const TradeList: React.FC<Props> = ({ trades, onEdit, onDelete, onAnalyze, lang }) => {
  const openImage = (src: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<body style="background-color:#121212; margin:0; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${src}" style="max-width: 100%; max-height: 100%; border: 1px solid #333;" /></body>`);
    }
  };

  const speakTrade = (trade: Trade) => {
      window.speechSynthesis.cancel();
      const text = lang === 'ar' 
        ? `صفقة ${trade.symbol}، ${trade.type === TradeType.LONG ? 'شراء' : 'بيع'}. النتيجة ${trade.pnl >= 0 ? 'ربح' : 'خسارة'} ${Math.abs(trade.pnl)} دولار.` 
        : `Trade on ${trade.symbol}, ${trade.type}. Result: ${trade.pnl >= 0 ? 'Profit' : 'Loss'} of ${Math.abs(trade.pnl)} dollars.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-12 bg-light-800 dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
        <p className="text-gray-500">{t('noTrades', lang)}</p>
      </div>
    );
  }

  return (
    <div className="bg-light-800 dark:bg-dark-800 rounded-xl shadow-md border border-gray-200 dark:border-red-900/20 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <thead className="bg-gray-100 dark:bg-dark-900 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-start">{t('date', lang)} / {t('time', lang)}</th>
              <th className="px-4 py-3 text-start">{t('symbol', lang)}</th>
              <th className="px-4 py-3 text-start">{t('type', lang)}</th>
              <th className="px-4 py-3 text-start">{t('chartImage', lang)}</th>
              <th className="px-4 py-3 text-start">{t('strategy', lang)}</th>
              <th className="px-4 py-3 text-start" dir="ltr">{t('totalPnL', lang)}</th>
              <th className="px-4 py-3 text-center">{t('actions', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors bg-white dark:bg-dark-800">
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap text-start">
                  <div>{trade.date}</div>
                  {trade.time && <div className="text-xs text-gray-400 font-mono mt-0.5">{trade.time}</div>}
                </td>
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-start">{trade.symbol}</td>
                <td className="px-4 py-3 text-start">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${trade.type === TradeType.LONG ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-900/50 text-brand-accent border border-red-200 dark:border-red-900'}`}>
                    {trade.type === TradeType.LONG ? t('long', lang) : t('short', lang)}
                  </span>
                </td>
                <td className="px-4 py-3 text-start">
                  {trade.screenshot ? (
                    <button 
                      onClick={() => openImage(trade.screenshot!)}
                      className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700"
                      title={t('viewChart', lang)}
                    >
                      <PhotoIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-start">{trade.strategy || '-'}</td>
                <td className={`px-4 py-3 text-start font-bold ${trade.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} dir="ltr">
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => speakTrade(trade)}
                      className="p-1.5 rounded bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="Quick Speak"
                    >
                      <SpeakerWaveIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onAnalyze(trade)}
                      className="p-1.5 rounded bg-purple-50 dark:bg-dark-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                      title={t('aiAction', lang)}
                    >
                      <RobotIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEdit(trade.id)}
                      className="p-1.5 rounded bg-blue-50 dark:bg-dark-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                      title={t('edit', lang)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(trade.id)}
                      className="p-1.5 rounded bg-red-50 dark:bg-red-900/20 text-brand-accent hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-transparent hover:border-red-200 dark:hover:border-brand-accent"
                      title={t('delete', lang)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
