export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Hotel AI Assistant
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Project foundation ready
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          This is the initial Next.js app foundation for the hotel guest experience project.
          The chatbot, hotel dashboard, and AI features will be added later.
        </p>
      </div>
    </main>
  );
}
