'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle, Clock, AlertTriangle, Plus,
  Send, Eye, RefreshCw, Search, ExternalLink
} from 'lucide-react';

interface Contract {
  id: string;
  contract_number: string;
  contract_type: string;
  party_b_name: string;
  party_b_signatory: string;
  party_b_email: string;
  commodity: string;
  deal_value?: number;
  deal_currency?: string;
  governing_law: string;
  status: string;
  version_number: number;
  created_at: string;
  signed_by_b_at?: string;
  esign_expires_at?: string;
  esign_token?: string;
  special_terms?: string;
  notes?: string;
  company_name?: string;
}

interface ContractStats {
  draft: number;
  awaiting_signature: number;
  executed: number;
  expired: number;
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
  awaiting_signature: { color: 'bg-amber-100 text-amber-700', label: 'Awaiting Signature' },
  executed: { color: 'bg-green-100 text-green-700', label: 'Executed' },
  expired: { color: 'bg-red-100 text-red-600', label: 'Expired' },
  cancelled: { color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
  amended: { color: 'bg-blue-100 text-blue-700', label: 'Amended' },
};

const CONTRACT_TYPES = [
  { value: 'NCNDA', label: 'NCNDA — Non-Circumvention / Non-Disclosure' },
  { value: 'Supply Agreement', label: 'Supply Agreement' },
  { value: 'Offtake Agreement', label: 'Offtake Agreement' },
  { value: 'MOU', label: 'Memorandum of Understanding' },
  { value: 'Broker Agreement', label: 'Broker / Intermediary Agreement' },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats>({ draft: 0, awaiting_signature: 0, executed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [previewContract, setPreviewContract] = useState<{ html: string; number: string } | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_type: 'NCNDA',
    party_b_name: '',
    party_b_signatory: '',
    party_b_email: '',
    commodity: '',
    governing_law: 'England and Wales',
    deal_value: '',
    deal_currency: 'USD',
    special_terms: '',
    send_for_signature: false,
  });
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generated, setGenerated] = useState<{ contract_number: string; signing_url?: string } | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    try {
      const res = await fetch(`/api/contracts?${params}`);
      const data = await res.json();
      setContracts(data.contracts || []);
      setStats(data.stats || { draft: 0, awaiting_signature: 0, executed: 0, expired: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleGenerate = async () => {
    if (!formData.party_b_name || !formData.party_b_email || !formData.commodity) {
      setGenerateError('Party name, email, and commodity are required');
      return;
    }
    setGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deal_value: formData.deal_value ? parseFloat(formData.deal_value) : undefined,
        }),
      });
      const data = await res.json();
      if (data.contract) {
        setGenerated({ contract_number: data.contract.contract_number, signing_url: data.contract.signing_url });
        fetchContracts();
      } else {
        setGenerateError(data.error || 'Generation failed');
      }
    } catch {
      setGenerateError('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const resendForSignature = async (contractId: string) => {
    await fetch(`/api/contracts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contractId, action: 'resend' }),
    });
    fetchContracts();
  };

  const previewHtml = async (contractId: string, contractNumber: string) => {
    const res = await fetch(`/api/contracts?id=${contractId}`);
    const data = await res.json();
    const contract = (data.contracts || []).find((c: Contract) => c.id === contractId);
    if (contract) setPreviewContract({ html: contract.document_html || '<p>No document HTML</p>', number: contractNumber });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">NCNDA, supply agreements, and eSignature lifecycle</p>
        </div>
        <button
          onClick={() => { setShowGenerateForm(true); setGenerated(null); setGenerateError(''); }}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Generate Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Drafts', value: stats.draft, icon: FileText, color: 'text-gray-500' },
          { label: 'Awaiting Signature', value: stats.awaiting_signature, icon: Clock, color: 'text-amber-500' },
          { label: 'Executed', value: stats.executed, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Expired', value: stats.expired, icon: AlertTriangle, color: 'text-red-400' },
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
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contract number, party, commodity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="awaiting_signature">Awaiting Signature</option>
          <option value="executed">Executed</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={fetchContracts} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No contracts yet. Generate your first NCNDA.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Party B</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commodity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">v</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c) => {
                  const badge = STATUS_BADGE[c.status] || { color: 'bg-gray-100 text-gray-600', label: c.status };
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.contract_number}</td>
                      <td className="px-4 py-3 text-gray-600">{c.contract_type}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-32">{c.party_b_name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-32">{c.party_b_signatory}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{c.commodity}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">v{c.version_number}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => previewHtml(c.id, c.contract_number)}
                            className="p-1 text-gray-400 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {c.status === 'awaiting_signature' && c.esign_token && (
                            <a
                              href={`/sign/${c.esign_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-400 hover:text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                              title="Open signing link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {c.status === 'draft' && (
                            <button
                              onClick={() => resendForSignature(c.id)}
                              className="p-1 text-amber-400 hover:text-amber-600 border border-amber-200 rounded hover:bg-amber-50"
                              title="Send for signature"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Contract Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Generate Contract</h2>

            {generated ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">{generated.contract_number}</p>
                <p className="text-sm text-gray-500 mb-4">Contract generated successfully.</p>
                {generated.signing_url && (
                  <a
                    href={generated.signing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 underline"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Signing Link
                  </a>
                )}
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setShowGenerateForm(false)} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm hover:bg-gray-50">Close</button>
                  <button onClick={() => setGenerated(null)} className="flex-1 bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-800">New Contract</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contract Type</label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData(f => ({ ...f, contract_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {[
                  { key: 'party_b_name', label: 'Party B — Company Name *' },
                  { key: 'party_b_signatory', label: 'Party B — Authorised Signatory' },
                  { key: 'party_b_email', label: 'Party B — Email *' },
                  { key: 'commodity', label: 'Commodity *' },
                  { key: 'governing_law', label: 'Governing Law' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type={key === 'party_b_email' ? 'email' : 'text'}
                      value={formData[key as keyof typeof formData] as string}
                      onChange={(e) => setFormData(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Deal Value</label>
                    <input
                      type="number"
                      value={formData.deal_value}
                      onChange={(e) => setFormData(f => ({ ...f, deal_value: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Currency</label>
                    <select
                      value={formData.deal_currency}
                      onChange={(e) => setFormData(f => ({ ...f, deal_currency: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      {['USD', 'EUR', 'GBP', 'CHF', 'AED', 'SGD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Special Terms (optional)</label>
                  <textarea
                    value={formData.special_terms}
                    onChange={(e) => setFormData(f => ({ ...f, special_terms: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.send_for_signature}
                    onChange={(e) => setFormData(f => ({ ...f, send_for_signature: e.target.checked }))}
                  />
                  Send signing link to Party B immediately
                </label>

                {generateError && <p className="text-xs text-red-600">{generateError}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowGenerateForm(false)} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                  <button onClick={handleGenerate} disabled={generating} className="flex-1 bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {previewContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{previewContract.number}</h2>
              <button onClick={() => setPreviewContract(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-6 text-sm"
              dangerouslySetInnerHTML={{ __html: previewContract.html }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
