'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Instrument {
  id: string;
  deal_id: string;
  instrument_type: string;
  stage: string;
  issuing_bank_name: string | null;
  issuing_bank_bic: string | null;
  amount: number | null;
  currency: string;
  expiry_date: string | null;
  beneficiary_name: string | null;
  verification_status: string;
  human_approval_required: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

const STAGE_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-700 text-zinc-300',
  ISSUED: 'bg-blue-900 text-blue-300',
  TRANSMITTED: 'bg-indigo-900 text-indigo-300',
  CONFIRMED: 'bg-cyan-900 text-cyan-300',
  ACTIVE: 'bg-green-900 text-green-300',
  DRAWN: 'bg-yellow-900 text-yellow-300',
  EXPIRED: 'bg-red-900 text-red-300',
  CANCELLED: 'bg-zinc-700 text-zinc-400',
  REJECTED: 'bg-red-900 text-red-400',
};

const VERIFY_COLORS: Record<string, string> = {
  UNVERIFIED: 'bg-zinc-700 text-zinc-300',
  PENDING_HUMAN_REVIEW: 'bg-yellow-900 text-yellow-300',
  HUMAN_APPROVED: 'bg-blue-900 text-blue-300',
  HUMAN_REJECTED: 'bg-red-900 text-red-400',
  VERIFIED: 'bg-green-900 text-green-300',
  FAILED: 'bg-red-900 text-red-400',
};

export default function InstrumentsPage() {
  const [dealId, setDealId] = useState('');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInstruments = (id: string) => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/funding/instruments?dealId=${id}`)
      .then((r) => r.json())
      .then((d) => setInstruments(d.instruments ?? []))
      .finally(() => setLoading(false));
  };

  const runVerification = async (instrumentId: string) => {
    setActionLoading(instrumentId + '_verify');
    await fetch('/api/funding/instruments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VERIFY', instrumentId }),
    });
    fetchInstruments(dealId);
    setActionLoading(null);
  };

  const humanApprove = async (instrumentId: string) => {
    const approvedBy = prompt('Enter your name for audit trail:');
    if (!approvedBy) return;
    setActionLoading(instrumentId + '_approve');
    await fetch('/api/funding/instruments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'HUMAN_APPROVE', instrumentId, approvedBy }),
    });
    fetchInstruments(dealId);
    setActionLoading(null);
  };

  const humanReject = async (instrumentId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setActionLoading(instrumentId + '_reject');
    await fetch('/api/funding/instruments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'HUMAN_REJECT', instrumentId, reason }),
    });
    fetchInstruments(dealId);
    setActionLoading(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Banking Instruments</h1>
          <p className="text-sm text-zinc-400 mt-1">
            SBLC · LC · Escrow — verification requires human approval gate
          </p>
        </div>
        <Link href="/dashboard/funding" className="text-sm text-zinc-400 hover:text-white">
          ← Funding Overview
        </Link>
      </div>

      {/* Deal ID input */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Paste Deal ID…"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 w-80"
        />
        <button
          onClick={() => fetchInstruments(dealId)}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-sm"
        >
          Load
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-700/40 rounded-lg p-4 text-xs text-amber-300">
        <strong>Orchestrator Notice:</strong> FTH Trading does not issue banking instruments.
        Instruments listed here are issued by third-party banks. Verification checks are automated
        consistency checks only. <strong>All instruments require human approval before being marked verified.</strong>
      </div>

      {/* Instruments table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading…</div>
        ) : instruments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Enter a Deal ID above to load instruments.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Issuing Bank</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Verification</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst) => (
                <tr key={inst.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="px-5 py-3 text-zinc-200 font-medium">{inst.instrument_type}</td>
                  <td className="px-5 py-3">
                    <div className="text-zinc-200">{inst.issuing_bank_name ?? '—'}</div>
                    <div className="text-xs text-zinc-500">{inst.issuing_bank_bic ?? ''}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-300">
                    {inst.amount
                      ? `${inst.currency} ${parseFloat(String(inst.amount)).toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {inst.expiry_date ? new Date(inst.expiry_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[inst.stage] ?? ''}`}>
                      {inst.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${VERIFY_COLORS[inst.verification_status] ?? ''}`}>
                      {inst.verification_status.replace(/_/g, ' ')}
                    </span>
                    {inst.human_approval_required && (
                      <span className="ml-1 text-xs text-amber-400">⚠ human gate</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {inst.verification_status === 'UNVERIFIED' && (
                        <button
                          onClick={() => runVerification(inst.id)}
                          disabled={actionLoading === inst.id + '_verify'}
                          className="px-2 py-1 text-xs rounded bg-blue-800 hover:bg-blue-700 text-blue-200 disabled:opacity-50"
                        >
                          {actionLoading === inst.id + '_verify' ? '…' : 'Run Checks'}
                        </button>
                      )}
                      {inst.verification_status === 'PENDING_HUMAN_REVIEW' && (
                        <>
                          <button
                            onClick={() => humanApprove(inst.id)}
                            disabled={!!actionLoading}
                            className="px-2 py-1 text-xs rounded bg-green-800 hover:bg-green-700 text-green-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => humanReject(inst.id)}
                            disabled={!!actionLoading}
                            className="px-2 py-1 text-xs rounded bg-red-900 hover:bg-red-800 text-red-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {inst.verification_status === 'HUMAN_APPROVED' && (
                        <span className="text-xs text-green-400">
                          ✓ {inst.verified_by}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
