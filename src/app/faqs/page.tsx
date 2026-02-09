'use client';

import { useEffect, useState } from 'react';
import { supabase, FAQ, Company } from '@/lib/supabase';
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

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchFaqs() {
    let query = supabase.from('faqs').select('*');
    if (selectedCompany !== 'all') query = query.eq('company_id', selectedCompany);
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) toast.error('Failed to fetch');
    else setFaqs(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) toast.error('Failed');
    else { toast.success('Deleted'); fetchFaqs(); }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FAQs</h1>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Link href="/faqs/new"><Button>+ Add FAQ</Button></Link>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">❓</span>
                  <h3 className="font-semibold">{faq.question}</h3>
                  {faq.category && <Badge variant="outline">{faq.category}</Badge>}
                  <Badge variant="secondary">P{faq.priority}</Badge>
                </div>
                <p className="text-sm text-gray-600 ml-7 line-clamp-2">{faq.answer}</p>
                <div className="flex gap-1 mt-2 ml-7">
                  {faq.tags?.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Link href={`/faqs/${faq.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(faq.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {faqs.length === 0 && (
        <Card className="p-8 text-center text-gray-500">No FAQs found.</Card>
      )}
    </div>
  );
}

