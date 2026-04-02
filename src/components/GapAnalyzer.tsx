import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { analyzeProcessGap } from '../services/geminiService';

export default function GapAnalyzer() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setStatus('analyzing');
    setErrorMsg('');
    setResult(null);

    try {
      const data = await analyzeProcessGap(text);
      setResult(data);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error al analizar el proceso.');
      setStatus('error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
          <Search className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BPM Gap Analyzer</h1>
          <p className="text-slate-400 text-sm mt-1">Auditoría experta de procesos bajo estándares Marriott International</p>
        </div>
      </div>

      <div className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Descripción del Proceso o XML BPMN
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí el texto descriptivo del proceso o el código XML de BPMN..."
          className="w-full h-48 bg-bg-dark border border-white/[0.06] rounded-xl p-4 text-slate-300 focus:outline-none focus:border-blue-500/50 resize-none font-mono text-sm"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={status === 'analyzing' || !text.trim()}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {status === 'analyzing' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Auditando...</>
            ) : (
              <><Search className="w-4 h-4" /> Ejecutar Auditoría</>
            )}
          </button>
        </div>
        {errorMsg && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Diagnóstico General */}
          <div className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> Diagnóstico General
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-bg-dark rounded-xl border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                <p className="text-white font-medium capitalize">{result.diagnostico_general?.estado?.replace('_', ' ')}</p>
              </div>
              <div className="p-4 bg-bg-dark rounded-xl border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nivel de Madurez</p>
                <p className="text-white font-medium capitalize">{result.diagnostico_general?.nivel_madurez}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {result.diagnostico_general?.resumen_ejecutivo}
            </p>
          </div>

          {/* Errores Críticos */}
          {result.errores_criticos?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Errores Críticos
              </h2>
              <div className="space-y-4">
                {result.errores_criticos.map((err: any, i: number) => (
                  <div key={i} className="p-4 bg-bg-dark rounded-xl border border-red-500/10">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">{err.id}</span>
                      <span className="text-xs text-slate-400">{err.elemento}</span>
                    </div>
                    <p className="text-sm text-white mb-2">{err.descripcion}</p>
                    <div className="text-xs space-y-1">
                      <p><span className="text-slate-500">Impacto:</span> <span className="text-slate-300">{err.impacto}</span></p>
                      <p><span className="text-slate-500">Corrección:</span> <span className="text-emerald-400">{err.correccion}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validación Sistemas Marriott */}
          <div className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Validación Sistemas Marriott</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.validacion_sistemas_marriott || {}).map(([sys, data]: [string, any]) => (
                <div key={sys} className="p-4 bg-bg-dark rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{sys.replace('_', ' ')}</span>
                    {data.uso_correcto ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{data.observaciones}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Oportunidades de Mejora */}
          {result.oportunidades_mejora?.length > 0 && (
            <div className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Oportunidades de Mejora</h2>
              <div className="space-y-3">
                {result.oportunidades_mejora.map((om: any, i: number) => (
                  <div key={i} className="p-4 bg-bg-dark rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{om.id}</span>
                      <span className="text-xs text-slate-400 capitalize">{om.tipo?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-1">{om.descripcion}</p>
                    <p className="text-xs text-emerald-400">Beneficio: {om.beneficio}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flujo Corregido */}
          {result.flujo_corregido?.pasos?.length > 0 && (
            <div className="bg-bg-sidebar border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Flujo Corregido Propuesto</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-bg-dark">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Orden</th>
                      <th className="px-4 py-3">Lane</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Sistema</th>
                      <th className="px-4 py-3 rounded-tr-lg">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.flujo_corregido.pasos.map((paso: any, i: number) => (
                      <tr key={i} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-white">{paso.orden}</td>
                        <td className="px-4 py-3 text-slate-300">{paso.lane}</td>
                        <td className="px-4 py-3 text-white">{paso.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-white/5 rounded text-xs text-slate-300">
                            {paso.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-blue-400">{paso.sistema}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{paso.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
