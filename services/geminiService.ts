
import { GoogleGenAI } from "@google/genai";

// Initialize with API key - with fallback if not set
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: any = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.warn("Failed to initialize Gemini AI:", error);
  }
}

/**
 * Uses gemini-3-flash-preview for quick, low-latency chat replies.
 */
export const generateAiReply = async (history: { role: string, content: string }[]) => {
  if (!ai) {
    console.warn("Gemini API not initialized");
    return "I'm temporarily unavailable. Please try again later.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(h => ({
        parts: [{ text: h.content }],
        role: h.role === 'me' ? 'user' : 'model'
      })),
      config: {
        systemInstruction: "You are an AI assistant in Google Messages. You have access to Google Search for real-time info. Keep responses concise, helpful, and use emojis. If asked about facts, use Google Search grounding.",
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });

    // Directly access the .text property from GenerateContentResponse
    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong. Please check your connection.";
  }
};

/**
 * Uses gemini-flash-lite-latest for extremely fast message variations.
 */
export const magicCompose = async (context: string) => {
  if (!ai) {
    return ["Sounds good!", "I'll be there.", "Can't wait!"];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Conversation Context:\n${context}\n\nTask: Suggest 3 short, contextually relevant message variations.`,
      config: {
        systemInstruction: "Return exactly 3 variations separated by '|'. No other text.",
      }
    });
    return response.text?.split('|').map((s: string) => s.trim()).filter(Boolean) || [];
  } catch (error) {
    console.warn("Magic compose error:", error);
    return ["Sounds good!", "I'll be there.", "Can't wait!"];
  }
};

/**
 * Uses gemini-3-pro-preview for deep analysis of conversation history.
 */
export const analyzeConversation = async (history: { sender: string, text: string }[]) => {
  if (!ai) {
    return null;
  }

  try {
    const context = history.map(h => `${h.sender}: ${h.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Conversation History:\n${context}\n\nTask: Provide a 1-sentence summary of this conversation and list up to 3 smart action items or follow-ups.`,
      config: {
        systemInstruction: "Return a JSON object with 'summary' (string) and 'actions' (array of strings).",
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.warn("Analysis Error:", error);
    return null;
  }
};
