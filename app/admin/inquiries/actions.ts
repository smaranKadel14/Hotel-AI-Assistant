"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { changeInquiryStatus } from "@/modules/booking/management";

type FormState = { error?: string };

export async function updateInquiryStatus(_state: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || id.length === 0 || typeof status !== "string") return { error: "Inquiry and status are required." };

  const result = await changeInquiryStatus(id, status);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}`);
}
