import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";
import DeleteKnowledgeBaseButton from "@/components/dashboard/DeleteKnowledgeBaseButton";
import KnowledgeBaseForm from "@/components/dashboard/KnowledgeBaseForm";
import { prisma } from "@/lib/prisma";

import { removeFaq, saveFaq } from "./actions";

export const metadata: Metadata = { title: "FAQs | HotelAI" };
const HOTEL_SLUG = "himalayan-grand-hotel";

type FaqsPageProps = { searchParams: Promise<{ q?: string }> };

export default async function FaqsPage({ searchParams }: FaqsPageProps) {
  const query = (await searchParams).q?.trim() ?? "";
  const hotel = await prisma.hotel.findUnique({
    where: { slug: HOTEL_SLUG },
    select: { name: true, faqs: { where: query ? { OR: [{ question: { contains: query, mode: "insensitive" } }, { answer: { contains: query, mode: "insensitive" } }] } : undefined, orderBy: { question: "asc" } } },
  });

  return <DashboardShell hotelName={hotel?.name ?? "Current hotel"}><div className="space-y-7"><section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-cyan-700">Knowledge base</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">FAQs</h1><p className="mt-2 text-sm leading-6 text-slate-500">Manage the approved answers your receptionist uses for common guest questions.</p></div><details className="group relative"><summary className="cursor-pointer list-none rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Add FAQ</summary><div className="absolute right-0 z-10 mt-3 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"><KnowledgeBaseForm action={saveFaq} kind="faq" submitLabel="Create FAQ" /></div></details></section><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6"><div><h2 className="text-base font-bold text-slate-950">FAQ library</h2><p className="mt-1 text-xs text-slate-500">{hotel?.faqs.length ?? 0} {query ? "matching " : "approved "}questions.</p></div><form className="flex w-full max-w-sm gap-2" method="get"><label className="sr-only" htmlFor="faq-search">Search FAQs</label><input id="faq-search" name="q" defaultValue={query} placeholder="Search questions or answers" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">Search</button></form></div>{!hotel?.faqs.length ? <div className="px-6 py-14 text-center text-sm text-slate-500">{query ? "No FAQs match your search." : "No FAQs have been added yet."}</div> : <div className="divide-y divide-slate-100">{hotel.faqs.map((faq) => <article key={faq.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div className="min-w-0"><h3 className="font-semibold text-slate-900">{faq.question}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{faq.answer}</p></div><div className="flex shrink-0 gap-4"><details className="group relative"><summary className="cursor-pointer list-none text-sm font-semibold text-cyan-700 hover:text-cyan-800">Edit</summary><div className="absolute right-0 z-10 mt-2 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl"><KnowledgeBaseForm action={saveFaq} kind="faq" submitLabel="Save changes" initial={{ id: faq.id, title: faq.question, content: faq.answer }} /></div></details><DeleteKnowledgeBaseButton id={faq.id} action={removeFaq} /></div></article>)}</div>}</section></div></DashboardShell>;
}
