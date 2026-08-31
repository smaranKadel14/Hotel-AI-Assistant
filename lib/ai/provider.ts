import { GoogleGenAI } from "@google/genai";

import { buildPromptPayload, buildSystemInstruction } from "./prompts";
import type {
  ChatMessage,
  GenerateResponseInput,
  GenerateResponseOutput,
  HotelContext,
} from "./types";

const DEFAULT_MODEL = "gemini-3.6-flash";

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

const buildConversationMessages = (messages: ChatMessage[], userMessage: string) => {
  if (!messages.length) {
    return [{
      role: "user" as const,
      parts: [{ text: buildPromptPayload("the hotel", "No hotel data provided.", userMessage) }],
    }];
  }

  const historyText = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [{
    role: "user" as const,
    parts: [{
      text: buildPromptPayload(
        "the hotel",
        "No hotel data provided.",
        `Conversation history:\n${historyText}\n\nCurrent guest question:\n${userMessage}`,
      ),
    }],
  }];
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

  const hotelContextText =
    typeof input.hotelContext === "string"
      ? input.hotelContext
      : formatHotelContext(input.hotelContext);

  const hotelName = input.hotelName ||
    (typeof input.hotelContext === "string" ? "the hotel" : input.hotelContext.hotel.name);

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      baseUrl: "https://generativelanguage.googleapis.com",
    },
  });

  try {
    const promptText = buildPromptPayload(
      hotelName,
      hotelContextText,
      input.messages.length
        ? `Conversation history:\n${input.messages
            .filter((message) => message.role !== "system")
            .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
            .join("\n")}\n\nCurrent guest question:\n${input.userMessage}`
        : input.userMessage,
    );

    console.log("=== DEBUG: PROMPT LENGTH ===", promptText.length);
    console.log("=== DEBUG: MODEL ===", model);

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{ text: promptText }],
      }],
    });

    const text = response.text?.trim() || "I can only answer from the hotel information provided. Please contact the front desk for anything beyond that.";

    return {
      text,
      suggestedHandoff: inferHandoff(text),
    };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    const fallbackMessage =
      "I can only answer using the hotel information provided. If you need a booking or staff assistance, please contact the front desk directly.";

    return {
      text: fallbackMessage,
      suggestedHandoff: true,
    };
  }
}

export { buildPromptPayload, buildSystemInstruction, formatHotelContext };
export default generateAIResponse;
