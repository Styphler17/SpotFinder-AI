import React, { useState, useEffect } from 'react';
import { Language } from '../types';

const SEARCH_STEPS_EN = [
  "Searching Google...",
  "Finding the best spots...",
  "Typing..."
];

const SEARCH_STEPS_FR = [
  "Recherche Google...",
  "Sélection des pépites...",
  "Écriture..."
];

interface LoadingIndicatorProps {
  language: Language;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ language }) => {
  const [step, setStep] = useState(0);
  const steps = language === 'fr' ? SEARCH_STEPS_FR : SEARCH_STEPS_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex w-full justify-start mb-6 animate-fade-in-up" role="status" aria-live="polite">
      <div className="flex flex-col items-start max-w-[95%] md:max-w-[80%]">
        {/* Label matching MessageBubble */}
        <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mb-1.5 px-1 font-medium tracking-wide">
          {language === 'fr' ? 'SpotFinder AI' : 'SpotFinder AI'}
        </span>
        
        <div className="bg-white dark:bg-slate-900 px-4 py-3.5 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          {/* Subtle Typing Dots */}
          <div className="flex space-x-1" aria-hidden="true">
             <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-typing [animation-delay:-0.32s]"></div>
             <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-typing [animation-delay:-0.16s]"></div>
             <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-typing"></div>
          </div>

          {/* Separator */}
          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></div>

          {/* Subtle Text */}
          <span className="text-xs md:text-sm text-slate-500 dark:text-slate-500 font-medium">
            {steps[step]}
          </span>
        </div>
      </div>
    </div>
  );
};