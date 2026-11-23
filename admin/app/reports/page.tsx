'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import Sidebar from '../components/Sidebar';

interface StatCard { label: string; value: string | number; sub?: string; color: string; icon: string; }

function Card({ label, value, sub, color, icon }: StatCard) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  CREATED: '#6366F1',
  PICKED_UP: '#8B5CF6',
  AT_ORIGIN_HUB: '#7C3AED',
  IN_TRANSIT: '#F59E0B',
  CUSTOMS_CLEARANCE: '#F97316',
  AT_DESTINATION_HUB: '#06B6D4',
  OUT_FOR_DELIVERY: '#0D9488',
  DELIVERED: '#10B981',
  DELIVERY_FAILED: '#EF4444',
  ON_HOLD: '#EAB308',
  RETURNED: '#6B7280',
  CANCELLED: '#9CA3AF',
};

export default function ReportsPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'revenue' | 'shipments'>('overview');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      adminApi.dashboard(token).catch(() => null),
      adminApi.revenueReport(token).catch(() => null),
    ]).then(([d, r]) => {
      setDashboard(d?.data || d);
      setRevenue(r?.data || r);
    }).finally(() => setLoading(false));
  }, [token]);

  const stats = dashboard?.stats || {};
  const statusBreakdown = dashboard?.statusBreakdown || [];
  const monthlyRevenue = revenue?.monthly || [];

  const maxRevenue = Math.max(...monthlyRevenue.map((m: any) => m.total || 0), 1);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform performance overview</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
          {(['overview', 'revenue', 'shipments'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <Card label="Total Shipments" value={stats.totalShipments ?? 0} icon="📦" color="border-teal-500" />
                  <Card label="Active Shipments" value={stats.activeShipments ?? 0} icon="🚚" color="border-amber-400" sub="In transit / processing" />
                  <Card label="Delivered" value={stats.deliveredShipments ?? 0} icon="✅" color="border-green-500" />
                  <Card label="Total Revenue" value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`} icon="💰" color="border-indigo-400" sub="All time" />
                  <Card label="Total Customers" value={stats.totalCustomers ?? 0} icon="👥" color="border-purple-400" />
                  <Card label="Total Hubs" value={stats.totalHubs ?? 0} icon="🏢" color="border-cyan-400" />
                  <Card label="COD Pending" value={`$${Number(stats.pendingCOD || 0).toLocaleString()}`} icon="💵" color="border-orange-400" />
                  <Card label="Avg Delivery Days" value={stats.avgDeliveryDays ? `${Number(stats.avgDeliveryDays).toFixed(1)} d` : '—'} icon="⏱" color="border-rose-400" />
                </div>

                {/* Status Breakdown */}
                {statusBreakdown.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Shipments by Status</h2>
                    <div className="space-y-2.5">
                      {statusBreakdown.map((item: any) => {
                        const pct = stats.totalShipments ? Math.round((item.count / stats.totalShipments) * 100) : 0;
                        const color = STATUS_COLORS[item.status] || '#9CA3AF';
                        return (
                          <div key={item.status} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-36 truncate">{item.status.replace(/_/g, ' ')}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-8 text-right">{item.count}</span>
                            <span className="text-xs text-gray-400 w-8">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {tab === 'revenue' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-gray-600 mb-5 uppercase tracking-wide">Monthly Revenue (USD)</h2>
                  {monthlyRevenue.length > 0 ? (
                    <div className="flex items-end gap-2 h-48">
                      {monthlyRevenue.map((m: any, i: number) => {
                        const height = Math.round((m.total / maxRevenue) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">${Number(m.total || 0).toLocaleString()}</span>
                            <div
                              className="w-full rounded-t-lg bg-teal-500 hover:bg-teal-400 transition relative group"
                              style={{ height: `${Math.max(height, 4)}%` }}
                              title={`${m.month}: $${m.total}`}
                            />
                            <span className="text-xs text-gray-400 truncate max-w-full">{m.month?.slice(0, 3)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-400">No revenue data yet.</div>
                  )}
                </div>

                {/* Revenue by Service */}
                {revenue?.byService?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Revenue by Service</h2>
                    <div className="space-y-2">
                      {revenue.byService.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm text-gray-700">{s.service || s.serviceType || '—'}</span>
                          <span className="text-sm font-semibold text-teal-700">${Number(s.revenue || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shipments Tab */}
            {tab === 'shipments' && (
              <div className="space-y-5">
                {/* Top Hubs */}
                {dashboard?.topHubs?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Top Performing Hubs</h2>
                    <div className="space-y-2">
                      {dashboard.topHubs.map((h: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{h.name}</p>
                            <p className="text-xs text-gray-400">{h.country}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">{h.shipments} shipments</p>
                            {h.revenue && <p className="text-xs text-teal-600">${Number(h.revenue).toLocaleString()}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Performance */}
                {dashboard?.deliveryPerformance && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Delivery Performance</h2>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{dashboard.deliveryPerformance.onTimeRate ?? '—'}%</p>
                        <p className="text-xs text-gray-500 mt-1">On-Time Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-teal-600">{dashboard.deliveryPerformance.avgDays ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">Avg Days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-500">{dashboard.deliveryPerformance.failedRate ?? '—'}%</p>
                        <p className="text-xs text-gray-500 mt-1">Failed Delivery</p>
                      </div>
                    </div>
                  </div>
                )}

                {(!dashboard?.topHubs && !dashboard?.deliveryPerformance) && (
                  <div className="text-center py-16 text-gray-400">No detailed shipment data available yet.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
