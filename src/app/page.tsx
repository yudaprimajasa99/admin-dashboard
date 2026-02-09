'use client';

import { useEffect, useState } from 'react';
import { supabase, getIndustryIcon } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Stats {
  companies: number;
  personas: number;
  knowledge: number;
  items: number;
  faqs: number;
  chats: number;
}

interface CompanyInfo {
  id: string;
  name: string;
  industry: string;
  slug?: string;
  is_active: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    personas: 0,
    knowledge: 0,
    items: 0,
    faqs: 0,
    chats: 0,
  });
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Fetch counts in parallel
      const [
        { count: companiesCount },
        { count: personasCount },
        { count: knowledgeCount },
        { count: itemsCount },
        { count: faqsCount },
        { count: chatsCount },
        { data: companiesData },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('personas').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_base').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('faqs').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('id, name, industry, slug, is_active').order('created_at'),
      ]);

      setStats({
        companies: companiesCount || 0,
        personas: personasCount || 0,
        knowledge: knowledgeCount || 0,
        items: itemsCount || 0,
        faqs: faqsCount || 0,
        chats: chatsCount || 0,
      });

      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  }

  const statCards = [
    { label: 'Companies', value: stats.companies, href: '/companies', icon: '🏢', color: 'bg-blue-50' },
    { label: 'Personas', value: stats.personas, href: '/personas', icon: '🤖', color: 'bg-purple-50' },
    { label: 'Knowledge', value: stats.knowledge, href: '/knowledge', icon: '📚', color: 'bg-green-50' },
    { label: 'Items', value: stats.items, href: '/items', icon: '📦', color: 'bg-yellow-50' },
    { label: 'FAQs', value: stats.faqs, href: '/faqs', icon: '❓', color: 'bg-pink-50' },
    { label: 'Chats', value: stats.chats, href: '/chats', icon: '💬', color: 'bg-cyan-50' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">📊 Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${stat.color}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Companies / Clients */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🏢 Clients</h2>
          <Link href="/companies/new">
            <button className="text-sm text-blue-600 hover:underline">+ Add Client</button>
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-2">{getIndustryIcon(company.industry)}</div>
                <div className="font-semibold">{company.name}</div>
                <div className="text-gray-500 text-sm capitalize">
                  {company.industry.replace('_', ' ')}
                </div>
                {company.slug && (
                  <div className="text-xs text-blue-600 mt-1 truncate">
                    {company.slug}.adminsuport.id
                  </div>
                )}
                {!company.is_active && (
                  <span className="text-xs text-red-500">Inactive</span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
      <div className="grid grid-cols-4 gap-4">
        <Link href="/companies/new">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 border-blue-200">
            <div className="font-semibold">🏢 Add New Client</div>
            <div className="text-sm text-gray-600">Onboard new UMKM client</div>
          </Card>
        </Link>
        <Link href="/items/new">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-purple-50 border-purple-200">
            <div className="font-semibold">📦 Add Item/Product</div>
            <div className="text-sm text-gray-600">Auto-sync to knowledge</div>
          </Card>
        </Link>
        <Link href="/knowledge/new">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-green-50 border-green-200">
            <div className="font-semibold">📚 Add Knowledge</div>
            <div className="text-sm text-gray-600">Manual knowledge article</div>
          </Card>
        </Link>
        <Link href="/chats">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-cyan-50 border-cyan-200">
            <div className="font-semibold">💬 View Chats</div>
            <div className="text-sm text-gray-600">Monitor conversations</div>
          </Card>
        </Link>
      </div>

      {/* Sync Info */}
      <Card className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-semibold">Auto-Sync Active</p>
            <p className="text-sm text-gray-600">
              When you add/update Items, knowledge base syncs automatically for AI responses!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
