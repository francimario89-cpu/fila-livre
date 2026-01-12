
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Always initialize GoogleGenAI with a named parameter using process.env.API_KEY.
  // It's recommended to create a new instance before making an API call.
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getStyleRecommendation(userInput: string, base64Image?: string) {
    try {
      // Basic Text Tasks (e.g., summarization, proofreading, and simple Q&A): 'gemini-3-flash-preview'
      const model = 'gemini-3-flash-preview';
      const prompt = `Você é um estilista e barbeiro expert do app "Fila Livre". 
      Analise o seguinte pedido do cliente: "${userInput}". 
      Dê uma sugestão detalhada de corte de cabelo ou estilo que combine com o pedido. 
      Seja encorajador e profissional. Responda em Português do Brasil.`;

      let contents: any = prompt;

      if (base64Image) {
        contents = {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        };
      }

      const ai = this.getClient();
      // Use ai.models.generateContent to query GenAI with both the model name and prompt.
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: 0.7,
        }
      });

      // Directly access the .text property on the GenerateContentResponse object.
      return response.text || "Desculpe, não consegui processar sua recomendação agora.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Houve um erro ao consultar a IA. Tente novamente mais tarde.";
    }
  }
}

export const geminiService = new GeminiService();
