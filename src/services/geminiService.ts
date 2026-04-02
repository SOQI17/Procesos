import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

const callWithRetry = async (
  model: string,
  contents: string,
  maxRetries = 2
): Promise<string> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { temperature: 0.3, maxOutputTokens: 2048 },
      });
      return response.text ?? '';
    } catch (error: any) {
      if (isQuotaError(error) && attempt < maxRetries) {
        const delay = getRetryDelay(error);
        console.warn(`[${model}] Cuota alcanzada. Reintentando en ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max reintentos alcanzados');
};

export const generateProcessDiagram = async (input: string): Promise<string> => {
  // Limita el input a 3000 caracteres para no agotar tokens por minuto
  const safeInput = input.length > 3000
    ? input.slice(0, 3000) + '\n[...texto truncado para optimizar tokens]'
    : input;

  const prompt = `Extrae el proceso BPMN 2.0 del siguiente texto.
Devuelve SOLO pasos numerados con formato: "N. [ROL] Nombre de la tarea (tipo: task|gateway|event)"
No agregues explicaciones adicionales.

PROCESO:
${safeInput}`;

  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      console.log(`[geminiService] Usando modelo: ${model}`);
      return await callWithRetry(model, prompt);
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.warn(`[${model}] Cuota agotada, probando siguiente modelo...`);
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Cuota agotada en todos los modelos. ` +
    `Espera 1 minuto y vuelve a intentar. ` +
    `Detalles: ${lastError?.message}`
  );
};