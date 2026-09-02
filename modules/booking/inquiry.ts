import type { PrismaClient } from "@prisma/client";

import type { BookingExtraction } from "@/modules/ai/types";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s.-]{7,20}$/;
const VAGUE_DATE_PATTERN =
  /(weekend|week|month|soon|later|early|late|tomorrow|yesterday|next|this|coming|schedule|date)/i;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type BookingInquiryPersisted = {
  id: string;
  hotelId: string;
  conversationId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomType: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
};

export type BookingInquiryAction = "created" | "updated" | "none";

export function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidEmail(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) {
    return false;
  }

  return !/[A-Za-z]/.test(trimmed);
}

export function parseSafeDateString(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length < 6 || VAGUE_DATE_PATTERN.test(trimmed)) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, yearText, monthText, dayText] = isoMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return date;
    }
    return null;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, first, second, yearText] = slashMatch;
    const day = Number(first);
    const month = Number(second);
    const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return date;
    }
    return null;
  }

  const textMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (textMatch) {
    const [, monthText, dayText, yearText] = textMatch;
    const monthIndex = monthNames.findIndex((monthName) => monthName.toLowerCase() === monthText.toLowerCase());
    if (monthIndex === -1) {
      return null;
    }

    const year = yearText ? Number(yearText) : new Date().getUTCFullYear();
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, monthIndex, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex && date.getUTCDate() === day) {
      return date;
    }
    return null;
  }

  return null;
}

export function normalizeBookingExtraction(
  rawExtraction: Partial<BookingExtraction> | null | undefined,
): BookingExtraction | null {
  if (!rawExtraction || typeof rawExtraction !== "object") {
    return null;
  }

  const bookingIntent = Boolean(rawExtraction.bookingIntent);

  const guestName = normalizeOptionalText(rawExtraction.guestName);
  const guestEmail = normalizeOptionalText(rawExtraction.guestEmail);
  const guestPhone = normalizeOptionalText(rawExtraction.guestPhone);
  const roomType = normalizeOptionalText(rawExtraction.roomType);
  const checkIn = normalizeOptionalText(rawExtraction.checkIn);
  const checkOut = normalizeOptionalText(rawExtraction.checkOut);

  if (!bookingIntent) {
    return {
      bookingIntent: false,
      guestName: guestName,
      guestEmail: guestEmail,
      guestPhone: guestPhone,
      roomType: roomType,
      checkIn: checkIn,
      checkOut: checkOut,
    };
  }

  if (guestEmail && !isValidEmail(guestEmail)) {
    return null;
  }

  if (guestPhone && !isValidPhone(guestPhone)) {
    return null;
  }

  const parsedCheckIn = checkIn ? parseSafeDateString(checkIn) : null;
  const parsedCheckOut = checkOut ? parseSafeDateString(checkOut) : null;

  if (checkIn && !parsedCheckIn) {
    return null;
  }

  if (checkOut && !parsedCheckOut) {
    return null;
  }

  if (parsedCheckIn) {
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);

    if (parsedCheckIn.getTime() < startOfTodayUtc.getTime()) {
      return null;
    }
  }

  if (parsedCheckIn && parsedCheckOut && parsedCheckOut.getTime() < parsedCheckIn.getTime()) {
    return null;
  }

  return {
    bookingIntent: true,
    guestName,
    guestEmail,
    guestPhone,
    roomType,
    checkIn: checkIn,
    checkOut: checkOut,
  };
}

export function hasRequiredInquiryFields(
  extraction: Pick<BookingExtraction, "guestName" | "guestEmail" | "guestPhone"> | null | undefined,
): boolean {
  if (!extraction) {
    return false;
  }

  return Boolean(
    extraction.guestName &&
      extraction.guestEmail &&
      extraction.guestPhone &&
      isValidEmail(extraction.guestEmail) &&
      isValidPhone(extraction.guestPhone),
  );
}

export function getBookingInquiryData(
  extraction: BookingExtraction | null | undefined,
): {
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  roomType: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
} {
  if (!extraction) {
    return {
      guestName: null,
      guestEmail: null,
      guestPhone: null,
      roomType: null,
      checkIn: null,
      checkOut: null,
    };
  }

  const checkIn = extraction.checkIn ? parseSafeDateString(extraction.checkIn) : null;
  const checkOut = extraction.checkOut ? parseSafeDateString(extraction.checkOut) : null;

  return {
    guestName: extraction.guestName ? extraction.guestName.trim() : null,
    guestEmail: extraction.guestEmail ? extraction.guestEmail.trim() : null,
    guestPhone: extraction.guestPhone ? extraction.guestPhone.trim() : null,
    roomType: extraction.roomType ? extraction.roomType.trim() : null,
    checkIn,
    checkOut,
  };
}

export async function processBookingInquiry({
  hotelId,
  conversationId,
  extraction,
  prismaClient = prisma,
}: {
  hotelId: string;
  conversationId: string;
  extraction: Partial<BookingExtraction> | null | undefined;
  prismaClient?: PrismaClient;
}): Promise<{
  bookingInquiryCaptured: boolean;
  inquiryId: string | null;
  action: BookingInquiryAction;
}> {
  const normalizedExtraction = normalizeBookingExtraction(extraction);

  if (!normalizedExtraction || !normalizedExtraction.bookingIntent) {
    return {
      bookingInquiryCaptured: false,
      inquiryId: null,
      action: "none",
    };
  }

  const existingInquiry = await prismaClient.bookingInquiry.findFirst({
    where: {
      hotelId,
      conversationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingInquiry) {
    const currentData = getBookingInquiryData(normalizedExtraction);
    const updatePayload: Record<string, string | Date | null> = {
      status: "PENDING",
    };

    if (currentData.guestName) {
      updatePayload.guestName = currentData.guestName;
    }
    if (currentData.guestEmail) {
      updatePayload.guestEmail = currentData.guestEmail;
    }
    if (currentData.guestPhone) {
      updatePayload.guestPhone = currentData.guestPhone;
    }
    if (currentData.roomType) {
      updatePayload.roomType = currentData.roomType;
    }
    if (currentData.checkIn) {
      updatePayload.checkIn = currentData.checkIn;
    }
    if (currentData.checkOut) {
      updatePayload.checkOut = currentData.checkOut;
    }

    const updatedInquiry = await prismaClient.bookingInquiry.update({
      where: { id: existingInquiry.id },
      data: updatePayload,
    });

    return {
      bookingInquiryCaptured: hasRequiredInquiryFields({
        guestName: updatedInquiry.guestName,
        guestEmail: updatedInquiry.guestEmail,
        guestPhone: updatedInquiry.guestPhone,
      }),
      inquiryId: updatedInquiry.id,
      action: "updated",
    };
  }

  if (!hasRequiredInquiryFields(normalizedExtraction)) {
    return {
      bookingInquiryCaptured: false,
      inquiryId: null,
      action: "none",
    };
  }

  const newInquiryData = getBookingInquiryData(normalizedExtraction);

  const createdInquiry = await prismaClient.bookingInquiry.create({
    data: {
      hotelId,
      conversationId,
      guestName: newInquiryData.guestName!,
      guestEmail: newInquiryData.guestEmail!,
      guestPhone: newInquiryData.guestPhone!,
      roomType: newInquiryData.roomType,
      checkIn: newInquiryData.checkIn,
      checkOut: newInquiryData.checkOut,
      status: "PENDING",
    },
  });

  return {
    bookingInquiryCaptured: true,
    inquiryId: createdInquiry.id,
    action: "created",
  };
}
