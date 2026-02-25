'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProofAnchor {
  id: string;
  deal_id: string | null;
  object_type: string;
  object_id: string;
  object_hash: string;
  anchor_chain: 'XRPL' | 'STELLAR' | 'BOTH';
  xrpl_tx_hash: string | null;
  xrpl_confirmed: boolean;
  xrpl_ledger_index: number | null;
  stellar_tx_hash: string | null;
  stellar_confirmed: boolean;
  stellar_ledger: number | null;
  status: string;
  anchored_at: string;
}

const CHAIN_COLOR: Record<string, string> = {
  XRPL: 'bg-purple-900 text-purple-300',
  STELLAR: 'bg-blue-900 text-blue-300',
  BOTH: 'bg-indigo-900 text-indigo-300',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-zinc-700 text-zinc-300',
  SUBMITTED: 'bg-yellow-900 text-yellow-300',
  CONFIRMED: 'bg-green-900 text-green-300',
  FAILED: 'bg-red-900 text-red-400',
};

// Explorer URLs
function xrplExplorer(txHash: string) {
  return `https://xrpscan.com/tx/${txHash}`;
}
function stellarExplorer(txHash: string) {
  return `https://stellar.expert/explorer/public/tx/${txHash}`;
}

export default function AnchorsPage() {
  const [dealId, setDealId] = useState('');
  const [anchors, setAnchors] = useState<ProofAnchor[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorForm, setAnchorForm] = useState({
    objectType: 'INSTRUMENT',
    objectId: '',
    chain: 'XRPL' as 'XRPL' | 'STELLAR' | 'BOTH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ProofAnchor | null>(null);

  const load = () => {
    if (!dealId) return;
    setLoading(true);
    fetch(`/api/funding/anchors?dealId=${dealId}`)
      .then((r) => r.json())
      .then((d) => setAnchors(d.anchors ?? []))
      .finally(() => setLoading(false));
  };

  const submitAnchor = async () => {
    if (!anchorForm.objectId) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const r = await fetch('/api/funding/anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: dealId || undefined,
          objectType: anchorForm.objectType,
          objectId: anchorForm.objectId,
          objectData: { objectId: anchorForm.objectId, anchoredAt: new Date().toISOString() },
          chains: anchorForm.chain === 'BOTH' ? ['XRPL', 'STELLAR'] : [anchorForm.chain],
        }),
      });
      const d = await r.json();
      setSubmitResult(d.anchor);
      if (dealId) load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proof Anchors</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Audit-grade SHA-256 hash anchoring to XRPL and Stellar ledgers
          </p>
        </div>
        <Link href="/dashboard/funding" className="text-sm text-zinc-400 hover:text-white">
          ← Funding Overview
        </Link>
      </div>

      {/* Explainer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
        <p className="text-zinc-300 font-medium">How it works</p>
        <p>
          A SHA-256 hash of the target object (instrument, contract, message) is embedded in a
          transaction Memo on XRPL, or as a Stellar Memo Hash. The ledger transaction hash serves
          as tamper-evident evidence that the document existed in a specific state at a specific time.
        </p>
        <p className="text-amber-400">
          Note: Anchoring does not transfer funds. It creates an immutable timestamp proof only.
        </p>
      </div>

      {/* New Anchor form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Anchor a Document</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Object Type</label>
            <select
              value={anchorForm.objectType}
              onChange={(e) => setAnchorForm((f) => ({ ...f, objectType: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
            >
              <option value="INSTRUMENT">Instrument</option>
              <option value="CONTRACT">Contract</option>
              <option value="MILESTONE">Escrow Milestone</option>
              <option value="BANK_MESSAGE">Bank Message</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Object ID (UUID)</label>
            <input
              type="text"
              value={anchorForm.objectId}
              onChange={(e) => setAnchorForm((f) => ({ ...f, objectId: e.target.value }))}
              placeholder="Paste object UUID…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Anchor Chain</label>
            <select
              value={anchorForm.chain}
              onChange={(e) => setAnchorForm((f) => ({ ...f, chain: e.target.value as typeof anchorForm.chain }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
            >
              <option value="XRPL">XRPL only</option>
              <option value="STELLAR">Stellar only</option>
              <option value="BOTH">Both (XRPL + Stellar)</option>
            </select>
          </div>
        </div>
        <button
          onClick={submitAnchor}
          disabled={submitting || !anchorForm.objectId}
          className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-50"
        >
          {submitting ? 'Anchoring…' : 'Submit Anchor'}
        </button>

        {submitResult && (
          <div className="bg-zinc-800 rounded p-3 text-xs space-y-1">
            <p className="text-green-400 font-medium">Anchor Submitted</p>
            <p><span className="text-zinc-400">Hash:</span> <span className="font-mono text-zinc-300">{submitResult.object_hash}</span></p>
            {submitResult.xrplTxHash && (
              <p>
                <span className="text-zinc-400">XRPL TX: </span>
                <a href={xrplExplorer(submitResult.xrplTxHash)} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-purple-400 hover:text-purple-300 underline break-all">
                  {submitResult.xrplTxHash}
                </a>
              </p>
            )}
            {submitResult.stellarTxHash && (
              <p>
                <span className="text-zinc-400">Stellar TX: </span>
                <a href={stellarExplorer(submitResult.stellarTxHash)} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 underline break-all">
                  {submitResult.stellarTxHash}
                </a>
              </p>
            )}
            <p><span className="text-zinc-400">Status:</span> <span className="text-yellow-300">{submitResult.status}</span></p>
          </div>
        )}
      </div>

      {/* Load by deal */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Deal ID to load anchors…"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 w-80"
        />
        <button
          onClick={load}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
        >
          Load Anchors
        </button>
      </div>

      {/* Anchors table */}
      {loading && <div className="text-zinc-500 text-sm text-center py-4">Loading…</div>}
      {!loading && anchors.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Hash (SHA-256)</th>
                <th className="px-4 py-3 text-left">Chain</th>
                <th className="px-5 py-3 text-left">XRPL TX</th>
                <th className="px-5 py-3 text-left">Stellar TX</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Anchored At</th>
              </tr>
            </thead>
            <tbody>
              {anchors.map((a) => (
                <tr key={a.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="px-5 py-3 text-zinc-200">{a.object_type}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-zinc-400 break-all">
                      {a.object_hash.slice(0, 24)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHAIN_COLOR[a.anchor_chain]}`}>
                      {a.anchor_chain}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {a.xrpl_tx_hash ? (
                      <a href={xrplExplorer(a.xrpl_tx_hash)} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-purple-400 hover:text-purple-300 underline">
                        {a.xrpl_tx_hash.slice(0, 16)}…
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {a.stellar_tx_hash ? (
                      <a href={stellarExplorer(a.stellar_tx_hash)} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-400 hover:text-blue-300 underline">
                        {a.stellar_tx_hash.slice(0, 16)}…
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {new Date(a.anchored_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
