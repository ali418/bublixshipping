'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../lib/api';
import Sidebar from '../../components/Sidebar';

const STATUS_COLORS: Record<string, string> = {
  COLLECTED: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  SETTLED: 'bg-green-100 text-green-700',
  DISCREPANCY: 'bg-red-100 text-red-700',
};

const STATUSES = ['ALL', 'COLLECTED', 'SUBMITTED', 'SETTLED', 'DISCREPANCY'];

export default function CODPage() {
  const { token } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [settling, setSettling] = useState<string | null>(null);
  const limit = 20;

  const fetchCOD = () => {
    if (!token) return;
    setLoading(true);
    const params: any = { page, limit };
    if (status !== 'ALL') params.status = status;
    adminApi.codCollections(token, params)
      .then(res => {
        setCollections(res.data || []);
        setTotal(res.meta?.total || 0);
      })
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCOD, [token, page, status]);

  const handleSettle = async (id: string) => {
    if (!token || !confirm('Mark this COD collection as settled?')) return;
    setSettling(id);
    try {
      await adminApi.settleCOD(token, id);
      fetchCOD();
    } catch {
      alert('Failed to settle COD');
    } finally {
      setSettling(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">COD Collections</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cash on Delivery — {total.toLocaleString()} collections</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Collected', value: total, color: 'teal' },
            { label: 'Pending Settlement', key: 'SUBMITTED', color: 'amber' },
            { label: 'Settled Today', key: 'SETTLED', color: 'green' },
            { label: 'Discrepancies', key: 'DISCREPANCY', color: 'red' },
          ].map((card, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 border-${card.color}-500`}>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${status === s ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tracking #</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Collected Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Currency</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expected Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Collected At</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : collections.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">No COD collections found.</td></tr>
              ) : collections.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-teal-700 font-medium text-xs">
                    {c.shipment?.trackingNumber || '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{Number(c.collectedAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{c.currency}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expectedAmount ? Number(c.expectedAmount).toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{c.driver?.firstName ? `${c.driver.firstName} ${c.driver.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.collectedAt ? new Date(c.collectedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(c.status === 'COLLECTED' || c.status === 'SUBMITTED') && (
                      <button
                        onClick={() => handleSettle(c.id)}
                        disabled={settling === c.id}
                        className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-100 transition disabled:opacity-50">
                        {settling === c.id ? '…' : '✓ Settle'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Page {page} of {Math.ceil(total / limit)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
