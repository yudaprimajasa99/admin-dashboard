'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Company } from '@/lib/supabase';
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

// Get main domain from env or default
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'adminsuport.id';

const industries = [
  { value: 'digital_agency', label: 'Digital Agency', icon: '💻' },
  { value: 'ecommerce', label: 'E-commerce / Toko Online', icon: '🛒' },
  { value: 'hotel', label: 'Hotel / Hospitality', icon: '🏨' },
  { value: 'car_rental', label: 'Rental Mobil/Motor', icon: '🚗' },
  { value: 'travel', label: 'Travel / Tour', icon: '✈️' },
  { value: 'fnb', label: 'Food & Beverage', icon: '🍽️' },
  { value: 'services', label: 'Jasa Umum', icon: '🛠️' },
  { value: 'retail', label: 'Retail / Toko', icon: '🏪' },
  { value: 'automotive', label: 'Otomotif / Bengkel', icon: '🔧' },
  { value: 'property', label: 'Property / Kost', icon: '🏠' },
  { value: 'health', label: 'Kesehatan / Klinik', icon: '🏥' },
  { value: 'education', label: 'Pendidikan / Kursus', icon: '📚' },
  { value: 'beauty', label: 'Kecantikan / Salon', icon: '💇' },
  { value: 'fashion', label: 'Fashion / Butik', icon: '👗' },
  { value: 'electronics', label: 'Elektronik', icon: '📱' },
  { value: 'furniture', label: 'Furniture / Mebel', icon: '🪑' },
  { value: 'other', label: 'Lainnya', icon: '📦' },
];

const templates = [
  { value: 'default', label: 'Default Template' },
  { value: 'template_ecommerce', label: 'E-commerce Style' },
  { value: 'template_services', label: 'Services Style' },
  { value: 'template_rental', label: 'Rental Style' },
  { value: 'template_fnb', label: 'F&B / Restaurant Style' },
];

const domainTypes = [
  { value: 'subdomain', label: '🌐 Subdomain (Gratis)', description: `Contoh: toko.${MAIN_DOMAIN}` },
  { value: 'custom', label: '🔗 Custom Domain (Premium)', description: 'Contoh: tokosaya.com' },
  { value: 'none', label: '❌ None (API Only)', description: 'Tidak ada website, hanya pakai API' },
];

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    display_name: '',
    industry: 'services',
    // Domain config
    domain_type: 'none' as 'subdomain' | 'custom' | 'none',
    slug: '',
    custom_domain: '',
    // Website config
    template: 'default',
    // Contact
    wa_number: '',
    email: '',
    phone: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    if (!isNew) fetchCompany();
  }, [isNew]);

  async function fetchCompany() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      toast.error('Company not found');
      router.push('/companies');
      return;
    }

    setForm({
      id: data.id,
      name: data.name || '',
      display_name: data.display_name || '',
      industry: data.industry || 'services',
      domain_type: data.domain_type || 'none',
      slug: data.slug || '',
      custom_domain: data.custom_domain || '',
      template: data.template || 'default',
      wa_number: data.wa_number || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      is_active: data.is_active ?? true,
    });
    setLoading(false);
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function getPreviewUrl(): string {
    switch (form.domain_type) {
      case 'subdomain':
        const slug = form.slug || generateSlug(form.name) || 'xxx';
        return `https://${slug}.${MAIN_DOMAIN}`;
      case 'custom':
        return form.custom_domain ? `https://${form.custom_domain}` : 'https://yourdomain.com';
      default:
        return '(Tidak ada website)';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Validation
    if (form.domain_type === 'subdomain' && !form.slug && !form.name) {
      toast.error('Slug wajib diisi untuk subdomain');
      setSaving(false);
      return;
    }

    if (form.domain_type === 'custom' && !form.custom_domain) {
      toast.error('Custom domain wajib diisi');
      setSaving(false);
      return;
    }

    // Auto-generate slug if empty
    const slug = form.domain_type === 'subdomain' 
      ? (form.slug || generateSlug(form.name))
      : (form.slug || null);

    const payload = {
      name: form.name,
      display_name: form.display_name || form.name,
      industry: form.industry,
      domain_type: form.domain_type,
      slug: slug,
      custom_domain: form.domain_type === 'custom' ? form.custom_domain : null,
      template: form.template,
      wa_number: form.wa_number || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      is_active: form.is_active,
    };

    let error;
    if (isNew) {
      if (!form.id) {
        toast.error('Company ID is required');
        setSaving(false);
        return;
      }
      const res = await supabase.from('companies').insert({ id: form.id, ...payload });
      error = res.error;
    } else {
      const res = await supabase.from('companies').update(payload).eq('id', params.id);
      error = res.error;
    }

    if (error) {
      toast.error('Failed: ' + error.message);
    } else {
      toast.success('Saved!');
      router.push('/companies');
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? '➕ Add New Company' : `✏️ Edit: ${form.name}`}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4">📋 Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {isNew && (
                <div>
                  <Label>Company ID *</Label>
                  <Input
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    placeholder="e.g. toko-baju-kinder"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique identifier, lowercase, no spaces
                  </p>
                </div>
              )}
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Toko Baju Kinder"
                  required
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="e.g. Toko Baju Kinder - Fashion Anak"
                />
              </div>
              <div>
                <Label>Industry *</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.icon} {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Domain Configuration */}
          <div>
            <h2 className="text-lg font-semibold mb-4">🌐 Domain Configuration</h2>
            
            {/* Domain Type */}
            <div className="mb-4">
              <Label>Domain Type *</Label>
              <Select 
                value={form.domain_type} 
                onValueChange={(v) => setForm({ ...form, domain_type: v as 'subdomain' | 'custom' | 'none' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domainTypes.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {domainTypes.find(d => d.value === form.domain_type)?.description}
              </p>
            </div>

            {/* Subdomain Config */}
            {form.domain_type === 'subdomain' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label>Subdomain Slug *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ 
                      ...form, 
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                    })}
                    placeholder={generateSlug(form.name) || 'toko-saya'}
                    className="flex-1"
                  />
                  <span className="text-gray-600 font-medium">.{MAIN_DOMAIN}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ✨ Preview: <strong>{getPreviewUrl()}</strong>
                </p>
              </div>
            )}

            {/* Custom Domain Config */}
            {form.domain_type === 'custom' && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Label>Custom Domain *</Label>
                <Input
                  value={form.custom_domain}
                  onChange={(e) => setForm({ 
                    ...form, 
                    custom_domain: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '') 
                  })}
                  placeholder="tokosaya.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-2">
                  ✨ Preview: <strong>{getPreviewUrl()}</strong>
                </p>
                <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                  ⚠️ <strong>Setup Required:</strong> Client perlu pointing DNS ke server kita
                </div>
              </div>
            )}

            {/* API Only */}
            {form.domain_type === 'none' && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  ℹ️ Company ini tidak akan punya website dari platform kita.<br/>
                  Hanya menggunakan <strong>API backend</strong> untuk chatbot.
                </p>
              </div>
            )}
          </div>

          {/* Website Template (only if has website) */}
          {form.domain_type !== 'none' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">🎨 Website Template</h2>
              <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4">📞 Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>WhatsApp Number</Label>
                <Input
                  value={form.wa_number}
                  onChange={(e) => setForm({ ...form, wa_number: e.target.value.replace(/[^0-9+]/g, '') })}
                  placeholder="e.g. 6281234567890"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For chat handoff. Format: 62xxx (tanpa +)
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. contact@tokobaju.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. (021) 12345678"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Company' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/companies')}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>

      {/* Quick Actions for existing company */}
      {!isNew && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => router.push(`/personas?company=${params.id}`)}>
              🤖 Manage Persona
            </Button>
            <Button variant="outline" onClick={() => router.push(`/items?company=${params.id}`)}>
              📦 Manage Items
            </Button>
            <Button variant="outline" onClick={() => router.push(`/knowledge?company=${params.id}`)}>
              📚 Manage Knowledge
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
