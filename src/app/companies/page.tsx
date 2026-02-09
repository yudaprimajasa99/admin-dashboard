'use client';

import { useEffect, useState } from 'react';
import { supabase, Company, getIndustryIcon } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'adminsuport.id';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to fetch companies');
      // eslint-disable-next-line no-console
      console.error('Fetch error:', error);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }

  function getDomainDisplay(company: Company): string {
    switch (company.domain_type) {
      case 'subdomain':
        return `${company.slug}.${MAIN_DOMAIN}`;
      case 'custom':
        return company.custom_domain || 'Not configured';
      default:
        return 'API Only';
    }
  }

  function getDomainBadge(domainType: string) {
    switch (domainType) {
      case 'subdomain':
        return <Badge className="bg-blue-100 text-blue-700">🌐 Subdomain</Badge>;
      case 'custom':
        return <Badge className="bg-purple-100 text-purple-700">🔗 Custom</Badge>;
      default:
        return <Badge variant="secondary">❌ No Web</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🏢 Companies</h1>
          <p className="text-gray-500 text-sm mt-1">
            {companies.length} companies registered
          </p>
        </div>
        <Link href="/companies/new">
          <Button>+ Add Company</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {companies.map((company) => (
          <Card key={company.id} className={`p-4 ${!company.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-2xl mb-2">
                  {getIndustryIcon(company.industry)}
                </div>
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <p className="text-gray-500 text-sm capitalize">
                  {company.industry.replace('_', ' ')}
                </p>
              </div>
              <Badge variant={company.is_active ? 'default' : 'secondary'}>
                {company.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Domain Info */}
            <div className="mb-3 p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-1">
                {getDomainBadge(company.domain_type)}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {getDomainDisplay(company)}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-3">ID: {company.id}</p>
            
            <div className="flex gap-2">
              <Link href={`/companies/${company.id}`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
              <Link href={`/personas?company=${company.id}`}>
                <Button variant="outline" size="sm">🤖</Button>
              </Link>
              <Link href={`/items?company=${company.id}`}>
                <Button variant="outline" size="sm">📦</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No companies yet.</p>
          <Link href="/companies/new">
            <Button>+ Add First Company</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
