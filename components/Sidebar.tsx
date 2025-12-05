import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Language, SessionColor } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<ChatSession>) => void;
  onExportPDF: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isOpen: boolean;
  onClose: () => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
}

const COLORS: SessionColor[] = ['violet', 'rose', 'amber', 'emerald', 'cyan', 'slate'];

const getColorClass = (color?: SessionColor) => {
  switch (color) {
    case 'rose': return 'bg-rose-500';
    case 'amber': return 'bg-amber-500';
    case 'emerald': return 'bg-emerald-500';
    case 'cyan': return 'bg-cyan-500';
    case 'slate': return 'bg-slate-500';
    default: return 'bg-violet-500';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateSession,
  onExportPDF,
  theme,
  toggleTheme,
  language,
  setLanguage,
  isOpen,
  onClose,
  isDesktopOpen,
  onToggleDesktop
}) => {
  // State for menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // State for renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditValue(session.title);
    setActiveMenuId(null);
  };

  const saveEditing = () => {
    if (editingId && editValue.trim()) {
      onUpdateSession(editingId, { title: editValue.trim() });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const t = {
    newChat: language === 'fr' ? "Nouvelle Discussion" : "New Chat",
    history: language === 'fr' ? "Historique" : "History",
    noHistory: language === 'fr' ? "Aucun historique" : "No recent chats",
    close: language === 'fr' ? "Fermer" : "Close",
    collapse: language === 'fr' ? "Réduire le menu" : "Collapse sidebar",
    expand: language === 'fr' ? "Agrandir le menu" : "Expand sidebar",
    rename: language === 'fr' ? "Renommer" : "Rename",
    delete: language === 'fr' ? "Supprimer" : "Delete",
    exportPdf: language === 'fr' ? "Exporter PDF" : "Export PDF"
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-50 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col
          transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isDesktopOpen ? 'md:w-72' : 'md:w-20'}
        `}
      >
        {/* Header / New Chat */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 ${isDesktopOpen ? '' : 'flex-col justify-center'}`}>
           <button
             onClick={() => { onNewChat(); onClose(); }}
             className={`flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500
                ${isDesktopOpen ? 'flex-1 py-3' : 'w-10 h-10 p-0'}
             `}
             title={t.newChat}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             {isDesktopOpen && <span>{t.newChat}</span>}
           </button>
           
           {/* Desktop Collapse Button */}
           <button
             onClick={onToggleDesktop}
             className={`hidden md:flex p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors ${isDesktopOpen ? '' : 'mt-2'}`}
             title={isDesktopOpen ? t.collapse : t.expand}
             aria-label={isDesktopOpen ? t.collapse : t.expand}
           >
             {isDesktopOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="M15 10l-2 2 2 2"/></svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="M13 10l2 2-2 2"/></svg>
             )}
           </button>
        </div>

        {/* History List (Hidden in Slim Mode) */}
        {isDesktopOpen && (
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar pb-20 animate-fade-in-up">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
                {t.history}
            </div>
            
            <div className="flex flex-col gap-1">
                {sessions.length === 0 ? (
                <div className="text-sm text-slate-400 dark:text-slate-600 px-2 italic">
                    {t.noHistory}
                </div>
                ) : (
                sessions.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(session => (
                    <div key={session.id} className="group relative flex items-center">
                    
                    {editingId === session.id ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEditing}
                            onKeyDown={handleKeyDown}
                            className="flex-1 py-2.5 px-3 rounded-lg text-sm bg-white dark:bg-slate-800 border border-violet-500 outline-none text-slate-900 dark:text-white shadow-sm"
                        />
                    ) : (
                        <button
                            onClick={() => { onSelectSession(session.id); onClose(); }}
                            onDoubleClick={() => startEditing(session)}
                            className={`
                            flex-1 text-left text-sm truncate py-2.5 pl-3 pr-8 rounded-lg transition-all flex items-center gap-2
                            ${currentSessionId === session.id 
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-medium' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }
                            `}
                            title={session.title}
                        >
                            {/* Color Dot */}
                            {session.color && (
                                <div className={`w-2 h-2 rounded-full shrink-0 ${getColorClass(session.color)}`}></div>
                            )}
                            <span className="truncate">{session.title}</span>
                        </button>
                    )}

                    {/* Menu Button (visible on hover or when active) */}
                    {!editingId && (
                        <div className="absolute right-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === session.id ? null : session.id); }}
                            className={`p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ${activeMenuId === session.id ? 'opacity-100 bg-slate-200 dark:bg-slate-700' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>

                        {/* Context Menu */}
                        {activeMenuId === session.id && (
                            <div 
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up"
                                style={{ top: '100%' }}
                            >
                                {/* Color Picker */}
                                <div className="p-2 flex justify-between gap-1 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={(e) => { e.stopPropagation(); onUpdateSession(session.id, { color: c }); setActiveMenuId(null); }}
                                            className={`w-5 h-5 rounded-full ${getColorClass(c)} hover:scale-110 transition-transform ring-1 ring-offset-1 ring-transparent hover:ring-slate-300 dark:ring-offset-slate-800`}
                                            aria-label={`Color ${c}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); startEditing(session); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    {t.rename}
                                </button>
                                
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    {t.delete}
                                </button>
                            </div>
                        )}
                        </div>
                    )}
                    </div>
                ))
                )}
            </div>
            </div>
        )}

        {/* Spacer for slim mode to push bottom controls down */}
        {!isDesktopOpen && <div className="flex-1"></div>}

        {/* Bottom Controls */}
        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ${isDesktopOpen ? '' : 'flex flex-col items-center gap-3'}`}>
          <div className={`flex ${isDesktopOpen ? 'flex-col gap-2' : 'flex-col gap-3 w-full items-center'}`}>
            
            <div className={`flex ${isDesktopOpen ? 'items-center justify-between gap-2' : 'flex-col gap-3 w-full'}`}>
               <button
                  onClick={toggleTheme}
                  title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                  className={`flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 transition-colors ${isDesktopOpen ? 'flex-1' : 'w-10 h-10'}`}
                >
                  {theme === 'light' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
               </button>

               <button
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className={`flex items-center justify-center gap-1 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 transition-colors text-sm font-bold ${isDesktopOpen ? 'flex-1' : 'w-10 h-10'}`}
                title={language === 'en' ? "Passer en Français" : "Switch to English"}
               >
                 {language === 'en' ? '🇺🇸' : '🇫🇷'}
               </button>
            </div>

            <button
                onClick={onExportPDF}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-xs font-medium ${isDesktopOpen ? 'w-full' : 'w-10 h-10'}`}
                title={t.exportPdf}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {isDesktopOpen && <span>{t.exportPdf}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};