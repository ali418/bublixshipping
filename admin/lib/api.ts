// API client with auth for the admin dashboard
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message || 'Request failed', res.status);
  return json;
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  refresh: () =>
    request<any>('/auth/refresh', { method: 'POST' }),

  logout: (token: string) =>
    request<any>('/auth/logout', { method: 'POST' }, token),

  me: (token: string) =>
    request<any>('/auth/me', {}, token),

  // Dashboard
  dashboard: (token: string) =>
    request<any>('/reports/dashboard', {}, token),

  // Shipments
  shipments: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/shipments${qs}`, {}, token);
  },

  shipment: (token: string, id: string) =>
    request<any>(`/shipments/${id}`, {}, token),

  createShipment: (token: string, data: any) =>
    request<any>('/shipments', { method: 'POST', body: JSON.stringify(data) }, token),

  addTrackingEvent: (token: string, id: string, data: any) =>
    request<any>(`/shipments/${id}/events`, { method: 'POST', body: JSON.stringify(data) }, token),

  cancelShipment: (token: string, id: string, reason: string) =>
    request<any>(`/shipments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }, token),

  // Customers
  customers: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/customers${qs}`, {}, token);
  },

  createCustomer: (data: any, token: string) =>
    request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }, token),

  // Hubs
  hubs: (token: string) =>
    request<any>('/hubs', {}, token),

  // Finance
  invoices: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/finance/invoices${qs}`, {}, token);
  },

  payments: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/finance/payments${qs}`, {}, token);
  },

  codList: (token: string) =>
    request<any>('/finance/cod', {}, token),

  codCollections: (token: string, params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/finance/cod${qs}`, {}, token);
  },

  settleCOD: (token: string, id: string) =>
    request<any>(`/finance/cod/${id}/settle`, { method: 'POST' }, token),

  verifyPayment: (token: string, id: string) =>
    request<any>(`/finance/payments/${id}/verify`, { method: 'POST' }, token),

  // Locations
  countries: (token: string) =>
    request<any>('/locations/countries', {}, token),

  cities: (token: string, countryId: string) =>
    request<any>(`/locations/cities?countryId=${countryId}`, {}, token),

  // Users
  users: (token: string, params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/users${qs}`, {}, token);
  },

  createUser: (token: string, data: any) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(data) }, token),

  updateUser: (token: string, id: string, data: any) =>
    request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  // Hubs
  createHub: (token: string, data: any) =>
    request<any>('/hubs', { method: 'POST', body: JSON.stringify(data) }, token),

  // Pricing
  pricingRules: (token: string, params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/pricing/rules${qs}`, {}, token);
  },

  createPricingRule: (token: string, data: any) =>
    request<any>('/pricing/rules', { method: 'POST', body: JSON.stringify(data) }, token),

  currencyRates: (token: string) =>
    request<any>('/pricing/currencies', {}, token),

  // Reports
  revenueReport: (token: string) =>
    request<any>('/reports/revenue', {}, token),

  // Services
  services: (token: string) =>
    request<any>('/pricing/services', {}, token),
};
