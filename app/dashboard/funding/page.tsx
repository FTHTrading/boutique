'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Requirement {
  id: string;
  requirement_type: string;
  label: string;
  status: string;
  is_critical: boolean;
  due_date: string | null;
}

interface Deal {
  id: string;
  client_name: string;
  commodity: string;
  value: number;
  currency: string;
  stage: string;
}

function ReadinessGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-400' :
    score >= 50 ? 'text-yellow-400' :
    'text-red-400';
  const ring =
    score >= 80 ? 'ring-green-400' :
    score >= 50 ? 'ring-yellow-400' :
    'ring-red-400';

  return (
    <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full ring-4 ${ring} bg-zinc-900`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-zinc-400">/ 100</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-zinc-700 text-zinc-300',
    SUBMITTED: 'bg-blue-900 text-blue-300',
    UNDER_REVIEW: 'bg-yellow-900 text-yellow-300',
    APPROVED: 'bg-green-900 text-green-300',
    REJECTED: 'bg-red-900 text-red-300',
    WAIVED: 'bg-purple-900 text-purple-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
}

export default function FundingOverviewPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/deals')
      .then((r) => r.json())
      .then((d) => { setDeals(d.deals ?? []); if (d.deals?.length) setSelectedDeal(d.deals[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDeal) return;
    setLoading(true);
    fetch(`/api/funding/requirements?dealId=${selectedDeal}`)
      .then((r) => r.json())
      .then((d) => {
        setRequirements(d.requirements ?? []);
        setReadinessScore(d.readinessScore ?? 0);
      })
      .finally(() => setLoading(false));
  }, [selectedDeal]);

  const critical = requirements.filter((r) => r.is_critical && r.status === 'PENDING');
  const optional = requirements.filter((r) => !r.is_critical && r.status === 'PENDING');
  const approved = requirements.filter((r) => r.status === 'APPROVED' || r.status === 'WAIVED');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Funding Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Orchestration layer — not a bank. Instruments require human review before execution.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/funding/instruments"
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-sm"
          >
            Instruments
          </Link>
          <Link
            href="/dashboard/funding/settlement"
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-sm"
          >
            Settlement
          </Link>
          <Link
            href="/dashboard/funding/anchors"
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-sm"
          >
            Proof Anchors
          </Link>
        </div>
      </div>

      {/* Deal Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">Deal:</label>
        <select
          value={selectedDeal}
          onChange={(e) => setSelectedDeal(e.target.value)}
          className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 text-sm"
        >
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.client_name} — {d.commodity} ({d.currency} {d.value?.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {/* Score + Stats */}
      {selectedDeal && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Readiness Score</p>
              <ReadinessGauge score={readinessScore} />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-xs text-zinc-400 uppercase">Critical Pending</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{critical.length}</p>
            <p className="text-xs text-zinc-500 mt-1">blocks funding</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-xs text-zinc-400 uppercase">Optional Pending</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{optional.length}</p>
            <p className="text-xs text-zinc-500 mt-1">recommended</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-xs text-zinc-400 uppercase">Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{approved.length}</p>
            <p className="text-xs text-zinc-500 mt-1">approved / waived</p>
          </div>
        </div>
      )}

      {/* Requirements Table */}
      {selectedDeal && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Requirements Checklist</h2>
            <button
              onClick={async () => {
                const deal = deals.find((d) => d.id === selectedDeal);
                if (!deal) return;
                setLoading(true);
                await fetch('/api/funding/structure', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    dealId: selectedDeal,
                    dealValue: deal.value,
                    currency: deal.currency,
                    commodity: deal.commodity,
                    jurisdiction: 'Unknown',
                    persistRequirements: true,
                  }),
                });
                const r = await fetch(`/api/funding/requirements?dealId=${selectedDeal}`);
                const d = await r.json();
                setRequirements(d.requirements ?? []);
                setReadinessScore(d.readinessScore ?? 0);
                setLoading(false);
              }}
              className="px-3 py-1 text-xs rounded bg-indigo-700 hover:bg-indigo-600 text-white"
            >
              {loading ? 'Analyzing...' : 'AI Structure Analysis'}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Analyzing…</div>
          ) : requirements.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No requirements yet. Run AI Structure Analysis to generate them.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left">Requirement</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-center">Critical</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Due</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-zinc-200">{req.label}</td>
                    <td className="px-5 py-3 text-zinc-400">{req.requirement_type}</td>
                    <td className="px-4 py-3 text-center">
                      {req.is_critical ? (
                        <span className="text-red-400 font-bold">●</span>
                      ) : (
                        <span className="text-zinc-600">○</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">
                      {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
