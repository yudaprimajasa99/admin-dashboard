'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/companies', label: 'Companies', icon: '🏢' },
  { href: '/personas', label: 'Personas', icon: '🤖' },
  { href: '/items', label: 'Items/Services', icon: '📦' },
  { href: '/knowledge', label: 'Knowledge Base', icon: '📚' },
  { href: '/faqs', label: 'FAQs', icon: '❓' },
  { href: '/chats', label: 'Chat History', icon: '💬' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">🚀 Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">SaaS CS AI - Roofel</p>
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-700 mt-4">
        <p className="text-xs text-gray-500 text-center">
          AdminSuport.id v1.0
        </p>
      </div>
    </aside>
  );
}
