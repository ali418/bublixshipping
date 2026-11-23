'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../lib/api';
import Sidebar from '../../components/Sidebar';

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  AT_ORIGIN_HUB: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-700',
  CUSTOMS_CLEARANCE: 'bg-orange-100 text-orange-700',
  AT_DESTINATION_HUB: 'bg-cyan-100 text-cyan-700',
  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-700',
  DELIVERED: 'bg-green-100 text-green-700',
  DELIVERY_FAILED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  RETURNED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const NEXT_STATUS: Record<string, string[]> = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['AT_ORIGIN_HUB', 'CANCELLED'],
  AT_ORIGIN_HUB: ['IN_TRANSIT', 'ON_HOLD', 'CANCELLED'],
  IN_TRANSIT: ['AT_DESTINATION_HUB', 'CUSTOMS_CLEARANCE', 'ON_HOLD'],
  CUSTOMS_CLEARANCE: ['AT_DESTINATION_HUB', 'ON_HOLD'],
  AT_DESTINATION_HUB: ['OUT_FOR_DELIVERY', 'ON_HOLD'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'ON_HOLD'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'RETURNED', 'ON_HOLD'],
  ON_HOLD: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RETURNED', 'CANCELLED'],
};

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ status: '', notes: '', isPublic: true });
  const [eventError, setEventError] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchShipment = async () => {
    if (!token) return;
    try {
      const res = await adminApi.shipment(token, id);
      setShipment(res.data);
    } catch {
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipment(); }, [id, token]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEvent(true);
    setEventError('');
    try {
      await adminApi.addTrackingEvent(token!, id, eventForm);
      setShowEventModal(false);
      setEventForm({ status: '', notes: '', isPublic: true });
      fetchShipment();
    } catch (err: any) {
      setEventError(err.message || 'Failed to add event');
    } finally {
      setAddingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Shipment not found.</p>
            <button onClick={() => router.push('/shipments')} className="text-teal-600 hover:underline">← Back to Shipments</button>
          </div>
        </div>
      </div>
    );
  }

  const allowedNext = NEXT_STATUS[shipment.shipmentStatus] || [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/shipments')} className="text-sm text-gray-500 hover:text-teal-600 mb-1 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{shipment.trackingNumber}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[shipment.shipmentStatus] || 'bg-gray-100 text-gray-700'}`}>
              {shipment.shipmentStatus?.replace(/_/g, ' ')}
            </span>
            {allowedNext.length > 0 && (
              <button onClick={() => setShowEventModal(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition">
                + Add Event
              </button>
            )}
            <a href={`${API}/api/v1/documents/waybill/${shipment.id}`} target="_blank" rel="noreferrer"
              className="border border-amber-400 text-amber-600 px-4 py-2 rounded-lg text-sm hover:bg-amber-50 transition">
              🖨 Waybill
            </a>
            <a href={`${API}/api/v1/documents/label/${shipment.id}`} target="_blank" rel="noreferrer"
              className="border border-teal-400 text-teal-600 px-4 py-2 rounded-lg text-sm hover:bg-teal-50 transition">
              🏷 Label
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Receiver */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Receiver</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium text-gray-800 mt-0.5">{shipment.receiverName}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium text-gray-800 mt-0.5">{shipment.receiverPhone}</p></div>
                {shipment.receiverEmail && <div><span className="text-gray-500">Email</span><p className="font-medium text-gray-800 mt-0.5">{shipment.receiverEmail}</p></div>}
                {shipment.receiverAddress && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Address</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {typeof shipment.receiverAddress === 'object'
                        ? `${shipment.receiverAddress.line1 || ''} ${shipment.receiverAddress.city || ''}`.trim()
                        : shipment.receiverAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Route</h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Origin</p>
                  <p className="font-semibold text-gray-800">{shipment.originHub?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{shipment.originCountry?.name || '—'}</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-teal-300 mx-4 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <span className="text-teal-500 text-sm">✈</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="font-semibold text-gray-800">{shipment.destinationHub?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{shipment.destinationCountry?.name || '—'}</p>
                </div>
              </div>
            </div>

            {/* Weight & Payment */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Package & Payment</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Actual Weight</span><p className="font-medium mt-0.5">{shipment.actualWeight} kg</p></div>
                <div><span className="text-gray-500">Chargeable Weight</span><p className="font-medium mt-0.5">{shipment.chargeableWeight} kg</p></div>
                <div><span className="text-gray-500">Pieces</span><p className="font-medium mt-0.5">{shipment.totalPieces}</p></div>
                <div><span className="text-gray-500">Shipping Cost</span><p className="font-medium mt-0.5">{shipment.shippingCost} {shipment.currency}</p></div>
                <div><span className="text-gray-500">Total Amount</span><p className="font-bold text-teal-700 mt-0.5">{shipment.totalAmount} {shipment.currency}</p></div>
                <div><span className="text-gray-500">Payment</span><p className="font-medium mt-0.5">{shipment.paymentMethod}</p></div>
                {shipment.codAmount > 0 && (
                  <div><span className="text-gray-500">COD Amount</span><p className="font-medium mt-0.5">{shipment.codAmount} {shipment.codCurrency}</p></div>
                )}
              </div>
            </div>

            {/* Items */}
            {shipment.items?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h2>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Weight</th>
                    <th className="pb-2 text-right">Value</th>
                  </tr></thead>
                  <tbody>
                    {shipment.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{item.weight ? `${item.weight} kg` : '—'}</td>
                        <td className="py-2 text-right">{item.declaredValue ? `$${item.declaredValue}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right — Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-5 h-fit">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tracking Timeline</h2>
            {shipment.events?.length > 0 ? (
              <ol className="relative border-l-2 border-teal-100 ml-2">
                {[...shipment.events].reverse().map((ev: any, i: number) => (
                  <li key={i} className="ml-4 mb-5 last:mb-0">
                    <div className="absolute -left-2 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white" style={{ top: `${i * 68 + 4}px` }} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ev.status?.replace(/_/g, ' ')}
                    </span>
                    {ev.notes && <p className="text-xs text-gray-600 mt-1">{ev.notes}</p>}
                    {ev.location && <p className="text-xs text-gray-400">{ev.location}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(ev.eventTime || ev.createdAt).toLocaleString()}
                    </p>
                    {!ev.isPublic && <span className="text-xs text-gray-400 italic">Internal</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 text-sm">No events yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add Tracking Event</h2>
            {eventError && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{eventError}</p>
            )}
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Status *</label>
                <select required value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select status…</option>
                  {allowedNext.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea rows={3} value={eventForm.notes} onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Package received at hub..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPublic" checked={eventForm.isPublic}
                  onChange={e => setEventForm(f => ({ ...f, isPublic: e.target.checked }))} className="accent-teal-600" />
                <label htmlFor="isPublic" className="text-sm text-gray-600">Visible to customer</label>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEventModal(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={addingEvent}
                  className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60">
                  {addingEvent ? 'Saving…' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
