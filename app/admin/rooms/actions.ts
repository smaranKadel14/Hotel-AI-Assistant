"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createRoom,
  deleteRoom,
  parseRoomFormData,
  updateRoom,
} from "@/modules/knowledge-base";

type FormState = { error?: string };

export async function saveRoom(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseRoomFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const id = formData.get("id");
  const result = typeof id === "string" && id.length > 0
    ? await updateRoom(id, parsed.input)
    : await createRoom(parsed.input);

  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function removeRoom(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const result = await deleteRoom(id);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/admin");
  revalidatePath("/admin/rooms");
}
