import React, { useState } from 'react';
import {
  Upload,
  Mic,
  MessageSquare,
  Zap,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Download,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { generateProcessDiagram } from '../services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'texto' | 'archivo';

const stats = [
  { label: 'Diagramas Generados', value: '1,284', icon: Zap },
  { label: 'Tiempo Ahorrado',     value: '420 h', icon: ArrowRight },
  { label: 'Precisión IA',        value: '98.2%', icon: ShieldCheck },
];

export const ProcessGenerator = () => {
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