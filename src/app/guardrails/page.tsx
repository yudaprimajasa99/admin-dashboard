'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface Guardrail {
  id: string;
  company_id: string;
  name: string;
  trigger_intent: string[] | null;
  trigger_topic: string[] | null;
  trigger_emotion: string[] | null;
  trigger_always: boolean;
  rules: string;
  forbidden: string[];
  required: string[];
  priority: number;
  is_active: boolean;
}

interface Company { id: string; name: string; }

const INTENTS = ['INFO', 'NEGO', 'ORDER', 'KOMPLAIN', 'KONSULTASI', 'TECHNICAL'];
const TOPICS = ['website', 'seo', 'ads', 'maintenance', 'pricing', 'technical'];
const EMOTIONS = ['frustrated', 'skeptical', 'confused', 'impatient', 'disappointed'];

export default function GuardrailsPage() {
  const [items, setItems] = useState<Guardrail[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Guardrail | null>(null);
  const [formData, setFormData] = useState({
    company_id: '', name: '', trigger_intent: [] as string[], trigger_topic: [] as string[],
    trigger_emotion: [] as string[], trigger_always: false, rules: '', forbidden: '', required: '', priority: 0,
  });

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { fetchItems(); }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('id, name');
    setCompanies(data || []);
    if (data?.[0]) setFormData(prev => ({ ...prev, company_id: data[0].id }));
  }

  async function fetchItems() {
    let query = supabase.from('guardrails').select('*');
    if (selectedCompany !== 'all') query = query.eq('company_id', selectedCompany);
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) toast.error('Failed');
    else setItems(data || []);
    setLoading(false);
  }

  async function handleToggle(item: Guardrail) {
    const { error } = await supabase.from('guardrails').update({ is_active: !item.is_active }).eq('id', item.id);
    if (error) toast.error('Failed');
    else { toast.success(item.is_active ? 'Disabled' : 'Enabled'); fetchItems(); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    const { error } = await supabase.from('guardrails').delete().eq('id', id);
    if (error) toast.error('Failed');
    else { toast.success('Deleted'); fetchItems(); }
  }

  function openEdit(item: Guardrail) {
    setEditingItem(item);
    setFormData({
      company_id: item.company_id, name: item.name,
      trigger_intent: item.trigger_intent || [], trigger_topic: item.trigger_topic || [],
      trigger_emotion: item.trigger_emotion || [], trigger_always: item.trigger_always,
      rules: item.rules, forbidden: (item.forbidden || []).join('\n'),
      required: (item.required || []).join('\n'), priority: item.priority,
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditingItem(null);
    setFormData({
      company_id: companies[0]?.id || '', name: '', trigger_intent: [], trigger_topic: [],
      trigger_emotion: [], trigger_always: false, rules: '', forbidden: '', required: '', priority: 0,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.rules) { toast.error('Name and rules required'); return; }
    const payload = {
      company_id: formData.company_id, name: formData.name,
      trigger_intent: formData.trigger_intent.length ? formData.trigger_intent : null,
      trigger_topic: formData.trigger_topic.length ? formData.trigger_topic : null,
      trigger_emotion: formData.trigger_emotion.length ? formData.trigger_emotion : null,
      trigger_always: formData.trigger_always, rules: formData.rules,
      forbidden: formData.forbidden.split('\n').map(s => s.trim()).filter(Boolean),
      required: formData.required.split('\n').map(s => s.trim()).filter(Boolean),
      priority: formData.priority, is_active: true,
    };
    const op = editingItem
      ? supabase.from('guardrails').update(payload).eq('id', editingItem.id)
      : supabase.from('guardrails').insert(payload);
    const { error } = await op;
    if (error) toast.error('Failed');
    else { toast.success(editingItem ? 'Updated' : 'Created'); setDialogOpen(false); fetchItems(); }
  }

  function toggleArray(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Guardrails</h1>
          <p className="text-muted-foreground mt-1">Aturan SOP yang HARUS diikuti AI</p>
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
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Guardrail</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'New'} Guardrail</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company</Label>
                    <Select value={formData.company_id} onValueChange={(v) => setFormData({...formData, company_id: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="No Overpromise SEO" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox checked={formData.trigger_always} onCheckedChange={(c) => setFormData({...formData, trigger_always: !!c})} />
                  <Label>Apply to ALL conversations (trigger_always)</Label>
                </div>
                {!formData.trigger_always && (
                  <>
                    <div>
                      <Label>Trigger on Intent (select multiple)</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {INTENTS.map(i => (
                          <Badge key={i} variant={formData.trigger_intent.includes(i) ? 'default' : 'outline'} className="cursor-pointer"
                            onClick={() => setFormData({...formData, trigger_intent: toggleArray(formData.trigger_intent, i)})}>{i}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Trigger on Topic</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {TOPICS.map(t => (
                          <Badge key={t} variant={formData.trigger_topic.includes(t) ? 'default' : 'outline'} className="cursor-pointer"
                            onClick={() => setFormData({...formData, trigger_topic: toggleArray(formData.trigger_topic, t)})}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Trigger on Emotion</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {EMOTIONS.map(e => (
                          <Badge key={e} variant={formData.trigger_emotion.includes(e) ? 'default' : 'outline'} className="cursor-pointer"
                            onClick={() => setFormData({...formData, trigger_emotion: toggleArray(formData.trigger_emotion, e)})}>{e}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label>Rules (main instruction)</Label>
                  <Textarea value={formData.rules} onChange={(e) => setFormData({...formData, rules: e.target.value})} 
                    placeholder="Jangan overpromise ranking SEO. SEO adalah proses." rows={2} />
                </div>
                <div>
                  <Label>❌ Forbidden (one per line)</Label>
                  <Textarea value={formData.forbidden} onChange={(e) => setFormData({...formData, forbidden: e.target.value})} 
                    placeholder="Janji ranking 1 dalam waktu tertentu&#10;Guarantee hasil spesifik" rows={3} />
                </div>
                <div>
                  <Label>✅ Required (one per line)</Label>
                  <Textarea value={formData.required} onChange={(e) => setFormData({...formData, required: e.target.value})} 
                    placeholder="Explain process-based approach&#10;Gunakan 'target' bukan 'janji'" rows={3} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} />
                </div>
                <Button onClick={handleSave} className="w-full">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No guardrails yet. Add SOP rules for AI!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={`p-4 ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">{item.name}</span>
                    {item.trigger_always && <Badge variant="destructive">Always</Badge>}
                    <Badge variant="secondary">P{item.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.rules}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.trigger_intent?.map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                    {item.trigger_topic?.map(t => <Badge key={t} variant="outline" className="text-xs bg-purple-50">{t}</Badge>)}
                    {item.trigger_emotion?.map(e => <Badge key={e} variant="outline" className="text-xs bg-orange-50">{e}</Badge>)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {item.forbidden?.length > 0 && (
                      <div><AlertTriangle className="w-3 h-3 inline text-red-500 mr-1" />
                        {item.forbidden.slice(0,2).join(', ')}{item.forbidden.length > 2 && '...'}</div>
                    )}
                    {item.required?.length > 0 && (
                      <div><CheckCircle className="w-3 h-3 inline text-green-500 mr-1" />
                        {item.required.slice(0,2).join(', ')}{item.required.length > 2 && '...'}</div>
                    )}
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
