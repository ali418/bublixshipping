// Shared API client for the public website
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function trackShipment(trackingNumber: string) {
  const res = await fetch(`${API_URL}/tracking/${trackingNumber}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function getShippingServices() {
  const res = await fetch(`${API_URL}/pricing/services`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.services || [];
}

export async function calculateQuote(payload: {
  serviceId: string;
  originCountryId?: string;
  destinationCountryId?: string;
  actualWeight: number;
  length?: number;
  width?: number;
  height?: number;
}) {
  const res = await fetch(`${API_URL}/pricing/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json;
}
