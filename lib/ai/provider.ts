import { GoogleGenAI } from "@google/genai";

import { buildPrompt, SYSTEM_PROMPT } from "./prompts";
import type {
  ChatMessage,
  GenerateResponseInput,
  GenerateResponseOutput,
  HotelContext,
} from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";

const formatHotelContext = (hotelContext: HotelContext): string => {
  const rooms = hotelContext.rooms
    .map(
      (room) =>
        `- ${room.name}: ${room.description} | NPR ${room.priceNpr.toLocaleString("en-US")} / night | Capacity ${room.capacity}`,
    )
    .join("\n");

  const facilities = hotelContext.facilities.map((facility) => `- ${facility}`).join("\n");

  const policies = hotelContext.policies
    .map((policy) => `- ${policy.title}: ${policy.content}`)
    .join("\n");

  const faqs = hotelContext.faqs
    .map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`)
    .join("\n");

  return `Hotel: ${hotelContext.hotel.name}\nAddress: ${hotelContext.hotel.address}\nPhone: ${hotelContext.hotel.phone}\nEmail: ${hotelContext.hotel.email}\n\nRooms:\n${rooms}\n\nFacilities:\n${facilities || "- Not provided"}\n\nPolicies:\n${policies || "- Not provided"}\n\nFAQs:\n${faqs || "- Not provided"}`;
};

const buildConversationHistory = (messages: ChatMessage[]): string => {
  if (!messages.length) {
    return "No prior messages.";
  }

  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
};

const inferHandoff = (text: string): boolean => {
  const handoffPattern =
    /front[- ]desk|human support|staff assistance|contact.*desk|please contact|need.*staff|booking inquiry.*front[- ]desk|our team/i;

  return handoffPattern.test(text) || text.trim().length === 0;
};

export async function generateAIResponse(
  input: GenerateResponseInput,
): Promise<GenerateResponseOutput> {
  const model = input.model ?? DEFAULT_MODEL;
  const apiKey = input.apiKey ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallback =
      "I can only answer using the hotel information available here. If you need details not listed, or need a booking handled by staff, please contact the front desk directly.";

    return {
      text: fallback,
      suggestedHandoff: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(
    {
      hotel: input.hotelContext.hotel,
      rooms: input.hotelContext.rooms,
      facilities: input.hotelContext.facilities,
      policies: input.hotelContext.policies,
      faqs: input.hotelContext.faqs,
    },
    buildConversationHistory(input.messages),
    input.userMessage,
  );

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
    });

    const text = response.text?.trim() || "I can only answer from the hotel information provided. Please contact the front desk for anything beyond that.";

    return {
      text,
      suggestedHandoff: inferHandoff(text),
    };
  } catch (error) {
    const fallbackMessage =
      "I can only answer using the hotel information provided. If you need a booking or staff assistance, please contact the front desk directly.";

    return {
      text: fallbackMessage,
      suggestedHandoff: true,
    };
  }
}

export { SYSTEM_PROMPT, formatHotelContext };
export default generateAIResponse;
