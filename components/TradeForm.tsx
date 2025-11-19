
import React, { useState, useEffect, useRef } from 'react';
import { Trade, TradeType } from '../types';
import { PhotoIcon, TrashIcon } from './Icons';
import { Language, t } from '../services/i18n';
import { ToastType } from './Toast';

interface Props {
  initialData?: Trade | null;
  onSave: (trade: Partial<Trade>) => void;
  onCancel: () => void;
  lang: Language;
  notify: (msg: string, type: ToastType) => void;
}

const emptyForm: Partial<Trade> = {
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  symbol: "",
  type: TradeType.LONG,
  entry: null,
  exit: null,
  size: null,
  stopLoss: null,
  takeProfit: null,
  pnl: 0,
  notes: "",
  entryReason: "",
  emotions: "",
  strategy: "",
  screenshot: undefined
};

export const TradeForm: React.FC<Props> = ({ initialData, onSave, onCancel, lang, notify }) => {
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        ...emptyForm,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5)
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, screenshot: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      entry: form.entry ? Number(form.entry) : null,
      exit: form.exit ? Number(form.exit) : null,
      size: form.size ? Number(form.size) : null,
      stopLoss: form.stopLoss ? Number(form.stopLoss) : null,
      takeProfit: form.takeProfit ? Number(form.takeProfit) : null,
      pnl: Number(form.pnl) || 0,
    };
    onSave(payload);
  };

  const inputClasses = "w-full p-2.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors";

  return (
    <div className="bg-light-800 dark:bg-dark-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-red-900/30 mb-6 relative overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{initialData ? t('editTrade', lang) : t('newTrade', lang)}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basics */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('date', lang)}</label>
            <input 
              name="date" 
              type="date" 
              required
              value={form.date} 
              onChange={handleChange} 
              className={inputClasses} 
            />
          </div>
           <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('time', lang)}</label>
            <input 
              name="time" 
              type="time" 
              value={form.time} 
              onChange={handleChange} 
              className={inputClasses} 
            />
          </div>
          <div className="col-span-5">
            <label className="block text-xs font-medium text-brand-accent mb-1">{t('symbol', lang)}</label>
            <input 
              name="symbol" 
              placeholder="XAUUSD" 
              required
              value={form.symbol} 
              onChange={handleChange} 
              className={`${inputClasses} uppercase font-bold tracking-wide`} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('type', lang)}</label>
             <select 
                name="type" 
                value={form.type} 
                onChange={handleChange} 
                className={inputClasses}
             >
              <option value={TradeType.LONG}>{t('long', lang)}</option>
              <option value={TradeType.SHORT}>{t('short', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('strategy', lang)}</label>
             <input 
              name="strategy" 
              placeholder="Breakout..." 
              value={form.strategy || ''} 
              onChange={handleChange} 
              className={inputClasses} 
            />
          </div>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-dark-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
           <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('entry', lang)}</label>
             <input 
              name="entry" 
              type="number"
              step="any"
              placeholder="0.00" 
              value={form.entry || ''} 
              onChange={handleChange} 
              className={`${inputClasses} bg-white dark:bg-dark-800`} 
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('stopLoss', lang)}</label>
             <input 
              name="stopLoss" 
              type="number"
              step="any"
              placeholder="S.L" 
              value={form.stopLoss || ''} 
              onChange={handleChange} 
              className={`${inputClasses} bg-white dark:bg-dark-800 text-brand-accent placeholder-red-900/50`} 
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('takeProfit', lang)}</label>
             <input 
              name="takeProfit" 
              type="number"
              step="any"
              placeholder="T.P" 
              value={form.takeProfit || ''} 
              onChange={handleChange} 
              className={`${inputClasses} bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 placeholder-emerald-900/50`} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('exit', lang)}</label>
             <input 
              name="exit" 
              type="number"
              step="any"
              placeholder="0.00" 
              value={form.exit || ''} 
              onChange={handleChange} 
              className={inputClasses} 
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('riskSize', lang)}</label>
             <input 
              name="size" 
              type="number"
              step="any"
              placeholder="Lots / %" 
              value={form.size || ''} 
              onChange={handleChange} 
              className={inputClasses} 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('netPnL', lang)}</label>
          <input 
            name="pnl" 
            type="number"
            step="any"
            required
            placeholder="0.00" 
            value={form.pnl} 
            onChange={handleChange} 
            className={`w-full p-2.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-brand-accent focus:outline-none text-sm font-bold ${Number(form.pnl) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} 
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('entryReason', lang)}</label>
          <textarea 
            name="entryReason" 
            rows={2}
            placeholder={t('whyEntered', lang)}
            value={form.entryReason || ''} 
            onChange={handleChange} 
            className={inputClasses} 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('chartImage', lang)}</label>
          {!form.screenshot ? (
            <div className="relative border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-center">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center text-gray-400">
                 <PhotoIcon className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                 <span className="text-xs text-gray-500 dark:text-gray-400">{t('uploadChart', lang)}</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img src={form.screenshot} alt="Chart preview" className="w-full h-48 object-cover opacity-90 hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   type="button"
                   onClick={handleRemoveImage}
                   className="p-2 bg-brand-red text-white rounded-full hover:bg-red-700 shadow-lg"
                   title={t('removeImage', lang)}
                 >
                   <TrashIcon className="w-6 h-6" />
                 </button>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg transition-all text-sm shadow-md shadow-red-900/20"
        >
          {initialData ? t('updateTrade', lang) : t('saveTrade', lang)}
        </button>
      </form>
    </div>
  );
};
