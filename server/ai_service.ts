import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function generateExecutiveBriefing(stats: any): Promise<string> {
  return `Executive Summary:\n- Total Orders: ${stats.totalOrders || 0}\n- Total Revenue: SAR ${stats.totalRevenue || 0}\n- Active Patrons: ${stats.activeCustomers || 0}\n\nStrategic Outlook:\nBusiness performance remains strong across coffee and bespoke luxury retail segments with steady organic expansion.`;
}

export async function generateExecutiveBriefingFromContext(context: any): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required for AI executive generation.");
  }

  const systemInstruction = `You are the Al Zoal Enterprise Sovereign AI Executive Briefing Intelligence Engine.
You synthesize validated executive business intelligence for high-level leadership.
CRITICAL RULES:
1. Base your interpretation strictly on the provided UNTRUSTED BUSINESS DATA context.
2. Never invent numbers, revenue figures, order counts, or financial metrics. Use exactly the numbers supplied in the context.
3. COGS, Gross Profit, Gross Margin, Operating Expenses, Net Profit, and Cash Flow are UNAVAILABLE and must not be stated as factual numbers.
4. Do not provide unverified numerical forecasts.
5. Return strictly valid JSON adhering to the required schema.`;

  const prompt = `Generate an enterprise executive briefing based on the following verified business context:
${JSON.stringify(context, null, 2)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executive_summary: { type: Type.STRING },
          briefing_type: { type: Type.STRING, description: "Daily, Weekly, or Monthly" },
          risks: { type: Type.STRING, description: "Markdown formatted risks and supply chain alerts" },
          recommendations: { type: Type.STRING, description: "Markdown formatted strategic recommendations" },
          revenue_summary: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              highlight: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["title", "highlight", "text"]
          },
          inventory_summary: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              highlight: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["title", "highlight", "text"]
          },
          customer_summary: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              highlight: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["title", "highlight", "text"]
          }
        },
        required: ["executive_summary", "briefing_type", "risks", "recommendations", "revenue_summary", "inventory_summary", "customer_summary"]
      },
      temperature: 0.2
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty AI generation response.");
  }
  return JSON.parse(text);
}
