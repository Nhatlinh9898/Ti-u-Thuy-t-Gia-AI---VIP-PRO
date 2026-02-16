
import { GoogleGenAI, Type } from "@google/genai";
import { NodeType } from "../types";
import { getSavedSettings } from "../config";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cleanJSON = (text: string): string => {
  try {
    const jsonRegex = /\{[\s\S]*\}|\[[\s\S]*\]/;
    const match = text.match(jsonRegex);
    return match ? match[0] : text;
  } catch {
    return text;
  }
};

const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, backoff = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const isServerError = error.message?.includes('500') || error.message?.includes('503') || error.message?.includes('INTERNAL');
    if (retries > 0 && isServerError) {
      console.warn(`AI Server Error. Retrying... (${retries})`);
      await delay(backoff);
      return fetchWithRetry(fn, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const generateNovelContent = async (
  promptType: string,
  nodeType: NodeType,
  contextPath: string,
  currentContent: string,
  extraParams?: { 
    style?: string; 
    topic?: string; 
    projectOverview?: string;
    parentNodeTitle?: string;
    parentNodeSummary?: string;
  }
): Promise<string> => {
  const settings = getSavedSettings();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  let responseSchema: any = undefined;
  let mimeType = "text/plain";

  const coreLock = extraParams?.projectOverview ? `\nBỐI CẢNH GỐC: ${extraParams.projectOverview}\n` : "";

  switch (promptType) {
    case 'NEW_PROJECT_MEGA_PARTS':
      prompt = `${coreLock}\nÝ tưởng: "${extraParams?.topic}", tạo 10 PHẦN (PART). Trả về JSON.`;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          parts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, type: { type: Type.STRING, enum: ["PART"] } },
              required: ["title", "summary", "type"]
            }
          }
        },
        required: ["title", "overview", "parts"]
      };
      break;

    case 'MEGA_ARCHITECT_CHILDREN':
      const childType = nodeType === 'PART' ? 'CHAPTER' : 'SECTION';
      prompt = `${coreLock}\nNODE CHA: [${extraParams?.parentNodeTitle}] - ${extraParams?.parentNodeSummary}\nTạo 10 ${childType}. Trả về JSON Array.`;
      mimeType = "application/json";
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, type: { type: Type.STRING, enum: [childType] } },
          required: ["title", "summary", "type"]
        }
      };
      break;

    case 'WRITE':
      prompt = `${coreLock}\nVIẾT [${contextPath}]. Nội dung hiện có: ${currentContent.substring(Math.max(0, currentContent.length - 2000))}`;
      break;

    default:
      prompt = `Yêu cầu: ${promptType}`;
  }

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: {
        systemInstruction: settings.systemInstruction,
        responseMimeType: mimeType,
        responseSchema: responseSchema,
        temperature: settings.temperature,
      }
    });

    const result = response.text || "";
    return mimeType === "application/json" ? cleanJSON(result) : result;
  });
};
