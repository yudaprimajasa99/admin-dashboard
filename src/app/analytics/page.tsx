'use client';

import { useEffect, useState } from 'react';
import { supabase, Company } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Phone, TrendingUp, Users } from 'lucide-react';

interface WAStats {
  total: number;
  byContext: {
    button: number;
    link: number;
    other: number;
  };
  dailyStats: Record<string, number>;
  period: string;
}

interface ChatStats {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function AnalyticsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [waStats, setWaStats] = useState<WAStats | null>(null);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.optifya.com';

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchStats();
    }
  }, [selectedCompany]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*').eq('is_active', true);
    setCompanies(data || []);
    if (data && data.length > 0) {
      setSelectedCompany(data[0].id);
    }
    setLoading(false);
  }

  async function fetchStats() {
    setLoading(true);

    // Fetch WA stats from backend
    try {
      const waRes = await fetch(`${API_URL}/analytics/wa-stats/${selectedCompany}`);
      if (waRes.ok) {
        const data = await waRes.json();
        setWaStats(data);
      }
    } catch (e) {
      console.log('WA stats fetch failed');
    }

    // Fetch chat stats from Supabase directly
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get messages for this company
      const { data: messages } = await supabase
        .from('messages')
        .select('session_id, role, sentiment')
        .eq('company_id', selectedCompany)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (messages) {
        const sessions = new Set(messages.map(m => m.session_id));
        const userMessages = messages.filter(m => m.role === 'user');
        
        setChatStats({
          totalSessions: sessions.size,
          totalMessages: messages.length,
          avgMessagesPerSession: sessions.size > 0 ? Math.round(messages.length / sessions.size) : 0,
          sentimentBreakdown: {
            positive: userMessages.filter(m => m.sentiment === 'positive').length,
            negative: userMessages.filter(m => m.sentiment === 'negative').length,
            neutral: userMessages.filter(m => !m.sentiment || m.sentiment === 'neutral').length,
          },
        });
      }
    } catch (e) {
      console.log('Chat stats fetch failed');
    }

    setLoading(false);
  }

  if (loading && companies.length === 0) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics</h1>
          <p className="text-gray-500">Statistik LiveChat & WhatsApp (30 hari terakhir)</p>
        </div>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih Company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold">{chatStats?.totalSessions || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold">{chatStats?.totalMessages || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">WA Clicks</p>
              <p className="text-2xl font-bold">{waStats?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold">
                {chatStats?.totalSessions && waStats?.total
                  ? `${Math.round((waStats.total / chatStats.totalSessions) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* WA Click Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">📱 WhatsApp Click Sources</h3>
          
          {waStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Button Click (tombol hijau)</span>
                <Badge variant="secondary">{waStats.byContext.button}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Link Click (nomor di chat)</span>
                <Badge variant="secondary">{waStats.byContext.link}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Other</span>
                <Badge variant="secondary">{waStats.byContext.other}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No WA click data yet</p>
          )}
        </Card>

        {/* Sentiment Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">😊 Customer Sentiment</h3>
          
          {chatStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className="text-lg">😊</span> Positive
                </span>
                <Badge className="bg-green-500">{chatStats.sentimentBreakdown.positive}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className="text-lg">😐</span> Neutral
                </span>
                <Badge variant="secondary">{chatStats.sentimentBreakdown.neutral}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className="text-lg">😠</span> Negative
                </span>
                <Badge className="bg-red-500">{chatStats.sentimentBreakdown.negative}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sentiment data yet</p>
          )}
        </Card>
      </div>

      {/* Daily Chart - Simple Text Version */}
      {waStats?.dailyStats && Object.keys(waStats.dailyStats).length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">📈 WA Clicks - Last 7 Days</h3>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(waStats.dailyStats)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-7)
              .map(([date, count]) => (
                <div key={date} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold text-green-600">{count}</p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
