"use client";

import { useActionState } from "react";

type FormState = { error?: string };
type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

type KnowledgeBaseFormProps = {
  action: FormAction;
  kind: "room" | "faq" | "policy";
  submitLabel: string;
  initial?: {
    id: string;
    name?: string;
    description?: string;
    priceNpr?: number;
    capacity?: number;
    title?: string;
    content?: string;
  };
};

const inputClassName = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

export default function KnowledgeBaseForm({ action, kind, submitLabel, initial }: KnowledgeBaseFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const isRoom = kind === "room";
  const title = isRoom ? (initial ? "Edit room" : "Add room") : kind === "faq" ? (initial ? "Edit FAQ" : "Add FAQ") : (initial ? "Edit policy" : "Add policy");

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">Changes will update the HotelAI knowledge base.</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700">Knowledge base</span>
      </div>

      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      {isRoom ? (
        <>
          <label className="block text-sm font-semibold text-slate-700">Room name/type<input className={inputClassName} name="name" defaultValue={initial?.name} placeholder="e.g. Deluxe Room" required /></label>
          <label className="block text-sm font-semibold text-slate-700">Description<textarea className={`${inputClassName} min-h-24 resize-y`} name="description" defaultValue={initial?.description} placeholder="Describe the room and its amenities" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Price (NPR)<input className={inputClassName} name="priceNpr" type="number" min="0.01" step="0.01" defaultValue={initial?.priceNpr} placeholder="8500" required /></label>
            <label className="block text-sm font-semibold text-slate-700">Capacity<input className={inputClassName} name="capacity" type="number" min="1" step="1" defaultValue={initial?.capacity} placeholder="2" required /></label>
          </div>
        </>
      ) : (
        <>
          <label className="block text-sm font-semibold text-slate-700">{kind === "faq" ? "Question" : "Policy name"}<input className={inputClassName} name="title" defaultValue={initial?.title} placeholder={kind === "faq" ? "e.g. Is breakfast included?" : "e.g. Cancellation Policy"} required /></label>
          <label className="block text-sm font-semibold text-slate-700">{kind === "faq" ? "Answer" : "Policy content"}<textarea className={`${inputClassName} min-h-32 resize-y`} name="content" defaultValue={initial?.content} placeholder={kind === "faq" ? "Write the approved answer for guests" : "Describe the policy clearly"} required /></label>
        </>
      )}

      {state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
