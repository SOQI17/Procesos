import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  Search,
  FileSearch,
  Settings,
  Zap,
  Target,
  ChevronRight,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'General', id: 'general', group: 'main' },
  { icon: Zap,             label: 'Diagramador de Procesos',      id: 'diagramador',    group: 'tools' },
  { icon: Target,          label: 'Diagnóstico de Madurez',       id: 'diagnostico',    group: 'tools' },
  { icon: FileSearch,      label: 'Analizador de Procesos',       id: 'analyzer',       group: 'tools' },
  { icon: GitBranch,       label: 'Mapeo de Flujo de Valor',      id: 'vsm',            group: 'tools' },
  { icon: FileText,        label: 'Generador de Procedimientos',  id: 'procedimientos', group: 'tools' },
  { icon: Search,          label: 'BPM Gap Analyzer',             id: 'gap',            group: 'tools' },
];

export const Sidebar = ({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) => {
  return (
    <aside className="w-60 bg-bg-sidebar border-r border-white/[0.06] flex flex-col h-screen sticky top-0 shrink-0">

      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/[0.06] gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="text-white w-3.5 h-3.5 fill-current" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold tracking-tight text-white leading-none">
            ProcessOS
          </span>
          <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-white/20 leading-none">
            BPM Suite
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">

        {/* Main */}
        <div className="space-y-0.5 mb-4">
          {menuItems.filter(m => m.group === 'main').map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 group relative',
                  active
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-white/35 hover:text-white/75 hover:bg-white/[0.04]'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r-full" />
                )}
                <item.icon className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-blue-400' : 'text-white/25 group-hover:text-white/50')} />
                <span className="truncate flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tools group */}
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-white/20 px-2 mb-2">
          Módulos
        </p>
        <div className="space-y-0.5">
          {menuItems.filter(m => m.group === 'tools').map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 group relative',
                  active
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-white/35 hover:text-white/75 hover:bg-white/[0.04]'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r-full" />
                )}
                <item.icon className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-blue-400' : 'text-white/25 group-hover:text-white/50')} />
                <span className="truncate flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06]">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 group">
          <Settings className="w-3.5 h-3.5 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
          <span>Configuración</span>
        </button>
        <div className="mt-3 mx-2 flex items-center justify-between">
          <span className="text-[9px] text-white/15 font-mono tracking-wider">v2.4.1</span>
          <span className="text-[9px] bg-blue-500/10 text-blue-400/60 border border-blue-500/10 rounded px-1.5 py-0.5 font-medium tracking-wide">
            PRO
          </span>
        </div>
      </div>
    </aside>
  );
};