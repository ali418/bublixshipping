import { trackShipment } from '../../../lib/api';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  CREATED: { label: 'Shipment Created', color: 'bg-blue-100 text-blue-800', emoji: '📋' },
  PICKED_UP: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-800', emoji: '📦' },
  AT_ORIGIN_HUB: { label: 'At Origin Hub', color: 'bg-purple-100 text-purple-800', emoji: '🏭' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-yellow-100 text-yellow-800', emoji: '🚛' },
  AT_DESTINATION_HUB: { label: 'At Destination', color: 'bg-orange-100 text-orange-800', emoji: '🏬' },
  CUSTOMS_CLEARANCE: { label: 'Customs Clearance', color: 'bg-red-100 text-red-800', emoji: '🛃' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-800', emoji: '🏍️' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', emoji: '✅' },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-100 text-gray-800', emoji: '⏸️' },
  DELIVERY_FAILED: { label: 'Delivery Failed', color: 'bg-red-100 text-red-700', emoji: '❌' },
  RETURNED: { label: 'Returned', color: 'bg-red-100 text-red-900', emoji: '↩️' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', emoji: '🚫' },
};

export default async function TrackingPage({ params }: { params: { trackingNumber: string } }) {
  const tn = params.trackingNumber.toUpperCase();
  const shipment = await trackShipment(tn);
  const statusInfo = shipment ? STATUS_LABELS[shipment.status] : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-teal-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            🚚 <span className="text-yellow-400">Bublix</span> Shipping
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-teal-600 hover:underline text-sm mb-6 inline-block">
          ← Back to Home
        </Link>

        {!shipment ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Shipment Not Found</h1>
            <p className="text-gray-500 mb-6">
              No shipment found for tracking number <strong className="text-teal-700">{tn}</strong>
            </p>
            <Link href="/" className="bg-teal-700 text-white px-6 py-3 rounded-full hover:bg-teal-600 transition-colors inline-block">
              Track Another Shipment
            </Link>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Tracking Number</p>
                  <h1 className="text-2xl font-mono font-bold text-teal-800">{shipment.trackingNumber}</h1>
                </div>
                {statusInfo && (
                  <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                    {statusInfo.emoji} {statusInfo.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-50 pt-4">
                <div>
                  <p className="text-gray-400 text-xs">Type</p>
                  <p className="font-medium text-gray-700">{shipment.shipmentType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Packages</p>
                  <p className="font-medium text-gray-700">{shipment.totalPieces}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Origin</p>
                  <p className="font-medium text-gray-700">{shipment.origin?.country?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Destination</p>
                  <p className="font-medium text-gray-700">{shipment.destination?.country?.name || '—'}</p>
                </div>
                {shipment.estimatedDelivery && (
                  <div>
                    <p className="text-gray-400 text-xs">Est. Delivery</p>
                    <p className="font-medium text-teal-700">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>
                  </div>
                )}
                {shipment.deliveredAt && (
                  <div>
                    <p className="text-gray-400 text-xs">Delivered On</p>
                    <p className="font-medium text-green-700">{new Date(shipment.deliveredAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            {shipment.timeline && shipment.timeline.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Tracking History</h2>
                <div className="relative">
                  {[...shipment.timeline].reverse().map((event: any, idx: number) => {
                    const ev = STATUS_LABELS[event.status] || { label: event.status, color: 'bg-gray-100 text-gray-700', emoji: '📍' };
                    return (
                      <div key={idx} className="flex gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-lg flex-shrink-0">
                            {ev.emoji}
                          </div>
                          {idx < shipment.timeline.length - 1 && (
                            <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                          )}
                        </div>
                        <div className="pb-2">
                          <p className="font-semibold text-gray-800">{ev.label}</p>
                          {event.location && <p className="text-gray-500 text-sm">📍 {event.location}</p>}
                          {event.notes && <p className="text-gray-400 text-sm italic">{event.notes}</p>}
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(event.eventTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
