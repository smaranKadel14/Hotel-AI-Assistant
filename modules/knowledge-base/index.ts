import { prisma } from "@/lib/prisma";

export const CURRENT_HOTEL_SLUG = "himalayan-grand-hotel";

type RoomInput = {
  name: string;
  description: string;
  priceNpr: number;
  capacity: number;
};

type TextInput = {
  title: string;
  content: string;
};

export type KnowledgeBaseResult =
  | { ok: true }
  | { ok: false; error: string };

function requiredText(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { value: null, error: `${label} is required.` };
  }

  return { value: value.trim(), error: null };
}

function positiveNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, error: `${label} must be greater than zero.` };
  }

  return { value: parsed, error: null };
}

export function parseRoomFormData(formData: FormData): { input: RoomInput } | { error: string } {
  const name = requiredText(formData.get("name"), "Room name");
  const description = requiredText(formData.get("description"), "Description");
  const price = positiveNumber(formData.get("priceNpr"), "Price");
  const capacity = positiveNumber(formData.get("capacity"), "Capacity");

  if (name.error || description.error || price.error || capacity.error) {
    return { error: name.error ?? description.error ?? price.error ?? capacity.error! };
  }

  if (!Number.isInteger(capacity.value)) {
    return { error: "Capacity must be a whole number." };
  }

  return {
    input: {
      name: name.value!,
      description: description.value!,
      priceNpr: price.value!,
      capacity: capacity.value!,
    },
  };
}

export function parseTextFormData(formData: FormData, label: string): { input: TextInput } | { error: string } {
  const title = requiredText(formData.get("title"), `${label} name`);
  const content = requiredText(formData.get("content"), "Content");

  if (title.error || content.error) {
    return { error: title.error ?? content.error! };
  }

  return { input: { title: title.value!, content: content.value! } };
}

async function getCurrentHotel() {
  return prisma.hotel.findUnique({
    where: { slug: CURRENT_HOTEL_SLUG },
    select: { id: true },
  });
}

export async function createRoom(input: RoomInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  await prisma.room.create({ data: { ...input, hotelId: hotel.id } });
  return { ok: true };
}

export async function updateRoom(id: string, input: RoomInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const room = await prisma.room.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!room) return { ok: false, error: "Room not found for the current hotel." };

  await prisma.room.update({ where: { id: room.id }, data: input });
  return { ok: true };
}

export async function deleteRoom(id: string): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const room = await prisma.room.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!room) return { ok: false, error: "Room not found for the current hotel." };

  await prisma.room.delete({ where: { id: room.id } });
  return { ok: true };
}

export async function createFaq(input: TextInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  await prisma.faq.create({ data: { question: input.title, answer: input.content, hotelId: hotel.id } });
  return { ok: true };
}

export async function updateFaq(id: string, input: TextInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const faq = await prisma.faq.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!faq) return { ok: false, error: "FAQ not found for the current hotel." };

  await prisma.faq.update({ where: { id: faq.id }, data: { question: input.title, answer: input.content } });
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const faq = await prisma.faq.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!faq) return { ok: false, error: "FAQ not found for the current hotel." };

  await prisma.faq.delete({ where: { id: faq.id } });
  return { ok: true };
}

export async function createPolicy(input: TextInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  await prisma.policy.create({ data: { title: input.title, content: input.content, hotelId: hotel.id } });
  return { ok: true };
}

export async function updatePolicy(id: string, input: TextInput): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const policy = await prisma.policy.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!policy) return { ok: false, error: "Policy not found for the current hotel." };

  await prisma.policy.update({ where: { id: policy.id }, data: input });
  return { ok: true };
}

export async function deletePolicy(id: string): Promise<KnowledgeBaseResult> {
  const hotel = await getCurrentHotel();
  if (!hotel) return { ok: false, error: "Current hotel workspace was not found." };

  const policy = await prisma.policy.findFirst({ where: { id, hotelId: hotel.id }, select: { id: true } });
  if (!policy) return { ok: false, error: "Policy not found for the current hotel." };

  await prisma.policy.delete({ where: { id: policy.id } });
  return { ok: true };
}
