
import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, StopCircleIcon, XMarkIcon, RobotIcon, SparklesIcon, SpeakerWaveIcon, ChatBubbleLeftRightIcon, ChartBarIcon, NewspaperIcon, UserIcon } from './Icons';
import { getCoachResponse, CoachMode } from '../services/gemini';
import { Language, t } from '../services/i18n';
import { Trade } from '../types';
import { playStartListeningSound, playStopListeningSound, playSuccessSound, playCautionSound } from '../services/audio';
import { ToastType } from './Toast';

interface Props {
  onClose: () => void;
  lang: Language;
  trades?: Trade[];
  contextTrade?: Trade | null;
  notify: (msg: string, type: ToastType) => void;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export const VoiceCoachModal: React.FC<Props> = ({ onClose, lang, trades = [], contextTrade = null, notify }) => {
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto'); // 'auto' = Continuous, 'manual' = Push-to-Talk
  const [coachMode, setCoachMode] = useState<CoachMode>('general');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  
  // UI States
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Load Voices & Select Best
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initial Greeting
  useEffect(() => {
    let initialMsg = t('voiceCoachWelcome', lang);
    
    if (contextTrade) {
      if (lang === 'ar') {
        initialMsg = `أهلاً! لنتحدث عن صفقة ${contextTrade.symbol}.`;
      } else {
        initialMsg = `Hello! Let's discuss your ${contextTrade.symbol} trade.`;
      }
    }

    setMessages([{ role: 'ai', text: initialMsg }]);
    
    // Direct Speak: Start immediately in auto mode
    if (mode === 'auto') {
        setIsSessionActive(true);
        // Short delay to ensure modal transition finishes
        setTimeout(() => speak(initialMsg, true), 800); 
    } else {
        setTimeout(() => speak(initialMsg, false), 800);
    }

    return () => {
        setIsSessionActive(false);
        window.speechSynthesis.cancel();
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e){}
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const startSession = () => {
    setIsSessionActive(true);
    startListening();
  };

  const stopSession = () => {
    setIsSessionActive(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    window.speechSynthesis.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    playStopListeningSound();
  };

  const toggleMode = () => {
      setMode(prev => prev === 'auto' ? 'manual' : 'auto');
      if (mode === 'auto' && isListening) {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
      }
  };

  const toggleCoachMode = (newMode: CoachMode) => {
      setCoachMode(newMode);
  };
  
  const toggleGender = () => {
      setVoiceGender(prev => prev === 'male' ? 'female' : 'male');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      notify(t('browserNoSpeech', lang), 'error');
      setIsSessionActive(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    if (!isListening) {
       playStartListeningSound();
    }
    
    setCurrentSubtitle(t('listening', lang));

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false; 
    // ENABLE REAL-TIME FEEDBACK
    recognition.interimResults = true; 

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Real-time feedback to user
      if (interimTranscript) {
        setCurrentSubtitle(interimTranscript);
      }

      if (finalTranscript) {
        setIsListening(false);
        if (recognitionRef.current) recognitionRef.current.stop();
        await handleUserMessage(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.log("Speech Error:", event.error);

      // Handle permission denied explicitly
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
         setIsSessionActive(false);
         setIsListening(false);
         notify(t('microphonePermissionError', lang), 'error');
         return;
      }

      if (event.error === 'network') {
         setIsListening(false);
         setCurrentSubtitle(t('voiceNetworkError', lang));
         notify(t('voiceNetworkError', lang), 'error');
         playCautionSound();
         setIsSessionActive(false);
         return;
      }
      
      // Handle No Speech / Silence (Common in continuous loops)
      if (event.error === 'no-speech') {
         if (mode === 'auto' && isSessionActive) {
             // Mimic Python `while True`: Just listen again silently
             console.log("No speech detected, restarting listener...");
             if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
             
             // Small delay to prevent CPU spinning
             silenceTimerRef.current = setTimeout(() => {
                 if (isSessionActive) startListening();
             }, 100);
         } else {
             // Manual Mode - Explicit Error Feedback
             setIsListening(false);
             playCautionSound();
             setCurrentSubtitle(t('noSpeechError', lang));
             notify(t('noSpeechError', lang), 'error');
         }
         return;
      } 
      
      setIsListening(false);
    };

    recognition.onend = () => {
        // Logic handled by onresult (success) or onerror (failure/retry)
        if (isListening) setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
        recognition.start();
    } catch(e) {
        console.error("Start error", e);
        // If start fails immediately, try again shortly
        if (isSessionActive && mode === 'auto') {
            setTimeout(startListening, 1000);
        }
    }
  };

  const manualStopListening = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
          playStopListeningSound();
      }
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // VOICE COMMANDS: Stop / Exit
    const lowerText = text.toLowerCase().trim();
    const stopKeywords = ['stop', 'exit', 'close', 'bye', 'خروج', 'انهاء', 'توقف', 'مع السلامة'];
    if (stopKeywords.some(kw => lowerText.includes(kw))) {
        speak(lang === 'ar' ? 'حسناً، مع السلامة.' : 'Okay, goodbye.', false);
        stopSession();
        setTimeout(onClose, 2500);
        return;
    }

    const newHistory: Message[] = [...messages, { role: 'user', text }];
    setMessages(newHistory);
    
    setIsProcessing(true);
    setCurrentSubtitle(lang === 'ar' ? '...' : 'Thinking...');

    const responseText = await getCoachResponse(newHistory, text, lang, trades, contextTrade, coachMode);
    
    setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    setIsProcessing(false);
    
    speak(responseText, mode === 'auto');
  };

  const speak = (text: string, autoListenAfter: boolean) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(new RegExp('[*#_`]', 'g'), ''); // Safer regex
    setCurrentSubtitle(cleanText); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = lang === 'ar' ? 'ar-SA' : 'en-US';
    const baseLang = langCode.split('-')[0];

    utterance.lang = langCode;
    // Optimization: Speak slightly faster for "Direct" feel
    utterance.rate = lang === 'ar' ? 1.1 : 1.15; 
    
    let pitchBase = voiceGender === 'male' ? 0.9 : 1.1;

    // === IMPROVED VOICE SELECTION ===
    if (availableVoices.length > 0) {
        let genderKeywords = voiceGender === 'male' ? ['Male', 'David', 'Google US English', 'Maged'] : ['Female', 'Zira', 'Google', 'Laila'];

        // Prioritize Google voices as they are often cleaner/more direct
        let preferredVoice = availableVoices.find(v => 
            (v.lang === langCode || v.lang.startsWith(baseLang)) && 
            genderKeywords.some(kw => v.name.includes(kw)) &&
            (v.name.includes('Google') || v.name.includes('Natural'))
        );

        if (!preferredVoice) {
           preferredVoice = availableVoices.find(v => 
             (v.lang === langCode || v.lang.startsWith(baseLang)) && 
             genderKeywords.some(kw => v.name.includes(kw))
           );
        }
        
        if (!preferredVoice) {
           preferredVoice = availableVoices.find(v => v.lang.startsWith(baseLang));
        }

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
    }
    
    if (contextTrade) {
        if (contextTrade.pnl > 0) {
            utterance.pitch = pitchBase + 0.1; 
            if(!isSpeaking) playSuccessSound();
        } else if (contextTrade.pnl < 0) {
            utterance.pitch = pitchBase - 0.1; 
        } else {
            utterance.pitch = pitchBase;
        }
    } else {
        utterance.pitch = pitchBase;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        // THE LOOP: Mimic "while True"
        if (isSessionActive && autoListenAfter) {
            setTimeout(() => {
                startListening();
            }, 100);
        }
    };
    
    utterance.onerror = () => {
        setIsSpeaking(false);
        if (isSessionActive && autoListenAfter) startListening();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Helper for center icon to keep JSX clean
  const renderCenterIcon = () => {
      if (isListening) return <MicrophoneIcon className="w-16 h-16 text-white animate-pulse" />;
      if (isSpeaking) {
          if (coachMode === 'economic') return <NewspaperIcon className="w-16 h-16 text-white"/>;
          if (coachMode === 'technical') return <ChartBarIcon className="w-16 h-16 text-white"/>;
          return <SpeakerWaveIcon className="w-16 h-16 text-white" />;
      }
      if (isProcessing) return <SparklesIcon className="w-16 h-16 text-white animate-spin" />;
      return <RobotIcon className="w-16 h-16 text-white opacity-50" />;
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 transition-all duration-500">
      <button 
        onClick={() => {
            stopSession();
            onClose();
        }} 
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {contextTrade && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center gap-2">
           <SparklesIcon className="w-4 h-4 text-brand-red" />
           <span className="text-xs font-medium text-white opacity-90">
             {contextTrade.symbol}
           </span>
        </div>
      )}

      <div className="w-full max-w-md flex flex-col items-center justify-between h-full relative p-6 pb-24 pt-12">
        
        <div className="flex-1 flex flex-col items-center justify-center w-full">
           <div className="relative flex items-center justify-center mb-12">
              {isSpeaking && (
                <>
                  <div className={`absolute w-72 h-72 ${coachMode === 'economic' ? 'bg-orange-500/10' : coachMode === 'technical' ? 'bg-blue-500/10' : 'bg-emerald-500/10'} rounded-full animate-[ping_1s_infinite] opacity-30`}></div>
                  <div className={`absolute w-60 h-60 ${coachMode === 'economic' ? 'bg-orange-500/20' : coachMode === 'technical' ? 'bg-blue-500/20' : 'bg-emerald-500/20'} rounded-full animate-[pulse_0.8s_infinite] opacity-50`}></div>
                </>
              )}
              {isListening && (
                <>
                  <div className="absolute w-72 h-72 bg-brand-red/10 rounded-full animate-[ping_1s_infinite] opacity-30"></div>
                  <div className="absolute w-60 h-60 bg-brand-red/20 rounded-full animate-[pulse_0.8s_infinite] opacity-50"></div>
                </>
              )}
              {isProcessing && (
                <div className="absolute w-64 h-64 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              )}

              <div className={`relative z-10 w-40 h-40 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 ease-in-out ${
                isListening ? 'bg-gradient-to-br from-red-500 to-red-700 scale-110' :
                isSpeaking ? (coachMode === 'economic' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : coachMode === 'technical' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600') + ' scale-105 shadow-lg' :
                isProcessing ? 'bg-gradient-to-br from-purple-500 to-purple-700 animate-pulse' :
                'bg-gradient-to-br from-gray-700 to-gray-800'
              }`}>
                 {renderCenterIcon()}
              </div>
           </div>

           <div className="text-center h-8 mb-4">
             <h3 className={`text-xl font-bold tracking-wider uppercase transition-colors duration-300 ${
                isListening ? 'text-brand-red' :
                isSpeaking ? (coachMode === 'economic' ? 'text-orange-400' : coachMode === 'technical' ? 'text-blue-400' : 'text-emerald-400') :
                isProcessing ? 'text-purple-400' :
                'text-gray-500'
             }`}>
               {isListening ? t('listening', lang) :
                isSpeaking ? (lang === 'ar' ? 'أتحدث...' : 'Speaking...') :
                isProcessing ? t('processingVoice', lang) :
                (coachMode === 'economic' ? t('modeEconomic', lang) : coachMode === 'technical' ? t('modeTechnical', lang) : t('voiceCoachTitle', lang))}
             </h3>
           </div>

           <div className="w-full min-h-[80px] flex items-center justify-center px-6">
             {currentSubtitle && (
               <p className="text-center text-lg md:text-xl text-white/90 font-medium leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 line-clamp-3">
                 "{currentSubtitle}"
               </p>
             )}
           </div>
        </div>

        <div className="flex items-center justify-center w-full mb-8">
           {isSessionActive && mode === 'auto' ? (
             <button 
               onClick={stopSession}
               className="p-6 bg-white/5 border border-white/10 rounded-full hover:bg-brand-red hover:border-brand-red hover:scale-110 transition-all duration-300 group"
             >
               <StopCircleIcon className="w-12 h-12 text-white/80 group-hover:text-white" />
             </button>
           ) : isListening && mode === 'manual' ? (
              <button 
               onClick={manualStopListening}
               className="p-8 bg-emerald-600 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-110 transition-all duration-300 animate-pulse"
             >
               <ChatBubbleLeftRightIcon className="w-12 h-12 text-white" />
             </button>
           ) : (
             <button 
               onClick={startSession}
               disabled={isProcessing || isSpeaking}
               className="p-8 bg-brand-red rounded-full shadow-[0_0_30px_rgba(211,47,47,0.5)] hover:shadow-[0_0_60px_rgba(211,47,47,0.8)] hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
             >
               <MicrophoneIcon className="w-12 h-12 text-white" />
             </button>
           )}
        </div>

        <div className="w-full bg-white/5 rounded-2xl p-3 flex justify-between items-center backdrop-blur-sm border border-white/10">
           <button 
            onClick={toggleMode}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${mode === 'auto' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
           >
             <ChatBubbleLeftRightIcon className="w-4 h-4" />
             <span className="hidden sm:inline">{mode === 'auto' ? 'Auto' : 'Manual'}</span>
           </button>

           <div className="h-6 w-px bg-white/10"></div>

           <div className="flex gap-1">
              <button 
                onClick={() => toggleCoachMode('general')}
                className={`p-2 rounded-lg transition-all ${coachMode === 'general' ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title={t('modeGeneral', lang)}
              >
                <RobotIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => toggleCoachMode('economic')}
                className={`p-2 rounded-lg transition-all ${coachMode === 'economic' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title={t('modeEconomic', lang)}
              >
                <NewspaperIcon className="w-5 h-5" />
              </button>
               <button 
                onClick={() => toggleCoachMode('technical')}
                className={`p-2 rounded-lg transition-all ${coachMode === 'technical' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title={t('modeTechnical', lang)}
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
           </div>

           <div className="h-6 w-px bg-white/10"></div>

           <button 
             onClick={toggleGender}
             className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${voiceGender === 'male' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'}`}
           >
             <UserIcon className="w-4 h-4" />
             <span className="hidden sm:inline">{voiceGender === 'male' ? 'M' : 'F'}</span>
           </button>
        </div>

      </div>
    </div>
  );
};
