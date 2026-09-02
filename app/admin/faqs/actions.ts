"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFaq,
  deleteFaq,
  parseTextFormData,
  updateFaq,
} from "@/modules/knowledge-base";

type FormState = { error?: string };

export async function saveFaq(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseTextFormData(formData, "FAQ");
  if ("error" in parsed) return { error: parsed.error };

  const id = formData.get("id");
  const result = typeof id === "string" && id.length > 0
    ? await updateFaq(id, parsed.input)
    : await createFaq(parsed.input);

  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function removeFaq(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const result = await deleteFaq(id);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/admin");
  revalidatePath("/admin/faqs");
}
