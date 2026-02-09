'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, FAQ, Company } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function EditFAQPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: '',
    question: '',
    answer: '',
    category: 'general',
    tags: '',
    priority: 5,
    is_active: true,
  });

  useEffect(() => {
    fetchCompanies();
    if (!isNew) fetchFAQ();
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchFAQ() {
    const { data, error } = await supabase.from('faqs').select('*').eq('id', params.id).single();
    if (error) { toast.error('Not found'); router.push('/faqs'); return; }
    setForm({
      company_id: data.company_id,
      question: data.question,
      answer: data.answer,
      category: data.category || 'general',
      tags: (data.tags || []).join(', '),
      priority: data.priority || 5,
      is_active: data.is_active,
    });
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      company_id: form.company_id,
      question: form.question,
      answer: form.answer,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      priority: form.priority,
      is_active: form.is_active,
    };

    let error;
    if (isNew) {
      const res = await supabase.from('faqs').insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from('faqs').update(payload).eq('id', params.id);
      error = res.error;
    }

    if (error) toast.error('Failed: ' + error.message);
    else { toast.success('Saved!'); router.push('/faqs'); }
    setSaving(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'Add FAQ' : 'Edit FAQ'}</h1>
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Question</Label>
            <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question..." className="min-h-[80px]" />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter the answer..." className="min-h-[150px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="harga, promo, diskon" /></div>
            <div><Label>Priority (1-10)</Label><Input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} /></div>
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={() => router.push('/faqs')}>Cancel</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

