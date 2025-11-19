
export interface EconomicEvent {
  id: string;
  time: string; // UTC HH:mm
  currency: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'XAU'];
const EVENT_TYPES = [
  { name: 'قرار الفائدة الصادر عن الفيدرالي', impact: 'High' },
  { name: 'تقرير التوظيف بالقطاع الخاص (NFP)', impact: 'High' },
  { name: 'مؤشر أسعار المستهلكين (CPI)', impact: 'High' },
  { name: 'مبيعات التجزئة', impact: 'Medium' },
  { name: 'معدل البطالة', impact: 'High' },
  { name: 'خطاب محافظ البنك المركزي', impact: 'High' },
  { name: 'مخزونات النفط الخام', impact: 'Medium' },
  { name: 'مؤشر مديري المشتريات الصناعي', impact: 'Medium' },
  { name: 'الميزان التجاري', impact: 'Low' },
  { name: 'مزاد سندات الخزينة', impact: 'Low' },
];

// Helper to generate random realistic events for a specific date (Assumed UTC)
export const getEconomicEvents = (dateStr: string): EconomicEvent[] => {
  // Use date string to seed randomness somewhat consistently (simple hash)
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = 5 + (seed % 5); // 5 to 9 events per day
  
  const events: EconomicEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    const impactRand = Math.random();
    const impact: 'High' | 'Medium' | 'Low' = impactRand > 0.7 ? 'High' : impactRand > 0.4 ? 'Medium' : 'Low';
    
    const typeIndex = Math.floor(Math.random() * EVENT_TYPES.length);
    const currencyIndex = Math.floor(Math.random() * CURRENCIES.length);
    
    // Random time between 08:00 and 18:00 UTC
    const hour = 8 + Math.floor(Math.random() * 10);
    const minute = Math.random() > 0.5 ? '30' : '00';
    const timeStr = `${hour < 10 ? '0' + hour : hour}:${minute}`;

    events.push({
      id: `${dateStr}-${i}`,
      time: timeStr,
      currency: CURRENCIES[currencyIndex],
      event: EVENT_TYPES[typeIndex].name,
      impact: EVENT_TYPES[typeIndex].impact as 'High' | 'Medium' | 'Low',
      actual: (Math.random() * 100).toFixed(1),
      forecast: (Math.random() * 100).toFixed(1),
    });
  }

  // Sort by time
  return events.sort((a, b) => parseInt(a.time.replace(':', '')) - parseInt(b.time.replace(':', '')));
};

// Convert UTC time string (HH:mm) to Local time string (HH:mm)
export const convertUtcToLocal = (utcTime: string): string => {
  if (!utcTime) return '';
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  
  return `${localHours < 10 ? '0' + localHours : localHours}:${localMinutes < 10 ? '0' + localMinutes : localMinutes}`;
};

// Get current timezone offset formatted (e.g., GMT+3)
export const getLocalTimeZoneLabel = (): string => {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '-';
  return `GMT${sign}${Math.abs(offset)}`;
};

// --- NEW: Simulated Market Context for AI ---
export const getMarketSentiment = (): string => {
  // In a real app, this would fetch from an API. Here we simulate "Live" context.
  const sentiments = [
    "Global Market Sentiment: Risk-OFF due to geopolitical tensions. Safe havens (Gold, USD) are strong.",
    "Global Market Sentiment: Risk-ON. Equity markets are rallying, USD is weakening.",
    "Market Context: High volatility expected ahead of FOMC meeting. Liquidity is thin.",
    "Technical Context: Gold is testing key resistance at 2050. RSI is overbought.",
    "Technical Context: EURUSD broke below 1.0800 support, looking bearish.",
  ];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
};
