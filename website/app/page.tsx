import Link from 'next/link';
import Image from 'next/image';
import TrackingSearch from './components/TrackingSearch';
import ServiceCards from './components/ServiceCards';

export default function HomePage() {
  return (
    <main>
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="bg-teal-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Bublix Shipping" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight"><span className="text-yellow-400">Bublix</span> Shipping</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/tracking" className="hover:text-yellow-400 transition-colors">Track</Link>
            <Link href="/services" className="hover:text-yellow-400 transition-colors">Services</Link>
            <Link href="/quote" className="hover:text-yellow-400 transition-colors">Get a Quote</Link>
            <Link href="/contact" className="hover:text-yellow-400 transition-colors">Contact</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Ship Anywhere,<br />
            <span className="text-yellow-400">Track Everything</span>
          </h1>
          <p className="text-teal-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Domestic and international logistics made simple. Air, sea and land freight with real-time tracking.
          </p>
          <TrackingSearch />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Countries Served', value: '50+' },
            { label: 'Shipments Delivered', value: '100K+' },
            { label: 'Branches', value: '12+' },
            { label: 'On-Time Rate', value: '98%' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-teal-700">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Our Shipping Services</h2>
          <p className="text-center text-gray-500 mb-12">From local deliveries to international freight.</p>
          <ServiceCards />
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Book Your Shipment', desc: 'Create a shipment online or visit your nearest branch.' },
              { step: '02', title: 'We Handle the Rest', desc: 'Our team picks up and processes your package swiftly.' },
              { step: '03', title: 'Track in Real-Time', desc: 'Follow your shipment every step of the way.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl font-black text-teal-100 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="bg-teal-800 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Ship?</h2>
        <p className="text-teal-200 mb-8">Get an instant quote or contact our team.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/quote" className="bg-yellow-400 text-teal-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors">
            Get a Quote
          </Link>
          <Link href="/contact" className="border border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-teal-700 transition-colors">
            Contact Us
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-center text-sm">
        <p className="text-white font-semibold text-lg mb-1">🚚 Bublix Shipping</p>
        <p>© 2026 Bublix Shipping. All rights reserved.</p>
        <p className="mt-1">📍 Kampala, Uganda &nbsp;|&nbsp; 📞 +256 700 000 000 &nbsp;|&nbsp; ✉️ info@bublixshipping.com</p>
      </footer>
    </main>
  );
}
