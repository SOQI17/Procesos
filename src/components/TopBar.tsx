import React from 'react';
import { Bell, Settings, Search } from 'lucide-react';

export const TopBar = () => {
  return (
    <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-bg-dark/80 backdrop-blur-xl sticky top-0 z-20">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2">
        <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 select-none">
          Dashboard
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-white/10 shrink-0" fill="none">
          <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/70">
          Generador
        </span>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-0.5">

        {/* Search */}
        <button className="flex items-center gap-2 h-8 px-3 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-150">
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px] tracking-wide hidden lg:block">Buscar</span>
          <kbd className="hidden lg:block text-[9px] bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono leading-none text-white/20">
            ⌘K
          </kbd>
        </button>

        <div className="w-px h-4 bg-white/[0.08] mx-1.5" />

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-150">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-[7px] right-[7px] w-[5px] h-[5px] bg-blue-500 rounded-full ring-[1.5px] ring-bg-dark" />
        </button>

        {/* Settings */}
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-150">
          <Settings className="w-3.5 h-3.5" />
        </button>

      </div>
    </header>
  );
};