'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import Sidebar from '../components/Sidebar';

const RULE_TYPE_LABELS: Record<string, string> = {
  PER_KG: 'Per kg',
  FLAT: 'Flat rate',
  ZONE: 'Zone-based',
  VOLUMETRIC: 'Volumetric',
};

export default function PricingPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'services' | 'rules' | 'rates'>('services');
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [ruleForm, setRuleForm] = useState({
    serviceTypeId: '', originCountryId: '', destinationCountryId: '',
    minWeight: '', maxWeight: '', pricePerKg: '', flatRate: '',
    currency: 'USD', isActive: true,
  });
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      adminApi.services(token).catch(() => ({ data: [] })),
      adminApi.pricingRules(token).catch(() => ({ data: [] })),
      adminApi.currencyRates(token).catch(() => ({ data: [] })),
      adminApi.countries(token).catch(() => ({ data: [] })),
    ]).then(([s, r, cr, c]) => {
      setServices(s.data || []);
      setRules(r.data || []);
      setRates(cr.data || []);
      setCountries(c.data || []);
    }).finally(() => setLoading(false));
  }, [token]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createPricingRule(token!, {
        ...ruleForm,
        minWeight: parseFloat(ruleForm.minWeight) || 0,
        maxWeight: ruleForm.maxWeight ? parseFloat(ruleForm.maxWeight) : null,
        pricePerKg: ruleForm.pricePerKg ? parseFloat(ruleForm.pricePerKg) : null,
        flatRate: ruleForm.flatRate ? parseFloat(ruleForm.flatRate) : null,
      });
      setShowCreateRule(false);
      const r = await adminApi.pricingRules(token!).catch(() => ({ data: [] }));
      setRules(r.data || []);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pricing Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Services, pricing rules & currency rates</p>
          </div>
          {tab === 'rules' && (
            <button onClick={() => setShowCreateRule(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition font-medium">
              + New Rule
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
          {(['services', 'rules', 'rates'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'rates' ? 'Currency Rates' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Services Tab */}
            {tab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((s: any) => (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{s.name}</h3>
                        <p className="text-xs text-gray-400 font-mono">{s.serviceCode}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {s.description && <p className="text-sm text-gray-500 mb-3">{s.description}</p>}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>🚛 {s.serviceType?.replace(/_/g, ' ')}</span>
                      {s.minDays != null && <span>⏱ {s.minDays}–{s.maxDays} days</span>}
                      {s.maxWeightKg && <span>⚖️ Max {s.maxWeightKg} kg</span>}
                      {s.trackingEnabled && <span>📡 Tracking</span>}
                      {s.insuranceAvailable && <span>🛡 Insurance</span>}
                      {s.codAvailable && <span>💵 COD</span>}
                    </div>
                  </div>
                ))}
                {services.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400">No services found.</div>}
              </div>
            )}

            {/* Rules Tab */}
            {tab === 'rules' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Weight Range</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Currency</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rules.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-16 text-gray-400">No pricing rules yet.</td></tr>
                    ) : rules.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.shippingService?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {r.originCountry?.code || 'ALL'} → {r.destinationCountry?.code || 'ALL'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {r.minWeight}kg – {r.maxWeight ? `${r.maxWeight}kg` : '∞'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {r.pricePerKg ? `${r.pricePerKg}/kg` : r.flatRate ? `${r.flatRate} flat` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.currency}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Currency Rates Tab */}
            {tab === 'rates' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <p className="text-sm text-gray-500">Exchange rates relative to USD base currency</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">To</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rates.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-16 text-gray-400">No currency rates found.</td></tr>
                    ) : rates.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-semibold text-teal-700">{r.fromCurrency}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-700">{r.toCurrency}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{Number(r.rate).toFixed(4)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">New Pricing Rule</h2>
            {createError && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
                <select required value={ruleForm.serviceTypeId} onChange={e => setRuleForm(f => ({ ...f, serviceTypeId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select service…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Origin Country</label>
                  <select value={ruleForm.originCountryId} onChange={e => setRuleForm(f => ({ ...f, originCountryId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">All</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dest. Country</label>
                  <select value={ruleForm.destinationCountryId} onChange={e => setRuleForm(f => ({ ...f, destinationCountryId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">All</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Weight (kg) *</label>
                  <input required type="number" step="0.01" min="0" value={ruleForm.minWeight} onChange={e => setRuleForm(f => ({ ...f, minWeight: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Weight (kg)</label>
                  <input type="number" step="0.01" value={ruleForm.maxWeight} onChange={e => setRuleForm(f => ({ ...f, maxWeight: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="∞" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price / kg</label>
                  <input type="number" step="0.01" value={ruleForm.pricePerKg} onChange={e => setRuleForm(f => ({ ...f, pricePerKg: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="2.50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Flat Rate</label>
                  <input type="number" step="0.01" value={ruleForm.flatRate} onChange={e => setRuleForm(f => ({ ...f, flatRate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="10.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                <select value={ruleForm.currency} onChange={e => setRuleForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {['USD', 'KES', 'UGX', 'TZS', 'ETB', 'RWF'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateRule(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={creating}
                  className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60">
                  {creating ? 'Creating…' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
