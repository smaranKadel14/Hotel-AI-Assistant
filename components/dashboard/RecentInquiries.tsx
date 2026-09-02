import Link from "next/link";

type Inquiry = {
  id: string;
  guestName: string;
  roomType: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  createdAt: string;
};

type RecentInquiriesProps = {
  inquiries: Inquiry[];
};

function StatusBadge({ status }: { status: string }) {
  const isPending = status.toUpperCase() === "PENDING";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${isPending ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function RecentInquiries({ inquiries }: RecentInquiriesProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-slate-950">Recent Booking Inquiries</h2>
          <p className="mt-1 text-xs text-slate-500">The latest requests waiting for your team&apos;s attention.</p>
        </div>
        <Link href="/admin/inquiries" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">View all inquiries <span aria-hidden="true">→</span></Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500" aria-hidden="true">□</span>
          <h3 className="mt-4 text-sm font-bold text-slate-900">No booking inquiries yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">New guest booking inquiries will appear here once they are captured.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Guest</th>
                <th className="px-4 py-3.5">Room type</th>
                <th className="px-4 py-3.5">Stay dates</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-semibold text-slate-800">{inquiry.guestName}</td>
                  <td className="px-4 py-4 text-slate-600">{inquiry.roomType ?? "Not specified"}</td>
                  <td className="px-4 py-4 text-slate-600"><span className="whitespace-nowrap">{inquiry.checkIn}</span><span className="mx-1.5 text-slate-300">→</span><span className="whitespace-nowrap">{inquiry.checkOut}</span></td>
                  <td className="px-4 py-4"><StatusBadge status={inquiry.status} /></td>
                  <td className="px-6 py-4 text-slate-500">{inquiry.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
