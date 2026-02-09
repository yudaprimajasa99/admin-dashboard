'use client';

import { useEffect, useState } from 'react';
import { supabase, KnowledgeBase, Company } from '@/lib/supabase';
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

export default function KnowledgePage() {
  const searchParams = useSearchParams();
  const companyFromUrl = searchParams.get('company');
  
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(companyFromUrl || 'all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCompany, selectedSource]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchItems() {
    let query = supabase.from('knowledge_base').select('*');
    
    if (selectedCompany !== 'all') {
      query = query.eq('company_id', selectedCompany);
    }
    if (selectedSource !== 'all') {
      query = query.eq('source_type', selectedSource);
    }
    
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) toast.error('Failed to fetch');
    else setItems(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string, sourceType?: string) {
    if (sourceType === 'item') {
      toast.error('Cannot delete auto-synced item. Delete from Items page instead.');
      return;
    }
    if (!confirm('Delete this knowledge article?')) return;
    
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  }

  function getSourceBadge(sourceType?: string) {
    switch (sourceType) {
      case 'item':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">📦 Auto-sync</Badge>;
      case 'faq':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">❓ FAQ</Badge>;
      case 'import':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">📥 Import</Badge>;
      default:
        return <Badge variant="secondary" className="bg-green-100 text-green-700">✍️ Manual</Badge>;
    }
  }

  // Stats
  const manualCount = items.filter(i => !i.source_type || i.source_type === 'manual').length;
  const autoCount = items.filter(i => i.source_type === 'item').length;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">📚 Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} articles ({manualCount} manual, {autoCount} auto-synced from items)
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">✍️ Manual</SelectItem>
              <SelectItem value="item">📦 Auto-sync</SelectItem>
              <SelectItem value="faq">❓ FAQ</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/knowledge/new">
            <Button>+ Add Article</Button>
          </Link>
        </div>
      </div>

      {/* Info banner for auto-sync */}
      {autoCount > 0 && (
        <Card className="p-3 mb-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-700">
            💡 <strong>{autoCount} articles</strong> are auto-synced from Items. 
            When you add/update items, knowledge base updates automatically!
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold">{item.title}</h3>
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant="secondary">P{item.priority}</Badge>
                  {getSourceBadge(item.source_type)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                <div className="flex gap-1 mt-2">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Company: {item.company_id}
                  {item.source_id && ` | Source ID: ${item.source_id.substring(0, 8)}...`}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {item.source_type !== 'item' && (
                  <>
                    <Link href={`/knowledge/${item.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(item.id, item.source_type)}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {item.source_type === 'item' && (
                  <Link href={`/items/${item.source_id}`}>
                    <Button variant="outline" size="sm">View Item →</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No knowledge articles found.</p>
          <p className="text-sm">
            Add articles manually or they will be auto-created when you add Items.
          </p>
        </Card>
      )}
    </div>
  );
}
