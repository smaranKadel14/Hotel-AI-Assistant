import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";
import DeleteKnowledgeBaseButton from "@/components/dashboard/DeleteKnowledgeBaseButton";
import KnowledgeBaseForm from "@/components/dashboard/KnowledgeBaseForm";
import { prisma } from "@/lib/prisma";

import { removeRoom, saveRoom } from "./actions";

export const metadata: Metadata = { title: "Rooms | HotelAI" };
const HOTEL_SLUG = "himalayan-grand-hotel";

export default async function RoomsPage() {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: HOTEL_SLUG },
    select: {
      name: true,
      rooms: { orderBy: { name: "asc" } },
    },
  });

  return (
    <DashboardShell hotelName={hotel?.name ?? "Current hotel"}>
      <div className="space-y-7">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-cyan-700">Knowledge base</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Rooms</h1><p className="mt-2 text-sm leading-6 text-slate-500">Keep room details accurate so guests receive trusted answers.</p></div>
          <details className="group relative"><summary className="cursor-pointer list-none rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Add room</summary><div className="absolute right-0 z-10 mt-3 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"><KnowledgeBaseForm action={saveRoom} kind="room" submitLabel="Create room" /></div></details>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6"><h2 className="text-base font-bold text-slate-950">Room inventory</h2><p className="mt-1 text-xs text-slate-500">{hotel?.rooms.length ?? 0} room types in this hotel workspace.</p></div>
          {!hotel?.rooms.length ? <div className="px-6 py-14 text-center text-sm text-slate-500">No rooms have been added yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-195 text-left"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-3.5">Room</th><th className="px-4 py-3.5">Description</th><th className="px-4 py-3.5">Price</th><th className="px-4 py-3.5">Capacity</th><th className="px-6 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{hotel.rooms.map((room) => <tr key={room.id} className="align-top hover:bg-slate-50/70"><td className="px-6 py-4 font-semibold text-slate-800">{room.name}</td><td className="max-w-md px-4 py-4 leading-6 text-slate-600">{room.description}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">NPR {room.priceNpr.toLocaleString("en-US")}</td><td className="px-4 py-4 text-slate-600">{room.capacity} guests</td><td className="px-6 py-4"><div className="flex justify-end gap-4"><details className="group relative"><summary className="cursor-pointer list-none text-sm font-semibold text-cyan-700 hover:text-cyan-800">Edit</summary><div className="absolute right-0 z-10 mt-2 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl"><KnowledgeBaseForm action={saveRoom} kind="room" submitLabel="Save changes" initial={{ id: room.id, name: room.name, description: room.description, priceNpr: room.priceNpr, capacity: room.capacity }} /></div></details><DeleteKnowledgeBaseButton id={room.id} action={removeRoom} /></div></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </DashboardShell>
  );
}
