'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

interface ChatPattern {
  id: string;
  company_id: string;
  name: string;
  pattern_type: string;
  example_input: string;
  example_output: string;
  explanation: string;
  priority: number;
  is_active: boolean;
}

interface Company { id: string; name: string; }

const PATTERN_TYPES = [
  { value: 'discovery', label: '🔍 Discovery', desc: 'Gali kebutuhan' },
  { value: 'pricing', label: '💰 Pricing', desc: 'Kasih harga' },
  { value: 'objection', label: '🤔 Objection', desc: 'Handle keberatan' },
  { value: 'closing', label: '🎯 Closing', desc: 'Soft close' },
  { value: 'technical', label: '⚙️ Technical', desc: 'Jawab teknis' },
  { value: 'empathy', label: '❤️ Empathy', desc: 'Tunjukkan empati' },
  { value: 'comparison', label: '⚖️ Comparison', desc: 'Handle perbandingan' },
  { value: 'custom', label: '📝 Custom', desc: 'Pola lain' },
];

export default function ChatPatternsPage() {
  const [patterns, setPatterns] = useState<ChatPattern[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChatPattern | null>(null);
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    pattern_type: 'discovery',
    example_input: '',
    example_output: '',
    explanation: '',
    priority: 0,
  });

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { fetchPatterns(); }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('id, name');
    setCompanies(data || []);
    if (data?.[0]) setFormData(prev => ({ ...prev, company_id: data[0].id }));
  }

  async function fetchPatterns() {
    let query = supabase.from('chat_patterns').select('*');
    if (selectedCompany !== 'all') query = query.eq('company_id', selectedCompany);
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) toast.error('Failed to fetch');
    else setPatterns(data || []);
    setLoading(false);
  }

  async function handleToggle(item: ChatPattern) {
    const { error } = await supabase.from('chat_patterns')
      .update({ is_active: !item.is_active }).eq('id', item.id);
    if (error) toast.error('Failed');
    else { toast.success(item.is_active ? 'Disabled' : 'Enabled'); fetchPatterns(); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pattern?')) return;
    const { error } = await supabase.from('chat_patterns').delete().eq('id', id);
    if (error) toast.error('Failed');
    else { toast.success('Deleted'); fetchPatterns(); }
  }

  function openEdit(item: ChatPattern) {
    setEditingItem(item);
    setFormData({
      company_id: item.company_id,
      name: item.name,
      pattern_type: item.pattern_type,
      example_input: item.example_input,
      example_output: item.example_output,
      explanation: item.explanation || '',
      priority: item.priority,
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditingItem(null);
    setFormData({
      company_id: companies[0]?.id || '',
      name: '',
      pattern_type: 'discovery',
      example_input: '',
      example_output: '',
      explanation: '',
      priority: 0,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.example_input || !formData.example_output) {
      toast.error('Name, input, and output are required');
      return;
    }
    const payload = { ...formData, is_active: true };
    const op = editingItem
      ? supabase.from('chat_patterns').update(payload).eq('id', editingItem.id)
      : supabase.from('chat_patterns').insert(payload);
    const { error } = await op;
    if (error) toast.error('Failed');
    else { toast.success(editingItem ? 'Updated' : 'Created'); setDialogOpen(false); fetchPatterns(); }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chat Patterns</h1>
          <p className="text-muted-foreground mt-1">Contoh pola chat untuk AI pelajari style</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Pattern</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'New'} Chat Pattern</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company</Label>
                    <Select value={formData.company_id} onValueChange={(v) => setFormData({...formData, company_id: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.pattern_type} onValueChange={(v) => setFormData({...formData, pattern_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PATTERN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pattern Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Discovery Awal" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Input type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div>
                  <Label>Example User Input</Label>
                  <Textarea value={formData.example_input} onChange={(e) => setFormData({...formData, example_input: e.target.value})} placeholder="ada jasa website?" rows={2} />
                </div>
                <div>
                  <Label>Example CS Response</Label>
                  <Textarea value={formData.example_output} onChange={(e) => setFormData({...formData, example_output: e.target.value})} placeholder="Bisa, kalau boleh tau untuk bisnis apa?" rows={2} />
                </div>
                <div>
                  <Label>Explanation (Pattern Insight)</Label>
                  <Textarea value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})} placeholder="POLA: Gali kebutuhan spesifik sebelum kasih harga" rows={2} />
                </div>
                <Button onClick={handleSave} className="w-full">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {patterns.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No chat patterns yet. Add DNA chat examples!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {patterns.map((item) => (
            <Card key={item.id} className={`p-4 ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{PATTERN_TYPES.find(t => t.value === item.pattern_type)?.label || item.pattern_type}</Badge>
                    <span className="font-semibold">{item.name}</span>
                    <Badge variant="secondary">P{item.priority}</Badge>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                    <div><span className="text-muted-foreground">User:</span> "{item.example_input}"</div>
                    <div><span className="text-muted-foreground">CS:</span> "{item.example_output}"</div>
                    {item.explanation && <div className="text-xs text-blue-600 mt-1">→ {item.explanation}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch checked={item.is_active} onCheckedChange={() => handleToggle(item)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
