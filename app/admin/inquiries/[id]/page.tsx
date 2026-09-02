import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import InquiryStatusForm from "@/components/dashboard/InquiryStatusForm";
import { getInquiryDetails } from "@/modules/booking/management";

import { updateInquiryStatus } from "../actions";

export const metadata: Metadata = { title: "Inquiry details | HotelAI" };

type InquiryDetailsPageProps = { params: Promise<{ id: string }> };

const formatDateTime = (date: Date) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
const formatDate = (date: Date | null) => date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date) : "Not specified";

function nightsBetween(checkIn: Date | null, checkOut: Date | null) {
  if (!checkIn || !checkOut) return "Not specified";
  const nights = Math.round((Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate()) - Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate())) / 86400000);
  return nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Not specified";
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles}`}>{status}</span>;
}

export default async function InquiryDetailsPage({ params }: InquiryDetailsPageProps) {
  const { id } = await params;
  const { hotel, inquiry } = await getInquiryDetails(id);
  if (!hotel || !inquiry) notFound();

  return <DashboardShell hotelName={hotel.name}><div className="space-y-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin/inquiries" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">← Booking inquiries</Link><h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Inquiry from {inquiry.guestName}</h1><p className="mt-2 text-sm text-slate-500">Captured {formatDateTime(inquiry.createdAt)}</p></div><StatusBadge status={inquiry.status} /></div><div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]"><div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Guest information</h2><dl className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1"><div><dt className="text-xs text-slate-500">Name</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{inquiry.guestName}</dd></div><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-900">{inquiry.guestEmail}</dd></div><div><dt className="text-xs text-slate-500">Phone</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{inquiry.guestPhone}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Stay details</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><div><dt className="text-xs text-slate-500">Room type</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{inquiry.roomType ?? "Not specified"}</dd></div><div><dt className="text-xs text-slate-500">Check-in</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(inquiry.checkIn)}</dd></div><div><dt className="text-xs text-slate-500">Check-out</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(inquiry.checkOut)}</dd></div><div><dt className="text-xs text-slate-500">Number of nights</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{nightsBetween(inquiry.checkIn, inquiry.checkOut)}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between gap-4"><div><h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Manage status</h2><p className="mt-1 text-xs text-slate-500">Confirmation here represents staff approval of availability.</p></div><StatusBadge status={inquiry.status} /></div><div className="mt-5"><InquiryStatusForm inquiryId={inquiry.id} currentStatus={inquiry.status} action={updateInquiryStatus} /></div></section></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"><div className="border-b border-slate-200 px-5 py-5 sm:px-6"><h2 className="text-base font-bold text-slate-950">Conversation</h2><p className="mt-1 text-xs text-slate-500">{inquiry.conversation ? `${inquiry.conversation.channel} conversation` : "No conversation is attached to this inquiry."}</p></div>{!inquiry.conversation ? <div className="px-6 py-16 text-center text-sm text-slate-500">Conversation history is not available for this inquiry.</div> : <div className="max-h-170 space-y-4 overflow-y-auto bg-slate-50/60 p-5 sm:p-6">{inquiry.conversation.messages.map((message) => <div key={message.id} className={`flex ${message.sender === "GUEST" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.sender === "GUEST" ? "bg-slate-900 text-white" : message.sender === "AI" ? "border border-slate-200 bg-white text-slate-700" : "bg-cyan-50 text-cyan-900"}`}><div className={`mb-1 text-[10px] font-bold uppercase tracking-[0.12em] ${message.sender === "GUEST" ? "text-slate-300" : "text-slate-400"}`}>{message.sender === "GUEST" ? "Guest" : message.sender === "AI" ? "HotelAI" : "Staff"}</div><p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p><p className={`mt-2 text-[10px] ${message.sender === "GUEST" ? "text-slate-400" : "text-slate-400"}`}>{formatDateTime(message.createdAt)}</p></div></div>)}</div>}</section></div></div></DashboardShell>;
}
