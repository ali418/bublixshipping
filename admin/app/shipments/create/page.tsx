'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../lib/api';
import Sidebar from '../../components/Sidebar';

interface Hub { id: string; name: string; code: string; }
interface Country { id: string; name: string; code: string; }
interface Service { id: string; name: string; serviceCode: string; }

const PAYMENT_METHODS = ['PREPAID', 'COD', 'CREDIT', 'THIRD_PARTY'];
const SHIPMENT_TYPES = ['DOMESTIC', 'INTERNATIONAL'];

export default function CreateShipmentPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [hubs, setHubs] = useState<Hub[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ trackingNumber: string; shipmentId: string } | null>(null);

  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
    receiverAddressLine: '',
    receiverCity: '',
    receiverCountry: '',
    shipmentType: 'DOMESTIC',
    serviceTypeId: '',
    originHubId: '',
    destinationHubId: '',
    originCountryId: '',
    destinationCountryId: '',
    actualWeight: '',
    length: '',
    width: '',
    height: '',
    totalPieces: '1',
    paymentMethod: 'PREPAID',
    shippingCost: '',
    currency: 'USD',
    codAmount: '',
    codCurrency: 'USD',
    specialInstructions: '',
    items: [{ description: '', quantity: 1, weight: '', declaredValue: '' }],
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      adminApi.hubs(token).catch(() => ({ data: [] })),
      adminApi.countries(token).catch(() => ({ data: [] })),
      adminApi.services(token).catch(() => ({ data: [] })),
    ]).then(([h, c, s]) => {
      setHubs(h.data || []);
      setCountries(c.data || []);
      setServices(s.data || []);
    });
  }, [token]);

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const setItem = (i: number, field: string, value: string | number) =>
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      return { ...f, items };
    });

  const addItem = () =>
    setForm(f => ({
      ...f,
      items: [...f.items, { description: '', quantity: 1, weight: '', declaredValue: '' }],
    }));

  const removeItem = (i: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverEmail: form.receiverEmail || undefined,
        receiverAddress: {
          line1: form.receiverAddressLine,
          city: form.receiverCity,
          country: form.receiverCountry,
        },
        shipmentType: form.shipmentType,
        serviceTypeId: form.serviceTypeId,
        originHubId: form.originHubId,
        destinationHubId: form.destinationHubId,
        originCountryId: form.originCountryId,
        destinationCountryId: form.destinationCountryId,
        actualWeight: parseFloat(form.actualWeight),
        dimensions: form.length
          ? {
              length: parseFloat(form.length),
              width: parseFloat(form.width),
              height: parseFloat(form.height),
            }
          : undefined,
        totalPieces: parseInt(form.totalPieces),
        paymentMethod: form.paymentMethod,
        shippingCost: parseFloat(form.shippingCost),
        currency: form.currency,
        codAmount: form.codAmount ? parseFloat(form.codAmount) : 0,
        codCurrency: form.codCurrency || undefined,
        specialInstructions: form.specialInstructions || undefined,
        items: form.items
          .filter(it => it.description)
          .map(it => ({
            description: it.description,
            quantity: Number(it.quantity),
            weight: it.weight ? parseFloat(it.weight) : undefined,
            declaredValue: it.declaredValue ? parseFloat(it.declaredValue) : undefined,
          })),
      };

      const res = await adminApi.createShipment(token!, payload);
      setSuccess({ trackingNumber: res.data.trackingNumber, shipmentId: res.data.id });
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Shipment Created!</h2>
            <p className="text-gray-500 mb-6">Your tracking number is:</p>
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-6 py-3 text-2xl font-mono font-bold text-teal-700 mb-6">
              {success.trackingNumber}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/shipments/${success.shipmentId}`)}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 transition"
              >
                View Shipment
              </button>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/waybill/${success.shipmentId}`}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 transition"
              >
                Print Waybill
              </a>
              <button
                onClick={() => { setSuccess(null); setForm(f => ({ ...f, receiverName: '', receiverPhone: '', receiverEmail: '' })); }}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                New Shipment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create New Shipment</h1>
            <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new shipment</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Receiver Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                Receiver Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input required value={form.receiverName} onChange={e => set('receiverName', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input required value={form.receiverPhone} onChange={e => set('receiverPhone', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="+1234567890" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.receiverEmail} onChange={e => set('receiverEmail', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.receiverCity} onChange={e => set('receiverCity', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Nairobi" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line</label>
                  <input value={form.receiverAddressLine} onChange={e => set('receiverAddressLine', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="123 Main Street, Apartment 4B" />
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                Shipment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select required value={form.shipmentType} onChange={e => set('shipmentType', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {SHIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
                  <select required value={form.serviceTypeId} onChange={e => set('serviceTypeId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select service…</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total Pieces</label>
                  <input type="number" min="1" value={form.totalPieces} onChange={e => set('totalPieces', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Origin Hub *</label>
                  <select required value={form.originHubId} onChange={e => set('originHubId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select hub…</option>
                    {hubs.map(h => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Destination Hub *</label>
                  <select required value={form.destinationHubId} onChange={e => set('destinationHubId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select hub…</option>
                    {hubs.map(h => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Origin Country *</label>
                  <select required value={form.originCountryId} onChange={e => set('originCountryId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select country…</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Destination Country *</label>
                  <select required value={form.destinationCountryId} onChange={e => set('destinationCountryId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select country…</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Weight & Dimensions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                Weight & Dimensions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg) *</label>
                  <input required type="number" step="0.01" min="0.01" value={form.actualWeight} onChange={e => set('actualWeight', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="1.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                  <input type="number" step="0.1" value={form.length} onChange={e => set('length', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                  <input type="number" step="0.1" value={form.width} onChange={e => set('width', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                  <input type="number" step="0.1" value={form.height} onChange={e => set('height', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="15" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                Payment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                  <select required value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Shipping Cost *</label>
                  <input required type="number" step="0.01" min="0" value={form.shippingCost} onChange={e => set('shippingCost', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="25.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => set('currency', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {['USD', 'KES', 'UGX', 'TZS', 'ETB', 'RWF'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {form.paymentMethod === 'COD' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">COD Amount *</label>
                      <input type="number" step="0.01" min="0" value={form.codAmount} onChange={e => set('codAmount', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">COD Currency</label>
                      <select value={form.codCurrency} onChange={e => set('codCurrency', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                        {['USD', 'KES', 'UGX', 'TZS', 'ETB', 'RWF'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
                  Items
                </h2>
                <button type="button" onClick={addItem}
                  className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-100 transition">
                  + Add Item
                </button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-3 mb-3">
                  <div className="col-span-2">
                    <input placeholder="Description" value={item.description} onChange={e => setItem(i, 'description', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div>
                    <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div className="flex gap-1">
                    <input type="number" placeholder="Value" step="0.01" value={item.declaredValue} onChange={e => setItem(i, 'declaredValue', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600 px-2 text-lg font-bold">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Special Instructions</h2>
              <textarea rows={3} value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Handle with care, fragile items..." />
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end pb-8">
              <button type="button" onClick={() => router.push('/shipments')}
                className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="bg-teal-600 text-white px-8 py-2.5 rounded-lg hover:bg-teal-700 transition text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Creating…</>
                ) : 'Create Shipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
