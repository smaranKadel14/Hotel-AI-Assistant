import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";
import DeleteKnowledgeBaseButton from "@/components/dashboard/DeleteKnowledgeBaseButton";
import KnowledgeBaseForm from "@/components/dashboard/KnowledgeBaseForm";
import { prisma } from "@/lib/prisma";

import { removePolicy, savePolicy } from "./actions";

export const metadata: Metadata = { title: "Policies | HotelAI" };
const HOTEL_SLUG = "himalayan-grand-hotel";

export default async function PoliciesPage() {
  const hotel = await prisma.hotel.findUnique({ where: { slug: HOTEL_SLUG }, select: { name: true, policies: { orderBy: { title: "asc" } } } });

  return <DashboardShell hotelName={hotel?.name ?? "Current hotel"}><div className="space-y-7"><section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-cyan-700">Knowledge base</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Policies</h1><p className="mt-2 text-sm leading-6 text-slate-500">Maintain the hotel policies your AI receptionist can share with guests.</p></div><details className="group relative"><summary className="cursor-pointer list-none rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Add policy</summary><div className="absolute right-0 z-10 mt-3 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"><KnowledgeBaseForm action={savePolicy} kind="policy" submitLabel="Create policy" /></div></details></section><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><div className="border-b border-slate-200 px-5 py-5 sm:px-6"><h2 className="text-base font-bold text-slate-950">Policy library</h2><p className="mt-1 text-xs text-slate-500">{hotel?.policies.length ?? 0} policies in this hotel workspace.</p></div>{!hotel?.policies.length ? <div className="px-6 py-14 text-center text-sm text-slate-500">No policies have been added yet.</div> : <div className="divide-y divide-slate-100">{hotel.policies.map((policy) => <article key={policy.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div className="min-w-0"><h3 className="font-semibold text-slate-900">{policy.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{policy.content}</p></div><div className="flex shrink-0 gap-4"><details className="group relative"><summary className="cursor-pointer list-none text-sm font-semibold text-cyan-700 hover:text-cyan-800">Edit</summary><div className="absolute right-0 z-10 mt-2 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl"><KnowledgeBaseForm action={savePolicy} kind="policy" submitLabel="Save changes" initial={{ id: policy.id, title: policy.title, content: policy.content }} /></div></details><DeleteKnowledgeBaseButton id={policy.id} action={removePolicy} /></div></article>)}</div>}</section></div></DashboardShell>;
}
