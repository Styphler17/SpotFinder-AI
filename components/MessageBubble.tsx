import React, { useState } from 'react';
import { Message, Language } from '../types';
import { SourceChips } from './SourceChips';
import { ChartRenderer } from './ChartRenderer';

interface MessageBubbleProps {
  message: Message;
  onSuggestionClick: (query: string) => void;
  onRegenerate?: (id: string) => void;
  onEdit?: (newText: string) => void;
  language: Language;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSuggestionClick, onRegenerate, onEdit, language }) => {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model';
  const isError = message.isError;
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  // Translations
  const t = {
    you: language === 'fr' ? 'Vous' : 'You',
    bestie: language === 'fr' ? 'SpotFinder AI' : 'SpotFinder AI',
    share: language === 'fr' ? 'Partager' : 'Share',
    copy: language === 'fr' ? 'Copier' : 'Copy',
    copied: language === 'fr' ? 'Copié !' : 'Copied!',
    explore: language === 'fr' ? 'Explorer plus' : 'Keep exploring',
    footer: language === 'fr' ? '— Trouvé via SpotFinder 🐾' : '— Found via SpotFinder 🐾',
    shareLabel: language === 'fr' ? 'Partager cette recommandation' : 'Share this recommendation',
    copyLabel: language === 'fr' ? 'Copier dans le presse-papier' : 'Copy to clipboard',
    exploreLabel: language === 'fr' ? 'Questions suggérées' : 'Suggested questions',
    news: language === 'fr' ? 'Actualités' : 'Latest News',
    newsLabel: language === 'fr' ? 'Voir les dernières actualités' : 'Fetch latest news related to this',
    regenerate: language === 'fr' ? 'Régénérer' : 'Regenerate',
    regenerateLabel: language === 'fr' ? 'Régénérer la réponse' : 'Regenerate response',
    edit: language === 'fr' ? 'Modifier' : 'Edit',
    save: language === 'fr' ? 'Enregistrer & Envoyer' : 'Save & Submit',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel'
  };

  const handleCopy = async () => {
    const textToShare = `${message.text}\n\n${t.footer}`;
    try {
      await navigator.clipboard.writeText(textToShare);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SpotFinder Recommendation',
      text: `${message.text}\n\n${t.footer}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
            handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleNewsClick = () => {
    const query = language === 'fr' 
      ? "Quelles sont les dernières actualités à ce sujet ?" 
      : "What are the latest news updates regarding this?";
    onSuggestionClick(query);
  };
  
  const handleSaveEdit = () => {
      if (onEdit && editText.trim() !== '' && editText !== message.text) {
          onEdit(editText.trim());
          setIsEditing(false);
      } else {
          setIsEditing(false);
          setEditText(message.text);
      }
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditText(message.text);
  };

  // Helper to parse bold text **text**
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Helper to structure text into paragraphs and lists
  const renderFormattedText = (text: string) => {
    // Split text into blocks by double newlines to form paragraphs
    const blocks = text.split(/\n\s*\n/);

    return blocks.map((block, pIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Check if this block looks like a list
      // Heuristic: multiple lines starting with -, •, or *
      const lines = block.split('\n').filter(l => l.trim().length > 0);
      const isList = lines.length > 0 && lines.every(line => /^\s*[-•*]\s/.test(line));

      if (isList) {
        return (
          <ul key={pIdx} className="list-disc pl-5 mb-3 space-y-1">
            {lines.map((line, lIdx) => {
              // Remove the bullet
              const content = line.replace(/^\s*[-•*]\s+/, '');
              return <li key={lIdx}>{parseBold(content)}</li>;
            })}
          </ul>
        );
      }

      // Standard Paragraph
      return (
        <p key={pIdx} className="mb-3 last:mb-0 leading-relaxed">
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {parseBold(line)}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 md:mb-8 animate-fade-in-up group/message`}>
      <div className={`flex flex-col max-w-[95%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'} w-full`}>
        
        {/* Author Label */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wide">
                {isUser ? t.you : t.bestie}
            </span>
            {isUser && onEdit && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover/message:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={t.edit}
                    aria-label={t.edit}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            )}
        </div>

        {/* Bubble */}
        <div
          className={`
            relative px-5 py-4 rounded-2xl shadow-sm text-[15px] md:text-base transition-all duration-300 ease-out w-full
            ${isUser 
              ? 'bg-violet-600 dark:bg-violet-700 text-white rounded-br-none shadow-violet-500/10 whitespace-pre-wrap' 
              : isError 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/30 rounded-bl-none'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none hover:shadow-md hover:-translate-y-[1px]'
            }
          `}
        >
          {isEditing ? (
              <div className="w-full">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg p-2 outline-none focus:ring-2 focus:ring-white/50 text-sm md:text-base resize-none"
                    rows={Math.max(2, Math.min(10, editText.split('\n').length))}
                  />
                  <div className="flex gap-2 justify-end mt-2">
                      <button 
                        onClick={handleCancelEdit}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                      >
                          {t.cancel}
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white text-violet-600 hover:bg-white/90 transition-colors font-bold shadow-sm"
                      >
                          {t.save}
                      </button>
                  </div>
              </div>
          ) : (
            <>
                {isUser ? message.text : renderFormattedText(message.text)}
                
                {/* Chart Visualization (Only for Model) */}
                {isModel && !isError && message.chartData && (
                    <div className="mt-4 mb-2 animate-fade-in-up">
                    <ChartRenderer data={message.chartData} />
                    </div>
                )}
                
                {/* Grounding Sources (Only for Model) */}
                {isModel && !isError && (
                    <SourceChips metadata={message.groundingMetadata} language={language} />
                )}

                {/* Action Bar (Only for Model) */}
                {isModel && !isError && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                    
                    {onRegenerate && (
                        <button 
                        onClick={() => onRegenerate(message.id)}
                        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded p-1 -ml-1"
                        title={t.regenerateLabel}
                        aria-label={t.regenerateLabel}
                        >
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 transition-colors" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </div>
                        {t.regenerate}
                        </button>
                    )}

                    <button 
                        onClick={handleNewsClick}
                        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50 rounded p-1"
                        title={t.newsLabel}
                        aria-label={t.newsLabel}
                    >
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/30 transition-colors" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                        </div>
                        {t.news}
                    </button>

                    <button 
                        onClick={handleShare}
                        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded p-1"
                        title={t.shareLabel}
                        aria-label={t.shareLabel}
                    >
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 transition-colors" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        </div>
                        {t.share}
                    </button>

                    <button 
                        onClick={handleCopy}
                        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded p-1"
                        title={t.copyLabel}
                        aria-label={t.copyLabel}
                    >
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 transition-colors" aria-hidden="true">
                        {isCopied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                        </div>
                        <span role="status" aria-live="polite">
                        {isCopied ? <span className="text-green-700 dark:text-green-400">{t.copied}</span> : t.copy}
                        </span>
                    </button>
                    </div>
                )}
            </>
          )}
        </div>

        {/* Related Questions (Only for Model) */}
        {!isEditing && isModel && !isError && message.relatedQuestions && message.relatedQuestions.length > 0 && (
          <div className="mt-3 w-full animate-fade-in-up" role="region" aria-label={t.exploreLabel}>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1 mb-2">
              {t.explore}
            </p>
            <div className="flex flex-wrap gap-2">
              {message.relatedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick(question)}
                  aria-label={`Ask: ${question}`}
                  className="text-xs md:text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 px-3 py-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-800 hover:text-violet-700 dark:hover:text-violet-300 transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 px-1 select-none">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};