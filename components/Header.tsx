import React from 'react';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  title?: string;
}

// Only visible on Mobile
export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar, title }) => {
  return (
    <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open menu"
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      
      {/* Optional Title for Mobile context */}
      {title && (
          <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
              {title}
          </span>
      )}

      {/* Spacer to balance the flex */}
      <div className="w-10"></div>
    </div>
  );
};