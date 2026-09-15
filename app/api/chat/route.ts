import { NextResponse } from "next/server";

import { ConversationError, processMessage } from "@/modules/conversation/service";

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

    if (conversationId !== undefined && !isNonEmptyString(conversationId)) {
      return NextResponse.json(
        { error: "conversationId must be a non-empty string when provided." },
        { status: 400 },
      );
    }

    const result = await processMessage({
      hotelSlug,
      conversationId: conversationId || undefined,
      channel: "WEB",
      message,
    });

    return NextResponse.json({
      conversationId: result.conversationId,
      reply: result.reply,
      handoffSuggested: result.handoffSuggested,
      bookingInquiryCaptured: result.bookingInquiryCaptured,
    });
  } catch (error) {
    if (error instanceof ConversationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Chat route error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
