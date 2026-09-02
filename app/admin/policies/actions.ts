"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createPolicy,
  deletePolicy,
  parseTextFormData,
  updatePolicy,
} from "@/modules/knowledge-base";

type FormState = { error?: string };

export async function savePolicy(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseTextFormData(formData, "Policy");
  if ("error" in parsed) return { error: parsed.error };

  const id = formData.get("id");
  const result = typeof id === "string" && id.length > 0
    ? await updatePolicy(id, parsed.input)
    : await createPolicy(parsed.input);

  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/admin/policies");
  redirect("/admin/policies");
}

export async function removePolicy(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const result = await deletePolicy(id);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/admin");
  revalidatePath("/admin/policies");
}
