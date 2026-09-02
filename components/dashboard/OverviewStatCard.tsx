type OverviewStatCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: string;
  tone: "cyan" | "amber" | "violet" | "emerald";
};

const toneStyles = {
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export default function OverviewStatCard({ label, value, detail, icon, tone }: OverviewStatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString()}</p>
        </div>
        <span className={`flex size-11 items-center justify-center rounded-xl text-xl ring-1 ${toneStyles[tone]}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-5 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
