import type { PrismaClient } from "@prisma/client";

import { formatHotelContext, generateAIResponse } from "@/modules/ai/provider";
import { processBookingInquiry } from "@/modules/booking/inquiry";
import type { Channel } from "@/modules/messaging/types";
import type { ProcessMessageInput, ProcessMessageResult } from "./types";
import { prisma } from "@/lib/prisma";

export class ConversationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "ConversationError";
    this.statusCode = statusCode;
  }
}

export async function processMessage(
  input: ProcessMessageInput,
  options?: { prismaClient?: PrismaClient },
): Promise<ProcessMessageResult> {
  const db = options?.prismaClient ?? prisma;

  if (!input.hotelSlug && !input.hotelId) {
    throw new ConversationError("hotelSlug or hotelId is required.", 400);
  }

  if (!input.message || typeof input.message !== "string" || input.message.trim().length === 0) {
    throw new ConversationError("message is required.", 400);
  }

  // 1. Validate the hotel context & fetch approved hotel knowledge
  const hotel = await db.hotel.findUnique({
    where: input.hotelSlug ? { slug: input.hotelSlug } : { id: input.hotelId! },
    include: {
      rooms: true,
      facilities: true,
      policies: true,
      faqs: true,
    },
  });

  if (!hotel) {
    throw new ConversationError("Hotel not found.", 404);
  }

  // 2. Find or create the conversation
  let conversation = null;

  if (input.conversationId) {
    conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
    });

    if (!conversation || conversation.hotelId !== hotel.id) {
      throw new ConversationError("Conversation not found for this hotel.", 404);
    }
  } else {
    conversation = await db.conversation.create({
      data: {
        hotelId: hotel.id,
        channel: input.channel,
        guestName: input.guestName ?? null,
      },
    });
  }

  // 3. Load existing history and store the guest message
  const conversationMessages = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  const guestMessage = await db.message.create({
    data: {
      conversationId: conversation.id,
      sender: "GUEST",
      text: input.message.trim(),
    },
  });

  const history: Array<{ role: "user" | "assistant" | "system"; content: string }> =
    conversationMessages.map((msg) => ({
      role:
        msg.sender === "GUEST"
          ? "user"
          : msg.sender === "AI"
            ? "assistant"
            : "system",
      content: msg.text,
    }));

  // 4. Format approved hotel knowledge
  const hotelContextText = formatHotelContext({
    hotel: {
      name: hotel.name,
      slug: hotel.slug,
      address: hotel.address,
      phone: hotel.phone,
      email: hotel.email,
    },
    rooms: hotel.rooms.map((room) => ({
      name: room.name,
      description: room.description,
      priceNpr: room.priceNpr,
      capacity: room.capacity,
    })),
    facilities: hotel.facilities.map((facility) => facility.name),
    policies: hotel.policies.map((policy) => ({
      title: policy.title,
      content: policy.content,
    })),
    faqs: hotel.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  });

  // 5. Call the AI provider
  const aiResponse = await generateAIResponse({
    hotelContext: hotelContextText,
    hotelName: hotel.name,
    messages: history,
    userMessage: guestMessage.text,
  });

  // 6. Process booking inquiry extraction & state
  let finalReply = aiResponse.text;
  let bookingInquiryCaptured = false;

  const buildBookingInquiryReply = () =>
    "Thanks! I’ve recorded your booking inquiry and sent the details to our staff. They will confirm availability and get back to you.";

  try {
    const inquiryState = await processBookingInquiry({
      hotelId: hotel.id,
      conversationId: conversation.id,
      extraction: aiResponse.bookingExtraction,
      prismaClient: db as PrismaClient,
    });

    bookingInquiryCaptured = inquiryState.bookingInquiryCaptured;

    if (bookingInquiryCaptured) {
      finalReply = buildBookingInquiryReply();
    }
  } catch (error) {
    console.error("Booking inquiry processing failed:", error);
  }

  // 7. Store the AI response
  const savedAiMessage = await db.message.create({
    data: {
      conversationId: conversation.id,
      sender: "AI",
      text: finalReply,
    },
  });

  // 8. Return result needed by channel adapter
  return {
    conversationId: conversation.id,
    hotelId: hotel.id,
    channel: (conversation.channel as Channel) || input.channel,
    reply: savedAiMessage.text,
    handoffSuggested: aiResponse.suggestedHandoff,
    bookingInquiryCaptured,
  };
}
