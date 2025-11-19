
import React from 'react';
import { TradeStats } from '../types';
import { TrendingUpIcon, TrendingDownIcon } from './Icons';
import { Language, t } from '../services/i18n';

interface Props {
  stats: TradeStats;
  lang: Language;
}

export const StatsOverview: React.FC<Props> = ({ stats, lang }) => {
  const fmt = (n: number) => n.toLocaleString();
  const isPositive = stats.totalPnL >= 0;
  
  const cardClass = "bg-light-800 dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-red-900/20 transition-colors";
  const labelClass = "text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider";
  const valueClass = "text-2xl font-bold mt-1 text-gray-900 dark:text-white";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className={cardClass}>
        <div className={labelClass}>{t('totalPnL', lang)}</div>
        <div className={`text-2xl font-bold mt-1 flex items-center gap-2 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} dir="ltr">
          {isPositive ? <TrendingUpIcon className="w-5 h-5" /> : <TrendingDownIcon className="w-5 h-5" />}
          ${fmt(stats.totalPnL)}
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>{t('winRate', lang)}</div>
        <div className={valueClass} dir="ltr">
          {stats.winRate}%
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>{t('profitFactor', lang)}</div>
        <div className={valueClass} dir="ltr">
          {stats.profitFactor === Infinity ? '∞' : stats.profitFactor}
        </div>
      </div>

       <div className={cardClass}>
        <div className={labelClass}>{t('tradesCount', lang)}</div>
        <div className={valueClass} dir="ltr">
          {stats.trades}
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>{t('avgTrade', lang)}</div>
        <div className={`text-2xl font-bold mt-1 ${stats.avgPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-accent'}`} dir="ltr">
          ${fmt(stats.avgPnL)}
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>{t('maxDrawdown', lang)}</div>
        <div className="text-2xl font-bold mt-1 text-brand-accent" dir="ltr">
          -${fmt(Math.abs(stats.maxDrawdown))}
        </div>
      </div>
    </div>
  );
};
