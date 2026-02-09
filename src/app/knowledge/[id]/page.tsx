'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, KnowledgeBase, Company } from '@/lib/supabase';
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

export default function EditKnowledgePage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: '',
    title: '',
    content: '',
    category: 'general',
    tags: '',
    priority: 5,
    is_active: true,
  });

  useEffect(() => {
    fetchCompanies();
    if (!isNew) fetchItem();
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchItem() {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      toast.error('Not found');
      router.push('/knowledge');
    } else {
      setForm({
        company_id: data.company_id,
        title: data.title,
        content: data.content,
        category: data.category || 'general',
        tags: (data.tags || []).join(', '),
        priority: data.priority || 5,
        is_active: data.is_active,
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      company_id: form.company_id,
      title: form.title,
      content: form.content,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      priority: form.priority,
      is_active: form.is_active,
    };

    let error;
    if (isNew) {
      const res = await supabase.from('knowledge_base').insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from('knowledge_base').update(payload).eq('id', params.id);
      error = res.error;
    }

    if (error) toast.error('Failed: ' + error.message);
    else {
      toast.success('Saved!');
      router.push('/knowledge');
    }
    setSaving(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'Add Article' : 'Edit Article'}</h1>
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
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
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Article content..." className="min-h-[200px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="seo, website, murah" />
            </div>
            <div>
              <Label>Priority (1-10)</Label>
              <Input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={() => router.push('/knowledge')}>Cancel</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

