import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, GitBranch, FileText, Search, FileSearch, Settings, Zap, Target, ChevronRight,
  Bell, Upload, Mic, MessageSquare, Loader2, ArrowRight, ShieldCheck, Download, Eye,
  User, BarChart3, Share2, Trophy, AlertCircle, BookOpen, RefreshCw, Cpu, Activity, Database, Brain,
  FileCode, CheckCircle2, Layers, Users, Copy, Terminal, FileSpreadsheet, X
} from 'lucide-react';
import { generateProcessDiagram, analyzeProcessFromText, extractTextFromFile, setApiKey, getStoredApiKey } from './services/geminiService';

import GapAnalyzer from './components/GapAnalyzer';

// --- Sidebar.tsx ---

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

const Sidebar = ({
  activeId,
  onNavigate,
  onOpenSettings
}: {
  activeId: string;
  onNavigate: (id: string) => void;
  onOpenSettings: () => void;
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
        <button onClick={onOpenSettings} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 group">
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

// --- TopBar.tsx ---

const TopBar = () => {
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

// --- ProcessGenerator.tsx ---



type Tab = 'texto' | 'archivo';

const stats = [
  { label: 'Diagramas Generados', value: '1,284', icon: Zap },
  { label: 'Tiempo Ahorrado',     value: '420 h', icon: ArrowRight },
  { label: 'Precisión IA',        value: '98.2%', icon: ShieldCheck },
];

const ProcessGenerator = () => {
  const [activeTab, setActiveTab]     = useState<Tab>('texto');
  const [inputText, setInputText]     = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const handleGenerate = async () => {
    if (activeTab === 'texto' && !inputText.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const prompt =
        activeTab === 'texto'
          ? inputText
          : 'Simulación de análisis de archivo: El usuario subió un documento de proceso de ventas.';
      const output = await generateProcessDiagram(prompt);
      setResult(output || 'No se pudo generar el diagrama.');
    } catch (err) {
      setError('Error al conectar con la IA. Por favor verifica tu conexión.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-8 h-8 bg-blue-600/15 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-400 fill-current" />
          </div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Levantador de Procesos
          </h1>
        </div>
        <p className="text-[13px] text-white/35 ml-11 leading-relaxed">
          Transforma voz, texto o archivos multimedia en diagramas BPMN 2.0
        </p>
      </div>

      {/* ── Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Input */}
        <div className="glass-panel overflow-hidden flex flex-col h-[580px]">

          {/* Tabs */}
          <div className="flex border-b border-white/[0.07]">
            {([
              { key: 'texto',   label: 'Texto y Voz', Icon: MessageSquare },
              { key: 'archivo', label: 'Archivo',     Icon: Upload },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 h-11 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-150',
                  activeTab === key
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/[0.05]'
                    : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 p-6 flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'archivo' ? (
                <motion.div
                  key="archivo"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.12] transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                    <Upload className="w-5 h-5 text-white/30" />
                  </div>
                  <p className="text-[13px] font-medium text-white/50 mb-1">Arrastra un archivo aquí</p>
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/20">
                    MP3 · WAV · MP4 · WEBM · PNG · JPG · PDF
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="texto"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 flex flex-col gap-3"
                >
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe el proceso aquí…&#10;&#10;Ej: El cliente solicita un presupuesto, el vendedor lo valida y envía propuesta en 48 h..."
                    className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-[13px] text-white/80 placeholder:text-white/15 focus:outline-none focus:border-blue-500/30 focus:bg-blue-500/[0.03] resize-none transition-all duration-150 leading-relaxed"
                  />
                  <button className="h-10 flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/40 hover:text-white/70 rounded-xl text-[12px] font-medium transition-all duration-150">
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                    Grabar Audio
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-[11px] text-red-400/80 text-center bg-red-500/[0.06] border border-red-500/10 rounded-lg px-4 py-3 leading-relaxed">
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (activeTab === 'texto' && !inputText.trim())}
              className="mt-5 h-11 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-semibold tracking-[0.08em] uppercase rounded-xl flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Generar Diagrama BPMN
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass-panel overflow-hidden flex flex-col h-[580px]">

          {/* Header strip */}
          <div className="h-11 px-5 border-b border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/25">
                System Output
              </span>
            </div>
            {result && (
              <div className="flex items-center gap-1.5">
                <button className="h-7 px-3 flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 transition-all">
                  <Download className="w-3 h-3" />
                  BPMN
                </button>
                <button className="h-7 px-3 flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 transition-all">
                  <Eye className="w-3 h-3" />
                  Editor
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col"
              >
                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.07] text-[12.5px] text-white/65 flex-1 overflow-auto prose prose-invert prose-sm max-w-none leading-relaxed">
                  <Markdown>{result}</Markdown>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
                  <Zap className="absolute inset-0 m-auto w-6 h-6 text-white/10" />
                </div>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/15">
                  Esperando entrada
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass-panel px-5 py-4 flex items-center gap-3.5"
          >
            <div className="w-8 h-8 bg-white/[0.04] border border-white/[0.07] rounded-lg flex items-center justify-center shrink-0">
              <stat.icon className="w-4 h-4 text-blue-400/70" />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/25 leading-none mb-1">
                {stat.label}
              </p>
              <p className="text-[18px] font-semibold text-white leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MaturityDiagnostic.tsx ---



// --- Constants & Data ---

const avatars = [
  { name: 'Analista', icon: User },
  { name: 'Ingeniero', icon: Zap },
  { name: 'Líder', icon: Trophy },
  { name: 'Auditor', icon: ShieldCheck },
  { name: 'Innovador', icon: BarChart3 },
];

const dimensions = [
  { id: 0, short: 'Planeación', title: 'Planeación Estratégica', question: '¿Los procesos de tu organización están alineados y priorizados según los objetivos estratégicos, o el área de procesos trabaja desconectada de la estrategia?' },
  { id: 1, short: 'Políticas', title: 'Políticas', question: '¿Existe una política formal de gestión por procesos aprobada por la alta dirección, o cada quien documenta como quiere?' },
  { id: 2, short: 'Comité', title: 'Comité de Procesos', question: '¿Tienen un comité activo con reuniones periódicas que toma decisiones sobre procesos, o las iniciativas de mejora dependen de una sola persona?' },
  { id: 3, short: 'Metodologías', title: 'Metodologías', question: '¿Utilizan metodologías estandarizadas (BPMN, Lean, Six Sigma) para gestionar procesos, o cada área usa su propio método improvisado?' },
  { id: 4, short: 'Herramientas', title: 'Herramientas', question: '¿Cuentan con herramientas tecnológicas especializadas para modelar y documentar procesos, o todavía usan Visio, Word o PowerPoint?' },
  { id: 5, short: 'Indicadores', title: 'Indicadores (KPIs)', question: '¿Cada proceso crítico tiene indicadores definidos, medidos y con metas claras, o miden por cumplir sin saber si realmente generan valor?' },
  { id: 6, short: 'Riesgos', title: 'Riesgos y Controles', question: '¿Tienen una matriz de riesgos operativos integrada a los procesos con controles definidos, o los riesgos se gestionan solo cuando hay auditorías?' },
  { id: 7, short: 'Innovación', title: 'Innovación', question: '¿Han implementado RPA, Process Mining o IA en sus procesos, o la "automatización" es pasar de papel a Excel?' },
  { id: 8, short: 'Cultura', title: 'Cultura', question: '¿Los dueños de proceso y las áreas entienden y viven la gestión por procesos, o lo ven como un trámite burocrático del área de calidad?' },
  { id: 9, short: 'Auditoría', title: 'Auditoría Interna', question: '¿Auditoría interna evalúa la eficacia real de los procesos y genera valor, o solo verifican que existan documentos?' }
];

const scaleLabels = [
  '',
  '1 — No existe / No se ha considerado',
  '2 — Inicial / Esfuerzos aislados',
  '3 — Definido / En desarrollo',
  '4 — Gestionado / Implementado parcialmente',
  '5 — Optimizado / Mejora continua'
];

const axisXQ = [
  '¿Tienen flujogramas/diagramas de proceso actualizados para sus procesos críticos?',
  '¿Cada flujograma tiene su procedimiento documentado con roles, responsables y políticas?',
  '¿Utilizan fichas SIPOC para definir el alcance de sus procesos?',
  '¿Tienen una Matriz de Riesgos Operativos vinculada a cada proceso con controles definidos?',
  '¿Cada proceso tiene KPIs definidos con metas, frecuencia de medición y responsables?'
];

const axisYQ = [
  '¿Han implementado RPA (Automatización Robótica de Procesos) en al menos un proceso?',
  '¿Utilizan Process Mining para analizar el comportamiento real de sus procesos con datos?',
  '¿Han integrado Agentes de IA o asistentes inteligentes en algún flujo de trabajo?',
  '¿Usan herramientas de BI (dashboards automatizados) para monitorear procesos en tiempo real?',
  '¿Tienen un roadmap de transformación digital que conecte tecnología con la mejora de procesos?'
];

// --- Component ---

const MaturityDiagnostic = () => {
  const [screen, setScreen] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [h1Scores, setH1Scores] = useState<number[]>(new Array(10).fill(0));
  const [h2XScores, setH2XScores] = useState<number[]>(new Array(5).fill(0));
  const [h2YScores, setH2YScores] = useState<number[]>(new Array(5).fill(0));
  const [showDownload, setShowDownload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const radarRef = useRef<HTMLCanvasElement>(null);
  const cartesianRef = useRef<HTMLCanvasElement>(null);
  const radarMiniRef = useRef<HTMLCanvasElement>(null);
  const cartesianMiniRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Logic ---

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleH1Score = (idx: number, val: number) => {
    const newScores = [...h1Scores];
    newScores[idx] = val;
    setH1Scores(newScores);
  };

  const handleH2Score = (axis: 'x' | 'y', idx: number, val: number) => {
    if (axis === 'x') {
      const newScores = [...h2XScores];
      newScores[idx] = val;
      setH2XScores(newScores);
    } else {
      const newScores = [...h2YScores];
      newScores[idx] = val;
      setH2YScores(newScores);
    }
  };

  const isH1Complete = h1Scores.every(s => s > 0);
  const isH2Complete = h2XScores.every(s => s > 0) && h2YScores.every(s => s > 0);

  // --- Drawing ---

  useEffect(() => {
    if (screen === 4 && radarRef.current) {
      drawRadar(radarRef.current, h1Scores);
    }
    if (screen === 6 && cartesianRef.current) {
      drawCartesian(cartesianRef.current, h2XScores, h2YScores);
    }
    if (screen === 7) {
      if (radarMiniRef.current) drawRadar(radarMiniRef.current, h1Scores);
      if (cartesianMiniRef.current) drawCartesian(cartesianMiniRef.current, h2XScores, h2YScores);
    }
  }, [screen, h1Scores, h2XScores, h2YScores]);

  const drawRadar = (canvas: HTMLCanvasElement, scores: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 50;
    const n = 10;

    ctx.clearRect(0, 0, size, size);

    // Draw background circles
    for (let lv = 1; lv <= 5; lv++) {
      const r = (lv / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.1)';
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.08)';
      ctx.stroke();
    }

    // Draw data
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const val = scores[idx] || 0;
      const r = (val / 5) * maxR;
      const a = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 163, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#00A3FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = '10px Outfit';
    ctx.fillStyle = '#8B95A8';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const lr = maxR + 25;
      ctx.fillText(dimensions[i].short, cx + lr * Math.cos(a), cy + lr * Math.sin(a) + 4);
    }
  };

  const drawCartesian = (canvas: HTMLCanvasElement, xScores: number[], yScores: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const pad = 60;
    const ps = size - pad * 2;
    const mid = pad + ps / 2;

    ctx.clearRect(0, 0, size, size);

    // Background quadrants
    ctx.fillStyle = 'rgba(255, 64, 87, 0.04)'; ctx.fillRect(pad, mid, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.04)'; ctx.fillRect(mid, mid, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.04)'; ctx.fillRect(pad, pad, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.04)'; ctx.fillRect(mid, pad, ps / 2, ps / 2);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 1; i <= 4; i++) {
      const p = pad + (ps * i / 5);
      ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, pad + ps); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(pad + ps, p); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad + ps); ctx.lineTo(pad + ps, pad + ps); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ps); ctx.stroke();

    // Mid lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath(); ctx.moveTo(mid, pad); ctx.lineTo(mid, pad + ps); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(pad + ps, mid); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)'; ctx.fillText('⚡ Innovación Caótica', pad + ps * 0.25, pad + ps * 0.15);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.5)'; ctx.fillText('🚀 Gestión Inteligente', pad + ps * 0.75, pad + ps * 0.15);
    ctx.fillStyle = 'rgba(255, 64, 87, 0.5)'; ctx.fillText('🔥 Zona de Caos', pad + ps * 0.25, pad + ps * 0.9);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.5)'; ctx.fillText('📄 Gestión de Papel', pad + ps * 0.75, pad + ps * 0.9);

    // Data point
    const xAvg = xScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = yScores.reduce((a, b) => a + b, 0) / 5;
    const px = pad + ((xAvg - 0.5) / 5) * ps;
    const py = pad + ps - ((yAvg - 0.5) / 5) * ps;

    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#00E5FF';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const generateShareImage = () => {
    const canvas = shareCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 900;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#06080F';
    ctx.fillRect(0, 0, width, height);

    // Border glow
    ctx.strokeStyle = 'rgba(0, 163, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Header
    ctx.fillStyle = '#00A3FF';
    ctx.font = 'bold 14px Outfit';
    ctx.fillText('LEAN TRANSFORMATION 2026 — WORKBOOK 1/3', 30, 35);
    ctx.fillStyle = '#8B95A8';
    ctx.font = '12px Outfit';
    ctx.fillText('16 · 17 · 18 de Marzo · El evento de procesos más grande de habla hispana', 30, 55);

    // User
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Outfit';
    ctx.fillText(`${userName} — ${avatars[selectedAvatar || 0].name}`, 30, 85);

    // Line
    ctx.strokeStyle = 'rgba(0, 163, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 100); ctx.lineTo(870, 100); ctx.stroke();

    // Draw mini radar on left
    const rCx = 200, rCy = 300, rMax = 140, n = 10;
    for (let lv = 1; lv <= 5; lv++) {
      const r = (lv / 5) * rMax;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = rCx + r * Math.cos(a);
        const y = rCy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const val = h1Scores[idx];
      const r = (val / 5) * rMax;
      const a = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const x = rCx + r * Math.cos(a);
      const y = rCy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 163, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00A3FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // BPMM
    const bpmm = getBpmmLevel();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText('Madurez BPMM', 60, 480);
    ctx.fillStyle = bpmm.color;
    ctx.font = 'bold 16px Outfit';
    ctx.fillText(`${bpmm.name} (${bpmm.avg.toFixed(1)}/5)`, 200, 480);

    // Draw mini cartesian on right
    const cPad = 490, cSize = 350, cPs = cSize - 80, cOx = cPad + 40, cOy = 130 + 40, cMid = cOx + cPs / 2, cMidY = cOy + cPs / 2;
    ctx.fillStyle = 'rgba(255, 64, 87, 0.06)'; ctx.fillRect(cOx, cMidY, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.06)'; ctx.fillRect(cMid, cMidY, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.04)'; ctx.fillRect(cOx, cOy, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.06)'; ctx.fillRect(cMid, cOy, cPs / 2, cPs / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cOx, cOy + cPs); ctx.lineTo(cOx + cPs, cOy + cPs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cOx, cOy); ctx.lineTo(cOx, cOy + cPs); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath(); ctx.moveTo(cMid, cOy); ctx.lineTo(cMid, cOy + cPs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cOx, cMidY); ctx.lineTo(cOx + cPs, cMidY); ctx.stroke();
    ctx.setLineDash([]);

    const xA = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yA = h2YScores.reduce((a, b) => a + b, 0) / 5;
    const ppx = cOx + ((xA - 0.5) / 5) * cPs;
    const ppy = cOy + cPs - ((yA - 0.5) / 5) * cPs;
    ctx.beginPath(); ctx.arc(ppx, ppy, 6, 0, Math.PI * 2); ctx.fillStyle = '#00E5FF'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

    // Footer
    ctx.fillStyle = 'rgba(0, 163, 255, 0.15)'; ctx.fillRect(0, 505, 900, 15);
    ctx.fillStyle = '#00A3FF';
    ctx.font = '9px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Comparte en la comunidad Process Masters · process-masters.circle.so · #LeanTransformation2026', 450, 514);

    setShowDownload(true);
  };

  const downloadImage = () => {
    const canvas = shareCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'Mi_Diagnostico_LeanTransformation_2026.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ Imagen descargada');
  };

  const getBpmmLevel = () => {
    const avg = h1Scores.reduce((a, b) => a + b, 0) / 10;
    const level = Math.max(1, Math.min(5, Math.round(avg)));
    const names = ['', 'INICIAL', 'REPETIBLE', 'DEFINIDO', 'GESTIONADO', 'OPTIMIZADO'];
    const colors = ['', '#FF4057', '#FF8C42', '#FFCC02', '#4FC3F7', '#00E676'];
    return { name: names[level], color: colors[level], avg };
  };

  const getRecommendations = () => {
    const sorted = dimensions.map((d, i) => ({ ...d, score: h1Scores[i] }))
      .sort((a, b) => a.score - b.score);
    
    const gaps = sorted.slice(0, 3);
    const strengths = sorted.slice(-2).reverse();

    const actions = [];
    if (h1Scores[0] <= 2) actions.push('Alinear el mapa de procesos con los objetivos estratégicos.');
    if (h1Scores[1] <= 2) actions.push('Formalizar una política de gestión por procesos aprobada.');
    if (h1Scores[2] <= 2) actions.push('Crear un comité de procesos con poder de decisión.');
    if (h1Scores[3] <= 2) actions.push('Estandarizar las metodologías de gestión (BPMN, Lean).');
    if (h1Scores[4] <= 2) actions.push('Migrar a herramientas especializadas de modelado.');
    if (actions.length < 3) actions.push('Definir indicadores críticos para los procesos clave.');

    return { gaps, strengths, actions };
  };

  // --- Render Screens ---


  const renderScreen1 = () => (
    <div className="flex flex-col items-center text-center py-12">
      <div className="flex items-center gap-8 mb-12">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <Zap className="w-12 h-12 text-primary fill-current" />
        </div>
      </div>
      <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-cyan-accent tracking-widest uppercase mb-6">
        Workbook 1/3 — Lean Transformation 2026
      </div>
      <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white via-cyan-accent to-primary bg-clip-text text-transparent">
        DIAGNÓSTICO DE MADUREZ
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mb-12 leading-relaxed">
        Evalúa el estado actual de tu gestión por procesos y descubre las brechas críticas que impiden tu transformación.
      </p>
      <button 
        onClick={() => setScreen(2)}
        className="btn-primary px-12 py-5 text-lg"
      >
        EMPEZAR DIAGNÓSTICO <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderScreen2 = () => (
    <div className="max-w-2xl mx-auto py-12">
      <div className="glass-panel p-10">
        <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
        <p className="text-slate-400 mb-8">Personaliza tu perfil para generar el informe final.</p>
        
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">¿Cuál es tu nombre?</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Escribe tu nombre..."
              className="w-full bg-bg-dark border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Selecciona tu Avatar</label>
            <div className="grid grid-cols-5 gap-4">
              {avatars.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all group",
                    selectedAvatar === i 
                      ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,163,255,0.2)]" 
                      : "bg-bg-dark border-white/5 hover:border-white/20"
                  )}
                >
                  <a.icon className={cn(
                    "w-8 h-8",
                    selectedAvatar === i ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!userName || selectedAvatar === null}
            onClick={() => setScreen(3)}
            className="w-full btn-primary py-5 text-lg disabled:opacity-30"
          >
            CONTINUAR <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderScreen3 = () => (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-cyan-accent uppercase tracking-widest mb-4">
          Herramienta 1 de 2
        </div>
        <h2 className="text-4xl font-bold mb-4">Madurez de Gestión por Procesos</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">Evalúa 10 dimensiones clave de tu sistema. Responde con total honestidad para obtener un diagnóstico real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {dimensions.map((d, i) => (
          <div key={i} className={cn(
            "glass-panel p-6 transition-all border-l-4",
            h1Scores[i] > 0 ? "border-l-emerald-500" : "border-l-primary/30"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <h4 className="font-bold text-white">{d.title}</h4>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{d.question}</p>
            <select 
              value={h1Scores[i]}
              onChange={(e) => handleH1Score(i, parseInt(e.target.value))}
              className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
            >
              <option value="0">Selecciona tu nivel...</option>
              {scaleLabels.slice(1).map((l, idx) => (
                <option key={idx} value={idx + 1}>{l}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          disabled={!isH1Complete}
          onClick={() => setScreen(4)}
          className="btn-primary px-12 py-5 text-lg disabled:opacity-30"
        >
          VER RESULTADOS <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderScreen4 = () => {
    const bpmm = getBpmmLevel();
    const recs = getRecommendations();
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Tu Diagnóstico de Madurez</h2>
          <p className="text-slate-400">Análisis detallado de tus capacidades actuales.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 glass-panel p-10 flex flex-col items-center">
            <canvas ref={radarRef} width={500} height={500} className="max-w-full" />
          </div>
          <div className="space-y-6">
            <div className="glass-panel p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-brand-purple flex items-center justify-center text-white font-bold text-xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{userName}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest">{avatars[selectedAvatar || 0].name}</div>
                </div>
              </div>
              <div className="space-y-3">
                {dimensions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{d.short}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(h1Scores[i] / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-white w-4">{h1Scores[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Escala BPMM</h4>
              <div className="h-12 flex rounded-xl overflow-hidden mb-4 relative">
                <div className="bpmm-level bg-red-500/80 text-white">L1</div>
                <div className="bpmm-level bg-orange-500/80 text-white">L2</div>
                <div className="bpmm-level bg-yellow-500/80 text-black">L3</div>
                <div className="bpmm-level bg-blue-400/80 text-black">L4</div>
                <div className="bpmm-level bg-emerald-500/80 text-black">L5</div>
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: `${((bpmm.avg - 1) / 4) * 100}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-black tracking-tight" style={{ color: bpmm.color }}>{bpmm.name}</div>
                <div className="text-xs text-slate-500 mt-1">Promedio: {bpmm.avg.toFixed(1)} / 5.0</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" /> Brechas Críticas
            </h3>
            {recs.gaps.map((g, i) => (
              <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div className="font-bold text-sm mb-1">{g.title}</div>
                <div className="text-xs text-slate-400">Nivel {g.score}/5 — Requiere atención inmediata.</div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" /> Fortalezas
            </h3>
            {recs.strengths.map((s, i) => (
              <div key={i} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <div className="font-bold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-slate-400">Nivel {s.score}/5 — Base sólida para escalar.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 mb-12">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Plan de Acción Prioritario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setScreen(5)}
            className="btn-primary px-12 py-5 text-lg"
          >
            CONTINUAR A HERRAMIENTA 2 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };


  const renderScreen5 = () => {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-cyan-accent uppercase tracking-widest mb-4">
            Herramienta 2 de 2
          </div>
          <h2 className="text-4xl font-bold mb-4">Gestión de Papel vs. Innovación</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Descubre si tu organización documenta para cumplir o transforma para generar valor estratégico.</p>
        </div>

        <div className="space-y-12 mb-12">
          <div className="glass-panel p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg"><BarChart3 className="w-5 h-5 text-primary" /></div>
              Eje X — Nivel de Documentación
            </h3>
            <div className="space-y-6">
              {axisXQ.map((q, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-sm text-slate-300 flex-1">{q}</label>
                  <select 
                    value={h2XScores[i]}
                    onChange={(e) => handleH2Score('x', i, parseInt(e.target.value))}
                    className="bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="0">Selecciona...</option>
                    {scaleLabels.slice(1).map((l, idx) => (
                      <option key={idx} value={idx + 1}>{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-brand-purple/20 rounded-lg"><Zap className="w-5 h-5 text-brand-purple" /></div>
              Eje Y — Nivel de Innovación y Tecnología
            </h3>
            <div className="space-y-6">
              {axisYQ.map((q, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-sm text-slate-300 flex-1">{q}</label>
                  <select 
                    value={h2YScores[i]}
                    onChange={(e) => handleH2Score('y', i, parseInt(e.target.value))}
                    className="bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="0">Selecciona...</option>
                    {scaleLabels.slice(1).map((l, idx) => (
                      <option key={idx} value={idx + 1}>{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            disabled={!isH2Complete}
            onClick={() => setScreen(6)}
            className="btn-primary px-12 py-5 text-lg disabled:opacity-30"
          >
            VER MI POSICIÓN <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderScreen6 = () => {
    const xAvg = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = h2YScores.reduce((a, b) => a + b, 0) / 5;
    
    let quadrant = { title: '', desc: '', color: '' };
    if (xAvg >= 3 && yAvg >= 3) {
      quadrant = { title: '🚀 GESTIÓN INTELIGENTE', desc: 'Tu organización tiene la base documental y la capacidad tecnológica para generar valor real. Profundiza la integración: que Process Mining alimente las mejoras de procedimientos y la automatización se base en procesos bien diseñados.', color: 'text-emerald-400' };
    } else if (xAvg < 3 && yAvg >= 3) {
      quadrant = { title: '⚡ INNOVACIÓN CAÓTICA', desc: 'Has invertido en tecnología pero sin la base documental. Estás automatizando el caos. Cada RPA que implementas puede estar automatizando ineficiencias. Necesitas urgentemente construir los cimientos documentales.', color: 'text-brand-purple' };
    } else if (xAvg >= 3 && yAvg < 3) {
      quadrant = { title: '📄 GESTIÓN DE PAPEL', desc: 'Tienes todo documentado pero no generas valor estratégico. Tu área es percibida como burocrática. El área necesita evolucionar de generadora de documentos a generadora de valor con tecnología.', color: 'text-yellow-400' };
    } else {
      quadrant = { title: '🔥 ZONA DE CAOS', desc: 'No tienes procesos documentados ni tecnología. Apagar incendios es tu día a día. Cada día pierdes tiempo, dinero y credibilidad. Los problemas se repiten y la dirección no ve el valor del área.', color: 'text-red-400' };
    }

    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Mapa de Gestión</h2>
          <p className="text-slate-400">Tu posición estratégica según documentación e innovación.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="glass-panel p-10 flex justify-center">
            <canvas ref={cartesianRef} width={500} height={500} className="max-w-full" />
          </div>
          <div className="space-y-8">
            <div className="glass-panel p-10">
              <div className={cn("text-3xl font-black mb-6 tracking-tight", quadrant.color)}>{quadrant.title}</div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">{quadrant.desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Documentación</div>
                  <div className="text-2xl font-bold text-white">{xAvg.toFixed(1)} / 5.0</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Innovación</div>
                  <div className="text-2xl font-bold text-white">{yAvg.toFixed(1)} / 5.0</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => setScreen(7)} className="btn-primary px-12 py-4">
                VER INFORME FINAL <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScreen7 = () => {
    const xAvg = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = h2YScores.reduce((a, b) => a + b, 0) / 5;
    const bpmm = getBpmmLevel();
    const recs = getRecommendations();
    
    let quadrant = { title: '', desc: '', color: '' };
    if (xAvg >= 3 && yAvg >= 3) {
      quadrant = { title: '🚀 GESTIÓN INTELIGENTE', desc: 'Tu organización tiene la base documental y la capacidad tecnológica para generar valor real. Profundiza la integración: que Process Mining alimente las mejoras de procedimientos y la automatización se base en procesos bien diseñados.', color: 'text-emerald-400' };
    } else if (xAvg < 3 && yAvg >= 3) {
      quadrant = { title: '⚡ INNOVACIÓN CAÓTICA', desc: 'Has invertido en tecnología pero sin la base documental. Estás automatizando el caos. Cada RPA que implementas puede estar automatizando ineficiencias. Necesitas urgentemente construir los cimientos documentales.', color: 'text-brand-purple' };
    } else if (xAvg >= 3 && yAvg < 3) {
      quadrant = { title: '📄 GESTIÓN DE PAPEL', desc: 'Tienes todo documentado pero no generas valor estratégico. Tu área es percibida como burocrática. El área necesita evolucionar de generadora de documentos a generadora de valor con tecnología.', color: 'text-yellow-400' };
    } else {
      quadrant = { title: '🔥 ZONA DE CAOS', desc: 'No tienes procesos documentados ni tecnología. Apagar incendios es tu día a día. Cada día pierdes tiempo, dinero y credibilidad. Los problemas se repiten y la dirección no ve el valor del área.', color: 'text-red-400' };
    }

    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Informe Final de Diagnóstico</h2>
          <p className="text-slate-400">Lean Transformation 2026 — Workbook 1/3</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-panel p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" /> Madurez BPMM: {bpmm.name}
            </h3>
            <div className="flex justify-center mb-6">
              <canvas ref={radarMiniRef} width={300} height={300} />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Puntaje Promedio</div>
                <div className="text-2xl font-bold text-white">{bpmm.avg.toFixed(1)} / 5.0</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brechas Críticas</div>
                {recs.gaps.map((g, i) => (
                  <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {g.title} ({g.score}/5)
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-400">
              <BarChart3 className="w-5 h-5" /> Mapa de Gestión
            </h3>
            <div className="flex justify-center mb-6">
              <canvas ref={cartesianMiniRef} width={300} height={300} />
            </div>
            <div className="space-y-4">
              <div className={cn("text-xl font-black tracking-tight text-center", quadrant.color)}>{quadrant.title}</div>
              <p className="text-sm text-slate-400 leading-relaxed text-center">{quadrant.desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Documentación</div>
                  <div className="text-lg font-bold text-white">{xAvg.toFixed(1)}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Innovación</div>
                  <div className="text-lg font-bold text-white">{yAvg.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={generateShareImage} className="btn-primary px-8 py-4">
            <Download className="w-5 h-5" /> GENERAR IMAGEN PARA COMPARTIR
          </button>
          <button onClick={() => window.print()} className="btn-secondary px-8 py-4">
            <Share2 className="w-5 h-5" /> EXPORTAR PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(rgba(0,163,255,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-brand-purple/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {screen === 1 && renderScreen1()}
            {screen === 2 && renderScreen2()}
            {screen === 3 && renderScreen3()}
            {screen === 4 && renderScreen4()}
            {screen === 5 && renderScreen5()}
            {screen === 6 && renderScreen6()}
            {screen === 7 && renderScreen7()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden Canvas for Image Generation */}
      <canvas ref={shareCanvasRef} className="hidden" />

      {/* Download Overlay */}
      <div className={cn("download-overlay", showDownload && "show")}>
        <div className="glass-panel p-8 max-w-4xl w-full flex flex-col items-center">
          <h3 className="text-xl font-bold mb-6">📊 Tu Diagnóstico — Listo para compartir</h3>
          <div className="w-full overflow-hidden rounded-xl border border-white/10 mb-8">
            <canvas 
              ref={(el) => {
                if (el && shareCanvasRef.current) {
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    el.width = shareCanvasRef.current.width;
                    el.height = shareCanvasRef.current.height;
                    ctx.drawImage(shareCanvasRef.current, 0, 0);
                  }
                }
              }} 
              className="w-full h-auto" 
            />
          </div>
          <div className="flex gap-4">
            <button onClick={downloadImage} className="btn-primary px-8 py-3">
              <Download className="w-5 h-5" /> DESCARGAR IMAGEN
            </button>
            <button onClick={() => setShowDownload(false)} className="btn-secondary px-8 py-3">
              CERRAR
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={cn("toast", toast && "show")}>
        {toast}
      </div>
    </div>
  );
};

// --- ProcessAnalyzer.tsx ---



// ─── BPMN XML Generator (compatible con Bizagi) ───────────────────────────────

const escapeXML = (str: string) => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateBPMNXML = (processName: string, steps: any[]) => {
  const lanes = [...new Set(steps.map(s => s.lane))] as string[];
  const escapedProcessName = escapeXML(processName || "Proceso de Negocio");
  const LANE_HEIGHT = 200;
  const LANE_WIDTH = (steps.length + 3) * 200;
  const ACTIVITY_WIDTH = 120;
  const ACTIVITY_HEIGHT = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;
  const HORIZONTAL_SPACING = 200;
  const START_X = 150;

  const laneYMap: Record<string, number> = {};
  lanes.forEach((lane, idx) => { laneYMap[lane] = idx * LANE_HEIGHT; });

  const getBPMNTag = (step: any) => {
    if (step.type === 'gateway') return 'bpmn:exclusiveGateway';
    switch (step.subType) {
      case 'send':         return 'bpmn:sendTask';
      case 'receive':      return 'bpmn:receiveTask';
      case 'user':         return 'bpmn:userTask';
      case 'manual':       return 'bpmn:manualTask';
      case 'service':      return 'bpmn:serviceTask';
      case 'businessRule': return 'bpmn:businessRuleTask';
      default:             return 'bpmn:task';
    }
  };

  const getPrefix = (step: any) => step.type === 'gateway' ? 'Gateway' : 'Activity';

  const laneElements = lanes.map((lane, idx) => `
      <bpmn:lane id="Lane_${idx}" name="${escapeXML(lane)}">
        ${steps.filter(s => s.lane === lane).map(s => {
          const sIdx = steps.indexOf(s);
          return `<bpmn:flowNodeRef>${getPrefix(s)}_${sIdx}</bpmn:flowNodeRef>`;
        }).join('\n        ')}
        ${lane === steps[0].lane ? '<bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>' : ''}
        ${lane === steps[steps.length - 1].lane ? '<bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>' : ''}
      </bpmn:lane>`).join('');

  const flowNodes = steps.map((s, idx) => {
    const tag = getBPMNTag(s);
    const id = `${getPrefix(s)}_${idx}`;
    const name = escapeXML(s.name);
    
    let incoming = [`Flow_${idx}`];
    if (idx < steps.length - 1 && steps[idx + 1].type === 'gateway') {
      incoming.push(`Flow_${idx + 1}_No`);
    }
    
    let outgoing = [`Flow_${idx + 1}`];
    if (s.type === 'gateway') {
      outgoing.push(`Flow_${idx}_No`);
    }

    const incomingXml = incoming.map(f => `\n      <bpmn:incoming>${f}</bpmn:incoming>`).join('');
    const outgoingXml = outgoing.map(f => `\n      <bpmn:outgoing>${f}</bpmn:outgoing>`).join('');
    
    if (s.type === 'gateway') {
      return `\n    <bpmn:exclusiveGateway id="${id}" name="${name}" gatewayDirection="Diverging">${incomingXml}${outgoingXml}\n    </bpmn:exclusiveGateway>`;
    }
    return `\n    <${tag} id="${id}" name="${name}">${incomingXml}${outgoingXml}\n    </${tag}>`;
  }).join('');

  let sequences = steps.map((s, idx) => {
    const source = idx === 0 ? 'StartEvent_1' : `${getPrefix(steps[idx - 1])}_${idx - 1}`;
    const target = `${getPrefix(s)}_${idx}`;
    const nameAttr = idx > 0 && steps[idx - 1].type === 'gateway' ? ' name="Sí"' : '';
    return `<bpmn:sequenceFlow id="Flow_${idx}"${nameAttr} sourceRef="${source}" targetRef="${target}" />`;
  }).join('\n    ');

  steps.forEach((s, idx) => {
    if (s.type === 'gateway' && idx > 0) {
      sequences += `\n    <bpmn:sequenceFlow id="Flow_${idx}_No" name="No" sourceRef="${getPrefix(s)}_${idx}" targetRef="${getPrefix(steps[idx - 1])}_${idx - 1}" />`;
    }
  });
  sequences += `\n    <bpmn:sequenceFlow id="Flow_${steps.length}" sourceRef="${getPrefix(steps[steps.length - 1])}_${steps.length - 1}" targetRef="EndEvent_1" />`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${escapedProcessName}" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">${laneElements}
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio"><bpmn:outgoing>Flow_0</bpmn:outgoing></bpmn:startEvent>
    ${flowNodes}
    <bpmn:endEvent id="EndEvent_1" name="Fin"><bpmn:incoming>Flow_${steps.length}</bpmn:incoming></bpmn:endEvent>
    ${sequences}
  </bpmn:process>
</bpmn:definitions>`;
};

// ─── File reader helpers ──────────────────────────────────────────────────────

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      res(result.split(',')[1]);
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

const readFileAsText = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsText(file);
  });

// ─── Component ───────────────────────────────────────────────────────────────

const ACCEPTED = '.pdf,.doc,.docx,.txt,image/*';
const ACCEPTED_MIME = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'image/png', 'image/jpeg', 'image/webp'];

type Status = 'idle' | 'reading' | 'extracting' | 'analyzing' | 'done' | 'error';

const STATUS_LABELS: Record<Status, string> = {
  idle:       '',
  reading:    'Leyendo archivo...',
  extracting: 'Extrayendo texto con IA...',
  analyzing:  'Analizando proceso con Gemini...',
  done:       '',
  error:      '',
};

const ProcessAnalyzer = () => {
  const [file, setFile]           = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [result, setResult]       = useState<any>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basicos' | 'extendidos'>('extendidos');
  const fileInputRef              = useRef<HTMLInputElement>(null);

  // ── File handling ──
  const acceptFile = (f: File) => {
    if (!ACCEPTED_MIME.some(m => f.type.startsWith(m.split('/')[0]) || f.type === m)) {
      setErrorMsg('Formato no soportado. Usa PDF, Word, TXT o imagen.');
      return;
    }
    setFile(f);
    setErrorMsg('');
    setResult(null);
    setSelectedStepId(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  // ── Main analyze ──
  const handleAnalyze = async () => {
    if (!file && !manualText.trim()) return;

    setStatus('idle');
    setErrorMsg('');
    setResult(null);
    setSelectedStepId(null);

    try {
      let extractedText = '';

      if (file) {
        setStatus('reading');
        const isPDF   = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');
        const isText  = file.type === 'text/plain';

        if (isText) {
          extractedText = await readFileAsText(file);
        } else if (isPDF || isImage) {
          setStatus('extracting');
          const b64 = await readFileAsBase64(file);
          extractedText = await extractTextFromFile(b64, file.type);
        } else {
          // Word — read as text (best effort; for proper Word parsing a server-side lib is needed)
          setStatus('extracting');
          try {
            extractedText = await readFileAsText(file);
          } catch {
            throw new Error('Los archivos .docx requieren conversión previa a PDF o TXT.');
          }
        }
      } else {
        extractedText = manualText;
      }

      if (!extractedText.trim()) throw new Error('No se pudo extraer texto del documento.');

      setStatus('analyzing');
      const parsed = await analyzeProcessFromText(extractedText);

      // Ensure steps have required fields
      const steps = (parsed.steps || []).map((s: any, i: number) => ({
        id: String(s.id || i + 1),
        lane: s.lane || 'General',
        name: s.name || `Paso ${i + 1}`,
        type: s.type || 'task',
        subType: s.subType || 'user',
        description: s.description || '',
        performers: s.performers || '',
        accountable: s.accountable || '',
        consulted: s.consulted || '',
        informed: s.informed || '',
      }));

      setResult({ ...parsed, steps });
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error al analizar el proceso. Verifica tu conexión.');
      setStatus('error');
    }
  };

  // ── Exports ──
  const downloadBPMN = () => {
    if (!result?.steps?.length) return;
    const xml = generateBPMNXML(result.bizagiBasics?.name || result.name, result.steps);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${result.code || 'proceso'}.bpmn`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyBPMN = () => {
    if (!result?.steps?.length) return;
    navigator.clipboard.writeText(generateBPMNXML(result.bizagiBasics?.name || result.name, result.steps));
  };

  const exportToExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    
    // Atributos Básicos y Extendidos (Bizagi)
    if (result.bizagiBasics || result.bizagiExtended) {
      const bizagiData = [
        { Atributo: 'Nombre', Valor: result.bizagiBasics?.name || result.name || '' },
        { Atributo: 'Descripción', Valor: result.bizagiBasics?.description || '' },
        { Atributo: 'Versión', Valor: result.bizagiBasics?.version || '' },
        { Atributo: 'Autor', Valor: result.bizagiBasics?.author || '' },
        { Atributo: 'Objetivo', Valor: result.bizagiExtended?.objective || result.objective || '' },
        { Atributo: 'Alcance', Valor: result.bizagiExtended?.scope || '' },
        { Atributo: 'Categoría', Valor: result.bizagiExtended?.category || '' },
        { Atributo: 'Dueño de Proceso', Valor: result.bizagiExtended?.processOwner || '' },
        { Atributo: 'Marco Normativo', Valor: result.bizagiExtended?.normativeFoundation || '' },
        { Atributo: 'Políticas', Valor: result.bizagiExtended?.policies || '' },
      ];
      const wsBizagi = XLSX.utils.json_to_sheet(bizagiData);
      XLSX.utils.book_append_sheet(wb, wsBizagi, 'Atributos Bizagi');
    }

    const wsSteps = XLSX.utils.json_to_sheet(result.steps.map((s: any) => ({
      'ID': s.id, 'Rol': s.lane, 'Actividad': s.name,
      'Tipo': s.type, 'Subtipo': s.subType, 'Descripción': s.description,
    })));
    XLSX.utils.book_append_sheet(wb, wsSteps, 'Flujo de Proceso');
    if (result.indicators?.length) {
      const wsKpi = XLSX.utils.json_to_sheet(result.indicators.map((k: any) => ({
        'Indicador': k.name, 'Meta': k.goal, 'Frecuencia': k.frequency, 'Fuente': k.source,
      })));
      XLSX.utils.book_append_sheet(wb, wsKpi, 'Indicadores KPI');
    }
    if (result.riskMatrix?.length) {
      const wsRisk = XLSX.utils.json_to_sheet(result.riskMatrix.map((r: any) => ({
        'Riesgo': r.risk, 'Impacto': r.impact, 'Probabilidad': r.probability, 'Mitigación': r.mitigation,
      })));
      XLSX.utils.book_append_sheet(wb, wsRisk, 'Matriz de Riesgos');
    }
    XLSX.writeFile(wb, `${result.code || 'analisis'}.xlsx`);
  };

  const isLoading = ['reading', 'extracting', 'analyzing'].includes(status);

  // ── Render ──
  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-8 h-8 bg-blue-600/15 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <FileSearch className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Analizador de Procesos Externos
          </h1>
        </div>
        <p className="text-[13px] text-white/35 ml-11">
          Sube un PDF o Word y obtén el diagrama BPMN listo para importar en Bizagi
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ── Left panel ── */}
        <div className={cn("space-y-4", result ? "xl:col-span-3" : "xl:col-span-4")}>
          <div className="glass-panel p-6">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/25 mb-4">
              Entrada de datos
            </p>

            {/* Drop zone */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED}
              onChange={onFileInput}
            />
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 py-8 px-4 border border-dashed rounded-xl cursor-pointer transition-all duration-150',
                isDragging
                  ? 'border-blue-500/50 bg-blue-500/[0.06]'
                  : file
                    ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                    : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
              )}
            >
              {file ? (
                <>
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-white/70 truncate max-w-[180px]">{file.name}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setStatus('idle'); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white/25" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-white/45">
                      {isDragging ? '¡Suéltalo aquí!' : 'Arrastra o haz clic'}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5 tracking-wide uppercase">
                      PDF · Word · TXT · Imagen
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Manual text */}
            <div className="mt-3">
              <p className="text-[10px] font-medium text-white/20 mb-2 uppercase tracking-widest">
                O describe el proceso manualmente
              </p>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                disabled={!!file}
                placeholder="Describe el proceso paso a paso..."
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 text-[12.5px] text-white/70 placeholder:text-white/15 focus:outline-none focus:border-blue-500/30 resize-none h-28 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="mt-3 flex items-start gap-2.5 bg-red-500/[0.06] border border-red-500/10 rounded-xl p-3">
                <AlertCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-red-400/70 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading || (!file && !manualText.trim())}
              className="mt-4 w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-semibold tracking-[0.08em] uppercase rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {STATUS_LABELS[status]}
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  Analizar con IA
                </>
              )}
            </button>
          </div>

          {/* Success summary */}
          <AnimatePresence>
            {status === 'done' && result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-panel p-5 border-l-2 border-emerald-500"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-emerald-400">
                    Análisis completado
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { l: 'Actividades', v: result.steps?.length ?? 0 },
                    { l: 'Roles detectados', v: new Set(result.steps?.map((s: any) => s.lane) ?? []).size },
                    { l: 'KPIs generados', v: result.indicators?.length ?? 0 },
                    { l: 'Riesgos identificados', v: result.riskMatrix?.length ?? 0 },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between items-center">
                      <span className="text-[11.5px] text-white/35">{l}</span>
                      <span className="text-[12px] font-semibold text-white/75">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Center & Right panels ── */}
        {!result && !isLoading && (
          <div className="xl:col-span-8">
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel">
              <div className="w-14 h-14 border border-white/[0.06] bg-white/[0.02] rounded-2xl flex items-center justify-center mb-4">
                <FileCode className="w-6 h-6 text-white/10" />
              </div>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/15">
                Sube un archivo para comenzar
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="xl:col-span-8">
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel gap-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] font-medium text-blue-400/70 animate-pulse">
                {STATUS_LABELS[status]}
              </p>
            </div>
          </div>
        )}

        {result && status === 'done' && (
          <>
            {/* ── Center Panel: Process Header & Steps ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="xl:col-span-5 space-y-4"
            >
              {/* Process header */}
              <div className="glass-panel p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-blue-400/60 mb-1.5">
                      Proceso detectado
                    </div>
                    <h2 className="text-[18px] font-semibold text-white tracking-tight leading-tight mb-1">
                      {result.bizagiBasics?.name || result.name}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <Layers className="w-3 h-3" />{result.code || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <Users className="w-3 h-3" />
                        {new Set(result.steps?.map((s: any) => s.lane)).size} roles
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={downloadBPMN}
                      className="flex items-center gap-1.5 h-8 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <Download className="w-3 h-3" /> .BPMN
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1.5 h-8 px-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> Excel
                    </button>
                  </div>
                </div>

                {/* Steps list */}
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {result.steps?.map((step: any, idx: number) => (
                    <div
                      key={step.id}
                      onClick={() => setSelectedStepId(selectedStepId === step.id ? null : step.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group',
                        selectedStepId === step.id
                          ? 'bg-blue-500/[0.08] border-blue-500/25'
                          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                        step.type === 'gateway'
                          ? 'bg-amber-500/15 text-amber-400'
                          : selectedStepId === step.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/[0.04] text-white/25 group-hover:text-white/50'
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9.5px] font-semibold text-blue-400/60 uppercase tracking-wider mb-0.5 truncate">
                          {step.lane}
                        </div>
                        <div className="text-[12.5px] text-white/70 truncate">{step.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BPMN XML preview */}
              {result.steps?.length > 0 && (
                <div className="glass-panel p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-blue-400/60" />
                      <span className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25">
                        PROMPT PARA DIAGRAMADOR (SYSTEM OUTPUT)
                      </span>
                    </div>
                    <button
                      onClick={copyBPMN}
                      className="flex items-center gap-1.5 h-7 px-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9.5px] font-medium text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      <Copy className="w-3 h-3" /> Copiar Texto
                    </button>
                  </div>
                  <pre className="text-[10px] text-white/30 font-mono leading-relaxed overflow-x-auto max-h-40 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 custom-scrollbar">
                    {generateBPMNXML(result.bizagiBasics?.name || result.name, result.steps).slice(0, 800)}...
                  </pre>
                </div>
              )}
            </motion.div>

            {/* ── Right Panel: Metadata Tabs ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="xl:col-span-4"
            >
              <div className="glass-panel p-0 overflow-hidden flex flex-col h-[calc(100vh-120px)] sticky top-6">
                {/* Tabs Header */}
                <div className="flex border-b border-white/[0.05]">
                  <button
                    onClick={() => setActiveTab('basicos')}
                    className={cn(
                      "flex-1 py-3.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all",
                      activeTab === 'basicos'
                        ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/[0.03]"
                        : "text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
                    )}
                  >
                    Básicos
                  </button>
                  <button
                    onClick={() => setActiveTab('extendidos')}
                    className={cn(
                      "flex-1 py-3.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all",
                      activeTab === 'extendidos'
                        ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/[0.03]"
                        : "text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
                    )}
                  >
                    Extendidos
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                  {activeTab === 'basicos' && (
                    <div className="space-y-6">
                      <div className="border border-blue-500/20 bg-blue-500/[0.02] rounded-xl p-4">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Atributos del Proceso</p>
                        <p className="text-[11px] text-white/40 mb-4">Propiedades globales del modelo</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Nombre</p>
                            <p className="text-[12px] text-white/70">{result.bizagiBasics?.name || result.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Descripción</p>
                            <p className="text-[12px] text-white/70">{result.bizagiBasics?.description || '-'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Versión</p>
                              <p className="text-[12px] text-white/70">{result.bizagiBasics?.version || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Autor</p>
                              <p className="text-[12px] text-white/70">{result.bizagiBasics?.author || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'extendidos' && (
                    <div className="space-y-6">
                      <div className="border border-blue-500/20 bg-blue-500/[0.02] rounded-xl p-4">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Atributos del Proceso</p>
                        <p className="text-[11px] text-white/40">Propiedades globales del modelo</p>
                      </div>

                      {/* 1. OBJETIVO */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">1. Objetivo</p>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                          <p className="text-[12px] text-white/70 leading-relaxed">{result.bizagiExtended?.objective || result.objective || '-'}</p>
                        </div>
                      </div>

                      {/* 2. ALCANCE */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">2. Alcance</p>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                          <p className="text-[12px] text-white/70 leading-relaxed">{result.bizagiExtended?.scope || '-'}</p>
                        </div>
                      </div>

                      {/* 3. FUNDAMENTO */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">3. Fundamento</p>
                        {result.foundation?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Documentos internos</th>
                                  <th className="p-2.5 font-medium text-white/40">Documentos externos</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.foundation.map((f: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{f.internal || '-'}</td>
                                    <td className="p-2.5 text-white/70">{f.external || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectó fundamento normativo.</p>
                          </div>
                        )}
                      </div>

                      {/* 4. RESPONSABLE DEL PROCESO */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">4. Responsable del Proceso</p>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                          <p className="text-[12px] text-white/70">{result.bizagiExtended?.processOwner || <span className="text-white/40 italic">No especificado</span>}</p>
                        </div>
                      </div>

                      {/* 5. DEFINICIONES */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">5. Definiciones</p>
                        {result.definitions?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Término</th>
                                  <th className="p-2.5 font-medium text-white/40">Descripción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.definitions.map((d: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70 font-medium">{d.term}</td>
                                    <td className="p-2.5 text-white/60">{d.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron definiciones.</p>
                          </div>
                        )}
                      </div>

                      {/* 6. INDICADORES KPI */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">6. Indicadores KPI</p>
                        {result.indicators?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Indicador</th>
                                  <th className="p-2.5 font-medium text-white/40">Meta</th>
                                  <th className="p-2.5 font-medium text-white/40">Frec.</th>
                                  <th className="p-2.5 font-medium text-white/40">Fuente</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.indicators.map((k: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{k.name}</td>
                                    <td className="p-2.5 text-emerald-400/70">{k.goal}</td>
                                    <td className="p-2.5 text-white/50">{k.frequency}</td>
                                    <td className="p-2.5 text-white/50">{k.source}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron ni propusieron indicadores KPI.</p>
                          </div>
                        )}
                      </div>

                      {/* 7. MATRIZ DE RIESGOS */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">7. Matriz de Riesgos</p>
                        {result.riskMatrix?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Riesgo</th>
                                  <th className="p-2.5 font-medium text-white/40">Imp.</th>
                                  <th className="p-2.5 font-medium text-white/40">Prob.</th>
                                  <th className="p-2.5 font-medium text-white/40">Mitigación</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.riskMatrix.map((r: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{r.risk}</td>
                                    <td className={cn("p-2.5", r.impact === 'Alto' ? 'text-red-400/70' : r.impact === 'Medio' ? 'text-amber-400/70' : 'text-emerald-400/70')}>{r.impact}</td>
                                    <td className="p-2.5 text-white/50">{r.probability}</td>
                                    <td className="p-2.5 text-white/60">{r.mitigation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectó matriz de riesgos.</p>
                          </div>
                        )}
                      </div>

                      {/* 8. RECURSOS */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">8. Recursos</p>
                        {result.resources?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Recurso Humano</th>
                                  <th className="p-2.5 font-medium text-white/40">Materiales e Insumos</th>
                                  <th className="p-2.5 font-medium text-white/40">Medios de Com.</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.resources.map((r: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{r.human || '-'}</td>
                                    <td className="p-2.5 text-white/60">{r.materials || '-'}</td>
                                    <td className="p-2.5 text-white/60">{r.media || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron recursos.</p>
                          </div>
                        )}
                      </div>

                      {/* 9. MATRIZ (SIPOC) */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">9. Matriz (SIPOC)</p>
                        {result.sipocMatrix?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-[11px] min-w-[400px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Proveedor</th>
                                  <th className="p-2.5 font-medium text-white/40">Entrada</th>
                                  <th className="p-2.5 font-medium text-white/40">Proceso</th>
                                  <th className="p-2.5 font-medium text-white/40">Salida</th>
                                  <th className="p-2.5 font-medium text-white/40">Cliente</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.sipocMatrix.map((s: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{s.supplier}</td>
                                    <td className="p-2.5 text-white/60">{s.input}</td>
                                    <td className="p-2.5 text-white/60">{s.process}</td>
                                    <td className="p-2.5 text-white/60">{s.output}</td>
                                    <td className="p-2.5 text-white/70">{s.customer}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectó matriz SIPOC.</p>
                          </div>
                        )}
                      </div>

                      {/* 10. PUNTOS DE CONTROL */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">10. Puntos de Control</p>
                        {result.controlPoints?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Punto de Cont.</th>
                                  <th className="p-2.5 font-medium text-white/40">Responsable</th>
                                  <th className="p-2.5 font-medium text-white/40">Evidencia</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.controlPoints.map((c: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{c.point}</td>
                                    <td className="p-2.5 text-white/60">{c.resp}</td>
                                    <td className="p-2.5 text-white/60">{c.evid}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron puntos de control.</p>
                          </div>
                        )}
                      </div>

                      {/* MODIFICACIÓN */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">11. Modificación</p>
                        {result.modifications?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Fecha</th>
                                  <th className="p-2.5 font-medium text-white/40">Versión</th>
                                  <th className="p-2.5 font-medium text-white/40">Descripción</th>
                                  <th className="p-2.5 font-medium text-white/40">Responsable</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.modifications.map((m: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{m.date}</td>
                                    <td className="p-2.5 text-white/60">{m.version}</td>
                                    <td className="p-2.5 text-white/60">{m.description}</td>
                                    <td className="p-2.5 text-white/70">{m.responsible}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron modificaciones.</p>
                          </div>
                        )}
                      </div>

                      {/* 12. RACI */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">12. RACI</p>
                        {result.raciMatrix?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Ejecutante</th>
                                  <th className="p-2.5 font-medium text-white/40">Responsable</th>
                                  <th className="p-2.5 font-medium text-white/40">Consultado</th>
                                  <th className="p-2.5 font-medium text-white/40">Informado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.raciMatrix.map((r: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{r.exec}</td>
                                    <td className="p-2.5 text-white/60">{r.resp}</td>
                                    <td className="p-2.5 text-white/60">{r.cons}</td>
                                    <td className="p-2.5 text-white/60">{r.info}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectó matriz RACI.</p>
                          </div>
                        )}
                      </div>

                      {/* 13. APROBACIONES */}
                      <div>
                        <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">13. Aprobaciones</p>
                        {result.approvals?.length > 0 ? (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-[11px] min-w-[400px]">
                              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                <tr>
                                  <th className="p-2.5 font-medium text-white/40">Elabora</th>
                                  <th className="p-2.5 font-medium text-white/40">Revisado</th>
                                  <th className="p-2.5 font-medium text-white/40">Verificado</th>
                                  <th className="p-2.5 font-medium text-white/40">Aprobado</th>
                                  <th className="p-2.5 font-medium text-white/40">Fecha</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.02]">
                                {result.approvals.map((a: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2.5 text-white/70">{a.elab}</td>
                                    <td className="p-2.5 text-white/60">{a.rev}</td>
                                    <td className="p-2.5 text-white/60">{a.ver}</td>
                                    <td className="p-2.5 text-white/60">{a.app}</td>
                                    <td className="p-2.5 text-white/50">{a.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                            <p className="text-[12px] text-white/40 italic">No se detectaron aprobaciones.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

// --- App.tsx ---

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [apiKey, setLocalApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(getStoredApiKey());
    }
  }, [isOpen]);

  const handleSave = () => {
    setApiKey(apiKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" /> Configuración
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-bg-dark border border-white/[0.06] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
            <p className="text-xs text-slate-500 mt-2">
              Tu API key se guarda localmente en tu navegador. Es necesaria para usar las funciones de IA si no hay una configurada en el entorno.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary px-6 py-2 text-sm">
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('diagramador');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-dark text-slate-200 antialiased">
      <Sidebar activeId={activeTab} onNavigate={setActiveTab} onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'diagramador' && <ProcessGenerator />}
          {activeTab === 'diagnostico' && <MaturityDiagnostic />}
          {activeTab === 'analyzer'    && <ProcessAnalyzer />}
          {activeTab === 'gap'         && <GapAnalyzer />}
          {activeTab !== 'diagramador' &&
            activeTab !== 'diagnostico' &&
            activeTab !== 'analyzer' &&
            activeTab !== 'gap' && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-white/10">
                <div className="w-12 h-12 rounded-2xl border border-white/[0.06] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h.01M15 9h.01M9 15h6"/>
                  </svg>
                </div>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase">
                  Módulo en desarrollo
                </p>
              </div>
            )}
        </main>
      </div>
      
      <AnimatePresence>
        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}