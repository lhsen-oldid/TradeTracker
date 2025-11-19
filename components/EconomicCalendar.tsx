
import React, { useEffect, useRef, memo } from 'react';
import { XMarkIcon, GlobeIcon } from './Icons';
import { Language, t } from '../services/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  lang: Language;
}

export const EconomicCalendar: React.FC<Props> = memo(({ isOpen, onClose, theme, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadWidget = () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; 
        
        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
          "colorTheme": theme,
          "isTransparent": true,
          "width": "100%",
          "height": "100%",
          "locale": lang === 'ar' ? "ar_AE" : "en",
          "importanceFilter": "0,1", 
          "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,XAU",
        });
        
        containerRef.current.appendChild(script);
      }
    };

    if (isOpen) {
       const timer = setTimeout(() => {
         loadWidget();
       }, 100);
       return () => clearTimeout(timer);
    }
  }, [isOpen, theme, lang]);

  return (
    <div className={`fixed inset-y-0 z-40 w-full md:w-[500px] bg-white dark:bg-[#121212] border-r border-l border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full right-0' : '-translate-x-full left-0')} ${lang === 'ar' ? 'right-0' : 'left-0'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1E1E1E] shrink-0">
        <div className="flex items-center gap-2">
          <GlobeIcon className="w-5 h-5 text-brand-red" />
          <h2 className="font-bold text-gray-900 dark:text-white">{t('economicCalendar', lang)}</h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Widget Container */}
      <div className={`flex-1 relative overflow-hidden ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}>
         <div ref={containerRef} className="tradingview-widget-container h-full w-full">
            <div className="tradingview-widget-container__widget h-full w-full"></div>
         </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 text-center shrink-0">
        <p className="mb-1">{t('disclaimerTitle', lang)}</p>
        <p>{t('disclaimerText', lang)}</p>
        <p className="mt-1 text-[9px] opacity-70">{t('disclaimerNote', lang)}</p>
      </div>
    </div>
  );
});
