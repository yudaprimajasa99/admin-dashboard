'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Item, Company, formatPrice } from '@/lib/supabase';
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

const itemTypes = [
  { value: 'product', label: '📦 Product (E-commerce)', pricingType: 'simple' },
  { value: 'service', label: '🛠️ Service (Digital Agency)', pricingType: 'range' },
  { value: 'vehicle', label: '🚗 Vehicle (Car Rental)', pricingType: 'rental' },
  { value: 'room', label: '🛏️ Room (Hotel)', pricingType: 'room' },
  { value: 'tour', label: '✈️ Tour Package (Travel)', pricingType: 'tour' },
];

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: '',
    item_type: 'product' as Item['item_type'],
    name: '',
    slug: '',
    description: '',
    short_description: '',
    // Pricing fields - dynamic based on item_type
    price: 0,
    compare_price: 0,
    price_min: 0,
    price_max: 0,
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    deposit: 0,
    weekday_rate: 0,
    weekend_rate: 0,
    min_pax: 2,
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    fetchCompanies();
    if (!isNew) fetchItem();
  }, [isNew]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchItem() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      toast.error('Item not found');
      router.push('/items');
      return;
    }

    const pricing = data.base_pricing || {};
    
    setForm({
      company_id: data.company_id,
      item_type: data.item_type,
      name: data.name,
      slug: data.slug || '',
      description: data.description || '',
      short_description: data.short_description || '',
      // Parse pricing based on structure
      price: pricing.price || 0,
      compare_price: pricing.compare_price || 0,
      price_min: pricing.min || 0,
      price_max: pricing.max || 0,
      daily_rate: pricing.daily || 0,
      weekly_rate: pricing.weekly || 0,
      monthly_rate: pricing.monthly || 0,
      deposit: pricing.deposit || 0,
      weekday_rate: pricing.weekday || 0,
      weekend_rate: pricing.weekend || 0,
      min_pax: pricing.min_pax || 2,
      is_featured: data.is_featured,
      is_active: data.is_active,
    });
    setLoading(false);
  }

  function buildPricing() {
    switch (form.item_type) {
      case 'product':
        return {
          price: form.price,
          compare_price: form.compare_price || undefined,
        };
      case 'service':
        if (form.price_min && form.price_max) {
          return { min: form.price_min, max: form.price_max, unit: 'project' };
        }
        return { price: form.price, unit: 'project' };
      case 'vehicle':
        return {
          daily: form.daily_rate,
          weekly: form.weekly_rate || undefined,
          monthly: form.monthly_rate || undefined,
          deposit: form.deposit || undefined,
        };
      case 'room':
        return {
          weekday: form.weekday_rate,
          weekend: form.weekend_rate || form.weekday_rate,
        };
      case 'tour':
        return {
          price: form.price,
          min_pax: form.min_pax,
        };
      default:
        return { price: form.price };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const payload = {
      company_id: form.company_id,
      item_type: form.item_type,
      name: form.name,
      slug,
      description: form.description,
      short_description: form.short_description,
      base_pricing: buildPricing(),
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    let error;
    if (isNew) {
      const res = await supabase.from('items').insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from('items').update(payload).eq('id', params.id);
      error = res.error;
    }

    if (error) {
      toast.error('Failed: ' + error.message);
    } else {
      toast.success('Saved! Knowledge base will sync automatically.');
      router.push('/items');
    }
    setSaving(false);
  }

  function renderPricingFields() {
    switch (form.item_type) {
      case 'product':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (Rp) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 250000"
              />
            </div>
            <div>
              <Label>Compare Price (Rp)</Label>
              <Input
                type="number"
                value={form.compare_price}
                onChange={(e) => setForm({ ...form, compare_price: parseInt(e.target.value) || 0 })}
                placeholder="Original price for discount display"
              />
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Set either fixed price OR price range:</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fixed Price (Rp)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Min Price (Rp)</Label>
                <Input
                  type="number"
                  value={form.price_min}
                  onChange={(e) => setForm({ ...form, price_min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Max Price (Rp)</Label>
                <Input
                  type="number"
                  value={form.price_max}
                  onChange={(e) => setForm({ ...form, price_max: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Daily Rate (Rp) *</Label>
              <Input
                type="number"
                value={form.daily_rate}
                onChange={(e) => setForm({ ...form, daily_rate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Weekly Rate (Rp)</Label>
              <Input
                type="number"
                value={form.weekly_rate}
                onChange={(e) => setForm({ ...form, weekly_rate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Monthly Rate (Rp)</Label>
              <Input
                type="number"
                value={form.monthly_rate}
                onChange={(e) => setForm({ ...form, monthly_rate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Deposit (Rp)</Label>
              <Input
                type="number"
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        );

      case 'room':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weekday Rate (Rp) *</Label>
              <Input
                type="number"
                value={form.weekday_rate}
                onChange={(e) => setForm({ ...form, weekday_rate: parseInt(e.target.value) || 0 })}
                placeholder="Mon-Thu rate"
              />
            </div>
            <div>
              <Label>Weekend Rate (Rp)</Label>
              <Input
                type="number"
                value={form.weekend_rate}
                onChange={(e) => setForm({ ...form, weekend_rate: parseInt(e.target.value) || 0 })}
                placeholder="Fri-Sun rate"
              />
            </div>
          </div>
        );

      case 'tour':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price per Person (Rp) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Min Participants</Label>
              <Input
                type="number"
                value={form.min_pax}
                onChange={(e) => setForm({ ...form, min_pax: parseInt(e.target.value) || 2 })}
                min={1}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? '➕ Add Item' : `✏️ Edit: ${form.name}`}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4">📋 Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v as Item['item_type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sepatu Nike Air Max"
                required
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="auto-generated from name"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <Label>Short Description</Label>
            <Input
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="Brief description for listings"
            />
          </div>
          <div>
            <Label>Full Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[120px]"
              placeholder="Detailed description..."
            />
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold mb-4">💰 Pricing</h2>
            {renderPricingFields()}
          </div>

          {/* Status */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span>⭐ Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span>✅ Active</span>
            </label>
          </div>

          {/* Info */}
          <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-700">
            💡 <strong>Auto-Sync:</strong> When you save, this item will automatically be added to the knowledge base
            and AI will be able to answer questions about it!
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Item'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/items')}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
