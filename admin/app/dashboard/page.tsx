'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import Sidebar from '../components/Sidebar';

interface DashboardData {
  today: { newShipments: number };
  current: { inTransit: number; pendingPayment: number };
  monthly: { delivered: number; revenue: any[]; pendingCOD: number };
  statusBreakdown: Record<string, number>;
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token) {
      adminApi.dashboard(token)
        .then((res: any) => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-teal-700 animate-pulse">Loading...</div>;
  }

  const statCards = [
    { label: 'New Today', value: data?.today?.newShipments ?? '—', emoji: '📦', color: 'bg-blue-50 border-blue-200' },
    { label: 'In Transit', value: data?.current?.inTransit ?? '—', emoji: '🚛', color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Delivered (Month)', value: data?.monthly?.delivered ?? '—', emoji: '✅', color: 'bg-green-50 border-green-200' },
    { label: 'Pending Payment', value: data?.current?.pendingPayment ?? '—', emoji: '💰', color: 'bg-orange-50 border-orange-200' },
    { label: 'COD Unsettled', value: data?.monthly?.pendingCOD !== undefined ? `$${Number(data.monthly.pendingCOD).toFixed(0)}` : '—', emoji: '🏦', color: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {user.firstName} 👋</p>
          </div>
          <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
            {user.roles?.[0] || 'Staff'}
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-bold text-gray-800">{loading ? '...' : s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        {data?.statusBreakdown && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Shipments by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.statusBreakdown).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-teal-700">{count}</div>
                  <div className="text-xs text-gray-500 mt-1">{status.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue by Currency */}
        {data?.monthly?.revenue && data.monthly.revenue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Monthly Revenue</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.monthly.revenue.map((r: any) => (
                <div key={`${r.currency}-${r.paymentMethod}`} className="p-4 bg-teal-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">{r.paymentMethod}</div>
                  <div className="text-xl font-bold text-teal-800">
                    {parseFloat(r.total).toLocaleString()} <span className="text-sm">{r.currency}</span>
                  </div>
                  <div className="text-xs text-gray-400">{r.transactions} transactions</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
