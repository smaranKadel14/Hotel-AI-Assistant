import { NextResponse } from "next/server";

import { formatHotelContext, generateAIResponse } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";

type ChatRequestBody = {
  hotelSlug?: unknown;
  message?: unknown;
  conversationId?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const { hotelSlug, message, conversationId } = body;

    if (!isNonEmptyString(hotelSlug)) {
      return NextResponse.json(
        { error: "hotelSlug is required." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(message)) {
      return NextResponse.json(
        { error: "message is required." },
        { status: 400 },
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: { slug: hotelSlug },
      include: {
        rooms: true,
        facilities: true,
        policies: true,
        faqs: true,
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: "Hotel not found." },
        { status: 404 },
      );
    }

    let conversation = null;

    if (conversationId !== undefined) {
      if (!isNonEmptyString(conversationId)) {
        return NextResponse.json(
          { error: "conversationId must be a non-empty string when provided." },
          { status: 400 },
        );
      }

      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation || conversation.hotelId !== hotel.id) {
        return NextResponse.json(
          { error: "Conversation not found for this hotel." },
          { status: 404 },
        );
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          hotelId: hotel.id,
          channel: "WEB",
        },
      });
    }

    const conversationMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });

    const guestMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "GUEST",
        text: message,
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

    console.log('=== DEBUG: HOTEL CONTEXT LENGTH ===', hotelContextText.length);
    console.log('=== DEBUG: HOTEL CONTEXT ===\n', hotelContextText);

    const aiResponse = await generateAIResponse({
      hotelContext: hotelContextText,
      hotelName: hotel.name,
      messages: history,
      userMessage: guestMessage.text,
    });

    const savedAiMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "AI",
        text: aiResponse.text,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply: savedAiMessage.text,
      handoffSuggested: aiResponse.suggestedHandoff,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
