'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/shipments/create', label: 'New Shipment', emoji: '➕' },
  { href: '/shipments', label: 'Shipments', emoji: '📦' },
  { href: '/customers', label: 'Customers', emoji: '👥' },
  { href: '/finance/invoices', label: 'Invoices', emoji: '📄' },
  { href: '/finance/payments', label: 'Payments', emoji: '💳' },
  { href: '/finance/cod', label: 'COD', emoji: '💵' },
  { href: '/hubs', label: 'Branches', emoji: '🏢' },
  { href: '/users', label: 'Users', emoji: '👤' },
  { href: '/pricing', label: 'Pricing', emoji: '💲' },
  { href: '/reports', label: 'Reports', emoji: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-teal-900 text-white flex flex-col z-10 shadow-xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-teal-800 flex items-center gap-3">
        <Image src="/logo.jpg" alt="Bublix Shipping" width={36} height={36} className="rounded-lg" />
        <h1 className="text-base font-extrabold leading-tight"><span className="text-yellow-400">Bublix</span><br /><span className="text-teal-300 text-xs font-normal">Admin Portal</span></h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-colors ${
                active
                  ? 'bg-teal-700 text-yellow-400'
                  : 'text-teal-200 hover:bg-teal-800 hover:text-white'
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-teal-800">
        <div className="text-sm text-teal-300 mb-1">{user?.firstName} {user?.lastName}</div>
        <div className="text-xs text-teal-500 mb-3">{user?.roles?.[0]}</div>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-red-300 hover:text-red-200 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
