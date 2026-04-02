import { GoogleGenAI } from "@google/genai";

let ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const setApiKey = (key: string) => {
  ai = new GoogleGenAI({ apiKey: key || process.env.GEMINI_API_KEY || '' });
  localStorage.setItem('gemini_api_key', key);
};

export const getStoredApiKey = () => {
  return localStorage.getItem('gemini_api_key') || '';
};

// Initialize with stored key if available
const storedKey = getStoredApiKey();
if (storedKey) {
  ai = new GoogleGenAI({ apiKey: storedKey });
}

// Espera ms milisegundos
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Extrae el retryDelay del mensaje de error (en segundos)
const getRetryDelay = (error: any): number => {
  try {
    const msg: string = error?.message || '';
    const match = msg.match(/retry in (\d+(\.\d+)?)s/i);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000 + 500; // +500ms buffer
  } catch {}
  return 20000; // fallback 20s
};

const isQuotaError = (error: any): boolean => {
  const msg: string = error?.message || '';
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    error?.status === 429
  );
};

// Modelos en orden de preferencia (free tier)
const MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

const callWithRetry = async (
  contents: any,
  config: any = {},
  maxRetries = 2
): Promise<string> => {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[geminiService] Usando modelo: ${model}, intento: ${attempt + 1}`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { maxOutputTokens: 2048, ...config },
        });
        return response.text ?? '';
      } catch (error: any) {
        if (isQuotaError(error)) {
          if (attempt < maxRetries) {
            const delay = getRetryDelay(error);
            console.warn(`[${model}] Cuota alcanzada. Reintentando en ${delay}ms...`);
            await sleep(delay);
            continue;
          } else {
            console.warn(`[${model}] Cuota agotada tras reintentos, probando siguiente modelo...`);
            lastError = error;
            break; // Break out of the attempt loop, go to next model
          }
        }
        throw error; // Throw non-quota errors immediately
      }
    }
  }

  throw new Error(
    `Cuota agotada en todos los modelos. ` +
    `Espera 1 minuto y vuelve a intentar. ` +
    `Detalles: ${lastError?.message}`
  );
};

export const generateProcessDiagram = async (input: string): Promise<string> => {
  // Limita el input a 3000 caracteres para no agotar tokens por minuto
  const safeInput = input.length > 3000
    ? input.slice(0, 3000) + '\n[...texto truncado para optimizar tokens]'
    : input;

  const prompt = `Analiza el siguiente texto y extrae un proceso de negocio estructurado para BPMN 2.0.
Devuelve una lista de pasos numerados con los actores involucrados.
Sé claro y conciso. Usa formato Markdown.

Texto: ${safeInput}`;

  return await callWithRetry(prompt, { temperature: 0.5 });
};

// ─── Analizador — convierte texto extraído en JSON estructurado ─────────────

export const analyzeProcessFromText = async (text: string): Promise<any> => {
  const safeInput = text.length > 4000
    ? text.slice(0, 4000) + '\n[...texto truncado para optimizar tokens]'
    : text;

  const prompt = `Eres un experto Consultor BPM y especialista en Bizagi Modeler. Tu tarea es analizar de forma SUPER MINUCIOSA y EXHAUSTIVA el siguiente documento de proceso. Debes extraer absolutamente toda la información estructurada, sin omitir detalles, enfocándote en mapear perfectamente los atributos Básicos y Extendidos de Bizagi.

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
${safeInput}`;

  const raw = await callWithRetry(prompt, { temperature: 0.1 });
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
};

export const analyzeProcessGap = async (text: string): Promise<any> => {
  const safeInput = text.length > 4000
    ? text.slice(0, 4000) + '\n[...texto truncado para optimizar tokens]'
    : text;

  const prompt = `Eres un auditor experto en BPM, BPMN 2.0 y operación hotelera Marriott International (Tier 1).
Tu análisis tiene peso corporativo. No produces texto genérico. Cada afirmación es técnica, específica y accionable.

PROCESO A ANALIZAR:
${safeInput}

---

INSTRUCCIONES DE ANÁLISIS:

Evalúa el proceso anterior bajo los siguientes ejes. Responde EXACTAMENTE en la estructura JSON definida al final. No agregues texto fuera del JSON.

EJES DE EVALUACIÓN:
1. Coherencia lógica del flujo end-to-end (inicio → fin sin ambigüedades)
2. Corrección BPMN 2.0: tipos de eventos, subtipos de tareas (user/send/service/manual/businessRule/script), gateways (XOR/OR/AND/Event-Based), marcadores de loop/compensation, eventos intermedios
3. Alineación operativa Marriott: GXP (Guest Experience Platform), Qualtrics, OPERA/PMS, Service Recovery, MOD, Front Office, Rooms Division, F&B si aplica
4. Roles y lanes: coherencia, unicidad de responsabilidad, ausencia de áreas no operativas en procesos operativos
5. Gaps de control: ausencia de SLAs, escalaciones, validaciones, notificaciones automáticas
6. Riesgos operativos: puntos de falla, cuellos de botella, ausencia de manejo de excepciones

REGLAS CRÍTICAS:
- GXP es el sistema eje de gestión de feedback, service recovery y alertas de experiencia. Qualtrics es la herramienta de captura de encuestas post-estancia. No son intercambiables.
- Marketing NO participa en procesos operativos de Guest Experience o Service Recovery.
- MOD (Manager on Duty) tiene rol en escalaciones de service recovery, no en captura de feedback rutinario.
- Cada gateway XOR debe tener exactamente 2 flujos de salida etiquetados. Gateways sin etiquetas son errores críticos.
- Un proceso válido tiene exactamente 1 start event y al menos 1 end event. Múltiples end events deben estar justificados.

RESPONDE ÚNICAMENTE CON ESTE JSON (sin markdown, sin texto adicional):

{
  "diagnostico_general": {
    "estado": "correcto | parcialmente_correcto | incorrecto",
    "nivel_madurez": "basico | intermedio | avanzado",
    "resumen_ejecutivo": "string — máximo 3 oraciones, tono corporativo"
  },
  "errores_criticos": [
    {
      "id": "EC-01",
      "elemento": "nombre del elemento afectado",
      "descripcion": "qué está mal",
      "impacto": "por qué es crítico",
      "correccion": "qué debe hacerse"
    }
  ],
  "oportunidades_mejora": [
    {
      "id": "OM-01",
      "tipo": "logica_flujo | bpmn | operacion | control | automatizacion",
      "descripcion": "string",
      "beneficio": "string"
    }
  ],
  "validacion_sistemas_marriott": {
    "GXP": {
      "uso_correcto": true,
      "observaciones": "string"
    },
    "Qualtrics": {
      "uso_correcto": true,
      "observaciones": "string"
    },
    "OPERA_PMS": {
      "uso_correcto": true,
      "observaciones": "string"
    },
    "Service_Recovery": {
      "uso_correcto": true,
      "observaciones": "string"
    }
  },
  "correcciones_flujo": {
    "agregar": ["string"],
    "eliminar": ["string"],
    "reordenar": ["string"],
    "gateways_faltantes": ["string"],
    "gateways_sobrantes": ["string"]
  },
  "validacion_lanes": {
    "lanes_correctos": true,
    "problemas_detectados": ["string"],
    "estructura_ideal": ["string"]
  },
  "flujo_corregido": {
    "nombre_proceso": "string",
    "codigo_proceso": "string",
    "pasos": [
      {
        "orden": 1,
        "lane": "string",
        "nombre": "string",
        "tipo": "startEvent | task | gateway | endEvent | intermediateEvent",
        "subtipo": "user | send | service | manual | businessRule | script | xor | or | and | terminateEnd | messageEnd",
        "descripcion": "string",
        "performers": "string",
        "accountable": "string",
        "sistema": "GXP | Qualtrics | OPERA | POS | Manual | N/A"
      }
    ]
  },
  "recomendaciones_corporativas": {
    "controles_sugeridos": ["string"],
    "riesgos_identificados": ["string"],
    "buenas_practicas": ["string"],
    "kpis_sugeridos": ["string"]
  }
}`;

  const raw = await callWithRetry(prompt, { temperature: 0.1 });
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
};

// ─── Analizador — extrae texto de imagen/PDF via base64 ─────────────────────

export const extractTextFromFile = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const contents = [
    {
      inlineData: { data: base64Data, mimeType }
    },
    {
      text: "Extrae todo el texto de este documento de forma completa y ordenada. Conserva la estructura, títulos, listas y tablas. No agregues interpretaciones, solo el texto extraído."
    }
  ];

  return await callWithRetry(contents, { temperature: 0 });
};