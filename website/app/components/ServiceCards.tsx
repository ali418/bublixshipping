import { getShippingServices } from '../../lib/api';

const SERVICE_ICONS: Record<string, string> = {
  AIR: '✈️',
  SEA: '🚢',
  LAND: '🚛',
  EXPRESS: '⚡',
  LOCAL: '📦',
};

export default async function ServiceCards() {
  let services: any[] = [];
  try {
    services = await getShippingServices();
  } catch {}

  // Fallback static data if API not connected
  if (!services.length) {
    services = [
      { id: '1', name: 'Air Freight', nameAr: 'شحن جوي', serviceType: 'AIR', estimatedDaysMin: 3, estimatedDaysMax: 7, shipmentScope: 'INTERNATIONAL' },
      { id: '2', name: 'Sea Freight', nameAr: 'شحن بحري', serviceType: 'SEA', estimatedDaysMin: 20, estimatedDaysMax: 45, shipmentScope: 'INTERNATIONAL' },
      { id: '3', name: 'Express Delivery', nameAr: 'توصيل سريع', serviceType: 'EXPRESS', estimatedDaysMin: 1, estimatedDaysMax: 2, shipmentScope: 'BOTH' },
      { id: '4', name: 'Local Delivery', nameAr: 'توصيل محلي', serviceType: 'LOCAL', estimatedDaysMin: 1, estimatedDaysMax: 1, shipmentScope: 'DOMESTIC' },
      { id: '5', name: 'Land Freight', nameAr: 'شحن بري', serviceType: 'LAND', estimatedDaysMin: 5, estimatedDaysMax: 14, shipmentScope: 'BOTH' },
    ];
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div
          key={service.id}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all"
        >
          <div className="text-4xl mb-4">{SERVICE_ICONS[service.serviceType] || '📦'}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{service.name}</h3>
          {service.nameAr && (
            <p className="text-teal-600 text-sm mb-2" dir="rtl">{service.nameAr}</p>
          )}
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
            {service.shipmentScope === 'BOTH' ? 'Domestic & International' : service.shipmentScope}
          </p>
          {service.estimatedDaysMin && (
            <p className="text-teal-700 text-sm font-medium">
              🕐 {service.estimatedDaysMin}–{service.estimatedDaysMax} business days
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
