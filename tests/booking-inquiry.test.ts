import assert from "node:assert/strict";

import {
  hasRequiredInquiryFields,
  normalizeBookingExtraction,
  parseSafeDateString,
  processBookingInquiry,
} from "@/lib/booking/inquiry";

const makeMockPrisma = () => {
  const state = {
    records: new Map<string, { id: string; hotelId: string; conversationId: string; guestName: string; guestEmail: string; guestPhone: string; roomType: string | null; checkIn: Date | null; checkOut: Date | null; status: string; createdAt: Date }>(),
  };

  const bookingInquiry = {
    findFirst: async ({ where }: { where: { hotelId: string; conversationId: string } }) => {
      const matching = Array.from(state.records.values()).find(
        (record) => record.hotelId === where.hotelId && record.conversationId === where.conversationId,
      );

      return matching ?? null;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const current = state.records.get(where.id);
      if (!current) {
        throw new Error(`No booking inquiry found for ${where.id}`);
      }

      const updated = {
        ...current,
        ...data,
      };
      state.records.set(where.id, updated as typeof current);

      return updated as typeof current;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `inquiry-${state.records.size + 1}`;
      const record = {
        id,
        hotelId: String(data.hotelId),
        conversationId: String(data.conversationId),
        guestName: String(data.guestName),
        guestEmail: String(data.guestEmail),
        guestPhone: String(data.guestPhone),
        roomType: data.roomType !== null && data.roomType !== undefined ? String(data.roomType) : null,
        checkIn: data.checkIn instanceof Date ? data.checkIn : null,
        checkOut: data.checkOut instanceof Date ? data.checkOut : null,
        status: String(data.status),
        createdAt: new Date(),
      };

      state.records.set(id, record);
      return record;
    },
  };

  return { bookingInquiry, state };
};

async function run() {
  const nonBooking = normalizeBookingExtraction({ bookingIntent: false, guestName: "John" });
  assert.equal(nonBooking?.bookingIntent, false);
  assert.equal((await processBookingInquiry({ hotelId: "hotel-1", conversationId: "conv-1", extraction: nonBooking })).action, "none");

  const bookingNoContact = normalizeBookingExtraction({ bookingIntent: true, roomType: "Deluxe Room" });
  assert.equal(bookingNoContact?.bookingIntent, true);
  assert.equal((await processBookingInquiry({ hotelId: "hotel-1", conversationId: "conv-1", extraction: bookingNoContact })).bookingInquiryCaptured, false);

  const nameOnly = normalizeBookingExtraction({ bookingIntent: true, guestName: "John Smith" });
  assert.equal(nameOnly?.guestName, "John Smith");

  const emailOnly = normalizeBookingExtraction({ bookingIntent: true, guestEmail: " john@example.com " });
  assert.equal(emailOnly?.guestEmail, "john@example.com");

  const phoneOnly = normalizeBookingExtraction({ bookingIntent: true, guestPhone: "+1 (555) 123-4567" });
  assert.equal(phoneOnly?.guestPhone, "+1 (555) 123-4567");

  const firstPartial = { bookingIntent: true, guestName: "John Smith" };
  const firstResult = await processBookingInquiry({ hotelId: "hotel-1", conversationId: "conv-2", extraction: firstPartial, prismaClient: makeMockPrisma() as any });
  assert.equal(firstResult.bookingInquiryCaptured, false);

  const mockPrisma = makeMockPrisma();
  const secondResult = await processBookingInquiry({
    hotelId: "hotel-1",
    conversationId: "conv-3",
    extraction: {
      bookingIntent: true,
      guestName: "John Smith",
      guestEmail: "john@example.com",
      guestPhone: "+1 (555) 123-4567",
      roomType: "Deluxe Room",
      checkIn: "2026-09-15",
      checkOut: "2026-09-18",
    },
    prismaClient: mockPrisma as any,
  });
  assert.equal(secondResult.action, "created");
  assert.equal(secondResult.bookingInquiryCaptured, true);

  const duplicateResult = await processBookingInquiry({
    hotelId: "hotel-1",
    conversationId: "conv-3",
    extraction: {
      bookingIntent: true,
      guestName: "John Smith",
      guestEmail: "john@example.com",
      guestPhone: "+1 (555) 123-4567",
    },
    prismaClient: mockPrisma as any,
  });
  assert.equal(duplicateResult.action, "updated");
  assert.equal(mockPrisma.state.records.size, 1);

  const invalidEmail = normalizeBookingExtraction({ bookingIntent: true, guestName: "John", guestEmail: "bad-email", guestPhone: "+1 555 123 4567" });
  assert.equal(invalidEmail, null);

  const invalidPhone = normalizeBookingExtraction({ bookingIntent: true, guestName: "John", guestEmail: "john@example.com", guestPhone: "abc" });
  assert.equal(invalidPhone, null);

  const invalidDates = normalizeBookingExtraction({
    bookingIntent: true,
    guestName: "John",
    guestEmail: "john@example.com",
    guestPhone: "+1 555 123 4567",
    checkIn: "2026-09-18",
    checkOut: "2026-09-15",
  });
  assert.equal(invalidDates, null);

  const pastCheckIn = normalizeBookingExtraction({
    bookingIntent: true,
    guestName: "John",
    guestEmail: "john@example.com",
    guestPhone: "+1 555 123 4567",
    checkIn: "2024-09-15",
    checkOut: "2024-09-18",
  });
  assert.equal(pastCheckIn, null);

  const ambiguousDate = normalizeBookingExtraction({
    bookingIntent: true,
    guestName: "John",
    guestEmail: "john@example.com",
    guestPhone: "+1 555 123 4567",
    checkIn: "next month",
    checkOut: "later",
  });
  assert.equal(ambiguousDate, null);

  const noInventedDates = normalizeBookingExtraction({
    bookingIntent: true,
    guestName: "John Smith",
    guestEmail: "john@example.com",
    guestPhone: "+1 555 123 4567",
    roomType: "Deluxe Room",
    checkIn: null,
    checkOut: null,
  });
  assert.equal(noInventedDates?.checkIn, null);
  assert.equal(noInventedDates?.checkOut, null);

  assert.equal(hasRequiredInquiryFields({ guestName: "John", guestEmail: "john@example.com", guestPhone: "+1 555 123 4567" }), true);
  assert.equal(hasRequiredInquiryFields({ guestName: "John", guestEmail: "bad", guestPhone: "+1 555 123 4567" }), false);

  assert.equal(parseSafeDateString("2026-09-15")?.getUTCDate(), 15);

  const hotelIsolationPrisma = makeMockPrisma();
  const hotelIsolation = await processBookingInquiry({
    hotelId: "hotel-2",
    conversationId: "conv-4",
    extraction: {
      bookingIntent: true,
      guestName: "Alice",
      guestEmail: "alice@example.com",
      guestPhone: "+1 555 987 6543",
    },
    prismaClient: hotelIsolationPrisma as any,
  });
  assert.equal(hotelIsolation.bookingInquiryCaptured, true);
  assert.equal(hotelIsolationPrisma.state.records.get(hotelIsolation.inquiryId!)?.hotelId, "hotel-2");

  console.log("Booking inquiry validation scenarios passed.");
}

void run();
