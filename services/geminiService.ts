
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Refactored to follow @google/genai guidelines:
   * 1. Initialize GoogleGenAI with named parameter apiKey from process.env.API_KEY.
   * 2. Create a new instance right before making an API call.
   * 3. Use 'gemini-3-flash-preview' for basic text/vision tasks.
   * 4. Use config.systemInstruction for persona definition.
   * 5. Access .text property directly from the response.
   */
  async getStyleRecommendation(userInput: string, base64Image?: string) {
    try {
      // Create a fresh instance for the request
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [{ text: `Analise o seguinte pedido do cliente: "${userInput}"` }];
      
      if (base64Image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          systemInstruction: "Você é um estilista e barbeiro expert do app \"Fila Livre\". Dê uma sugestão detalhada de corte de cabelo ou estilo que combine com o pedido. Seja encorajador e profissional. Responda em Português do Brasil.",
          temperature: 0.7,
        }
      });

      // Directly access .text property
      return response.text || "Desculpe, não consegui processar sua recomendação agora.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Houve um erro ao consultar a IA. Tente novamente mais tarde.";
    }
  }
}

export const geminiService = new GeminiService();
