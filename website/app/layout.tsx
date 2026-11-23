import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Bublix Shipping – Global Logistics Platform',
    template: '%s | Bublix Shipping',
  },
  description: 'Professional domestic and international shipping services. Track your shipments in real-time.',
  keywords: ['shipping', 'logistics', 'tracking', 'international freight', 'Uganda'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
