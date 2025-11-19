
import React, { useState, useEffect } from 'react';
import { analyzeTradesWithGemini } from '../services/gemini';
import { Trade } from '../types';
import { SparklesIcon, SpeakerWaveIcon, StopCircleIcon } from './Icons';
import { Language, t } from '../services/i18n';

interface Props {
  trades: Trade[];
  lang: Language;
}

export const AIInsight: React.FC<Props> = ({ trades, lang }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeTradesWithGemini(trades, lang);
    setAnalysis(result);
    setLoading(false);
  };

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

  return (
    <div className="bg-light-800 dark:bg-dark-800 p-6 rounded-xl shadow-md border border-brand-accent mb-6 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-gray-100 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-gray-700 text-brand-accent">
             <SparklesIcon className="w-5 h-5" />
           </div>
           <div>
             <h3 className="font-bold text-gray-900 dark:text-white">{t('aiAnalyst', lang)}</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">{t('poweredBy', lang)}</p>
           </div>
        </div>
        
        <div className="flex gap-2">
          {analysis && (
             <button 
              onClick={toggleSpeech}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 shadow-sm border ${isSpeaking ? 'bg-red-100 dark:bg-red-900/50 text-brand-red dark:text-white border-red-200 dark:border-red-500' : 'bg-gray-100 dark:bg-dark-700 text-brand-accent border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-dark-600'}`}
              title={isSpeaking ? t('stopReading', lang) : t('readAnalysis', lang)}
            >
              {isSpeaking ? <StopCircleIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
            </button>
          )}

          {!analysis ? (
            <button 
              onClick={handleAnalyze}
              disabled={loading || trades.length === 0}
              className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-red-900/30"
            >
              {loading ? t('analyzing', lang) : t('analyzeLog', lang)}
              {!loading && <SparklesIcon className="w-4 h-4" />}
            </button>
          ) : null}
        </div>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      )}

      {analysis && (
        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
           {analysis.split('\n').map((line, i) => {
             if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1">{line.replace('###', '')}</h3>;
             if (line.includes('الأخطاء') || line.includes('Weaknesses')) return <p key={i} className="font-bold my-1 text-brand-accent">{line.replace(/\*\*/g, '')}</p>;
             if (line.includes('تشجيع') || line.includes('Strengths')) return <p key={i} className="font-bold my-1 text-emerald-600 dark:text-emerald-400">{line.replace(/\*\*/g, '')}</p>;
             if (line.startsWith('**')) return <p key={i} className="font-bold my-1 text-gray-800 dark:text-gray-200">{line.replace(/\*\*/g, '')}</p>;
             if (line.startsWith('-') || line.startsWith('*')) return <li key={i} className="mr-4 ml-4 text-gray-700 dark:text-gray-300 marker:text-brand-red">{line.substring(1)}</li>;
             return <p key={i} className="my-1 text-gray-600 dark:text-gray-400">{line.replace(/\*\*/g, '')}</p>;
           })}
           
           <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => {
                 window.speechSynthesis.cancel();
                 setIsSpeaking(false);
                 setAnalysis(null);
              }} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">{t('closeAnalysis', lang)}</button>
           </div>
        </div>
      )}
    </div>
  );
};
