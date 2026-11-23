'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  AT_ORIGIN_HUB: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-700',
  AT_DESTINATION_HUB: 'bg-orange-100 text-orange-700',
  CUSTOMS_CLEARANCE: 'bg-red-100 text-red-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-gray-200 text-gray-600',
  DELIVERY_FAILED: 'bg-red-200 text-red-800',
  RETURNED: 'bg-red-100 text-red-900',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

export default function ShipmentsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (search) params.search = search;
    if (status) params.status = status;

    adminApi.shipments(token, params)
      .then((res: any) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search, status]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Shipments</h1>
          <Link
            href="/shipments/create"
            className="bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors"
          >
            + New Shipment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            type="text"
            placeholder="Search tracking, name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-72"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            {['CREATED','PICKED_UP','AT_ORIGIN_HUB','IN_TRANSIT','AT_DESTINATION_HUB','CUSTOMS_CLEARANCE','OUT_FOR_DELIVERY','DELIVERED','ON_HOLD','DELIVERY_FAILED','RETURNED','CANCELLED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400 animate-pulse">Loading shipments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Tracking #', 'Receiver', 'Origin → Dest', 'Type', 'Amount', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No shipments found</td>
                    </tr>
                  ) : data?.data?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-teal-700 font-semibold">{s.trackingNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{s.receiverName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.originCountry?.name || '—'} → {s.destinationCountry?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{s.shipmentType}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {parseFloat(s.totalAmount).toFixed(2)} {s.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.shipmentStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {s.shipmentStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/shipments/${s.id}`} className="text-teal-600 hover:text-teal-800 text-xs font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Total: {data.pagination.total} shipments</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1">Page {page} of {data.pagination.totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.pagination.hasNextPage}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
