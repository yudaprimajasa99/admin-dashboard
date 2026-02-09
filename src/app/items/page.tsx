'use client';

import { useEffect, useState } from 'react';
import { supabase, Item, Company, formatPrice, getItemTypeIcon } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const companyFromUrl = searchParams.get('company');
  
  const [items, setItems] = useState<Item[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(companyFromUrl || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCompany, selectedType]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchItems() {
    setLoading(true);
    let query = supabase.from('items').select('*');
    
    if (selectedCompany !== 'all') {
      query = query.eq('company_id', selectedCompany);
    }
    if (selectedType !== 'all') {
      query = query.eq('item_type', selectedType);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      toast.error('Failed to fetch items');
      // eslint-disable-next-line no-console
      console.error('Fetch items error:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove it from knowledge base.`)) return;
    
    const { error } = await supabase.from('items').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      toast.success('Deleted! Knowledge base synced.');
      fetchItems();
    }
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    const { error } = await supabase
      .from('items')
      .update({ is_featured: !currentValue })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update');
    } else {
      fetchItems();
    }
  }

  // Stats
  const activeCount = items.filter(i => i.is_active).length;
  const featuredCount = items.filter(i => i.is_featured).length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">📦 Items / Services</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} items ({activeCount} active, {featuredCount} featured)
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">📦 Product</SelectItem>
              <SelectItem value="service">🛠️ Service</SelectItem>
              <SelectItem value="vehicle">🚗 Vehicle</SelectItem>
              <SelectItem value="room">🛏️ Room</SelectItem>
              <SelectItem value="tour">✈️ Tour</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/items/new">
            <Button>+ Add Item</Button>
          </Link>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={`p-4 ${!item.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{getItemTypeIcon(item.item_type)}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge variant="outline">{item.item_type}</Badge>
                    {item.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-700">⭐ Featured</Badge>
                    )}
                    {!item.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.short_description || item.description?.substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(item.base_pricing)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.company_id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFeatured(item.id, item.is_featured)}
                  title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                >
                  {item.is_featured ? '⭐' : '☆'}
                </Button>
                <Link href={`/items/${item.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id, item.name)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No items found.</p>
          <p className="text-sm mb-4">
            {selectedCompany !== 'all' || selectedType !== 'all' 
              ? 'Try adjusting filters or ' 
              : ''}
            Add your first item to get started!
          </p>
          <Link href="/items/new">
            <Button>+ Add Item</Button>
          </Link>
        </Card>
      )}

      {/* Info */}
      <Card className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-semibold">Auto-Sync to Knowledge Base</p>
            <p className="text-sm text-gray-600">
              Items are automatically synced to knowledge base. Delete item = delete from knowledge.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
