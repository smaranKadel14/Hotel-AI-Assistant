import { prisma } from "@/lib/prisma";

const CURRENT_HOTEL_SLUG = "himalayan-grand-hotel";
export const INQUIRY_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

type InquiryFilters = {
  search?: string;
  status?: string;
  roomType?: string;
  checkInFrom?: string;
  checkInTo?: string;
};

async function getCurrentHotel() {
  return prisma.hotel.findUnique({ where: { slug: CURRENT_HOTEL_SLUG }, select: { id: true, name: true } });
}

function parseFilterDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getInquiryList(filters: InquiryFilters = {}) {
  const hotel = await getCurrentHotel();
  if (!hotel) return { hotel: null, inquiries: [], roomTypes: [] };

  const search = filters.search?.trim();
  const status = INQUIRY_STATUSES.includes(filters.status as InquiryStatus) ? filters.status : undefined;
  const checkInFrom = parseFilterDate(filters.checkInFrom);
  const checkInTo = parseFilterDate(filters.checkInTo, true);

  const inquiries = await prisma.bookingInquiry.findMany({
    where: {
      hotelId: hotel.id,
      ...(status ? { status } : {}),
      ...(filters.roomType ? { roomType: filters.roomType } : {}),
      ...(checkInFrom || checkInTo ? { checkIn: { ...(checkInFrom ? { gte: checkInFrom } : {}), ...(checkInTo ? { lte: checkInTo } : {}) } } : {}),
      ...(search ? { OR: [{ guestName: { contains: search, mode: "insensitive" } }, { guestEmail: { contains: search, mode: "insensitive" } }, { guestPhone: { contains: search, mode: "insensitive" } }, { roomType: { contains: search, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, guestName: true, guestEmail: true, guestPhone: true, roomType: true, checkIn: true, checkOut: true, status: true, createdAt: true },
  });

  const roomTypes = Array.from(new Set(inquiries.map((inquiry) => inquiry.roomType).filter((roomType): roomType is string => Boolean(roomType)))).sort();
  return { hotel, inquiries, roomTypes };
}

export async function getInquiryDetails(id: string) {
  const hotel = await getCurrentHotel();
  if (!hotel) return { hotel: null, inquiry: null };

  const inquiry = await prisma.bookingInquiry.findFirst({
    where: { id, hotelId: hotel.id },
    select: {
      id: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      roomType: true,
      checkIn: true,
      checkOut: true,
      status: true,
      createdAt: true,
      conversation: {
        select: {
          id: true,
          channel: true,
          messages: { orderBy: { createdAt: "asc" }, select: { id: true, sender: true, text: true, createdAt: true } },
        },
      },
    },
  });

  return { hotel, inquiry };
}

export async function changeInquiryStatus(id: string, status: string) {
  if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) return { ok: false as const, error: "Invalid inquiry status." };

  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false as const, error: "Current hotel workspace was not found." };

  const inquiry = await prisma.bookingInquiry.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!inquiry) return { ok: false as const, error: "Inquiry not found for the current hotel." };

  await prisma.bookingInquiry.update({ where: { id: inquiry.id }, data: { status } });
  return { ok: true as const };
}
