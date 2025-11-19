
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Trade } from '../types';
import { Language, t } from '../services/i18n';

interface Props {
  trades: Trade[];
  lang: Language;
}

export const PnLChart: React.FC<Props> = ({ trades, lang }) => {
  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += t.pnl;
      return {
        date: t.date,
        pnl: cumulative,
        dailyPnL: t.pnl
      };
    });
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="bg-light-800 dark:bg-dark-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-red-900/20 h-80 mb-6 transition-colors">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 pb-2">{t('equityCurve', lang)}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(str) => str.slice(5)} 
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false}
            orientation={lang === 'ar' ? 'right' : 'left'}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1E1E1E', 
              borderColor: '#333', 
              borderRadius: '8px', 
              color: '#f8fafc',
              textAlign: lang === 'ar' ? 'right' : 'left'
            }}
            itemStyle={{ color: '#f8fafc' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey="pnl" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorPnL)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
