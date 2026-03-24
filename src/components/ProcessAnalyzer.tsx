import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import {
  FileSearch, Download, FileCode, CheckCircle2,
  ArrowRight, Layers, Users, Copy, Terminal,
  FileSpreadsheet, AlertCircle, Loader2, Upload,
  FileText, X, ChevronRight,
} from 'lucide-react';
import { analyzeProcessFromText, extractTextFromFile } from '../services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── BPMN XML Generator (compatible con Bizagi) ───────────────────────────────

const generateBPMNXML = (processName: string, steps: any[]) => {
  const lanes = [...new Set(steps.map(s => s.lane))] as string[];
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
      <bpmn:lane id="Lane_${idx}" name="${lane}">
        ${steps.filter(s => s.lane === lane).map(s => `<bpmn:flowNodeRef>${getPrefix(s)}_${s.id}</bpmn:flowNodeRef>`).join('\n        ')}
        ${idx === 0 ? '<bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>' : ''}
        ${idx === lanes.length - 1 ? '<bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>' : ''}
      </bpmn:lane>`).join('');

  const flowNodes = steps.map((s, idx) => {
    const tag = getBPMNTag(s);
    const id = `${getPrefix(s)}_${s.id}`;
    const incoming = `<bpmn:incoming>Flow_${idx}</bpmn:incoming>`;
    const outgoing = `<bpmn:outgoing>Flow_${idx + 1}</bpmn:outgoing>`;
    if (s.type === 'gateway') {
      return `\n    <${tag} id="${id}" name="${s.name}" gatewayDirection="Diverging">
      ${incoming}
      ${outgoing}
      <bpmn:outgoing>Flow_${idx}_No</bpmn:outgoing>
    </${tag}>`;
    }
    const extraIncoming = idx < steps.length - 1 && steps[idx + 1].type === 'gateway'
      ? `\n      <bpmn:incoming>Flow_${idx + 1}_No</bpmn:incoming>` : '';
    return `\n    <${tag} id="${id}" name="${s.name}">
      ${incoming}${extraIncoming}
      ${outgoing}
    </${tag}>`;
  }).join('');

  let sequences = steps.map((s, idx) => {
    const source = idx === 0 ? 'StartEvent_1' : `${getPrefix(steps[idx - 1])}_${steps[idx - 1].id}`;
    const target = `${getPrefix(s)}_${s.id}`;
    const nameAttr = idx > 0 && steps[idx - 1].type === 'gateway' ? ' name="Sí"' : '';
    return `<bpmn:sequenceFlow id="Flow_${idx}"${nameAttr} sourceRef="${source}" targetRef="${target}" />`;
  }).join('\n    ');

  steps.forEach((s, idx) => {
    if (s.type === 'gateway' && idx > 0) {
      sequences += `\n    <bpmn:sequenceFlow id="Flow_${idx}_No" name="No" sourceRef="${getPrefix(s)}_${s.id}" targetRef="${getPrefix(steps[idx - 1])}_${steps[idx - 1].id}" />`;
    }
  });
  sequences += `\n    <bpmn:sequenceFlow id="Flow_${steps.length}" sourceRef="${getPrefix(steps[steps.length - 1])}_${steps[steps.length - 1].id}" targetRef="EndEvent_1" />`;

  let diShapes = `
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="50" y="0" width="${LANE_WIDTH + 100}" height="${lanes.length * LANE_HEIGHT}" />
      </bpmndi:BPMNShape>`;
  diShapes += lanes.map((lane, idx) => `
      <bpmndi:BPMNShape id="Lane_${idx}_di" bpmnElement="Lane_${idx}" isHorizontal="true">
        <dc:Bounds x="80" y="${idx * LANE_HEIGHT}" width="${LANE_WIDTH + 70}" height="${LANE_HEIGHT}" />
      </bpmndi:BPMNShape>`).join('');
  diShapes += `
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="120" y="${laneYMap[steps[0].lane] + LANE_HEIGHT / 2 - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`;
  diShapes += steps.map((s, idx) => {
    const x = START_X + idx * HORIZONTAL_SPACING;
    const id = `${getPrefix(s)}_${s.id}`;
    if (s.type === 'gateway') {
      const y = laneYMap[s.lane] + LANE_HEIGHT / 2 - GATEWAY_SIZE / 2;
      return `\n      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}" isMarkerVisible="true"><dc:Bounds x="${x}" y="${y}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" /></bpmndi:BPMNShape>`;
    }
    const y = laneYMap[s.lane] + LANE_HEIGHT / 2 - ACTIVITY_HEIGHT / 2;
    return `\n      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"><dc:Bounds x="${x}" y="${y}" width="${ACTIVITY_WIDTH}" height="${ACTIVITY_HEIGHT}" /></bpmndi:BPMNShape>`;
  }).join('');
  diShapes += `
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${START_X + steps.length * HORIZONTAL_SPACING + 50}" y="${laneYMap[steps[steps.length - 1].lane] + LANE_HEIGHT / 2 - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`;

  let diEdges = steps.map((s, idx) => {
    const prev = steps[idx - 1];
    const sourceX = idx === 0 ? 156 : START_X + (idx - 1) * HORIZONTAL_SPACING + (prev.type === 'gateway' ? GATEWAY_SIZE : ACTIVITY_WIDTH);
    const sourceY = idx === 0 ? laneYMap[steps[0].lane] + LANE_HEIGHT / 2 : laneYMap[prev.lane] + LANE_HEIGHT / 2;
    const targetX = START_X + idx * HORIZONTAL_SPACING;
    const targetY = laneYMap[s.lane] + LANE_HEIGHT / 2;
    const label = idx > 0 && steps[idx - 1].type === 'gateway'
      ? `\n        <bpmndi:BPMNLabel><dc:Bounds x="${sourceX + 10}" y="${sourceY - 20}" width="15" height="14" /></bpmndi:BPMNLabel>` : '';
    return `\n      <bpmndi:BPMNEdge id="Flow_${idx}_di" bpmnElement="Flow_${idx}"><di:waypoint x="${sourceX}" y="${sourceY}" /><di:waypoint x="${targetX}" y="${targetY}" />${label}</bpmndi:BPMNEdge>`;
  }).join('');

  steps.forEach((s, idx) => {
    if (s.type === 'gateway' && idx > 0) {
      const gx = START_X + idx * HORIZONTAL_SPACING + GATEWAY_SIZE / 2;
      const gy = laneYMap[s.lane] + LANE_HEIGHT / 2 + GATEWAY_SIZE / 2;
      const px = START_X + (idx - 1) * HORIZONTAL_SPACING + ACTIVITY_WIDTH / 2;
      const py = laneYMap[steps[idx - 1].lane] + LANE_HEIGHT / 2 + ACTIVITY_HEIGHT / 2;
      diEdges += `\n      <bpmndi:BPMNEdge id="Flow_${idx}_No_di" bpmnElement="Flow_${idx}_No"><di:waypoint x="${gx}" y="${gy}" /><di:waypoint x="${gx}" y="${gy + 60}" /><di:waypoint x="${px}" y="${py + 60}" /><di:waypoint x="${px}" y="${py}" /><bpmndi:BPMNLabel><dc:Bounds x="${gx + 5}" y="${gy + 10}" width="15" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>`;
    }
  });

  const last = steps[steps.length - 1];
  diEdges += `\n      <bpmndi:BPMNEdge id="Flow_${steps.length}_di" bpmnElement="Flow_${steps.length}"><di:waypoint x="${START_X + (steps.length - 1) * HORIZONTAL_SPACING + (last.type === 'gateway' ? GATEWAY_SIZE : ACTIVITY_WIDTH)}" y="${laneYMap[last.lane] + LANE_HEIGHT / 2}" /><di:waypoint x="${START_X + steps.length * HORIZONTAL_SPACING + 50}" y="${laneYMap[last.lane] + LANE_HEIGHT / 2}" /></bpmndi:BPMNEdge>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${processName}" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">${laneElements}
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio"><bpmn:outgoing>Flow_0</bpmn:outgoing></bpmn:startEvent>
    ${flowNodes}
    <bpmn:endEvent id="EndEvent_1" name="Fin"><bpmn:incoming>Flow_${steps.length}</bpmn:incoming></bpmn:endEvent>
    ${sequences}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">${diShapes}${diEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
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

export const ProcessAnalyzer = () => {
  const [file, setFile]           = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [result, setResult]       = useState<any>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
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
    const xml = generateBPMNXML(result.name, result.steps);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${result.code || 'proceso'}.bpmn`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyBPMN = () => {
    if (!result?.steps?.length) return;
    navigator.clipboard.writeText(generateBPMNXML(result.name, result.steps));
  };

  const exportToExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left panel ── */}
        <div className="lg:col-span-4 space-y-4">
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

        {/* ── Right panel ── */}
        <div className="lg:col-span-8">
          {!result && !isLoading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel">
              <div className="w-14 h-14 border border-white/[0.06] bg-white/[0.02] rounded-2xl flex items-center justify-center mb-4">
                <FileCode className="w-6 h-6 text-white/10" />
              </div>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/15">
                Sube un archivo para comenzar
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel gap-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] font-medium text-blue-400/70 animate-pulse">
                {STATUS_LABELS[status]}
              </p>
            </div>
          )}

          {result && status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Process header */}
              <div className="glass-panel p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-blue-400/60 mb-1.5">
                      Proceso detectado
                    </div>
                    <h2 className="text-[18px] font-semibold text-white tracking-tight leading-tight mb-1">
                      {result.name}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <Layers className="w-3 h-3" />{result.code}
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
                      <Download className="w-3 h-3" /> .BPMN Bizagi
                    </button>
                    <button
                      onClick={copyBPMN}
                      className="flex items-center gap-1.5 h-8 px-3 bg-white/[0.04] border border-white/[0.07] rounded-lg text-[10px] font-semibold text-white/40 hover:text-white/70 transition-all"
                    >
                      <Copy className="w-3 h-3" /> Copiar XML
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1.5 h-8 px-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> Excel
                    </button>
                  </div>
                </div>

                {/* Objective */}
                {result.objective && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
                    <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25 mb-1.5">Objetivo</p>
                    <p className="text-[12.5px] text-white/60 leading-relaxed">{result.objective}</p>
                  </div>
                )}

                {/* Steps list */}
                <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25 mb-3">
                  Flujo de actividades — {result.steps?.length} pasos
                </p>
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
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
                      <div className={cn(
                        'text-[9px] font-medium px-2 py-0.5 rounded-md border shrink-0',
                        step.type === 'gateway'
                          ? 'bg-amber-500/10 border-amber-500/15 text-amber-400/70'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/20'
                      )}>
                        {step.type === 'gateway' ? 'Decisión' : step.subType || 'task'}
                      </div>
                      <ChevronRight className={cn(
                        'w-3 h-3 transition-all shrink-0',
                        selectedStepId === step.id ? 'text-blue-400 rotate-90' : 'text-white/10'
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs & Risks */}
              {(result.indicators?.length > 0 || result.riskMatrix?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.indicators?.length > 0 && (
                    <div className="glass-panel p-5">
                      <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25 mb-3">
                        Indicadores KPI
                      </p>
                      <div className="space-y-2">
                        {result.indicators.map((k: any, i: number) => (
                          <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                            <p className="text-[12px] font-medium text-white/70 mb-1">{k.name}</p>
                            <div className="flex gap-3 text-[10px] text-white/30">
                              <span>Meta: <span className="text-emerald-400/70">{k.goal}</span></span>
                              <span>{k.frequency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.riskMatrix?.length > 0 && (
                    <div className="glass-panel p-5">
                      <p className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25 mb-3">
                        Matriz de Riesgos
                      </p>
                      <div className="space-y-2">
                        {result.riskMatrix.map((r: any, i: number) => (
                          <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                            <p className="text-[12px] font-medium text-white/70 mb-1">{r.risk}</p>
                            <div className="flex gap-3 text-[10px]">
                              <span className={cn(
                                r.impact === 'Alto' ? 'text-red-400/70' :
                                r.impact === 'Medio' ? 'text-amber-400/70' : 'text-emerald-400/70'
                              )}>
                                Impacto: {r.impact}
                              </span>
                              <span className="text-white/25">P: {r.probability}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BPMN XML preview */}
              {result.steps?.length > 0 && (
                <div className="glass-panel p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-blue-400/60" />
                      <span className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-white/25">
                        BPMN XML — listo para Bizagi
                      </span>
                    </div>
                    <button
                      onClick={copyBPMN}
                      className="flex items-center gap-1.5 h-7 px-2.5 bg-white/[0.04] border border-white/[0.07] rounded-lg text-[9.5px] font-medium text-white/35 hover:text-white/60 transition-all"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                  <pre className="text-[10px] text-white/30 font-mono leading-relaxed overflow-x-auto max-h-40 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    {generateBPMNXML(result.name, result.steps).slice(0, 800)}...
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};