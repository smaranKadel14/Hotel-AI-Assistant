import ChatWidget from "@/components/chat/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏔️</span>
            <span className="text-lg font-bold tracking-tight text-white">
              Himalayan Grand Hotel
            </span>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
            Thamel, Kathmandu
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            Luxury Stay in the Heart of Nepal
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Experience Himalayan Hospitality
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Enjoy premium rooms, a rooftop restaurant, spa wellness, and 24/7 guest service.
            Have questions about room rates, check-in policies, or facilities? Try our instant AI concierge below!
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-3 text-sm text-slate-300">
              🛏️ Rooms from <strong className="text-white">NPR 8,500/night</strong>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-3 text-sm text-slate-300">
              🍳 <strong className="text-white">Complimentary Breakfast</strong>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-3 text-sm text-slate-300">
              🏊 <strong className="text-white">Heated Pool & Spa</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Showcase */}
      <section className="border-t border-slate-800 bg-slate-950/60 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white text-center sm:text-3xl">
            Featured Rooms & Suites
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Ask our AI assistant at the bottom right for live availability and details
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">Deluxe Room</h3>
              <p className="mt-2 text-sm text-slate-400">
                King-size bed with city views and modern amenities.
              </p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-indigo-400 font-bold">NPR 8,500</span>
                <span className="text-xs text-slate-500">per night • 2 Guests</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">Executive Suite</h3>
              <p className="mt-2 text-sm text-slate-400">
                Elegant suite with separate lounge for business travelers.
              </p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-indigo-400 font-bold">NPR 18,500</span>
                <span className="text-xs text-slate-500">per night • 3 Guests</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">Presidential Suite</h3>
              <p className="mt-2 text-sm text-slate-400">
                Ultimate luxury hospitality with panoramic mountain & city vistas.
              </p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-indigo-400 font-bold">NPR 45,000</span>
                <span className="text-xs text-slate-500">per night • 2 Guests</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chat Widget */}
      <ChatWidget
        hotelSlug="himalayan-grand-hotel"
        hotelName="Himalayan Grand Hotel"
      />
    </main>
  );
}
