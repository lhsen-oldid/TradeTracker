
import { Trade } from '../types';

export interface TraderProfile {
  winRate: number;
  totalTrades: number;
  bestPair: string;
  worstPair: string;
  avgWin: number;
  avgLoss: number;
  commonMistake: string;
  recentTrend: 'Winning' | 'Losing' | 'Neutral';
}

export const analyzeTraderProfile = (trades: Trade[]): TraderProfile => {
  if (trades.length === 0) {
    return {
      winRate: 0,
      totalTrades: 0,
      bestPair: 'None',
      worstPair: 'None',
      avgWin: 0,
      avgLoss: 0,
      commonMistake: 'None',
      recentTrend: 'Neutral'
    };
  }

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  
  // Best/Worst Pairs
  const pairStats: Record<string, number> = {};
  trades.forEach(t => {
    if (!pairStats[t.symbol]) pairStats[t.symbol] = 0;
    pairStats[t.symbol] += t.pnl;
  });
  
  const sortedPairs = Object.entries(pairStats).sort((a, b) => b[1] - a[1]);
  const bestPair = sortedPairs.length > 0 ? sortedPairs[0][0] : 'None';
  const worstPair = sortedPairs.length > 0 ? sortedPairs[sortedPairs.length - 1][0] : 'None';

  // Trend (Last 5 trades)
  const last5 = trades.slice(0, 5);
  const recentWins = last5.filter(t => t.pnl > 0).length;
  let recentTrend: 'Winning' | 'Losing' | 'Neutral' = 'Neutral';
  if (recentWins >= 4) recentTrend = 'Winning';
  if (recentWins <= 1 && last5.length >= 3) recentTrend = 'Losing';

  return {
    winRate: Math.round((wins.length / trades.length) * 100),
    totalTrades: trades.length,
    bestPair,
    worstPair,
    avgWin: wins.length ? wins.reduce((a, b) => a + b.pnl, 0) / wins.length : 0,
    avgLoss: losses.length ? Math.abs(losses.reduce((a, b) => a + b.pnl, 0) / losses.length) : 0,
    commonMistake: 'Unknown', // In a real app, we'd analyze 'notes' or 'entryReason' via NLP
    recentTrend
  };
};
