import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";
import OverviewStatCard from "@/components/dashboard/OverviewStatCard";
import RecentInquiries from "@/components/dashboard/RecentInquiries";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Overview | HotelAI",
  description: "HotelAI administration overview.",
};

const CURRENT_HOTEL_SLUG = "himalayan-grand-hotel";

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    : "Not specified";

export default async function AdminOverviewPage() {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: CURRENT_HOTEL_SLUG },
    select: {
      id: true,
      name: true,
      rooms: { select: { id: true } },
      facilities: { select: { id: true } },
      faqs: { select: { id: true } },
      bookingInquiries: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          guestName: true,
          roomType: true,
          checkIn: true,
          checkOut: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          rooms: true,
          facilities: true,
          faqs: true,
          bookingInquiries: true,
        },
      },
    },
  });

  if (!hotel) {
    return (
      <DashboardShell hotelName="Current hotel">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <p className="text-sm font-bold text-slate-900">No hotel workspace configured</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Connect a hotel workspace to view its rooms, facilities, FAQs, and booking inquiries.</p>
        </section>
      </DashboardShell>
    );
  }

  const inquiries = hotel.bookingInquiries.map((inquiry) => ({
    id: inquiry.id,
    guestName: inquiry.guestName,
    roomType: inquiry.roomType,
    checkIn: formatDate(inquiry.checkIn),
    checkOut: formatDate(inquiry.checkOut),
    status: inquiry.status,
    createdAt: formatDate(inquiry.createdAt),
  }));

  return (
    <DashboardShell hotelName={hotel.name}>
      <div className="space-y-8">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your hotel at a glance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Monitor your property&apos;s content and guest demand from one central workspace.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace data
          </div>
        </section>

        <section aria-label="Hotel statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewStatCard label="Rooms" value={hotel._count.rooms} detail="Room types configured" icon="▤" tone="cyan" />
          <OverviewStatCard label="Facilities" value={hotel._count.facilities} detail="Amenities available to guests" icon="⌂" tone="amber" />
          <OverviewStatCard label="FAQs" value={hotel._count.faqs} detail="Answers in your knowledge base" icon="?" tone="violet" />
          <OverviewStatCard label="Booking inquiries" value={hotel._count.bookingInquiries} detail="Guest requests captured" icon="□" tone="emerald" />
        </section>

        <RecentInquiries inquiries={inquiries} />
      </div>
    </DashboardShell>
  );
}
