import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingMetadata, Language, LocationData, ChartData } from "../types";

// Initialize the client
// NOTE: API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SearchResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
  relatedQuestions?: string[];
  chartData?: ChartData;
}

export const searchDeBesties = async (
  query: string, 
  history: {role: string, parts: {text: string}[]}[] = [], 
  language: Language = 'en',
  options: { 
    useThinking?: boolean, 
    location?: LocationData 
  } = {}
): Promise<SearchResult> => {
  try {
    const { useThinking, location } = options;

    // MODEL SELECTION
    // Thinking Mode -> gemini-3-pro-preview
    // Standard Mode -> gemini-2.5-flash (with Search & Maps)
    const modelId = useThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

    const commonInstruction = `
    FORMATTING & STRUCTURE:
    - Use **bold** for place names, key items, or prices to make them stand out.
    - Use bullet points (•) for lists of recommendations.
    - Use clear paragraphs with spacing. Avoid walls of text.
    - Be concise and organized.

    DATA VISUALIZATION:
    If the user asks for a comparison (e.g., prices, ratings, stats) or trends, you MUST provide data for a chart.
    Format the chart section exactly as follows:
    ___CHART_DATA___
    {
      "type": "bar" (or "line" or "pie"),
      "title": "Short Chart Title",
      "xLabel": "Label for X axis (optional)",
      "yLabel": "Label for Y axis (optional)",
      "data": [
        {"label": "Item A", "value": 10},
        {"label": "Item B", "value": 20}
      ]
    }
    `;

    const langInstruction = language === 'fr' 
      ? `LANGUAGE: French (Français).
         TONE: Helpful, smart, and efficient. Use emojis sparingly. Be natural and direct.
         IMPORTANT: Do NOT use overly casual slang.
         RESPONSE FORMAT:
         1. Your main answer (in French), beautifully structured with **bold** text and lists.
         2. (Optional) ___CHART_DATA___ and JSON.
         3. A separator: "___RELATED_QUESTIONS___"
         4. A list of 3 short, catchy follow-up questions in French.`
      : `LANGUAGE: English.
         TONE: Helpful, smart, and efficient. Use emojis sparingly. Be natural and direct.
         IMPORTANT: Do NOT use overly casual slang.
         RESPONSE FORMAT:
         1. Your main answer (in English), beautifully structured with **bold** text and lists.
         2. (Optional) ___CHART_DATA___ and JSON.
         3. A separator: "___RELATED_QUESTIONS___"
         4. A list of 3 short, catchy follow-up questions in English.`;

    // Base instruction
    let systemInstruction = `You are "SpotFinder", the ultimate AI companion for finding recommendations, locations, trends, and facts.
    
    YOUR MISSION:
    - Help users find the absolute best spots, products, and answers.
    ${commonInstruction}
    ${langInstruction}
    
    Example format:
    Here are the best spots I found:

    • **The Place**: It's amazing because...
    • **Another Spot**: Great for...

    ___CHART_DATA___
    { ...json... }
    
    ___RELATED_QUESTIONS___
    Question 1?
    Question 2?
    Question 3?
    `;

    // Configuration
    const config: any = {
      systemInstruction: systemInstruction,
    };

    if (useThinking) {
      // THINKING MODE CONFIG
      config.thinkingConfig = { thinkingBudget: 32768 };
    } else {
      // STANDARD MODE CONFIG (Search + Maps)
      config.tools = [
        { googleSearch: {} },
        { googleMaps: {} }
      ];
      
      // Add Location Context if available
      if (location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        };
      }
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })), // Previous context
        { role: 'user', parts: [{ text: query }] }
      ],
      config: config,
    });

    let fullText = response.text || (language === 'fr' ? "Je n'ai rien trouvé pour ça, désolé !" : "I couldn't find anything for that, sorry!");
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;
    
    let text = fullText;
    let relatedQuestions: string[] = [];
    let chartData: ChartData | undefined;

    const chartMarker = "___CHART_DATA___";
    const questionsMarker = "___RELATED_QUESTIONS___";

    // Helper to find the index of the first marker
    const findSplitIndex = (str: string, m1: string, m2: string) => {
      const i1 = str.indexOf(m1);
      const i2 = str.indexOf(m2);
      if (i1 === -1 && i2 === -1) return -1;
      if (i1 === -1) return i2;
      if (i2 === -1) return i1;
      return Math.min(i1, i2);
    };

    // 1. Extract Main Text
    const splitIndex = findSplitIndex(fullText, chartMarker, questionsMarker);
    if (splitIndex !== -1) {
      text = fullText.substring(0, splitIndex).trim();
    }

    // 2. Extract Chart Data
    if (fullText.includes(chartMarker)) {
      const start = fullText.indexOf(chartMarker) + chartMarker.length;
      let end = fullText.indexOf(questionsMarker, start);
      if (end === -1) end = fullText.length;
      
      const jsonStr = fullText.substring(start, end).trim();
      try {
        // Clean markdown code blocks if present
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '');
        chartData = JSON.parse(cleanJson);
      } catch (e) {
        console.warn("Failed to parse chart JSON", e);
      }
    }

    // 3. Extract Related Questions
    if (fullText.includes(questionsMarker)) {
      const start = fullText.indexOf(questionsMarker) + questionsMarker.length;
      const questionsRaw = fullText.substring(start).trim();
      if (questionsRaw) {
        relatedQuestions = questionsRaw.split('\n')
          .map(line => line.replace(/^[\d\-\.\s\[\]]+/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
      }
    }

    return {
      text,
      groundingMetadata,
      relatedQuestions,
      chartData
    };

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};