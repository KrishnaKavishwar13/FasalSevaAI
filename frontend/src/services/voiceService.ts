import axios from "axios";

export const voiceService = {
  async askAssistant(query: string, language?: string): Promise<string> {
    try {
      const res = await axios.post(
        "https://saksham2026.app.n8n.cloud/webhook/d82608f3-923a-4460-a935-c44c4c6b3fed/chat",
        { chatInput: query, language: language || "en" },
        { headers: { "Content-Type": "application/json" } }
      );
      return res.data?.output || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error("Voice assistant error:", error);
      return "I'm having trouble connecting to the server. Please try again later.";
    }
  },
};
