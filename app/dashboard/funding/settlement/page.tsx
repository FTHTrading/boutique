'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SettlementInstruction {
  id: string;
  deal_id: string;
  rail: 'FIAT' | 'XRPL' | 'STELLAR';
  amount: string | null;
  currency: string;
  beneficiary_name: string | null;
  swift_bic: string | null;
  xrpl_address: string | null;
  xrpl_destination_tag: number | null;
  stellar_address: string | null;
  stellar_memo: string | null;
  stellar_memo_type: string | null;
  validation_checklist: ValidationItem[];
  is_validated: boolean;
  created_at: string;
}

interface ValidationItem {
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'TODO';
  detail: string;
}

interface EscrowMilestone {
  id: string;
  milestone_name: string;
  amount: number;
  currency: string;
  release_condition: string;
  release_status: string;
  released_at: string | null;
}

const RAIL_COLOR: Record<string, string> = {
  FIAT: 'bg-zinc-700 text-zinc-200',
  XRPL: 'bg-purple-900 text-purple-300',
  STELLAR: 'bg-blue-900 text-blue-300',
};

const CHECK_ICON: Record<string, string> = {
  PASS: '✓',
  WARN: '⚠',
  FAIL: '✗',
  TODO: '○',
};

const CHECK_COLOR: Record<string, string> = {
  PASS: 'text-green-400',
  WARN: 'text-yellow-400',
  FAIL: 'text-red-400',
  TODO: 'text-zinc-500',
};

export default function SettlementPage() {
  const [dealId, setDealId] = useState('');
  const [instructions, setInstructions] = useState<SettlementInstruction[]>([]);
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([]);
  const [selected, setSelected] = useState<SettlementInstruction | null>(null);
  const [loading, setLoading] = useState(false);

  const load = (id: string) => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/funding/settlement?dealId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setInstructions(d.instructions ?? []);
        setMilestones(d.milestones ?? []);
        if (d.instructions?.length) setSelected(d.instructions[0]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settlement Instructions</h1>
          <p className="text-sm text-zinc-400 mt-1">
            FIAT · XRPL · Stellar — programmable settlement and audit rails
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
          onClick={() => load(dealId)}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-sm"
        >
          Load
        </button>
      </div>

      {/* No-funds-lost disclaimer */}
      <div className="bg-amber-950/40 border border-amber-700/40 rounded-lg p-4 text-xs text-amber-300 space-y-1">
        <p><strong>No-Funds-Lost Checklist:</strong></p>
        <p>① Always send a test transaction before full settlement.</p>
        <p>② XRPL: destination tag is REQUIRED — omission may result in unrecoverable funds.</p>
        <p>③ Stellar: memo is REQUIRED for most exchanges — verify recipient requirements.</p>
        <p>④ FIAT: confirm BIC and intermediary bank with counterparty before sending.</p>
        <p>⑤ All instructions must be reviewed and approved by a finance officer before execution.</p>
      </div>

      {loading && <div className="text-zinc-500 text-sm text-center py-8">Loading…</div>}

      {!loading && instructions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {/* Rail selector */}
          <div className="col-span-1 space-y-2">
            {instructions.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelected(inst)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selected?.id === inst.id
                    ? 'bg-zinc-800 border-indigo-600'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${RAIL_COLOR[inst.rail]}`}>
                    {inst.rail}
                  </span>
                  {inst.is_validated && <span className="text-xs text-green-400">✓ validated</span>}
                </div>
                <div className="text-sm text-zinc-300 mt-1">
                  {inst.amount && <span>{inst.currency} {parseFloat(inst.amount).toLocaleString()}</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {new Date(inst.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {/* Detail view */}
          {selected && (
            <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-sm font-bold ${RAIL_COLOR[selected.rail]}`}>
                  {selected.rail}
                </span>
                <span className="text-zinc-400 text-sm">
                  {selected.amount && `${selected.currency} ${parseFloat(selected.amount).toLocaleString()}`}
                </span>
              </div>

              {/* FIAT fields */}
              {selected.rail === 'FIAT' && (
                <div className="space-y-2 text-sm">
                  <Field label="Beneficiary" value={selected.beneficiary_name} />
                  <Field label="SWIFT BIC" value={selected.swift_bic} mono />
                </div>
              )}

              {/* XRPL fields */}
              {selected.rail === 'XRPL' && (
                <div className="space-y-2 text-sm">
                  <Field label="Destination Address" value={selected.xrpl_address} mono />
                  <Field
                    label="Destination Tag"
                    value={selected.xrpl_destination_tag !== null ? String(selected.xrpl_destination_tag) : null}
                    mono
                    critical
                  />
                </div>
              )}

              {/* Stellar fields */}
              {selected.rail === 'STELLAR' && (
                <div className="space-y-2 text-sm">
                  <Field label="Destination Address" value={selected.stellar_address} mono />
                  <Field
                    label={`Memo (${selected.stellar_memo_type ?? 'text'})`}
                    value={selected.stellar_memo}
                    mono
                    critical
                  />
                </div>
              )}

              {/* Validation checklist */}
              {selected.validation_checklist?.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Validation Checklist</h3>
                  <div className="space-y-1.5">
                    {(selected.validation_checklist as ValidationItem[]).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`font-bold ${CHECK_COLOR[item.status]}`}>
                          {CHECK_ICON[item.status]}
                        </span>
                        <div>
                          <span className="text-zinc-300">{item.check}</span>
                          {item.detail && (
                            <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Escrow milestones */}
      {milestones.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Escrow Milestones</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                <th className="px-5 py-3 text-left">Milestone</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left">Release Condition</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className="border-b border-zinc-800/60">
                  <td className="px-5 py-3 text-zinc-200">{m.milestone_name}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">
                    {m.currency} {parseFloat(String(m.amount)).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{m.release_condition}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      m.release_status === 'RELEASED' ? 'bg-green-900 text-green-300' :
                      m.release_status === 'LOCKED' ? 'bg-zinc-700 text-zinc-300' :
                      m.release_status === 'DISPUTED' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {m.release_status}
                    </span>
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

function Field({
  label, value, mono, critical,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  critical?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-zinc-500 w-40 shrink-0">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : ''} ${critical ? 'text-amber-300 font-semibold' : 'text-zinc-300'}`}>
        {value ?? <span className="text-zinc-600 italic">not set</span>}
        {critical && value && <span className="ml-2 text-xs text-amber-500">required</span>}
      </span>
    </div>
  );
}
