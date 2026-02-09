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

// Session summary from messages
interface ChatSession {
  session_id: string;
  company_id: string;
  message_count: number;
  first_message: string;
  last_message_at: string;
}

interface Message {
  id: string;
  session_id: string;
  company_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sentiment?: string;
  intent?: string;
  latency_ms?: number;
  created_at: string;
}

export default function ChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
    }
  }, [selectedSession]);

  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  }

  async function fetchSessions() {
    setLoading(true);
    
    // Get unique sessions from messages table
    let query = supabase
      .from('messages')
      .select('session_id, company_id, content, created_at')
      .order('created_at', { ascending: false });

    if (selectedCompany !== 'all') {
      query = query.eq('company_id', selectedCompany);
    }

    const { data, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Fetch sessions error:', error);
      toast.error('Failed to fetch chat sessions');
      setLoading(false);
      return;
    }

    // Group by session_id
    const sessionMap = new Map<string, ChatSession>();
    
    (data || []).forEach((msg: any) => {
      const existing = sessionMap.get(msg.session_id);
      if (!existing) {
        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          company_id: msg.company_id,
          message_count: 1,
          first_message: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
          last_message_at: msg.created_at,
        });
      } else {
        existing.message_count++;
        // Update last_message_at if this message is newer
        if (new Date(msg.created_at) > new Date(existing.last_message_at)) {
          existing.last_message_at = msg.created_at;
        }
      }
    });

    // Convert to array and sort by last message
    const sessionList = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setSessions(sessionList);
    setLoading(false);
  }

  async function fetchMessages(sessionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Fetch messages error:', error);
      toast.error('Failed to fetch messages');
    } else {
      setMessages(data || []);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getCompanyName(companyId: string) {
    return companies.find(c => c.id === companyId)?.name || companyId;
  }

  function getSentimentColor(sentiment?: string) {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Sessions List */}
      <div className="w-1/3">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">💬 Chat History</h1>
            <p className="text-sm text-gray-500">{sessions.length} sessions</p>
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {sessions.map((session) => (
            <Card
              key={session.session_id}
              className={`p-3 cursor-pointer transition-colors ${
                selectedSession === session.session_id
                  ? 'bg-blue-50 border-blue-300'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedSession(session.session_id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {session.first_message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getCompanyName(session.company_id)}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <Badge variant="secondary" className="text-xs">
                    {session.message_count} msgs
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(session.last_message_at)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {sessions.length === 0 && (
            <Card className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">💭</p>
              <p>No chat sessions found.</p>
              <p className="text-sm mt-1">Chat history will appear here after users send messages.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1">
        {selectedSession ? (
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold">💬 Conversation</h2>
              <p className="text-sm text-gray-500">
                Session: {selectedSession.substring(0, 30)}...
              </p>
              <p className="text-xs text-gray-400">
                {messages.length} messages
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className={`text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                      {msg.intent && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                          {msg.intent}
                        </span>
                      )}
                      {msg.sentiment && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getSentimentColor(msg.sentiment)}`}>
                          {msg.sentiment}
                        </span>
                      )}
                      {msg.latency_ms && (
                        <span className="text-xs text-gray-400">
                          ⚡ {msg.latency_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-4xl mb-2">📭</p>
                  <p>No messages in this session.</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-4xl mb-2">👈</p>
              <p>Select a session to view messages</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
