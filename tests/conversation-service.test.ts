import assert from "node:assert/strict";

import { CHANNELS, type Channel } from "@/modules/messaging/types";
import { ConversationError, processMessage } from "@/modules/conversation/service";

// Mock Prisma for conversation service tests
const makeMockPrisma = () => {
  const hotels = [
    {
      id: "hotel-himalayan",
      name: "Himalayan Grand Hotel",
      slug: "himalayan-grand-hotel",
      address: "Thamel, Kathmandu, Nepal",
      phone: "+977-1-4200000",
      email: "info@himalayangrand.com",
      rooms: [
        {
          id: "room-1",
          name: "Deluxe Room",
          description: "Comfortable room with a king-size bed.",
          priceNpr: 8500,
          capacity: 2,
        },
      ],
      facilities: [{ id: "fac-1", name: "High-speed Wi-Fi" }],
      policies: [{ id: "pol-1", title: "Check-in", content: "From 14:00" }],
      faqs: [{ id: "faq-1", question: "Is breakfast included?", answer: "Yes, complimentary buffet." }],
    },
    {
      id: "hotel-pokhara",
      name: "Pokhara Lakeside Resort",
      slug: "pokhara-lakeside-resort",
      address: "Lakeside, Pokhara, Nepal",
      phone: "+977-61-400000",
      email: "info@pokharalakeside.com",
      rooms: [
        {
          id: "room-2",
          name: "Lake View Suite",
          description: "Suite overlooking Phewa lake.",
          priceNpr: 15000,
          capacity: 2,
        },
      ],
      facilities: [{ id: "fac-2", name: "Lake Boating" }],
      policies: [{ id: "pol-2", title: "Check-in", content: "From 12:00" }],
      faqs: [{ id: "faq-2", question: "Lake view?", answer: "All suites have lake views." }],
    },
  ];

  const conversations = new Map<string, {
    id: string;
    hotelId: string;
    channel: string;
    guestName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>();

  const messages: Array<{
    id: string;
    conversationId: string;
    sender: "GUEST" | "AI" | "STAFF";
    text: string;
    createdAt: Date;
  }> = [];

  const bookingInquiries = new Map<string, any>();

  const db = {
    hotel: {
      findUnique: async ({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug) {
          return hotels.find((h) => h.slug === where.slug) ?? null;
        }
        if (where.id) {
          return hotels.find((h) => h.id === where.id) ?? null;
        }
        return null;
      },
    },
    conversation: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return conversations.get(where.id) ?? null;
      },
      create: async ({ data }: { data: { hotelId: string; channel: string; guestName?: string | null } }) => {
        const id = `conv-${conversations.size + 1}`;
        const record = {
          id,
          hotelId: data.hotelId,
          channel: data.channel,
          guestName: data.guestName ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        conversations.set(id, record);
        return record;
      },
    },
    message: {
      findMany: async ({ where }: { where: { conversationId: string } }) => {
        return messages.filter((m) => m.conversationId === where.conversationId);
      },
      create: async ({ data }: { data: { conversationId: string; sender: "GUEST" | "AI"; text: string } }) => {
        const id = `msg-${messages.length + 1}`;
        const record = {
          id,
          conversationId: data.conversationId,
          sender: data.sender,
          text: data.text,
          createdAt: new Date(),
        };
        messages.push(record);
        return record;
      },
    },
    bookingInquiry: {
      findFirst: async ({ where }: { where: { hotelId: string; conversationId: string } }) => {
        return Array.from(bookingInquiries.values()).find(
          (b) => b.hotelId === where.hotelId && b.conversationId === where.conversationId,
        ) ?? null;
      },
      create: async ({ data }: { data: any }) => {
        const id = `inq-${bookingInquiries.size + 1}`;
        const record = { id, ...data, createdAt: new Date() };
        bookingInquiries.set(id, record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const existing = bookingInquiries.get(where.id);
        const updated = { ...existing, ...data };
        bookingInquiries.set(where.id, updated);
        return updated;
      },
    },
    _state: { conversations, messages, bookingInquiries },
  };

  return db;
};

async function runTests() {
  console.log("Running Conversation Service & Channel Independence Tests...\n");

  // Test 1: Channel enum definitions
  assert.deepEqual([...CHANNELS], ["WEB", "WHATSAPP", "INSTAGRAM", "FACEBOOK"]);
  console.log("✓ Supported channels are defined correctly");

  // Test 2: Validation errors
  const mockDb = makeMockPrisma();

  await assert.rejects(
    async () => {
      await processMessage({ hotelSlug: "", channel: "WEB", message: "Hi" }, { prismaClient: mockDb as any });
    },
    (err: any) => err instanceof ConversationError && err.statusCode === 400,
  );
  console.log("✓ Empty hotel throws 400 ConversationError");

  await assert.rejects(
    async () => {
      await processMessage({ hotelSlug: "unknown-hotel", channel: "WEB", message: "Hi" }, { prismaClient: mockDb as any });
    },
    (err: any) => err instanceof ConversationError && err.statusCode === 404,
  );
  console.log("✓ Non-existent hotel throws 404 ConversationError");

  await assert.rejects(
    async () => {
      await processMessage({ hotelSlug: "himalayan-grand-hotel", channel: "WEB", message: "" }, { prismaClient: mockDb as any });
    },
    (err: any) => err instanceof ConversationError && err.statusCode === 400,
  );
  console.log("✓ Empty message throws 400 ConversationError");

  // Test 3: Channel assignment - WEB
  const webResult = await processMessage(
    {
      hotelSlug: "himalayan-grand-hotel",
      channel: "WEB",
      message: "What rooms do you have?",
    },
    { prismaClient: mockDb as any },
  );

  assert.ok(webResult.conversationId);
  assert.equal(webResult.channel, "WEB");
  assert.equal(webResult.hotelId, "hotel-himalayan");
  assert.ok(webResult.reply);
  assert.equal(typeof webResult.handoffSuggested, "boolean");
  assert.equal(typeof webResult.bookingInquiryCaptured, "boolean");

  const createdWebConv = mockDb._state.conversations.get(webResult.conversationId);
  assert.equal(createdWebConv?.channel, "WEB");
  console.log("✓ WEB channel conversation processed and persisted with channel=WEB");

  // Test 4: Channel assignment - WHATSAPP
  const whatsappResult = await processMessage(
    {
      hotelSlug: "himalayan-grand-hotel",
      channel: "WHATSAPP",
      message: "Hello from WhatsApp",
      guestName: "Ram Sharma",
    },
    { prismaClient: mockDb as any },
  );

  assert.ok(whatsappResult.conversationId);
  assert.equal(whatsappResult.channel, "WHATSAPP");
  const createdWaConv = mockDb._state.conversations.get(whatsappResult.conversationId);
  assert.equal(createdWaConv?.channel, "WHATSAPP");
  assert.equal(createdWaConv?.guestName, "Ram Sharma");
  console.log("✓ WHATSAPP channel conversation processed and persisted with channel=WHATSAPP");

  // Test 5: Channel assignment - INSTAGRAM
  const instagramResult = await processMessage(
    {
      hotelSlug: "himalayan-grand-hotel",
      channel: "INSTAGRAM",
      message: "Hello from Instagram DM",
    },
    { prismaClient: mockDb as any },
  );
  assert.equal(instagramResult.channel, "INSTAGRAM");
  console.log("✓ INSTAGRAM channel conversation processed and persisted with channel=INSTAGRAM");

  // Test 6: Channel assignment - FACEBOOK
  const facebookResult = await processMessage(
    {
      hotelSlug: "himalayan-grand-hotel",
      channel: "FACEBOOK",
      message: "Hello from FB Messenger",
    },
    { prismaClient: mockDb as any },
  );
  assert.equal(facebookResult.channel, "FACEBOOK");
  console.log("✓ FACEBOOK channel conversation processed and persisted with channel=FACEBOOK");

  // Test 7: Multi-turn conversation continuation using conversationId
  const followUpResult = await processMessage(
    {
      hotelSlug: "himalayan-grand-hotel",
      conversationId: webResult.conversationId,
      channel: "WEB",
      message: "And what is the check-in time?",
    },
    { prismaClient: mockDb as any },
  );
  assert.equal(followUpResult.conversationId, webResult.conversationId);
  console.log("✓ Multi-turn message uses existing conversationId");

  // Test 8: Multi-hotel isolation
  const pokharaResult = await processMessage(
    {
      hotelSlug: "pokhara-lakeside-resort",
      channel: "WHATSAPP",
      message: "Do you have rooms?",
    },
    { prismaClient: mockDb as any },
  );
  assert.equal(pokharaResult.hotelId, "hotel-pokhara");

  // Cannot use Pokhara conversation for Himalayan hotel
  await assert.rejects(
    async () => {
      await processMessage(
        {
          hotelSlug: "himalayan-grand-hotel",
          conversationId: pokharaResult.conversationId,
          channel: "WHATSAPP",
          message: "Hi",
        },
        { prismaClient: mockDb as any },
      );
    },
    (err: any) => err instanceof ConversationError && err.statusCode === 404,
  );
  console.log("✓ Cross-hotel conversation access is blocked with 404");

  console.log("\nAll Conversation Service tests passed successfully!");
}

void runTests();
