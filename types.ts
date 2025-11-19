
export enum TradeType {
  LONG = 'Long',
  SHORT = 'Short'
}

export interface Trade {
  id: string;
  date: string;
  time?: string; // HH:mm - Crucial for Economic Calendar correlation
  symbol: string;
  type: TradeType;
  entry: number | null;
  exit: number | null;
  size: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  pnl: number;
  notes: string; // Can be used for general notes
  entryReason?: string; // Specific reason for entry
  emotions?: string; // e.g., Fear, Greed, Calm
  strategy: string;
  screenshot?: string; // Base64 string of the chart image
  aiAnalysis?: string; // Store the AI result to avoid re-fetching
}

export interface TradeFilter {
  symbol: string;
  strategy: string;
  from: string;
  to: string;
}

export interface TradeStats {
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  profitFactor: number;
  maxDrawdown: number;
}
