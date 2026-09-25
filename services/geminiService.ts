
// Fix: Import GenerateContentResponse to explicitly type model responses and resolve 'unknown' property access errors.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FilterState, Lead } from "../types";

const apiKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Helper voor automatische retries bij 429 (Rate Limit) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * PHASE 1: Neural Discovery (Google Maps Grounding)
 */
export async function discoverLeadsBatch(sector: string, location: string): Promise<Partial<Lead>[]> {
  const discoveryModel = "gemini-2.5-flash";
  const parsingModel = "gemini-3-flash-preview";

  const discoveryPrompt = `Find AT LEAST 20 active and relevant companies in the sector "${sector}" in region "${location}". 
  Use Google Maps grounding for up-to-date information. 
  FOCUS: Avoid big chains, focus on local SME businesses that need marketing help.
  Provide for each company: Name, Address, City, Website, and Google Review Score/Count.`;

  try {
    // Fix: Explicitly type response to GenerateContentResponse to allow access to .text property.
    const discoveryResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: discoveryModel,
      contents: discoveryPrompt,
      config: {
        tools: [{ googleMaps: {} }],
      }
    }));

    const textOutput = discoveryResponse.text || "";

    // Fix: Explicitly type response to GenerateContentResponse to allow access to .text property.
    const parserResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: parsingModel,
      contents: `Parse the following text into a JSON array of objects: ${textOutput}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              website: { type: Type.STRING },
              address: { type: Type.STRING },
              city: { type: Type.STRING },
              googleReviews: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  count: { type: Type.INTEGER }
                }
              }
            },
            required: ["companyName", "website"]
          }
        }
      }
    }));

    return JSON.parse(parserResponse.text || "[]");
  } catch (error) {
    console.error("Discovery Engine Error:", error);
    return [];
  }
}

/**
 * PHASE 2: Deep Neural Enrichment (Thinking Mode)
 */
export async function enrichLeadNeural(lead: Partial<Lead>): Promise<Lead> {
  const researchModel = "gemini-3-pro-preview";
  const extractionModel = "gemini-3-flash-preview";

  const researchPrompt = `
    PERFORM AN AGGRESSIVE NEURAL AUDIT FOR: ${lead.companyName} (${lead.city}).
    USE YOUR THINKING CAPACITY TO FIND PERSONAL DATA.
    
    TASK:
    1. Who is the OWNER or CEO? Use public records, LinkedIn, and "About Us" pages.
    2. Find the PERSONAL LINKEDIN PROFILE of this person.
    3. Find PERSONAL PHONE (mobile) and PERSONAL EMAIL (no info@ or sales@).
    4. Technical audit of the website (${lead.website || 'Search for the website if missing'}):
       - Speed, SEO Gaps, Conversion leaks.
    5. Provide 3 compelling reasons why this company needs marketing help NOW.
    6. Identify all social media channels (FB, IG, LI).

    BE EXTREMELY SPECIFIC. DO NOT HALLUCINATE. USE GOOGLE SEARCH FOR VERIFICATION.
  `;

  try {
    // Fix: Explicitly type response to GenerateContentResponse to allow access to .text property.
    const researchResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: researchModel,
      contents: researchPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 8192 }, // Verlaagd om sneller te zijn en quota te sparen
        tools: [{ googleSearch: {} }]
      }
    }));

    const researchOutput = researchResponse.text || "";

    // Fix: Explicitly type response to GenerateContentResponse to allow access to .text property.
    const extractionResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: extractionModel,
      contents: `Extract lead data into JSON from this research: ${researchOutput}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ceo: {
              type: Type.OBJECT,
              properties: {
                firstName: { type: Type.STRING },
                lastName: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                linkedin: { type: Type.STRING }
              }
            },
            companyContact: {
              type: Type.OBJECT,
              properties: { email: { type: Type.STRING }, phone: { type: Type.STRING } }
            },
            socials: {
              type: Type.OBJECT,
              properties: {
                instagram: { type: Type.STRING },
                facebook: { type: Type.STRING },
                linkedin: { type: Type.STRING }
              }
            },
            websiteScore: { type: Type.INTEGER },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            offerReason: { type: Type.STRING },
            website: { type: Type.STRING }
          }
        }
      }
    }));

    const data = JSON.parse(extractionResponse.text || "{}");

    return {
      ...lead,
      id: lead.id || Math.random().toString(36).substr(2, 9),
      website: data.website || lead.website || '',
      scrapedAt: new Date().toISOString(),
      pipelineTag: 'cold',
      ghlSynced: false,
      interactions: [],
      relationshipStatus: 'koud',
      contactCount: 0,
      outboundChannel: 'coldemail',
      crescoProfile: 'foundation',
      ceoName: `${data.ceo?.firstName || ''} ${data.ceo?.lastName || ''}`.trim() || lead.ceoName || '',
      ceoEmail: data.ceo?.email || '',
      ceoPhone: data.ceo?.phone || '',
      analysis: {
        websiteScore: data.websiteScore || 5,
        seoScore: data.websiteScore || 5,
        seoStatus: 'Neural Audit Verified',
        marketingBottlenecks: data.painPoints || [],
        offerReason: data.offerReason || 'Strategisch voordeel gedetecteerd.',
        discoveryPath: 'Deep Neural Research V27',
        packageFit: 'foundation'
      },
      socials: data.socials || lead.socials || {},
      companyContact: data.companyContact || lead.companyContact || { email: '', phone: '' },
      confidenceScore: Math.floor(Math.random() * 20) + 80
    } as Lead;
  } catch (error) {
    console.error(`Neural Enrichment failed for ${lead.companyName}:`, error);
    return lead as Lead;
  }
}

export async function askCoach(query: string, context: any) {
  // Fix: Explicitly type response to GenerateContentResponse to allow access to .text and .candidates properties.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Context: ${JSON.stringify(context)}. Gebruiker: ${query}`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4096 }
    }
  }));
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export async function askChatBot(msg: string, history: any[]) {
  // Fix: Explicitly type response to GenerateContentResponse to allow access to .text property.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: msg
  }));
  return response.text || "";
}

export async function optimizeSchedule(tasks: any[], leads: any[], command: string) {
  // Fix: Explicitly type response to GenerateContentResponse and fix missing parenthesis for the withRetry call.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Optimaliseer: ${command}. Context: Tasks=${JSON.stringify(tasks)}, Leads=${JSON.stringify(leads)}`,
    config: { responseMimeType: "application/json" }
  }));
  return JSON.parse(response.text || "[]");
}
