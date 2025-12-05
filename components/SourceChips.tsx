import React from 'react';
import { GroundingMetadata, Language } from '../types';

interface SourceChipsProps {
  metadata?: GroundingMetadata;
  language: Language;
}

// Expanded Color Palettes for distinct styling
const PALETTES = [
  { // Blue
    name: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    subText: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-800/50',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'text-white'
  },
  { // Rose
    name: 'rose',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-900 dark:text-rose-100',
    subText: 'text-rose-700 dark:text-rose-300',
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-800/50',
    buttonBg: 'bg-rose-600 hover:bg-rose-700',
    buttonText: 'text-white'
  },
  { // Amber
    name: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    subText: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    buttonText: 'text-white'
  },
  { // Teal
    name: 'teal',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-900 dark:text-teal-100',
    subText: 'text-teal-700 dark:text-teal-300',
    icon: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-800/50',
    buttonBg: 'bg-teal-600 hover:bg-teal-700',
    buttonText: 'text-white'
  },
  { // Violet
    name: 'violet',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-900 dark:text-violet-100',
    subText: 'text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-800/50',
    buttonBg: 'bg-violet-600 hover:bg-violet-700',
    buttonText: 'text-white'
  },
  { // Fuchsia
    name: 'fuchsia',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    text: 'text-fuchsia-900 dark:text-fuchsia-100',
    subText: 'text-fuchsia-700 dark:text-fuchsia-300',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-800/50',
    buttonBg: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    buttonText: 'text-white'
  },
  { // Indigo
    name: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-900 dark:text-indigo-100',
    subText: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-800/50',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
    buttonText: 'text-white'
  },
  { // Orange
    name: 'orange',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    subText: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    buttonBg: 'bg-orange-600 hover:bg-orange-700',
    buttonText: 'text-white'
  }
];

// Consistent hashing to assign colors to hostnames
const getPaletteForHostname = (hostname: string) => {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = hostname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
};

export const SourceChips: React.FC<SourceChipsProps> = ({ metadata, language }) => {
  if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) {
    return null;
  }

  // Filter and deduplicate sources
  // We handle both 'web' and 'maps' chunks
  const uniqueSources = new Map<string, { type: 'web' | 'maps', uri: string, title: string }>();

  metadata.groundingChunks.forEach(chunk => {
    if (chunk.web) {
      if (!uniqueSources.has(chunk.web.uri)) {
        uniqueSources.set(chunk.web.uri, { type: 'web', ...chunk.web });
      }
    } else if (chunk.maps) {
      if (!uniqueSources.has(chunk.maps.uri)) {
        uniqueSources.set(chunk.maps.uri, { type: 'maps', ...chunk.maps });
      }
    }
  });

  const sources = Array.from(uniqueSources.values());

  if (sources.length === 0) return null;

  const label = language === 'fr' ? "Sources et Lieux" : "Sources & Places";

  return (
    <div className="mt-4 flex flex-col gap-2.5" role="region" aria-label={label}>
      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex flex-col gap-2">
        {sources.map((source, idx) => {
          const hostname = source.uri ? new URL(source.uri).hostname : '';
          const isMaps = source.type === 'maps';
          
          // Use dynamic palette for web sources, or fixed Emerald style for Maps
          const palette = getPaletteForHostname(hostname);
          
          // Construct styles based on type
          const bgClass = isMaps 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : `${palette.bg} ${palette.border}`;
            
          const iconBgClass = isMaps
            ? 'bg-white dark:bg-emerald-800/50'
            : `${palette.iconBg}`; 

          const textClass = isMaps
             ? 'text-emerald-900 dark:text-emerald-100'
             : `${palette.text}`;

          const subTextClass = isMaps
             ? 'text-emerald-700 dark:text-emerald-300'
             : palette.subText;

          const iconColorClass = isMaps
             ? 'text-emerald-600 dark:text-emerald-400'
             : palette.icon;
             
          const buttonBgClass = isMaps
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : `${palette.buttonBg} ${palette.buttonText}`;

          const ariaLabel = isMaps 
            ? (language === 'fr' ? `Ouvrir ${source.title} dans Google Maps` : `Open ${source.title} in Google Maps`)
            : (language === 'fr' ? `Ouvrir ${source.title} sur ${hostname}` : `Open ${source.title} on ${hostname}`);

          return (
          <div
            key={idx}
            className="relative group w-full"
          >
            {/* Chip Container */}
            <div className={`
              border rounded-xl p-3 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md
              ${bgClass}
            `}>
              {/* Content Section (Non-clickable, informational) */}
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                  p-2 rounded-full shrink-0 transition-colors
                  ${iconBgClass}
                `} aria-hidden="true">
                  {isMaps ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconColorClass}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconColorClass}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  )}
                </div>
                
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className={`text-sm font-bold truncate max-w-[200px] sm:max-w-xs ${textClass}`}>
                    {source.title || hostname}
                  </span>
                  <span className={`text-[10px] md:text-xs truncate max-w-[200px] ${subTextClass}`}>
                    {isMaps ? (language === 'fr' ? 'Google Maps' : 'Google Maps') : hostname}
                  </span>
                </div>
              </div>

              {/* Explicit Visit Button */}
              <a 
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                className={`
                   ml-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                   focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-current
                   ${buttonBgClass}
                `}
              >
                {language === 'fr' ? 'Visiter' : 'Visit'}
              </a>
            </div>

            {/* Custom Tooltip on Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] hidden group-hover:block z-50 pointer-events-none animate-fade-in-up">
              <div className="bg-slate-900 text-white text-[10px] rounded-lg py-2 px-3 shadow-xl">
                 <div className="font-bold mb-1 break-words whitespace-normal">{source.title}</div>
                 <div className="text-slate-400 break-all whitespace-normal leading-tight opacity-75">{source.uri}</div>
                 {/* Arrow */}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
