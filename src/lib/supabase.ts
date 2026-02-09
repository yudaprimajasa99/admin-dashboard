import { createClient } from '@supabase/supabase-js';

// Environment variables - set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// TYPES - Updated for SaaS Multi-tenant
// ==========================================

export interface Company {
  id: string;
  name: string;
  display_name?: string;
  industry: string;
  // Domain configuration
  slug?: string;
  custom_domain?: string;
  domain_type: 'subdomain' | 'custom' | 'none';
  // Website config
  template?: string;
  // Contact info
  wa_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Existing
  settings: Record<string, unknown>;
  ai_config?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Persona {
  id: string;
  company_id: string;
  persona_type: string;
  name: string;
  display_name: string;
  avatar_url?: string;
  system_prompt: string;
  personality: Record<string, unknown>;
  capabilities: string[];
  signature_phrases?: string[];
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeBase {
  id: string;
  company_id: string;
  title: string;
  content: string;
  content_embedding?: number[];
  category: string;
  tags: string[];
  priority: number;
  // New fields from migration
  source_type?: 'manual' | 'item' | 'faq' | 'import';
  source_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  company_id: string;
  category_id?: string;
  item_type: 'product' | 'service' | 'room' | 'vehicle' | 'tour';
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  content_embedding?: number[];
  // Flexible pricing based on item_type
  // product: { price, compare_price }
  // service: { price, unit } or { min, max, unit }
  // vehicle: { daily, weekly, monthly, deposit }
  // room: { weekday, weekend }
  // tour: { price, min_pax }
  base_pricing: ItemPricing;
  media?: ItemMedia[];
  metadata: Record<string, unknown>;
  is_featured: boolean;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Flexible pricing types
export type ItemPricing = 
  | { price: number; compare_price?: number; currency?: string }  // product/service simple
  | { min: number; max: number; unit?: string }  // service range
  | { daily: number; weekly?: number; monthly?: number; deposit?: number }  // vehicle
  | { weekday: number; weekend?: number }  // room
  | { price: number; min_pax?: number }  // tour
  | Record<string, unknown>;  // fallback

export interface ItemMedia {
  url: string;
  alt?: string;
  order?: number;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface FAQ {
  id: string;
  company_id: string;
  question: string;
  answer: string;
  question_embedding?: number[];
  category?: string;
  tags: string[];
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  session_id: string;
  customer_id?: string;
  persona_id?: string;
  channel: 'web' | 'whatsapp' | 'telegram';
  status: 'active' | 'closed' | 'archived';
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  started_at?: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  company_id: string;
  session_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  intent?: Record<string, unknown>;
  entities?: Record<string, unknown>;
  rag_context?: Record<string, unknown>;
  tokens_used?: number;
  latency_ms?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format price for display based on pricing object
 */
export function formatPrice(pricing: ItemPricing): string {
  if (!pricing) return '-';
  
  // Simple price
  if ('price' in pricing && typeof pricing.price === 'number') {
    const formatted = `Rp ${pricing.price.toLocaleString('id-ID')}`;
    if ('compare_price' in pricing && pricing.compare_price) {
      return `${formatted} (was Rp ${pricing.compare_price.toLocaleString('id-ID')})`;
    }
    if ('min_pax' in pricing) {
      return `${formatted}/pax (min ${pricing.min_pax})`;
    }
    return formatted;
  }
  
  // Range price (service)
  if ('min' in pricing && 'max' in pricing) {
    return `Rp ${pricing.min.toLocaleString('id-ID')} - Rp ${pricing.max.toLocaleString('id-ID')}`;
  }
  
  // Daily/weekly (vehicle)
  if ('daily' in pricing) {
    return `Rp ${pricing.daily.toLocaleString('id-ID')}/hari`;
  }
  
  // Weekday/weekend (room)
  if ('weekday' in pricing) {
    return `Rp ${pricing.weekday.toLocaleString('id-ID')}/malam`;
  }
  
  return '-';
}

/**
 * Get industry icon
 */
export function getIndustryIcon(industry: string): string {
  const icons: Record<string, string> = {
    digital_agency: '💻',
    ecommerce: '🛒',
    hotel: '🏨',
    car_rental: '🚗',
    travel: '✈️',
    fnb: '🍽️',
    services: '🛠️',
    retail: '🏪',
    automotive: '🔧',
    property: '🏠',
    health: '🏥',
    education: '📚',
    beauty: '💇',
    fashion: '👗',
    electronics: '📱',
    furniture: '🪑',
    other: '📦',
  };
  return icons[industry] || '🏢';
}

/**
 * Get item type icon
 */
export function getItemTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    service: '🛠️',
    product: '📦',
    room: '🛏️',
    vehicle: '🚗',
    tour: '✈️',
  };
  return icons[type] || '📦';
}
