
import { GoogleGenAI } from "@google/genai";
import { Trade, TradeType } from '../types';
import { EconomicEvent, getMarketSentiment } from './calendar';
import { Language } from './i18n';
import { analyzeTraderProfile } from './analysis';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export type CoachMode = 'general' | 'economic' | 'technical';

// 1. Analyze a batch of trades (Log Analysis)
export const analyzeTradesWithGemini = async (trades: Trade[], lang: Language): Promise<string> => {
  if (trades.length === 0) return "";

  const history = trades.map(t => 
    `${t.date}: ${t.symbol} (${t.type}) - PnL: ${t.pnl}, Strategy: ${t.strategy || 'N/A'}`
  ).join('\n');

  const prompt = lang === 'ar' 
    ? `أنت محلل تداول خبير. قم بتحليل سجل التداول التالي:\n${history}\n\nالمطلوب:\n1. تحديد نقاط القوة والضعف.\n2. تحديد الأخطاء المتكررة.\n3. تقديم نصائح عملية للتحسين.\nاجعل الرد منسقاً ومختصراً.`
    : `You are an expert trading analyst. Analyze the following trade log:\n${history}\n\nRequirements:\n1. Identify strengths and weaknesses.\n2. Identify recurring mistakes.\n3. Provide actionable tips for improvement.\nKeep the response structured and concise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return lang === 'ar' ? "حدث خطأ أثناء تحليل السجل." : "Error analyzing trade log.";
  }
};

// 2. Analyze a Single Trade with Economic Context
export const analyzeSingleTrade = async (trade: Trade, economicEvents: EconomicEvent[], lang: Language): Promise<string> => {
  const eventsContext = economicEvents.map(e => 
    `- ${e.time} (UTC): ${e.event} [${e.currency}] - Impact: ${e.impact}`
  ).join('\n');

  const tradeTimeInfo = trade.time ? `Trade Time: ${trade.time}` : "Trade Time: Not specified";

  const prompt = lang === 'ar' 
    ? `أنت مدرب تداول محترف. حلل هذه الصفقة:\n
       الرمز: ${trade.symbol}
       النوع: ${trade.type}
       الدخول: ${trade.entry}
       الخروج: ${trade.exit}
       الربح/الخسارة: ${trade.pnl}
       ${tradeTimeInfo}
       سبب الدخول: ${trade.entryReason || 'غير محدد'}
       
       سياق الأخبار الاقتصادية في ذلك اليوم (توقيت UTC):
       ${eventsContext || 'لا توجد أحداث مهمة.'}
       
       المطلوب:
       1. هل كان الدخول منطقياً؟
       2. هل تعارضت الصفقة مع خبر اقتصادي قوي (High Impact) قريب من وقت الصفقة؟ (انتبه لفارق التوقيت)
       3. تقييم إدارة المخاطر.
       4. نصيحة واحدة للتحسين.
       5. تشجيع قصير إذا كانت رابحة.
       `
    : `You are a professional trading coach. Analyze this trade:\n
       Symbol: ${trade.symbol}
       Type: ${trade.type}
       Entry: ${trade.entry}
       Exit: ${trade.exit}
       PnL: ${trade.pnl}
       ${tradeTimeInfo}
       Entry Reason: ${trade.entryReason || 'Not specified'}
       
       Economic Events Context for that day (UTC):
       ${eventsContext || 'No major events.'}
       
       Requirements:
       1. Was the entry logical?
       2. Did the trade conflict with any High Impact economic news near the trade time?
       3. Risk management assessment.
       4. One actionable tip.
       5. Short encouragement if profitable.
       `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Single Trade Analysis Error:", error);
    return lang === 'ar' ? "تعذر تحليل الصفقة حالياً." : "Could not analyze trade at this time.";
  }
};

// 3. Parse Voice to Trade JSON
export const parseTradeFromVoice = async (transcript: string, lang: Language): Promise<Partial<Trade>> => {
  const prompt = lang === 'ar'
    ? `حلل هذا النص الصوتي لاستخراج بيانات صفقة تداول: "${transcript}"
       قم بتصحيح أخطاء الكلام وتحويل النص إلى JSON فقط.
       الحقول المطلوبة: 
       - symbol: حول الاسم إلى رمز (مثال: "ذهب" أو "جولد" -> XAUUSD, "داو" -> US30, "يورو" -> EURUSD).
       - type: "Long" (شراء) أو "Short" (بيع).
       - entry: سعر الدخول (number).
       - exit: سعر الخروج (number).
       - size: حجم الصفقة (number).
       - pnl: الربح/الخسارة (number). اذا لم يذكر، حاول حسابه بناء على الدخول والخروج.
       - stopLoss: وقف الخسارة (number).
       - takeProfit: هدف الربح (number).
       - strategy: اسم الاستراتيجية.
       - notes: ملاحظات.
       - date: التاريخ بصيغة YYYY-MM-DD اذا ذكر (مثال: "أمس", "تاريخ 5 اكتوبر").
       - time: الوقت بصيغة HH:mm اذا ذكر.
       
       الرد يجب أن يكون كود JSON فقط بدون أي نص إضافي.`
    : `Analyze this voice transcript to extract trading data: "${transcript}"
       Correct speech errors and convert to JSON only.
       Fields: 
       - symbol: Normalize to ticker (e.g., "Gold" -> XAUUSD, "Euro" -> EURUSD).
       - type: "Long" or "Short".
       - entry: Entry price (number).
       - exit: Exit price (number).
       - size: Position size (number).
       - pnl: Profit/Loss (number). Calculate if missing.
       - stopLoss: Stop Loss (number).
       - takeProfit: Take Profit (number).
       - strategy: Strategy name.
       - notes: Notes.
       - date: Date as YYYY-MM-DD if mentioned.
       - time: Time as HH:mm if mentioned.

       Return ONLY JSON code.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "{}";
    // Safer regex to remove code blocks without using backticks in regex literal
    const jsonStr = text.replace(new RegExp('```json', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Voice Parse Error:", error);
    throw new Error("Failed to parse voice input");
  }
};

// 4. Advanced Voice Coach (Conversational)
export const getCoachResponse = async (
  history: { role: string, text: string }[], 
  userText: string, 
  lang: Language,
  trades: Trade[] = [],
  currentTrade: Trade | null = null,
  mode: CoachMode = 'general'
): Promise<string> => {
  
  // 1. Build Trader Memory (Profile)
  const profile = analyzeTraderProfile(trades);
  const profileSummary = lang === 'ar'
    ? `ملف المتداول: نسبة الفوز ${profile.winRate}%، أفضل زوج ${profile.bestPair}، أسوأ زوج ${profile.worstPair}. الاتجاه الأخير: ${profile.recentTrend}.`
    : `Trader Profile: Win Rate ${profile.winRate}%, Best Pair ${profile.bestPair}, Worst Pair ${profile.worstPair}. Recent Trend: ${profile.recentTrend}.`;

  // 2. Get Market Sentiment (Simulated)
  const marketSentiment = getMarketSentiment();

  // 3. Define Persona based on Mode
  let systemInstruction = "";
  
  if (lang === 'ar') {
    const base = `أنت مدرب تداول صوتي يتحدث عبر الهاتف. اسمك "الكوتش".
    - أسلوبك: تحدث بجمل قصيرة جداً، طبيعية، ومباشرة. لا تستخدم قوائم أو تنسيق Markdown (* أو -).
    - السياق: ${profileSummary}
    - حالة السوق: ${marketSentiment}
    - هدفك: إدارة حوار مستمر. دائماً اختم ردك بسؤال قصير لاستمرار الحديث (مثال: "ما رأيك؟" أو "هل دخلت الصفقة؟").
    - إذا ذكر المستخدم كلمات مثل "تحليل الذهب" أو "أخبار الدولار"، استخدم سياق السوق في ردك.
    `;

    if (mode === 'economic') {
      systemInstruction = `${base}
      - تركيزك: الأخبار الاقتصادية فقط. تجاهل التحليل الفني.
      - تحدث عن الفائدة، التضخم، والتقارير المالية.`;
    } else if (mode === 'technical') {
      systemInstruction = `${base}
      - تركيزك: الرسوم البيانية والمؤشرات (RSI, MACD, Support/Resistance).
      - لا تتحدث عن الأخبار.`;
    } else { // general
      systemInstruction = `${base}
      - أنت مدرب شامل. شجع المتداول، واسأله عن نفسيته والتزامه بالخطة.`;
    }
  } else {
    const base = `You are a voice trading coach on a phone call. Name: "Coach".
    - Style: Speak in very short, natural, punchy sentences. DO NOT use lists or Markdown (* or -).
    - Context: ${profileSummary}
    - Market: ${marketSentiment}
    - Goal: Maintain a continuous loop. ALWAYS end with a short follow-up question (e.g., "What do you think?" or "Are you holding?").
    - If user mentions "Gold analysis" or "News", use the Market Context.
    `;

    if (mode === 'economic') {
      systemInstruction = `${base}
      - Focus: Economic news ONLY (Rates, Inflation, NFP). Ignore charts.`;
    } else if (mode === 'technical') {
      systemInstruction = `${base}
      - Focus: Charts & Indicators (RSI, MACD, Trends). Ignore news.`;
    } else {
      systemInstruction = `${base}
      - Focus: General coaching, psychology, and discipline.`;
    }
  }

  // 4. Add Specific Trade Context if available
  let contextPrompt = "";
  if (currentTrade) {
    contextPrompt = lang === 'ar' 
      ? `نحن نناقش صفقة محددة الآن: ${currentTrade.symbol} (${currentTrade.type})، النتيجة: ${currentTrade.pnl}$.`
      : `We are discussing a specific trade: ${currentTrade.symbol} (${currentTrade.type}), PnL: ${currentTrade.pnl}$.`;
  }

  // 5. Construct Chat History
  // We only send the last few messages to keep context but save tokens/latency
  const recentHistory = history.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n');

  const finalPrompt = `${systemInstruction}\n\n${contextPrompt}\n\nConversation:\n${recentHistory}\nUser: ${userText}\nCoach:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    });
    
    // Cleaning response to ensure it's speech-friendly
    let text = response.text || "";
    // Safer regex replacement without backticks
    text = text.replace(new RegExp('[*#_`]', 'g'), ''); // Remove markdown characters
    text = text.replace(/User:|Coach:/g, ''); // Remove labels
    return text.trim();

  } catch (error) {
    console.error("Voice Coach Error:", error);
    return lang === 'ar' ? "آسف، انقطع الخط لحظة. هل يمكنك الإعادة؟" : "Sorry, line broke up. Can you say that again?";
  }
};
