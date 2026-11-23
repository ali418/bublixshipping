'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../lib/api';
import Sidebar from '../components/Sidebar';

const HUB_TYPE_COLORS: Record<string, string> = {
  HQ: 'bg-purple-100 text-purple-700',
  REGIONAL: 'bg-blue-100 text-blue-700',
  CITY: 'bg-teal-100 text-teal-700',
  AIRPORT: 'bg-amber-100 text-amber-700',
  PORT: 'bg-cyan-100 text-cyan-700',
};

export default function HubsPage() {
  const { token } = useAuth();
  const [hubs, setHubs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '', code: '', hubType: 'CITY', address: '',
    countryId: '', cityId: '', contactPhone: '', contactEmail: '',
    isActive: true, isOriginHub: false, isDestinationHub: false,
  });

  const fetchHubs = () => {
    if (!token) return;
    setLoading(true);
    adminApi.hubs(token)
      .then(res => { setHubs(res.data || []); setTotal(res.data?.length || 0); })
      .catch(() => setHubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHubs();
    if (token) {
      adminApi.countries(token).then(r => setCountries(r.data || [])).catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (token && form.countryId) {
      adminApi.cities(token, form.countryId).then(r => setCities(r.data || [])).catch(() => setCities([]));
    }
  }, [form.countryId, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createHub(token!, form);
      setShowCreate(false);
      setForm({ name: '', code: '', hubType: 'CITY', address: '', countryId: '', cityId: '', contactPhone: '', contactEmail: '', isActive: true, isOriginHub: false, isDestinationHub: false });
      fetchHubs();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create hub');
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
            <h1 className="text-2xl font-bold text-gray-800">Hubs & Branches</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} hubs registered</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition font-medium">
            + New Hub
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hubs.map((hub: any) => (
              <div key={hub.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{hub.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{hub.code}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${HUB_TYPE_COLORS[hub.hubType] || 'bg-gray-100 text-gray-600'}`}>
                    {hub.hubType}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-500">
                  {hub.country && <p>🌍 {hub.country.name}{hub.city ? `, ${hub.city.name}` : ''}</p>}
                  {hub.address && <p>📍 {hub.address}</p>}
                  {hub.contactPhone && <p>📞 {hub.contactPhone}</p>}
                  {hub.contactEmail && <p>✉️ {hub.contactEmail}</p>}
                </div>
                <div className="flex gap-2 mt-3">
                  {hub.isOriginHub && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">Origin</span>}
                  {hub.isDestinationHub && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">Destination</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ml-auto ${hub.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {hub.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {hubs.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">No hubs found.</div>
            )}
          </div>
        )}
      </div>

      {/* Create Hub Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Hub</h2>
            {createError && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hub Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Nairobi Hub" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="NBO" maxLength={10} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hub Type</label>
                <select value={form.hubType} onChange={e => setForm(f => ({ ...f, hubType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {['HQ', 'REGIONAL', 'CITY', 'AIRPORT', 'PORT'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
                <select required value={form.countryId} onChange={e => setForm(f => ({ ...f, countryId: e.target.value, cityId: '' }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select country…</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {cities.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <select value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">Select city…</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="123 Industrial Area, Nairobi" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                  <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div className="flex gap-4">
                {[
                  { key: 'isActive', label: 'Active' },
                  { key: 'isOriginHub', label: 'Origin Hub' },
                  { key: 'isDestinationHub', label: 'Destination Hub' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-teal-600" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={creating}
                  className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60">
                  {creating ? 'Creating…' : 'Create Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
