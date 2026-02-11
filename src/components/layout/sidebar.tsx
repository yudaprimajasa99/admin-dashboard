'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { LogOut } from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/companies', label: 'Companies', icon: '🏢' },
  { href: '/personas', label: 'AI Persona', icon: '🤖' },  // Main customization
  { href: '/items', label: 'Products/Services', icon: '📦' },
  { href: '/knowledge', label: 'Knowledge Base', icon: '📚' },
  { href: '/faqs', label: 'FAQs', icon: '❓' },
  { href: '/quick-responses', label: 'Quick Replies', icon: '⚡' },  // No AI
  { href: '/chats', label: 'Chat History', icon: '💬' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">🚀 Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">AdminSuport.id</p>
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

      {/* User Section */}
      <div className="pt-4 border-t border-gray-700 mt-4">
        {user && (
          <div className="mb-3 px-3">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm text-gray-200 truncate">{user.email}</p>
          </div>
        )}
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          v1.1.0
        </p>
      </div>
    </aside>
  );
}
