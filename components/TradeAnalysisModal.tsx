
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { analyzeSingleTrade } from '../services/gemini';
import { getEconomicEvents } from '../services/calendar';
import { RobotIcon, XMarkIcon, SpeakerWaveIcon, StopCircleIcon, ChatBubbleLeftRightIcon } from './Icons';
import { Language, t } from '../services/i18n';

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onSaveAnalysis: (id: string, analysis: string) => void;
  onOpenCoach: (trade: Trade) => void;
  lang: Language;
}

export const TradeAnalysisModal: React.FC<Props> = ({ trade, onClose, onSaveAnalysis, onOpenCoach, lang }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (trade) {
      if (trade.aiAnalysis) {
        setAnalysis(trade.aiAnalysis);
      } else {
        setLoading(true);
        
        const events = getEconomicEvents(trade.date);
        
        analyzeSingleTrade(trade, events, lang).then(result => {
          setAnalysis(result);
          onSaveAnalysis(trade.id, result);
          setLoading(false);
        });
      }
    } else {
      setAnalysis(null);
      setLoading(false);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [trade, lang]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!analysis) return;
      
      const textToSpeak = analysis
        .replace(/[#*_]/g, '')
        .replace(/\n+/g, '. ');
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onClose();
  };

  if (!trade) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-brand-red transition-colors">
        
        {/* Header */}
        <div className="bg-brand-red p-4 flex justify-between items-center text-white shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black/20 rounded-lg">
              <RobotIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('tradeAnalysisTitle', lang)}</h3>
              <p className="text-xs text-red-100">{trade.symbol} • {trade.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {!loading && analysis && (
              <button 
                onClick={toggleSpeech}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                title={isSpeaking ? t('stopReading', lang) : t('readAnalysis', lang)}
              >
                {isSpeaking ? <StopCircleIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
              </button>
            )}
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-dark-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">{t('analyzingTrade', lang)}</p>
            </div>
          ) : analysis ? (
            <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
               {analysis.split('\n').map((line, i) => {
                if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-brand-accent border-b border-gray-200 dark:border-gray-800 pb-1">{line.replace('###', '')}</h3>;
                if (line.includes('Mistakes') || line.includes('الأخطاء')) return <div key={i} className="text-brand-accent font-medium my-1">{line.replace(/\*\*/g, '')}</div>;
                if (line.includes('Encouragement') || line.includes('تشجيع') || line.includes('ممتاز')) return <div key={i} className="text-emerald-600 dark:text-emerald-400 font-medium my-1">{line.replace(/\*\*/g, '')}</div>;
                if (line.startsWith('-') || line.startsWith('*')) return <li key={i} className="text-gray-700 dark:text-gray-300 marker:text-brand-red">{line.substring(1)}</li>;
                return <p key={i} className="text-gray-600 dark:text-gray-300 my-2">{line.replace(/\*\*/g, '')}</p>;
               })}
            </div>
          ) : (
            <div className="text-center text-brand-accent">{t('analysisError', lang)}</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-800 flex justify-between items-center shrink-0">
          <button 
            onClick={() => onOpenCoach(trade)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-bold shadow-sm"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            {t('discussWithCoach', lang)}
          </button>

          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 text-sm font-medium transition-colors"
          >
            {t('close', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
