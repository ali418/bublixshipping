'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../lib/api';
import Sidebar from '../../components/Sidebar';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUSES = ['ALL', 'DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function InvoicesPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const limit = 20;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: any = { page, limit };
    if (status !== 'ALL') params.status = status;
    adminApi.invoices(token, params)
      .then(res => {
        setInvoices(res.data || []);
        setTotal(res.meta?.total || 0);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [token, page, status]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total invoices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
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
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Currency</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Issue Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">No invoices found.</td></tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-teal-700 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{inv.customer?.businessName || inv.customer?.contactName || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{Number(inv.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{Number(inv.paidAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
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
