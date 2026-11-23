'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingSearch() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const tn = trackingNumber.trim().toUpperCase();
    if (!tn) return;
    router.push(`/tracking/${tn}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
      <input
        type="text"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Enter tracking number (BBLX-XXXXXX)"
        className="flex-1 px-5 py-4 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
      />
      <button
        type="submit"
        className="bg-yellow-400 text-teal-900 font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg whitespace-nowrap"
      >
        Track Shipment
      </button>
    </form>
  );
}
