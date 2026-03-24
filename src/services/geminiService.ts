import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Diagramador ────────────────────────────────────────────────────────────

export const generateProcessDiagram = async (input: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Analiza el siguiente texto y extrae un proceso de negocio estructurado para BPMN 2.0.
Devuelve una lista de pasos numerados con los actores involucrados.
Sé claro y conciso. Usa formato Markdown.

Texto: ${input}`,
    config: { temperature: 0.5 }
  });
  return response.text;
};

// ─── Analizador — convierte texto extraído en JSON estructurado ─────────────

export const analyzeProcessFromText = async (text: string): Promise<any> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Eres un experto Consultor BPM y especialista en Bizagi Modeler. Tu tarea es analizar de forma SUPER MINUCIOSA y EXHAUSTIVA el siguiente documento de proceso. Debes extraer absolutamente toda la información estructurada, sin omitir detalles, enfocándote en mapear perfectamente los atributos Básicos y Extendidos de Bizagi.

Instrucciones Críticas:
1. NO resumas. Extrae el texto completo y detallado para cada campo.
2. Si un dato no está explícito pero se puede inferir claramente del contexto, infiérelo (ej. si no dice "Dueño" pero menciona "El Gerente de Ventas es el responsable de todo el proceso", pon "Gerente de Ventas").
3. Si el documento original no incluye explícitamente KPIs, Matriz de Riesgos, Puntos de Control, SIPOC, RACI o Recursos, DEBES PROPONERLOS basándote en las mejores prácticas de la industria para ese tipo de proceso. Nunca dejes estas matrices vacías.
4. Para los "steps" (pasos), extrae CADA UNA de las actividades mencionadas, por más pequeña que sea.

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:
{
  "bizagiBasics": {
    "name": "Nombre completo y oficial del proceso",
    "description": "Descripción detallada y completa del proceso",
    "version": "Versión (ej: 1.0)",
    "author": "Autor, área responsable o creador"
  },
  "bizagiExtended": {
    "objective": "Objetivo principal y secundario del proceso (para qué existe)",
    "scope": "Alcance detallado (dónde inicia, dónde termina, qué incluye y qué excluye)",
    "category": "Categoría o macroproceso al que pertenece",
    "processOwner": "Dueño del proceso (rol responsable del resultado final)",
    "normativeFoundation": "Marco normativo, leyes, ISO, resoluciones o base legal",
    "policies": "Políticas, directrices o reglas de negocio generales que rigen el proceso"
  },
  "code": "Código del proceso (ej: OTE001, PR-VEN-01)",
  "development": "Descripción narrativa muy detallada de cómo se desarrolla el proceso de principio a fin",
  "steps": [
    {
      "id": "1",
      "lane": "Nombre EXACTO del rol, cargo o área responsable de esta actividad",
      "name": "Nombre de la actividad (verbo en infinitivo + objeto)",
      "type": "task",
      "subType": "user",
      "description": "Explicación minuciosa de qué se hace, cómo se hace y qué herramientas se usan en esta actividad",
      "performers": "Quién ejecuta físicamente la tarea",
      "accountable": "Quién es el responsable final de que se haga",
      "consulted": "A quién se le consulta durante la tarea",
      "informed": "A quién se le informa al terminar"
    }
  ],
  "indicators": [
    { "name": "Nombre del KPI", "goal": "Meta o fórmula", "frequency": "Frecuencia de medición", "source": "Fuente de los datos" }
  ],
  "riskMatrix": [
    { "risk": "Descripción detallada del riesgo", "impact": "Alto/Medio/Bajo", "probability": "Alta/Media/Baja", "mitigation": "Acciones de mitigación o controles" }
  ],
  "sipocMatrix": [
    { "supplier": "Proveedor (interno o externo)", "input": "Entrada (documento, dato, material)", "process": "Actividad o subproceso", "output": "Salida (entregable)", "customer": "Cliente (interno o externo)" }
  ],
  "controlPoints": [
    { "point": "Qué se controla exactamente", "resp": "Rol responsable del control", "evid": "Evidencia o registro que deja el control" }
  ],
  "raciMatrix": [
    { "exec": "Actividad", "resp": "Rol Responsable (R)", "cons": "Rol Aprobador/Accountable (A)", "info": "Rol Consultado (C) / Informado (I)" }
  ],
  "approvals": [
    { "elab": "Rol que elabora", "rev": "Rol que revisa", "ver": "Rol que verifica", "app": "Rol que aprueba", "date": "Fecha de aprobación" }
  ],
  "resources": [
    { "human": "Perfiles o roles necesarios", "materials": "Sistemas, software, equipos, insumos", "media": "Canales de comunicación usados" }
  ],
  "foundation": [
    { "internal": "Manuales, reglamentos o documentos internos", "external": "Leyes, normas ISO o documentos externos" }
  ],
  "definitions": [
    { "term": "Concepto, sigla o término técnico", "description": "Definición detallada" }
  ],
  "modifications": [
    { "date": "Fecha de cambio", "version": "Versión", "description": "Qué cambió exactamente", "responsible": "Quién aprobó el cambio" }
  ]
}

Reglas para los "steps":
- type puede ser: "task" o "gateway"
- subType puede ser: "user", "manual", "service", "send", "receive", "businessRule"
- Usa "gateway" cuando el proceso tiene una decisión (ej: "¿Aprobado?"). Si es gateway, el "name" debe ser la pregunta.
- Extrae TODOS los pasos en orden cronológico estricto.
- Los "lane" deben ser los nombres reales de los roles/áreas del documento.

Documento a analizar:
${text}`,
    config: { temperature: 0.1 }
  });

  const raw = response.text || '';
  // Strip markdown code blocks if model wraps in them
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
};

// ─── Analizador — extrae texto de imagen/PDF via base64 ─────────────────────

export const extractTextFromFile = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        inlineData: { data: base64Data, mimeType }
      },
      {
        text: "Extrae todo el texto de este documento de forma completa y ordenada. Conserva la estructura, títulos, listas y tablas. No agregues interpretaciones, solo el texto extraído."
      }
    ],
    config: { temperature: 0 }
  } as any);

  return response.text || '';
};