"use client";

import { useActionState } from "react";

type StatusFormProps = {
  inquiryId: string;
  currentStatus: string;
  action: (state: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
};

const statuses = ["PENDING", "CONFIRMED", "CANCELLED"];

export default function InquiryStatusForm({ inquiryId, currentStatus, action }: StatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={inquiryId} />
      <label className="sr-only" htmlFor={`status-${inquiryId}`}>Inquiry status</label>
      <select id={`status-${inquiryId}`} name="status" defaultValue={currentStatus} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100">
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <button type="submit" disabled={pending} onClick={(event) => {
        const form = event.currentTarget.form;
        if (form && new FormData(form).get("status") === "CANCELLED" && !window.confirm("Cancel this booking inquiry?")) event.preventDefault();
      }} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving..." : "Save"}</button>
      {state.error && <span role="alert" className="basis-full text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
