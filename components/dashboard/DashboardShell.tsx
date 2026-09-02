import Link from "next/link";
import type { ReactNode } from "react";

type DashboardShellProps = {
  hotelName: string;
  children: ReactNode;
};

const navigation = [
  { label: "Overview", href: "/admin", icon: "▦", active: true },
  { label: "Rooms", href: "/admin/rooms", icon: "▤", active: false },
  { label: "FAQs", href: "/admin/faqs", icon: "?", active: false },
  { label: "Policies", href: "/admin/policies", icon: "▥", active: false },
  { label: "Booking Inquiries", href: "/admin/inquiries", icon: "□", active: false },
  { label: "Settings", href: "/admin/settings", icon: "⚙", active: false },
];

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950 shadow-[0_8px_18px_rgba(34,211,238,0.2)]">
        H
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">HotelAI</span>
    </Link>
  );
}

function NavigationLinks() {
  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {navigation.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
            item.active
              ? "bg-cyan-400/10 font-semibold text-cyan-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
          }`}
        >
          <span className={`flex size-6 items-center justify-center text-base ${item.active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"}`} aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function DashboardShell({ hotelName, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-800 bg-[#111a2a] px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-12 flex-1">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <NavigationLinks />
        </div>
        <Link href="/admin/support" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100">
          <span className="flex size-6 items-center justify-center text-base text-slate-500" aria-hidden="true">◌</span>
          Help &amp; Support
        </Link>
        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="px-3 text-xs text-slate-500">Current workspace</p>
          <p className="mt-1 truncate px-3 text-sm font-medium text-slate-200">{hotelName}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-360 flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div className="lg:hidden">
                <Brand />
              </div>
              <div className="hidden h-8 w-px bg-slate-200 lg:block" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Good morning, Admin</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">Here&apos;s what&apos;s happening with your hotel today.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="max-w-48 truncate text-xs font-semibold text-slate-700">{hotelName}</span>
                <span className="text-slate-400" aria-hidden="true">⌄</span>
              </div>
              <button type="button" aria-label="Notifications" className="relative flex size-10 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">
                ♧
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cyan-500" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">A</span>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800">Admin User</p>
                  <p className="text-[11px] text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-slate-100 px-5 py-2 lg:hidden sm:px-8">
            <div className="flex min-w-max gap-1">
              {navigation.map((item) => (
                <Link key={item.label} href={item.href} className={`rounded-lg px-3 py-2 text-xs font-semibold ${item.active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-360 px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
