'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Persona, Company } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { X, Plus, Sparkles, MessageSquare, Settings2, Zap } from 'lucide-react';

// Default personality options
const TONE_OPTIONS = [
  { value: 'friendly', label: 'Ramah & Hangat' },
  { value: 'professional', label: 'Profesional' },
  { value: 'casual', label: 'Santai' },
  { value: 'enthusiastic', label: 'Antusias' },
];

const FORMALITY_OPTIONS = [
  { value: 'formal', label: 'Formal (Anda/Bapak/Ibu)' },
  { value: 'semi-formal', label: 'Semi-formal (Kakak)' },
  { value: 'casual', label: 'Santai (Kamu)' },
  { value: 'friendly', label: 'Akrab (Bro/Sis)' },
];

const GREETING_OPTIONS = [
  { value: '__none__', label: '(Tanpa Sapaan) - Personal Tone' },
  { value: 'Kakak', label: 'Kakak - Sopan & Friendly' },
  { value: 'Anda', label: 'Anda - Netral Profesional' },
  { value: 'Kamu', label: 'Kamu - Casual' },
  { value: 'Pak/Bu', label: 'Pak/Bu - Formal tapi Luwes' },
  { value: 'Bapak/Ibu', label: 'Bapak/Ibu - Sangat Formal' },
  { value: 'Mas/Mbak', label: 'Mas/Mbak - Jawa Friendly' },
  { value: 'Bro/Sis', label: 'Bro/Sis - Gaul' },
  { value: '__custom__', label: '✏️ Custom (ketik sendiri)...' },
];

const EMOJI_OPTIONS = [
  { value: 'none', label: 'Tidak ada emoji' },
  { value: 'minimal', label: 'Minimal (1 per pesan)' },
  { value: 'moderate', label: 'Secukupnya (1-2 per pesan)' },
  { value: 'expressive', label: 'Ekspresif (banyak emoji)' },
];

const HUMOR_OPTIONS = [
  { value: 'none', label: 'Tidak ada humor' },
  { value: 'subtle', label: 'Humor halus' },
  { value: 'occasional', label: 'Sesekali bercanda' },
  { value: 'playful', label: 'Playful & Fun' },
];

const DEFAULT_CAPABILITIES = [
  'product_info',
  'pricing',
  'faq',
  'consultation',
  'recommendation',
  'complaint_handling',
];

const CAPABILITY_LABELS: Record<string, string> = {
  'product_info': '📦 Info Produk/Layanan',
  'pricing': '💰 Informasi Harga',
  'faq': '❓ Menjawab FAQ',
  'consultation': '💬 Konsultasi',
  'recommendation': '🎯 Rekomendasi',
  'complaint_handling': '🛠️ Handling Komplain',
  'booking': '📅 Booking/Order',
  'technical_support': '🔧 Support Teknis',
  'upselling': '📈 Upselling',
};

export default function EditPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [form, setForm] = useState({
    company_id: '',
    name: '',
    display_name: '',
    persona_type: 'cs',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    is_default: true,
    is_active: true,
  });

  // Personality state
  const [personality, setPersonality] = useState({
    tone: 'friendly',
    formality: 'semi-formal',
    greeting: '__none__',  // Default: tanpa sapaan
    emoji_usage: 'moderate',
    humor: 'subtle',
  });
  const [customGreeting, setCustomGreeting] = useState('');
  const [isCustomGreeting, setIsCustomGreeting] = useState(false);

  // Arrays state
  const [capabilities, setCapabilities] = useState<string[]>(DEFAULT_CAPABILITIES);
  const [signaturePhrases, setSignaturePhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');

  useEffect(() => {
    fetchCompanies();
    if (!isNew) fetchPersona();
  }, []);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchPersona() {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      toast.error('Persona not found');
      router.push('/personas');
      return;
    }

    setForm({
      company_id: data.company_id,
      name: data.name,
      display_name: data.display_name || '',
      persona_type: data.persona_type,
      system_prompt: data.system_prompt,
      temperature: data.temperature,
      max_tokens: data.max_tokens || 1000,
      is_default: data.is_default,
      is_active: data.is_active,
    });

    // Load personality
    if (data.personality) {
      const loadedGreeting = data.personality.greeting || '';
      const predefinedValues = GREETING_OPTIONS.map(o => o.value).filter(v => v !== '__custom__');
      
      // Check if it's a custom greeting (not in predefined list and not empty)
      const isCustom = loadedGreeting && !predefinedValues.includes(loadedGreeting) && loadedGreeting !== '__none__';
      
      // Map empty string to '__none__' for Select component
      const selectValue = !loadedGreeting ? '__none__' : (isCustom ? '__custom__' : loadedGreeting);
      
      setPersonality({
        tone: data.personality.tone || 'friendly',
        formality: data.personality.formality || 'semi-formal',
        greeting: selectValue,
        emoji_usage: data.personality.emoji_usage || 'moderate',
        humor: data.personality.humor || 'subtle',
      });
      
      if (isCustom) {
        setIsCustomGreeting(true);
        setCustomGreeting(loadedGreeting);
      }
    }

    // Load capabilities
    if (data.capabilities && Array.isArray(data.capabilities)) {
      setCapabilities(data.capabilities);
    }

    // Load signature phrases
    if (data.signature_phrases && Array.isArray(data.signature_phrases)) {
      setSignaturePhrases(data.signature_phrases);
    }

    setLoading(false);
  }

  function addSignaturePhrase() {
    if (newPhrase.trim() && !signaturePhrases.includes(newPhrase.trim())) {
      setSignaturePhrases([...signaturePhrases, newPhrase.trim()]);
      setNewPhrase('');
    }
  }

  function removeSignaturePhrase(phrase: string) {
    setSignaturePhrases(signaturePhrases.filter(p => p !== phrase));
  }

  function toggleCapability(cap: string) {
    if (capabilities.includes(cap)) {
      setCapabilities(capabilities.filter(c => c !== cap));
    } else {
      setCapabilities([...capabilities, cap]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Resolve actual greeting value
    let actualGreeting = isCustomGreeting ? customGreeting : personality.greeting;
    // Convert __none__ to empty string (no greeting)
    if (actualGreeting === '__none__') actualGreeting = '';
    
    const payload = {
      ...form,
      personality: {
        ...personality,
        greeting: actualGreeting,  // Use resolved greeting
      },
      capabilities,
      signature_phrases: signaturePhrases,
    };

    let error;
    if (isNew) {
      const res = await supabase.from('personas').insert(payload);
      error = res.error;
    } else {
      const res = await supabase
        .from('personas')
        .update(payload)
        .eq('id', params.id);
      error = res.error;
    }

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Persona saved successfully!');
      router.push('/personas');
    }
    setSaving(false);
  }

  // Generate prompt preview
  function generatePromptPreview() {
    const actualGreeting = isCustomGreeting ? customGreeting : personality.greeting;
    const hasNoGreeting = !actualGreeting || actualGreeting === '__none__';
    const tone = TONE_OPTIONS.find(t => t.value === personality.tone)?.label || personality.tone;
    const emoji = personality.emoji_usage !== 'none' ? '😊' : '';
    
    if (hasNoGreeting) {
      // Tanpa sapaan - personal tone
      return `Contoh respons (tanpa sapaan eksplisit):

"Halo! ${emoji} Ada yang bisa kami bantu hari ini?"

"Terima kasih sudah menghubungi kami! ${emoji}"

Tone: ${tone}
Sapaan: (tidak ada - personal tone)
Emoji: ${personality.emoji_usage}`;
    }
    
    return `Contoh respons dengan pengaturan ini:

"Halo ${actualGreeting}! ${emoji} Ada yang bisa saya bantu hari ini?"

"Terima kasih sudah menghubungi kami, ${actualGreeting}. ${emoji}"

Tone: ${tone}
Sapaan: ${actualGreeting}
Emoji: ${personality.emoji_usage}`;
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Create Persona' : 'Edit Persona'}
          </h1>
          <p className="text-gray-500 mt-1">
            Konfigurasi kepribadian AI Customer Service
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="is_active" className="text-sm">Active</Label>
          <Switch
            id="is_active"
            checked={form.is_active}
            onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="personality" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="gap-2">
              <Zap className="w-4 h-4" />
              Capabilities
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Basic Info */}
          <TabsContent value="basic">
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company *</Label>
                  <Select
                    value={form.company_id}
                    onValueChange={(v) => setForm({ ...form, company_id: v })}
                  >
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
                  <Label>Type</Label>
                  <Select
                    value={form.persona_type}
                    onValueChange={(v) => setForm({ ...form, persona_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs">Customer Service</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="concierge">Concierge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name (Internal) *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. roofel-cs"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">ID internal, lowercase, no spaces</p>
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="e.g. Asisten Roofel"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Nama yang ditampilkan ke user</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temperature: {form.temperature}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Konsisten (0)</span>
                    <span>Kreatif (1)</span>
                  </div>
                </div>
                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={form.max_tokens}
                    onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) })}
                    min={100}
                    max={4000}
                  />
                  <p className="text-xs text-gray-500 mt-1">Panjang max respons (500-2000 recommended)</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_default"
                    checked={form.is_default}
                    onCheckedChange={(checked) => setForm({ ...form, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Set as default persona</Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: Personality */}
          <TabsContent value="personality">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-6 space-y-4 col-span-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Pengaturan Kepribadian
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sapaan Customer</Label>
                    <Select
                      value={isCustomGreeting ? '__custom__' : personality.greeting}
                      onValueChange={(v) => {
                        if (v === '__custom__') {
                          setIsCustomGreeting(true);
                          setPersonality({ ...personality, greeting: '__custom__' });
                        } else {
                          setIsCustomGreeting(false);
                          setCustomGreeting('');
                          setPersonality({ ...personality, greeting: v });
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih sapaan..." /></SelectTrigger>
                      <SelectContent>
                        {GREETING_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || 'none'} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Custom greeting input */}
                    {isCustomGreeting && (
                      <Input
                        value={customGreeting}
                        onChange={(e) => setCustomGreeting(e.target.value)}
                        placeholder="Ketik sapaan custom... (misal: Chive, Boss, Chief)"
                        className="mt-2"
                      />
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {personality.greeting === '__none__' && !isCustomGreeting
                        ? 'Tanpa sapaan - fokus ke personal tone yang hangat'
                        : `Contoh: "Halo ${isCustomGreeting ? customGreeting || '...' : personality.greeting}! Ada yang bisa dibantu?"`
                      }
                    </p>
                  </div>

                  <div>
                    <Label>Tone/Nada Bicara</Label>
                    <Select
                      value={personality.tone}
                      onValueChange={(v) => setPersonality({ ...personality, tone: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formalitas</Label>
                    <Select
                      value={personality.formality}
                      onValueChange={(v) => setPersonality({ ...personality, formality: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMALITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Penggunaan Emoji</Label>
                    <Select
                      value={personality.emoji_usage}
                      onValueChange={(v) => setPersonality({ ...personality, emoji_usage: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMOJI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Humor</Label>
                  <Select
                    value={personality.humor}
                    onValueChange={(v) => setPersonality({ ...personality, humor: v })}
                  >
                    <SelectTrigger className="w-1/2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HUMOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Signature Phrases */}
                <div className="pt-4 border-t">
                  <Label>Frasa Khas (Signature Phrases)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Frasa yang akan digunakan sesekali untuk konsistensi brand
                  </p>
                  
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      placeholder="e.g. Siap membantu bisnis Anda go digital!"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSignaturePhrase())}
                    />
                    <Button type="button" onClick={addSignaturePhrase} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {signaturePhrases.map((phrase, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 py-1 px-2">
                        "{phrase}"
                        <button
                          type="button"
                          onClick={() => removeSignaturePhrase(phrase)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {signaturePhrases.length === 0 && (
                      <span className="text-gray-400 text-sm italic">Belum ada frasa khas</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Preview */}
              <Card className="p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="bg-white rounded-lg p-3 text-sm whitespace-pre-wrap border">
                  {generatePromptPreview()}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: System Prompt */}
          <TabsContent value="prompt">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-lg">System Prompt</Label>
                  <p className="text-sm text-gray-500">
                    Instruksi utama untuk AI. Personality settings akan digabung otomatis.
                  </p>
                </div>
                <Badge variant="outline">
                  {form.system_prompt.length} karakter
                </Badge>
              </div>

              <Textarea
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                placeholder={`Contoh:
Kamu adalah Asisten Roofel, Customer Service AI untuk Roofel - Digital Agency.

TENTANG ROOFEL:
- Berdiri sejak 2020
- Spesialisasi: Website, SEO, Digital Marketing

LAYANAN:
1. Website Development
2. SEO Optimization
3. Google Ads

TUGAS:
- Menjawab pertanyaan layanan & harga
- Memberikan rekomendasi
- Mengarahkan ke WhatsApp untuk order`}
                className="min-h-[500px] font-mono text-sm"
              />

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>💡 Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Personality settings (sapaan, tone, emoji) akan otomatis ditambahkan oleh system</li>
                  <li>Fokus pada: identitas, layanan, dan batasan AI</li>
                  <li>Gunakan format bullet points agar lebih jelas</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: Capabilities */}
          <TabsContent value="capabilities">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Kemampuan AI
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Pilih kemampuan yang dimiliki AI ini. Ini membantu AI memahami scope tugasnya.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(CAPABILITY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCapability(key)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      capabilities.includes(key)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Selected: {capabilities.length} capabilities
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={saving} className="px-8">
            {saving ? 'Saving...' : 'Save Persona'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/personas')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
