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
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';

interface QuickResponse {
  id: string;
  company_id: string;
  trigger_type: 'exact' | 'contains' | 'regex';
  triggers: string[];
  responses: string[];
  category: string;
  priority: number;
  is_active: boolean;
}

interface Company {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'greeting', label: '👋 Greeting', color: 'bg-green-100 text-green-800' },
  { value: 'thanks', label: '🙏 Thanks', color: 'bg-blue-100 text-blue-800' },
  { value: 'acknowledge', label: '✅ Acknowledge', color: 'bg-purple-100 text-purple-800' },
  { value: 'farewell', label: '👋 Farewell', color: 'bg-orange-100 text-orange-800' },
  { value: 'custom', label: '⚙️ Custom', color: 'bg-gray-100 text-gray-800' },
];

const TRIGGER_TYPES = [
  { value: 'exact', label: 'Exact Match' },
  { value: 'contains', label: 'Contains' },
  { value: 'regex', label: 'Regex Pattern' },
];

export default function QuickResponsesPage() {
  const [responses, setResponses] = useState<QuickResponse[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuickResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    company_id: string;
    trigger_type: 'exact' | 'contains' | 'regex';
    triggers: string;
    responses: string;
    category: string;
    priority: number;
  }>({
    company_id: '',
    trigger_type: 'exact',
    triggers: '',
    responses: '',
    category: 'greeting',
    priority: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('id, name');
    setCompanies(data || []);
    if (data && data.length > 0) {
      setFormData(prev => ({ ...prev, company_id: data[0].id }));
    }
  }

  async function fetchResponses() {
    let query = supabase.from('quick_responses').select('*');
    if (selectedCompany !== 'all') {
      query = query.eq('company_id', selectedCompany);
    }
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) {
      toast.error('Failed to fetch quick responses');
    } else {
      setResponses(data || []);
    }
    setLoading(false);
  }

  async function handleToggleActive(item: QuickResponse) {
    const { error } = await supabase
      .from('quick_responses')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(item.is_active ? 'Disabled' : 'Enabled');
      fetchResponses();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quick response?')) return;
    const { error } = await supabase.from('quick_responses').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted');
      fetchResponses();
    }
  }

  function openEditDialog(item: QuickResponse) {
    setEditingItem(item);
    setFormData({
      company_id: item.company_id,
      trigger_type: item.trigger_type,
      triggers: item.triggers.join('\n'),
      responses: item.responses.join('\n'),
      category: item.category,
      priority: item.priority,
    });
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingItem(null);
    setFormData({
      company_id: companies[0]?.id || '',
      trigger_type: 'exact',
      triggers: '',
      responses: '',
      category: 'greeting',
      priority: 0,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const triggersArray = formData.triggers.split('\n').map(t => t.trim()).filter(Boolean);
    const responsesArray = formData.responses.split('\n').map(r => r.trim()).filter(Boolean);

    if (triggersArray.length === 0 || responsesArray.length === 0) {
      toast.error('Triggers and responses are required');
      return;
    }

    const payload = {
      company_id: formData.company_id,
      trigger_type: formData.trigger_type,
      triggers: triggersArray,
      responses: responsesArray,
      category: formData.category,
      priority: formData.priority,
      is_active: true,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('quick_responses')
        .update(payload)
        .eq('id', editingItem.id);
      if (error) {
        toast.error('Failed to update');
      } else {
        toast.success('Updated');
        setDialogOpen(false);
        fetchResponses();
      }
    } else {
      const { error } = await supabase.from('quick_responses').insert(payload);
      if (error) {
        toast.error('Failed to create');
      } else {
        toast.success('Created');
        setDialogOpen(false);
        fetchResponses();
      }
    }
  }

  function getCategoryBadge(category: string) {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? (
      <Badge className={cat.color}>{cat.label}</Badge>
    ) : (
      <Badge variant="outline">{category}</Badge>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quick Responses</h1>
          <p className="text-muted-foreground mt-1">
            Auto-reply tanpa AI untuk greetings, thanks, dll
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" /> Add Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Quick Response' : 'New Quick Response'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Company</Label>
                  <Select 
                    value={formData.company_id} 
                    onValueChange={(v) => setFormData({...formData, company_id: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trigger Type</Label>
                    <Select 
                      value={formData.trigger_type} 
                      onValueChange={(v: any) => setFormData({...formData, trigger_type: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Triggers (one per line)</Label>
                  <Textarea 
                    placeholder="halo&#10;hai&#10;hello"
                    value={formData.triggers}
                    onChange={(e) => setFormData({...formData, triggers: e.target.value})}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.trigger_type === 'regex' 
                      ? 'Use regex patterns like: ^(halo|hai)\\s*[!.?]?$'
                      : 'Enter trigger words, one per line'}
                  </p>
                </div>

                <div>
                  <Label>Responses (one per line, random pick)</Label>
                  <Textarea 
                    placeholder="Halo! Ada yang bisa kami bantu?&#10;Hai! Ada yang bisa dibantu?"
                    value={formData.responses}
                    onChange={(e) => setFormData({...formData, responses: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Priority (higher = checked first)</Label>
                  <Input 
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {responses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No quick responses yet. Add one to get started!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {responses.map((item) => (
            <Card key={item.id} className={`p-4 ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryBadge(item.category)}
                    <Badge variant="outline">{item.trigger_type}</Badge>
                    <Badge variant="secondary">P{item.priority}</Badge>
                  </div>

                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Triggers: </span>
                    <span className="font-mono text-sm">
                      {item.triggers.slice(0, 3).join(', ')}
                      {item.triggers.length > 3 && ` +${item.triggers.length - 3} more`}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Responses: </span>
                    <span className="text-sm">
                      {item.responses[0]}
                      {item.responses.length > 1 && ` (+${item.responses.length - 1} variants)`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
