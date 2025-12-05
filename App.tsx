import React, { useState, useRef, useEffect } from 'react';
import { AppState, Message, Language, LocationData, ChatSession } from './types';
import { MobileHeader } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { LoadingIndicator } from './components/LoadingIndicator';
import { searchDeBesties } from './services/geminiService';

declare var html2pdf: any;

const TRANSLATIONS = {
  en: {
    titlePrefix: "Your",
    titleHighlight: "SpotFinder",
    titleSuffix: "AI Companion.",
    subtitle: "Ask SpotFinder anything. We use Google Search & Maps to find the absolute latest spots, deals, news, and hidden gems.",
    placeholder: "Ask anything... Trends, ideas, or facts?",
    searchButton: "Search",
    suggestions: [
      "What's trending today? 🔥",
      "Inspiring quote of the day ✨",
      "Tell me a mind-blowing fact 🤯",
      "Tips for a productive day 🚀"
    ],
    followUpPlaceholder: "Ask a follow up...",
    poweredBy: "Powered by Gemini 2.5 Flash • Google Search & Maps",
    errorMsg: "Oops! I had trouble searching for that. It might be a network issue. Try again?",
    thinkingMode: "Deep Think",
    thinkingOn: "Deep Thinking ON",
    thinkingOff: "Deep Thinking OFF",
    locationTip: "Share location for better local results",
    locationActive: "Using your location",
    loading: "Loading...",
    defaultTitle: "New Chat",
    openSidebar: "Open sidebar"
  },
  fr: {
    titlePrefix: "Votre",
    titleHighlight: "Compagnon SpotFinder",
    titleSuffix: ".",
    subtitle: "Demandez tout à SpotFinder. Nous utilisons Google Search & Maps pour trouver les derniers lieux, offres et pépites.",
    placeholder: "Demandez tout... Tendances, idées ou faits ?",
    searchButton: "Rechercher",
    suggestions: [
      "Les tendances du jour ? 🔥",
      "Citation inspirante du jour ✨",
      "Un fait incroyable 🤯",
      "Conseils pour être productif 🚀"
    ],
    followUpPlaceholder: "Posez une autre question...",
    poweredBy: "Propulsé par Gemini 2.5 Flash • Google Search & Maps",
    errorMsg: "Oups ! J'ai eu du mal à chercher ça. C'est peut-être un problème de réseau. Réessayer ?",
    thinkingMode: "Pensée Profonde",
    thinkingOn: "Pensée Profonde ACTIVE",
    thinkingOff: "Pensée Profonde INACTIVE",
    locationTip: "Partager la position pour de meilleurs résultats locaux",
    locationActive: "Position utilisée",
    loading: "Chargement...",
    defaultTitle: "Nouvelle Discussion",
    openSidebar: "Ouvrir le menu"
  }
};

const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language];

  // Thinking Mode State
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Location State
  const [location, setLocation] = useState<LocationData | undefined>(undefined);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Sidebar Mobile State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sidebar Desktop State
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // --- Session Management ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      // Migration check: If 'debesties_history' exists but 'debesties_sessions' doesn't, migrate it.
      const oldHistory = localStorage.getItem('debesties_history');
      const savedSessions = localStorage.getItem('debesties_sessions');
      
      if (oldHistory && !savedSessions) {
        const messages = JSON.parse(oldHistory, (key, value) => {
           if (key === 'timestamp' || key === 'updatedAt') return new Date(value);
           return value;
        });
        
        if (messages.length > 0) {
          const migratedSession: ChatSession = {
            id: Date.now().toString(),
            title: messages[0].text.substring(0, 30) + '...',
            messages: messages,
            updatedAt: new Date()
          };
          return [migratedSession];
        }
      }

      if (savedSessions) {
        return JSON.parse(savedSessions, (key, value) => {
          if (key === 'timestamp' || key === 'updatedAt') return new Date(value);
          return value;
        });
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply Language
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Persist Sessions
  useEffect(() => {
    localStorage.setItem('debesties_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Derived State: Current Messages
  const currentMessages = currentSessionId 
    ? sessions.find(s => s.id === currentSessionId)?.messages || [] 
    : [];

  const appState = currentMessages.length > 0 ? AppState.CHATTING : AppState.LANDING;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to bottom logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading, appState]);

  // Deep Link Logic (Only on initial load)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      // If query exists and we aren't already in a session with messages, start a search
      if (q && !currentSessionId && sessions.length === 0 && !isLoading) {
        setQuery(q);
        handleSearch(undefined, q);
      }
    }
  }, []);

  const toggleLocation = () => {
    if (location) {
      setLocation(undefined);
      return;
    }
    setIsLocationLoading(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error("Location access denied", error);
          alert(language === 'fr' ? "Impossible d'accéder à la position." : "Could not access location.");
          setIsLocationLoading(false);
        }
      );
    } else {
      setIsLocationLoading(false);
    }
  };

  const createNewSession = (firstMessageText: string): ChatSession => {
    return {
      id: Date.now().toString(),
      title: firstMessageText.substring(0, 40) + (firstMessageText.length > 40 ? '...' : ''),
      messages: [],
      updatedAt: new Date()
    };
  };

  const handleRegenerate = async (messageId: string) => {
    if (isLoading || !currentSessionId) return;
    
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // We need the preceding user message to retry the query
    const prevMsg = session.messages[msgIndex - 1];
    if (!prevMsg || prevMsg.role !== 'user') return;

    const queryToRetry = prevMsg.text;
    
    // 1. Truncate history: Keep messages up to the user prompt (exclusive of the current AI response)
    const newMessages = session.messages.slice(0, msgIndex);
    
    // Update state to remove the old AI message immediately
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: newMessages, updatedAt: new Date() };
      }
      return s;
    }));
    
    setIsLoading(true);

    try {
        // Build history for API (exclude the last user prompt which we are about to resend)
        const historyForApi = newMessages.slice(0, -1).slice(-6).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        })); 

        const result = await searchDeBesties(queryToRetry, historyForApi, language, {
            useThinking: isThinkingMode,
            location: location
        });

         const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text,
            timestamp: new Date(),
            groundingMetadata: result.groundingMetadata,
            relatedQuestions: result.relatedQuestions,
            chartData: result.chartData,
            isThinking: isThinkingMode
        };

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { 
                    ...s, 
                    messages: [...newMessages, aiMsg], 
                    updatedAt: new Date() 
                };
            }
            return s;
        }));

    } catch (error) {
         const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: TRANSLATIONS[language].errorMsg,
            timestamp: new Date(),
            isError: true
        };
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: [...newMessages, errorMsg] };
            }
            return s;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (isLoading || !currentSessionId) return;

    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate history: Keep messages up to this user message (exclusive)
    const truncatedHistory = session.messages.slice(0, msgIndex);
    
    // Create new updated user message
    const updatedUserMsg: Message = {
        ...session.messages[msgIndex],
        text: newText,
        timestamp: new Date()
    };

    // Update state: Set history to truncated + new user message
    const newSessionMessages = [...truncatedHistory, updatedUserMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: newSessionMessages, updatedAt: new Date() };
      }
      return s;
    }));

    setIsLoading(true);

    try {
        // Build history for API (exclude the current message we just added)
        const historyForApi = truncatedHistory.slice(-6).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const result = await searchDeBesties(newText, historyForApi, language, {
            useThinking: isThinkingMode,
            location: location
        });

         const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text,
            timestamp: new Date(),
            groundingMetadata: result.groundingMetadata,
            relatedQuestions: result.relatedQuestions,
            chartData: result.chartData,
            isThinking: isThinkingMode
        };

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: [...newSessionMessages, aiMsg],
                    updatedAt: new Date()
                };
            }
            return s;
        }));

    } catch (error) {
         const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: TRANSLATIONS[language].errorMsg,
            timestamp: new Date(),
            isError: true
        };
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: [...newSessionMessages, errorMsg] };
            }
            return s;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, suggestion?: string) => {
    if (e) e.preventDefault();
    
    // Safety check for empty history updates
    if (typeof window !== 'undefined' && !window.location.href.startsWith('blob:')) {
      try {
        // Only update history if not in a blob/sandboxed env
        const url = new URL(window.location.href);
        if (suggestion || query) {
           url.searchParams.set('q', suggestion || query);
           window.history.pushState({}, '', url.toString());
        }
      } catch (err) {
        // Ignore pushState errors in sandboxes
      }
    }

    const effectiveQuery = suggestion || query.trim();

    if (!effectiveQuery || (isLoading && !suggestion)) return;

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      inputRef.current?.blur();
    }

    if (!suggestion) setQuery('');

    // --- Session Logic ---
    let sessionId = currentSessionId;
    let sessionList = [...sessions];

    if (!sessionId) {
      const newSession = createNewSession(effectiveQuery);
      sessionId = newSession.id;
      sessionList = [newSession, ...sessionList];
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: effectiveQuery,
      timestamp: new Date()
    };

    // Optimistic Update
    const updatedSessions = sessionList.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, userMsg],
          updatedAt: new Date()
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setCurrentSessionId(sessionId);
    setIsLoading(true);

    try {
      // Get context from specific session
      const activeSession = updatedSessions.find(s => s.id === sessionId);
      // Exclude the current user message from history sent to API
      const historyMessages = (activeSession?.messages || []).slice(0, -1);
      const history = historyMessages.slice(-6).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Call API
      const result = await searchDeBesties(effectiveQuery, history, language, {
        useThinking: isThinkingMode,
        location: location
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: new Date(),
        groundingMetadata: result.groundingMetadata,
        relatedQuestions: result.relatedQuestions,
        chartData: result.chartData,
        isThinking: isThinkingMode
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMsg],
            updatedAt: new Date()
          };
        }
        return s;
      }));

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: TRANSLATIONS[language].errorMsg,
        timestamp: new Date(),
        isError: true
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, errorMsg] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleUpdateSession = (id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setQuery('');
    
    if (typeof window !== 'undefined' && !window.location.href.startsWith('blob:')) {
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('q');
            window.history.pushState({}, '', url.toString());
        } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleExportPDF = () => {
    if (!currentSessionId) return;
    
    const element = document.getElementById('chat-export-container');
    if (!element) return;

    const session = sessions.find(s => s.id === currentSessionId);
    const filename = `SpotFinder-${session ? session.title.substring(0, 15).replace(/[^a-z0-9]/gi, '_') : 'Chat'}-${new Date().toISOString().split('T')[0]}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save();
    } else {
      console.error("html2pdf library not loaded");
      alert("PDF library not loaded. Please refresh.");
    }
  };

  // Helper component for Location Icon
  const LocationIcon = ({ className }: { className?: string }) => (
    <button
      type="button"
      onClick={toggleLocation}
      title={location ? t.locationActive : t.locationTip}
      className={`
        flex items-center justify-center transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50
        ${className}
        ${location 
          ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
          : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }
      `}
    >
      {isLocationLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={location ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* SIDEBAR */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onUpdateSession={handleUpdateSession}
        onExportPDF={handleExportPDF}
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktop={() => setIsDesktopSidebarOpen(prev => !prev)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Note: Standalone Sidebar Toggle removed as Sidebar is always visible (slim or full) */}

        {/* Mobile Header (Only visible on mobile) */}
        <MobileHeader 
            onOpenSidebar={() => setIsSidebarOpen(true)} 
            title={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : undefined}
        />

        <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden" role="main">
          
          {/* LANDING STATE */}
          {appState === AppState.LANDING && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-20 animate-fade-in-up overflow-y-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-2xl shadow-violet-500/20 mb-6 md:mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-center tracking-tight mb-4 md:mb-6 text-slate-900 dark:text-white">
                {t.titlePrefix} <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">{t.titleHighlight}</span> {t.titleSuffix}
              </h2>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 text-center max-w-xl mb-8 md:mb-12 leading-relaxed px-2">
                {t.subtitle}
              </p>

              <div className="w-full max-w-xl flex flex-col gap-3 px-2 md:px-0">
                <form onSubmit={(e) => handleSearch(e)} className="w-full relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden p-1.5 md:p-2 transition-colors duration-300 focus-within:ring-2 focus-within:ring-violet-500/30">
                    <div className="pl-1">
                       <LocationIcon className="w-10 h-10" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.placeholder}
                        className="flex-1 h-12 md:h-14 px-2 md:px-3 text-base md:text-lg bg-transparent border-none outline-none placeholder:text-slate-500 dark:placeholder:text-slate-500 dark:text-white"
                        enterKeyHint="search"
                        autoComplete="off"
                      />
                      <button 
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] md:min-w-[100px] flex justify-center items-center shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/20 dark:border-slate-900/20 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                        ) : (
                          t.searchButton
                        )}
                      </button>
                  </div>
                </form>

                {/* Thinking Mode Toggle */}
                <div className="flex justify-center">
                   <button
                    type="button"
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`
                      flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                      ${isThinkingMode 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' 
                        : 'bg-transparent text-slate-500 dark:text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 1 8 8c0 3.25-2.25 6-5.25 7.5L14 22h-4l-.75-4.5A8.5 8.5 0 0 1 4 10a8 8 0 0 1 8-8z"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>
                     {isThinkingMode ? t.thinkingOn : t.thinkingMode}
                   </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-8 md:mt-12 flex flex-wrap justify-center gap-2 md:gap-3 px-4">
                 {t.suggestions.map((suggestion, i) => (
                   <button 
                     key={i}
                     onClick={() => handleSearch(undefined, suggestion)}
                     className="px-3 md:px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 hover:shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                   >
                     {suggestion}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {/* CHATTING STATE */}
          {appState === AppState.CHATTING && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6 scroll-smooth custom-scrollbar">
                 <div id="chat-export-container" className="max-w-3xl mx-auto">
                   {currentMessages.map(msg => (
                     <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      onSuggestionClick={(suggestion) => handleSearch(undefined, suggestion)}
                      onRegenerate={msg.role === 'model' ? handleRegenerate : undefined}
                      onEdit={msg.role === 'user' ? (newText) => handleEditMessage(msg.id, newText) : undefined}
                      language={language}
                     />
                   ))}
                   {isLoading && <LoadingIndicator language={language} />}
                   <div ref={messagesEndRef} className="h-4" />
                 </div>
              </div>

              {/* Input Area */}
              <div className="w-full bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-3 md:p-4 sticky bottom-0 z-40">
                 <div className="max-w-3xl mx-auto relative flex flex-col gap-2">
                   <form onSubmit={(e) => handleSearch(e)} className="flex gap-2 items-center">
                     <div className="flex-1 relative group">
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10">
                        <LocationIcon className="w-9 h-9" />
                      </div>
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.followUpPlaceholder}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 outline-none transition-all bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500"
                        enterKeyHint="send"
                        autoComplete="off"
                      />
                     </div>
                     <button 
                       type="submit"
                       disabled={isLoading || !query.trim()}
                       className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                     >
                       {isLoading ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                       )}
                     </button>
                   </form>
                   
                   <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => setIsThinkingMode(!isThinkingMode)}
                        className={`
                          flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                          ${isThinkingMode 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                            : 'text-slate-500 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400'
                          }
                        `}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 1 8 8c0 3.25-2.25 6-5.25 7.5L14 22h-4l-.75-4.5A8.5 8.5 0 0 1 4 10a8 8 0 0 1 8-8z"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>
                        {isThinkingMode ? t.thinkingOn : t.thinkingMode}
                      </button>
                      <span className="text-[10px] text-slate-500 dark:text-slate-600 font-medium hidden md:block">{t.poweredBy}</span>
                   </div>
                 </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;