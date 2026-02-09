'use client';

import { useEffect, useState } from 'react';
import { supabase, Persona, Company } from '@/lib/supabase';
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
import { Sparkles, MessageSquare, Zap, Plus } from 'lucide-react';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
    fetchPersonas();
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchPersonas() {
    let query = supabase.from('personas').select('*');
    
    if (selectedCompany !== 'all') {
      query = query.eq('company_id', selectedCompany);
    }

    const { data, error } = await query.order('company_id');

    if (error) {
      toast.error('Failed to fetch personas');
    } else {
      setPersonas(data || []);
    }
    setLoading(false);
  }

  function getCompanyName(companyId: string) {
    return companies.find(c => c.id === companyId)?.name || companyId;
  }

  function getPersonalityBadges(personality: Record<string, unknown>) {
    if (!personality) return null;
    
    const badges = [];
    if (personality.greeting) badges.push({ label: `Sapaan: ${personality.greeting}`, color: 'bg-blue-100 text-blue-700' });
    if (personality.tone) badges.push({ label: personality.tone as string, color: 'bg-green-100 text-green-700' });
    if (personality.emoji_usage) badges.push({ label: `Emoji: ${personality.emoji_usage}`, color: 'bg-yellow-100 text-yellow-700' });
    
    return badges;
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personas</h1>
          <p className="text-gray-500 mt-1">Kelola kepribadian AI untuk setiap company</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/personas/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Persona
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {personas.map((persona) => {
          const personalityBadges = getPersonalityBadges(persona.personality);
          
          return (
            <Card key={persona.id} className="p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {persona.display_name?.charAt(0) || persona.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{persona.display_name || persona.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {getCompanyName(persona.company_id)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {persona.is_default && <Badge variant="outline">Default</Badge>}
                  <Badge variant={persona.is_active ? 'default' : 'secondary'}>
                    {persona.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Personality Badges */}
              {personalityBadges && personalityBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {personalityBadges.map((badge, i) => (
                    <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-medium capitalize">{persona.persona_type}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Temperature</div>
                  <div className="text-sm font-medium">{persona.temperature}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Capabilities</div>
                  <div className="text-sm font-medium">{persona.capabilities?.length || 0}</div>
                </div>
              </div>

              {/* System Prompt Preview */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4 max-h-24 overflow-hidden relative">
                <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
                  {persona.system_prompt.substring(0, 200)}...
                </pre>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
              </div>

              {/* Signature Phrases */}
              {persona.signature_phrases && persona.signature_phrases.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Frasa Khas
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {persona.signature_phrases.slice(0, 2).map((phrase, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        "{phrase}"
                      </span>
                    ))}
                    {persona.signature_phrases.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{persona.signature_phrases.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link href={`/personas/${persona.id}`}>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Edit Persona
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {personas.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Sparkles className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No personas found</h3>
          <p className="text-gray-500 mb-4">Create a persona to configure your AI assistant</p>
          <Link href="/personas/new">
            <Button>Create Persona</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
