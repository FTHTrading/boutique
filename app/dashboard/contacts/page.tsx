'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Mail, ShieldCheck, ShieldOff, AlertCircle, Search, Plus, Send, RefreshCw } from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  company_id: string;
  company_name?: string;
  email: string;
  email_type: 'direct' | 'generic' | 'unknown';
  phone?: string;
  consent_status: 'opted_in' | 'opted_out' | 'unknown' | 'unsubscribed';
  is_bounced: boolean;
  can_contact: boolean;
  emails_sent?: number;
  emails_opened?: number;
  last_contacted_at?: string;
  created_at: string;
}

interface Stats {
  total: number;
  can_contact: number;
  opted_out: number;
  bounced: number;
}

interface DraftModal {
  open: boolean;
  contactId: string;
  contactName: string;
  contactEmail: string;
  draft: { subject: string; body: string } | null;
  loading: boolean;
  sending: boolean;
  sent: boolean;
}

const CONSENT_BADGE: Record<string, { label: string; color: string }> = {
  opted_in: { label: 'Opted In', color: 'bg-green-100 text-green-700' },
  opted_out: { label: 'Opted Out', color: 'bg-red-100 text-red-700' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600' },
  unsubscribed: { label: 'Unsubscribed', color: 'bg-orange-100 text-orange-700' },
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, can_contact: 0, opted_out: 0, bounced: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterConsent, setFilterConsent] = useState('');
  const [filterCanContact, setFilterCanContact] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', first_name: '', last_name: '', title: '', company_name: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [draft, setDraft] = useState<DraftModal>({
    open: false, contactId: '', contactName: '', contactEmail: '',
    draft: null, loading: false, sending: false, sent: false,
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterConsent) params.set('consent', filterConsent);
    if (filterCanContact) params.set('can_contact', 'true');

    try {
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setStats(data.stats || { total: 0, can_contact: 0, opted_out: 0, bounced: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, filterConsent, filterCanContact]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openDraft = async (contact: Contact) => {
    setDraft({ open: true, contactId: contact.id, contactName: `${contact.first_name} ${contact.last_name}`, contactEmail: contact.email, draft: null, loading: true, sending: false, sent: false });
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', contact_id: contact.id, outreach_type: 'initial_outreach' }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraft(d => ({ ...d, draft: data.draft, loading: false }));
      } else {
        setDraft(d => ({ ...d, loading: false }));
      }
    } catch {
      setDraft(d => ({ ...d, loading: false }));
    }
  };

  const sendDraft = async () => {
    if (!draft.draft) return;
    setDraft(d => ({ ...d, sending: true }));
    try {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          contact_id: draft.contactId,
          subject: draft.draft?.subject,
          body_text: draft.draft?.body,
          outreach_type: 'initial_outreach',
        }),
      });
      setDraft(d => ({ ...d, sending: false, sent: true }));
      fetchContacts();
    } catch {
      setDraft(d => ({ ...d, sending: false }));
    }
  };

  const handleAddContact = async () => {
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      const data = await res.json();
      if (data.contact) {
        setShowAddForm(false);
        setNewContact({ email: '', first_name: '', last_name: '', title: '', company_name: '' });
        fetchContacts();
      } else {
        setAddError(data.error || 'Failed to add contact');
      }
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">CRM contact management with consent tracking</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: stats.total, icon: Users, color: 'text-gray-700' },
          { label: 'Can Contact', value: stats.can_contact, icon: ShieldCheck, color: 'text-green-600' },
          { label: 'Opted Out', value: stats.opted_out, icon: ShieldOff, color: 'text-red-500' },
          { label: 'Bounced', value: stats.bounced, icon: AlertCircle, color: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={filterConsent}
          onChange={(e) => setFilterConsent(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All Consent</option>
          <option value="opted_in">Opted In</option>
          <option value="opted_out">Opted Out</option>
          <option value="unknown">Unknown</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={filterCanContact} onChange={(e) => setFilterCanContact(e.target.checked)} />
          Can Contact Only
        </label>
        <button onClick={fetchContacts} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No contacts found. Add one or run company research.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Consent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => {
                  const badge = CONSENT_BADGE[c.consent_status] || CONSENT_BADGE.unknown;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.first_name} {c.last_name}</div>
                        {c.title && <div className="text-xs text-gray-400">{c.title}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-700">{c.email}</span>
                          {c.email_type === 'generic' && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">generic</span>
                          )}
                          {c.is_bounced && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">bounced</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.emails_sent ?? 0}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {c.last_contacted_at ? new Date(c.last_contacted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDraft(c)}
                          disabled={!c.can_contact}
                          className="flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3 h-3" /> Draft Email
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add Contact</h2>
            <div className="space-y-3">
              {(['first_name', 'last_name', 'email', 'title', 'company_name'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={newContact[field]}
                    onChange={(e) => setNewContact(n => ({ ...n, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              ))}
              {addError && <p className="text-xs text-red-600">{addError}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddForm(false)} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddContact} disabled={addLoading} className="flex-1 bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50">
                {addLoading ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Draft Modal */}
      {draft.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Draft Email — {draft.contactName}</h2>
              <button onClick={() => setDraft(d => ({ ...d, open: false }))} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            {draft.loading ? (
              <div className="py-12 text-center text-gray-400">Generating AI draft...</div>
            ) : draft.sent ? (
              <div className="py-12 text-center">
                <Mail className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">Email sent to {draft.contactEmail}</p>
              </div>
            ) : draft.draft ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subject</label>
                  <input
                    type="text"
                    value={draft.draft.subject}
                    onChange={(e) => setDraft(d => ({ ...d, draft: d.draft ? { ...d.draft, subject: e.target.value } : null }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Message</label>
                  <textarea
                    value={draft.draft.body}
                    onChange={(e) => setDraft(d => ({ ...d, draft: d.draft ? { ...d.draft, body: e.target.value } : null }))}
                    rows={10}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                  />
                </div>
                <p className="text-xs text-amber-600">Review before sending. CAN-SPAM footer will be appended automatically.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDraft(d => ({ ...d, open: false }))} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                  <button onClick={sendDraft} disabled={draft.sending} className="flex-1 bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50">
                    {draft.sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">Failed to generate draft. Contact may have been blocked.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
