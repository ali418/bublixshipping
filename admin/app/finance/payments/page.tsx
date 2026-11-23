'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../lib/api';
import Sidebar from '../../components/Sidebar';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  REVERSED: 'bg-gray-100 text-gray-600',
};

const STATUSES = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'];

const PAYMENT_METHOD_ICONS: Record<string, string> = {
  CASH: '💵',
  MOBILE_MONEY: '📱',
  BANK_TRANSFER: '🏦',
  CHEQUE: '📄',
};

export default function PaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [verifying, setVerifying] = useState<string | null>(null);
  const limit = 20;

  const fetchPayments = () => {
    if (!token) return;
    setLoading(true);
    const params: any = { page, limit };
    if (status !== 'ALL') params.status = status;
    adminApi.payments(token, params)
      .then(res => {
        setPayments(res.data || []);
        setTotal(res.meta?.total || 0);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchPayments, [token, page, status]);

  const handleVerify = async (id: string) => {
    if (!token || !confirm('Verify this payment?')) return;
    setVerifying(id);
    try {
      await adminApi.verifyPayment(token, id);
      fetchPayments();
    } catch {
      alert('Failed to verify payment');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total payments</p>
          </div>
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
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Currency</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">No payments found.</td></tr>
              ) : payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-teal-700 font-medium text-xs">{p.referenceNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{p.customer?.businessName || p.customer?.contactName || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.currency}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {PAYMENT_METHOD_ICONS[p.paymentMethod] || '💳'} {p.paymentMethod?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => handleVerify(p.id)}
                        disabled={verifying === p.id}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100 transition disabled:opacity-50">
                        {verifying === p.id ? '…' : '✓ Verify'}
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
