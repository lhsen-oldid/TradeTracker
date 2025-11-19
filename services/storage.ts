
import { Trade } from '../types';

const STORAGE_KEY = "pro_trade_journal_v1";
const CAPITAL_KEY = "pro_trade_journal_capital";
const THEME_KEY = "pro_trade_journal_theme";
const LANG_KEY = "pro_trade_journal_lang";

export const getStoredTrades = (): Trade[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse stored trades", e);
  }
  return [];
};

export const saveStoredTrades = (trades: Trade[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error("Failed to save trades", e);
  }
};

export const getInitialCapital = (): number => {
  try {
    const raw = localStorage.getItem(CAPITAL_KEY);
    return raw ? Number(raw) : 1000; // Default $1000
  } catch (e) {
    return 1000;
  }
};

export const saveInitialCapital = (amount: number): void => {
  localStorage.setItem(CAPITAL_KEY, amount.toString());
};

export const getStoredTheme = (): 'light' | 'dark' => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch (e) {}
  return 'dark'; // Default to dark
};

export const saveStoredTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getStoredLanguage = (): 'ar' | 'en' => {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw === 'ar' || raw === 'en') return raw;
  } catch (e) {}
  return 'ar'; // Default
};

export const saveStoredLanguage = (lang: 'ar' | 'en'): void => {
  localStorage.setItem(LANG_KEY, lang);
};
