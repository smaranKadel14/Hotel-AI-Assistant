import { GoogleGenAI } from "@google/genai";

import { buildPromptPayload, buildSystemInstruction } from "./prompts";
import type {
  BookingExtraction,
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

const parseBookingExtraction = (rawText: string): BookingExtraction | null => {
  let text = rawText.trim();

  if (!text) {
    return null;
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    text = fencedMatch[1].trim();
  }

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    text = text.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(text) as Partial<BookingExtraction> | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      bookingIntent: Boolean(parsed.bookingIntent),
      guestName: typeof parsed.guestName === "string" ? parsed.guestName.trim() || null : null,
      guestEmail: typeof parsed.guestEmail === "string" ? parsed.guestEmail.trim() || null : null,
      guestPhone: typeof parsed.guestPhone === "string" ? parsed.guestPhone.trim() || null : null,
      roomType: typeof parsed.roomType === "string" ? parsed.roomType.trim() || null : null,
      checkIn: typeof parsed.checkIn === "string" ? parsed.checkIn.trim() || null : null,
      checkOut: typeof parsed.checkOut === "string" ? parsed.checkOut.trim() || null : null,
    };
  } catch (error) {
    console.warn("Failed to parse booking extraction from Gemini response:", error);
    return null;
  }
};

const parseGeminiReply = (responseText: string) => {
  const normalized = responseText.trim();
  const textMatch = normalized.match(/TEXT:\s*([\s\S]*?)(?:\n\s*BOOKING_EXTRACTION\s*:\s*|$)/i);
  const extractionMatch = normalized.match(/BOOKING_EXTRACTION\s*:\s*([\s\S]*)$/i);

  const plainText = textMatch?.[1]?.trim() || normalized;
  const extractionText = extractionMatch?.[1]?.trim() || "";

  return {
    text: plainText,
    extraction: extractionText ? parseBookingExtraction(extractionText) : null,
  };
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
    ) + `\n\nYou must respond in exactly this format:\nTEXT:\n<plain, guest-facing reply to the guest>\nBOOKING_EXTRACTION:\n{ "bookingIntent": boolean, "guestName": string|null, "guestEmail": string|null, "guestPhone": string|null, "roomType": string|null, "checkIn": string|null, "checkOut": string|null }\n\nRules:\n- The TEXT portion must be a natural customer-facing reply.\n- The TEXT must never say a reservation is confirmed or guaranteed.\n- Use “booking inquiry” wording consistently when discussing an inquiry.\n- If booking details are being collected, clearly say that staff must confirm availability.\n- The BOOKING_EXTRACTION portion must be valid JSON only and must not include markdown or code fences.\n- Only include values the guest actually provided or that can be safely inferred from the conversation.\n- If a value is unknown, use null.\n- Do not invent room prices, dates, or bookings.\n- Only use the hotel knowledge base for room details and prices; do not invent pricing.`;

    console.log("=== DEBUG: PROMPT LENGTH ===", promptText.length);
    console.log("=== DEBUG: MODEL ===", model);

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{ text: promptText }],
      }],
    });

    const rawText = response.text?.trim() || "I can only answer from the hotel information provided. Please contact the front desk for anything beyond that.";
    const parsedReply = parseGeminiReply(rawText);
    const text = parsedReply.text || rawText;

    return {
      text,
      suggestedHandoff: inferHandoff(text),
      bookingExtraction: parsedReply.extraction,
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
