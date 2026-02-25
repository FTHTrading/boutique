'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Globe, Users, BarChart2, RefreshCw, Search, CheckCircle, Loader2 } from 'lucide-react';

interface OutreachRecord {
  id: string;
  contact_email: string;
  contact_name?: string;
  company_name?: string;
  message_type: string;
  subject?: string;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed' | 'draft';
  outreach_type: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
}

interface OutreachStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  sent: { color: 'bg-blue-100 text-blue-700', label: 'Sent' },
  delivered: { color: 'bg-teal-100 text-teal-700', label: 'Delivered' },
  opened: { color: 'bg-green-100 text-green-700', label: 'Opened' },
  bounced: { color: 'bg-red-100 text-red-700', label: 'Bounced' },
  failed: { color: 'bg-orange-100 text-orange-700', label: 'Failed' },
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
};

export default function OutreachPage() {
  const [history, setHistory] = useState<OutreachRecord[]>([]);
  const [stats, setStats] = useState<OutreachStats>({ total: 0, sent: 0, delivered: 0, opened: 0, bounced: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Company research tab
  const [researchUrl, setResearchUrl] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<{
    company_name?: string; industry?: string; opportunity_score?: number; contacts_found?: number; message?: string;
  } | null>(null);
  const [researchError, setResearchError] = useState('');

  const [activeTab, setActiveTab] = useState<'history' | 'research'>('history');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/outreach?${params}`);
      const data = await res.json();
      setHistory(data.outreach || []);
      setStats(data.stats || { total: 0, sent: 0, delivered: 0, opened: 0, bounced: 0, failed: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const runResearch = async () => {
    if (!researchUrl.trim()) return;
    setResearchLoading(true);
    setResearchError('');
    setResearchResult(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'research', website_url: researchUrl.trim() }),
      });
      const data = await res.json();
      if (data.company) {
        setResearchResult({
          company_name: data.company.company_name,
          industry: data.company.industry,
          opportunity_score: data.company.opportunity_score,
          contacts_found: data.contacts_found,
          message: `Research complete. ${data.contacts_found ?? 0} contact(s) found from public pages.`,
        });
        setResearchUrl('');
      } else {
        setResearchError(data.error || 'Research failed');
      }
    } catch {
      setResearchError('Network error during research');
    } finally {
      setResearchLoading(false);
    }
  };

  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const deliveryRate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
        <p className="text-sm text-gray-500 mt-0.5">Company research + email campaign management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.total },
          { label: 'Delivered', value: stats.delivered, sub: `${deliveryRate}% rate` },
          { label: 'Opened', value: stats.opened, sub: `${openRate}% rate` },
          { label: 'Bounced', value: stats.bounced },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {([
            { id: 'history', label: 'Email History', icon: BarChart2 },
            { id: 'research', label: 'Company Research', icon: Globe },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <button onClick={fetchHistory} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading outreach history...</div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Send className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No outreach history yet. Start by researching a company and creating a contact.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((r) => {
                      const badge = STATUS_BADGE[r.status] || STATUS_BADGE.draft;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{r.contact_name || r.contact_email}</div>
                            {r.contact_name && <div className="text-xs text-gray-400">{r.contact_email}</div>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{r.company_name || '—'}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{r.subject || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 capitalize">{r.outreach_type?.replace(/_/g, ' ') || r.message_type}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Research */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Research a Company</h2>
            <p className="text-sm text-gray-500 mb-4">
              Fetches the company's public website. Only explicitly listed contacts are extracted.
              No email guessing. Respects rate limits.
            </p>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://example-commodity-trader.com"
                  value={researchUrl}
                  onChange={(e) => setResearchUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runResearch()}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                onClick={runResearch}
                disabled={researchLoading || !researchUrl.trim()}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {researchLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                ) : (
                  <><Search className="w-4 h-4" /> Research</>
                )}
              </button>
            </div>

            {researchError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 rounded p-3">{researchError}</div>
            )}

            {researchResult && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Research Complete</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Company</p><p className="font-medium">{researchResult.company_name || '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Industry</p><p className="font-medium">{researchResult.industry || '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Opportunity Score</p><p className="font-medium">{researchResult.opportunity_score ?? '—'}/10</p></div>
                  <div><p className="text-xs text-gray-500">Contacts Found</p><p className="font-medium">{researchResult.contacts_found ?? 0}</p></div>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  Company and contacts saved to CRM. Visit the Contacts tab to draft emails.
                </p>
              </div>
            )}

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">
              <strong>Legal note:</strong> Research fetches only public-facing pages (/, /about, /contact, /team). 
              FTH Trading bot identifies itself via User-Agent. No login bypassing, no sitemap scraping, no LinkedIn automation.
              All extracted contacts have consent_status set to &apos;unknown&apos; until confirmed.
            </div>
          </div>

          {/* Feature matrix */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> What gets extracted
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { ok: true, text: 'Company name, HQ location, industry' },
                { ok: true, text: 'Explicitly listed email addresses' },
                { ok: true, text: 'Explicitly listed phone numbers' },
                { ok: true, text: 'Named team members on /team or /about pages' },
                { ok: false, text: 'Guessed emails (firstname@domain.com)' },
                { ok: false, text: 'LinkedIn profiles or social media scraping' },
                { ok: false, text: 'Emails behind login / CAPTCHA' },
                { ok: false, text: 'Email pattern brute-forcing' },
              ].map(({ ok, text }, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={ok ? 'text-green-500 mt-0.5' : 'text-red-400 mt-0.5'}>
                    {ok ? '✓' : '✗'}
                  </span>
                  <span className={ok ? 'text-gray-700' : 'text-gray-400 line-through'}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
