'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Types ─── */
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

/* ─── Badge colours (light theme) ─── */
const STAGE_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-50 text-blue-700',
  TRANSMITTED: 'bg-indigo-50 text-indigo-700',
  CONFIRMED: 'bg-cyan-50 text-cyan-700',
  ACTIVE: 'bg-green-50 text-green-700',
  DRAWN: 'bg-yellow-50 text-yellow-700',
  EXPIRED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REJECTED: 'bg-red-50 text-red-700',
};

const VERIFY_COLORS: Record<string, string> = {
  UNVERIFIED: 'bg-gray-100 text-gray-600',
  PENDING_HUMAN_REVIEW: 'bg-yellow-50 text-yellow-700',
  HUMAN_APPROVED: 'bg-blue-50 text-blue-700',
  HUMAN_REJECTED: 'bg-red-50 text-red-700',
  VERIFIED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
};

/* ─── Instrument Reference Data ─── */
interface InstrumentRef {
  code: string;
  name: string;
  category: 'Credit' | 'Guarantee' | 'Collection' | 'Escrow' | 'Receivables';
  description: string;
  whenUsed: string;
  keyFields: string[];
  riskProfile: string;
  typicalTenor: string;
  iccRules: string;
  subtypes?: { name: string; detail: string }[];
}

const INSTRUMENT_CATALOG: InstrumentRef[] = [
  {
    code: 'LC',
    name: 'Documentary Letter of Credit',
    category: 'Credit',
    description:
      'An irrevocable undertaking by the issuing bank to pay the beneficiary (seller) upon presentation of compliant documents. The most widely used trade finance instrument globally, governed by UCP 600.',
    whenUsed:
      'Cross-border commodity purchases where buyer and seller lack established trust. Standard on first-time deals, CIF/CFR shipments, and high-value transactions.',
    keyFields: [
      'Issuing Bank + BIC/SWIFT',
      'Applicant (Buyer)',
      'Beneficiary (Seller)',
      'Amount & Currency',
      'Expiry Date & Place',
      'Latest Shipment Date',
      'Port of Loading / Discharge',
      'Document Requirements (B/L, Invoice, C/O, Inspection, Insurance)',
      'Partial Shipments (allowed/prohibited)',
      'Transhipment (allowed/prohibited)',
      'Incoterms (FOB, CIF, CFR, etc.)',
      'Tenor (at sight / usance)',
      'Confirming Bank (if confirmed)',
    ],
    riskProfile:
      'Low for seller (bank obligation to pay). Buyer bears cost but controls through document requirements. Discrepancy risk if documents don\'t match LC terms exactly.',
    typicalTenor: 'At sight or 30/60/90/120/180 days from B/L date',
    iccRules: 'UCP 600 (ICC Publication 600)',
    subtypes: [
      { name: 'Sight LC', detail: 'Payment on presentation of compliant documents. No deferred payment period.' },
      { name: 'Usance LC', detail: 'Deferred payment — typically 30-180 days from B/L date. Seller provides credit to buyer.' },
      { name: 'Confirmed LC', detail: 'A second bank (usually in seller\'s country) adds its own irrevocable payment undertaking, eliminating issuing-bank and country risk.' },
      { name: 'Transferable LC', detail: 'Beneficiary can transfer all or part to a second beneficiary. Used by middlemen/traders who source from suppliers.' },
      { name: 'Back-to-Back LC', detail: 'Two separate LCs — master LC from end-buyer, second LC opened in favor of actual supplier. Used when transfer is not possible.' },
      { name: 'Revolving LC', detail: 'Automatically reinstates after each drawing. Used for repeat shipments of the same commodity to reduce issuance costs.' },
      { name: 'Red Clause LC', detail: 'Allows advance payment to beneficiary before shipment against a simple receipt. Pre-finances supplier for procurement/packaging.' },
      { name: 'Green Clause LC', detail: 'Extends red clause by allowing advance against warehouse receipts. Used for commodity stockpiling before shipment.' },
      { name: 'Deferred Payment LC', detail: 'Bank undertakes to pay at a future date (no draft). Similar to usance but without bill of exchange.' },
      { name: 'Acceptance LC', detail: 'Issuing bank accepts a time draft drawn by beneficiary. Accepted draft becomes a bankable instrument (banker\'s acceptance).' },
    ],
  },
  {
    code: 'SBLC',
    name: 'Standby Letter of Credit',
    category: 'Guarantee',
    description:
      'A bank\'s irrevocable undertaking to pay if the applicant fails to perform a contractual obligation. Unlike a commercial LC, the SBLC is a default instrument — it pays only if the underlying transaction fails. Functions as a guarantee under U.S. banking law.',
    whenUsed:
      'Performance assurance, payment guarantees, advance payment protection, bid security, and as collateral in structured finance. Common in U.S.-originated trade and project finance.',
    keyFields: [
      'Issuing Bank + BIC/SWIFT',
      'Applicant (Account Party)',
      'Beneficiary',
      'Amount & Currency',
      'Expiry Date',
      'Underlying Obligation (contract/PO reference)',
      'Drawing Conditions (statement of default, demand)',
      'Partial Drawings (allowed/prohibited)',
      'Auto-extension / Evergreen Clause',
      'Governing Law',
      'Reduction Schedule (if applicable)',
    ],
    riskProfile:
      'Low for beneficiary — bank obligation backs the undertaking. Applicant bears full credit exposure. Cost typically 1-3% p.a. of face value.',
    typicalTenor: '1 year with auto-renewal, or matched to contract duration',
    iccRules: 'ISP98 (ICC Publication 590) or UCP 600',
    subtypes: [
      { name: 'Financial SBLC', detail: 'Guarantees payment obligations — e.g., supplier payment, loan repayment. Drawn upon non-payment.' },
      { name: 'Performance SBLC', detail: 'Guarantees contractual performance — e.g., delivery, construction milestones. Drawn upon non-performance.' },
      { name: 'Direct-Pay SBLC', detail: 'Primary payment mechanism (not just standby). Beneficiary draws as the normal payment method.' },
      { name: 'Counter SBLC', detail: 'Issued to induce a local bank to issue a guarantee in beneficiary\'s jurisdiction. Chain: counter-SBLC → local guarantee.' },
    ],
  },
  {
    code: 'BG',
    name: 'Bank Guarantee',
    category: 'Guarantee',
    description:
      'An irrevocable undertaking by a bank (guarantor) to pay the beneficiary if the principal (applicant) fails to meet a contractual obligation. Unlike SBLC, demand guarantees are not subject to U.S. restrictions and are standard across Europe, Middle East, Africa, and Asia.',
    whenUsed:
      'Bid/tender bonds, performance bonds, advance payment guarantees, retention guarantees, customs bonds, and warranty guarantees.',
    keyFields: [
      'Guarantor Bank + BIC/SWIFT',
      'Principal (Applicant)',
      'Beneficiary',
      'Amount & Currency',
      'Expiry Date / Expiry Event',
      'Underlying Contract Reference',
      'Demand Conditions',
      'Reduction Clause',
      'Governing Law / Jurisdiction',
    ],
    riskProfile:
      'Low for beneficiary. Principal bears credit risk and guarantee fee (typically 0.5-3% p.a.). Unfair calling risk exists — demand guarantees can be called without proof.',
    typicalTenor: 'Matched to contract: tender (3-6 months), performance (project duration + defects period), advance payment (until delivery)',
    iccRules: 'URDG 758 (ICC Publication 758)',
    subtypes: [
      { name: 'Bid Bond / Tender Guarantee', detail: 'Ensures bidder will sign contract if awarded. Typically 2-5% of bid value. Released upon contract signing or expiry.' },
      { name: 'Performance Guarantee', detail: 'Ensures contractor/supplier performs per contract. Typically 5-10% of contract value. Duration: contract execution + defects liability period.' },
      { name: 'Advance Payment Guarantee', detail: 'Protects buyer who pays in advance. Reduces pro-rata as goods/services delivered. Amount = advance payment amount.' },
      { name: 'Retention Guarantee', detail: 'Replaces cash retention held by buyer. Allows early release of retention money. Typically 5-10% of contract value.' },
      { name: 'Customs Guarantee', detail: 'Issued in favor of customs authorities. Covers import duties, transit bonds, temporary import/re-export obligations.' },
      { name: 'Warranty Guarantee', detail: 'Covers post-completion warranty period. Called if seller fails to honor warranty obligations. Duration: warranty period.' },
      { name: 'Payment Guarantee', detail: 'Bank guarantees buyer will pay for goods/services. Called if buyer fails to pay on due date.' },
    ],
  },
  {
    code: 'DC',
    name: 'Documentary Collection',
    category: 'Collection',
    description:
      'Banks act as intermediaries to handle shipping documents in exchange for payment or acceptance of a draft. The bank has no payment obligation — it only processes documents per instructions. Lower cost than LC but higher risk for seller.',
    whenUsed:
      'Established trading relationships, lower-risk corridors, or when LC cost is prohibitive. Common for repeat commodity shipments between trusted counterparties.',
    keyFields: [
      'Remitting Bank (Seller\'s Bank)',
      'Collecting Bank (Buyer\'s Bank)',
      'Drawer (Seller)',
      'Drawee (Buyer)',
      'Documents Against Payment (D/P) or Documents Against Acceptance (D/A)',
      'Bill of Exchange / Draft details',
      'Document list',
      'Protest instructions',
      'Charges allocation',
    ],
    riskProfile:
      'Medium for seller — buyer can refuse documents (no bank obligation to pay). Lower risk than open account but higher than LC.',
    typicalTenor: 'D/P: at sight. D/A: 30-180 days from draft acceptance',
    iccRules: 'URC 522 (ICC Publication 522)',
    subtypes: [
      { name: 'Documents Against Payment (D/P)', detail: 'Collecting bank releases documents only upon buyer\'s payment. Also called "Cash Against Documents" (CAD). Closest to LC protection without LC cost.' },
      { name: 'Documents Against Acceptance (D/A)', detail: 'Collecting bank releases documents upon buyer\'s acceptance of a time draft. Buyer gets documents (and goods) before payment date. Higher risk for seller.' },
    ],
  },
  {
    code: 'ESCROW',
    name: 'Escrow Arrangement',
    category: 'Escrow',
    description:
      'A third-party escrow agent (bank or specialized entity) holds funds or assets until predefined conditions are met. Used to synchronize payment with delivery milestones, reducing bilateral risk.',
    whenUsed:
      'High-value commodity transactions, M&A escrow, milestone-based project payments, and digital asset settlement. Essential when neither party wants to move first.',
    keyFields: [
      'Escrow Agent (Bank / Trust Company)',
      'Depositor',
      'Beneficiary',
      'Escrow Amount & Currency',
      'Release Conditions / Milestones',
      'Dispute Resolution Mechanism',
      'Expiry / Long-stop Date',
      'Partial Release Schedule',
      'Governing Law',
    ],
    riskProfile:
      'Low for both parties — funds held by neutral third party. Escrow agent risk is the primary exposure. Cost: setup fee + annual custody.',
    typicalTenor: 'Transaction-dependent: days (simple) to years (construction/M&A)',
    iccRules: 'No specific ICC rules — governed by escrow agreement and local law',
    subtypes: [
      { name: 'Cash Escrow', detail: 'Funds deposited in escrow account. Released upon documentary proof of condition fulfillment. Most common form.' },
      { name: 'Document Escrow', detail: 'Title documents/shares held by agent. Released upon payment or condition satisfaction.' },
      { name: 'Smart Contract Escrow', detail: 'Blockchain-based escrow using programmable logic. Conditions verified on-chain for automatic release. Used in XRPL/Stellar settlements.' },
    ],
  },
  {
    code: 'AVAL',
    name: 'Avalised Draft / Bill of Exchange',
    category: 'Receivables',
    description:
      'A bill of exchange (draft) guaranteed ("avalised") by a bank. The aval transforms a corporate payment promise into a bank-backed obligation, making it tradeable in the secondary market.',
    whenUsed:
      'Deferred payment commodity trades where seller needs immediate liquidity. The avalised draft can be discounted (sold) at favorable rates due to bank backing.',
    keyFields: [
      'Drawer (Seller)',
      'Drawee (Buyer)',
      'Avalist (Guaranteeing Bank)',
      'Amount & Currency',
      'Maturity Date',
      'Place of Payment',
      'Endorsement chain',
    ],
    riskProfile:
      'Low for holder — bank aval is equivalent to a bank guarantee on the draft. Cost: aval fee (0.5-2% p.a.) + discount rate when sold.',
    typicalTenor: '30-180 days from acceptance',
    iccRules: 'Governed by Geneva Convention on Bills of Exchange (also URC 522 for collection)',
  },
  {
    code: 'FORFAIT',
    name: 'Forfaiting',
    category: 'Receivables',
    description:
      'The purchase of a seller\'s receivables (backed by LC, BG, or avalised draft) at a discount, without recourse. The forfaiter assumes all payment risk including country, commercial, and transfer risk.',
    whenUsed:
      'Medium to long-term export financing (typically 1-7 years). Seller eliminates buyer/country risk entirely. Common in capital goods and commodity pre-export finance.',
    keyFields: [
      'Forfaiter (Purchasing Bank/Institution)',
      'Seller (Exporter)',
      'Debtor (Buyer/Issuing Bank)',
      'Underlying Instrument (LC, BG, Avalised Draft)',
      'Discount Rate / All-in Cost',
      'Maturity Schedule',
      'Without Recourse confirmation',
      'Assignment / Endorsement',
    ],
    riskProfile:
      'Eliminated for seller (without recourse). Forfaiter bears all risk. Cost reflected in discount margin.',
    typicalTenor: '6 months to 7 years',
    iccRules: 'URF 800 (ICC Publication 800)',
  },
  {
    code: 'FACTOR',
    name: 'Factoring / Receivables Purchase',
    category: 'Receivables',
    description:
      'The sale of trade receivables (invoices) to a factor at a discount. Unlike forfaiting, factoring typically covers short-term receivables and may be with or without recourse. Provides immediate working capital.',
    whenUsed:
      'Open-account commodity sales where seller needs immediate cash flow. Also for supply chain finance programs ("reverse factoring" initiated by buyer).',
    keyFields: [
      'Factor (Bank/Institution)',
      'Seller / Supplier',
      'Debtor / Buyer',
      'Invoice Amount & Currency',
      'Advance Rate (typically 70-90%)',
      'Discount Rate / Fee',
      'Recourse vs Non-Recourse',
      'Notification to Debtor',
      'Credit Insurance (if applicable)',
    ],
    riskProfile:
      'With recourse: seller retains buyer default risk. Without recourse: factor bears risk (higher cost). Credit insurance can bridge the gap.',
    typicalTenor: '30-120 days (invoice maturity)',
    iccRules: 'GRIF (General Rules for International Factoring) — FCI',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Credit: 'bg-blue-50 text-blue-700 border-blue-200',
  Guarantee: 'bg-amber-50 text-amber-700 border-amber-200',
  Collection: 'bg-purple-50 text-purple-700 border-purple-200',
  Escrow: 'bg-green-50 text-green-700 border-green-200',
  Receivables: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

export default function InstrumentsPage() {
  const [dealId, setDealId] = useState('');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reference' | 'deal'>('reference');

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banking Instruments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete reference for trade finance instruments — LC, SBLC, BG, Escrow, Collections, Forfaiting & Factoring
          </p>
        </div>
        <Link href="/dashboard/funding" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Funding Overview
        </Link>
      </div>

      {/* Orchestrator notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <strong>Orchestrator Notice:</strong> FTH Trading does not issue banking instruments.
        Instruments listed here are issued by third-party banks. Verification checks are automated
        consistency checks only. <strong>All instruments require human approval before being marked verified.</strong>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('reference')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reference'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Instrument Reference Guide
        </button>
        <button
          onClick={() => setActiveTab('deal')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'deal'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Deal Instruments
        </button>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* REFERENCE GUIDE TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'reference' && (
        <div className="space-y-4">
          {/* Category summary */}
          <div className="grid grid-cols-5 gap-3">
            {(['Credit', 'Guarantee', 'Collection', 'Escrow', 'Receivables'] as const).map((cat) => {
              const count = INSTRUMENT_CATALOG.filter((i) => i.category === cat).length;
              return (
                <div key={cat} className={`rounded-xl border p-4 ${CATEGORY_COLORS[cat]}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">{cat}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                  <p className="text-xs mt-0.5 opacity-75">
                    {count === 1 ? 'instrument' : 'instruments'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Instrument cards */}
          {INSTRUMENT_CATALOG.map((inst) => {
            const isExpanded = expandedInstrument === inst.code;
            return (
              <div
                key={inst.code}
                className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpandedInstrument(isExpanded ? null : inst.code)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-amber-700 w-16">{inst.code}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{inst.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{inst.iccRules}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[inst.category]}`}>
                      {inst.category}
                    </span>
                    <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-6 pb-5 space-y-4 border-t border-gray-100 pt-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{inst.description}</p>
                    </div>

                    {/* When to Use */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">When to Use</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{inst.whenUsed}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Risk Profile */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Risk Profile</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{inst.riskProfile}</p>
                      </div>
                      {/* Typical Tenor */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Typical Tenor</h4>
                        <p className="text-sm text-gray-700">{inst.typicalTenor}</p>
                      </div>
                    </div>

                    {/* Key Fields */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Fields</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                        {inst.keyFields.map((field) => (
                          <div key={field} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subtypes */}
                    {inst.subtypes && inst.subtypes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Subtypes & Variants ({inst.subtypes.length})
                        </h4>
                        <div className="space-y-2">
                          {inst.subtypes.map((sub) => (
                            <div key={sub.name} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{sub.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* DEAL INSTRUMENTS TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'deal' && (
        <div className="space-y-4">
          {/* Deal ID input */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Paste Deal ID…"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 w-80 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <button
              onClick={() => fetchInstruments(dealId)}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-medium transition-colors"
            >
              Load
            </button>
          </div>

          {/* Instruments table */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : instruments.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Enter a Deal ID above to load instruments, or browse the Reference Guide tab for instrument details.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase">
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
                    <tr key={inst.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-3 text-gray-900 font-medium">{inst.instrument_type}</td>
                      <td className="px-5 py-3">
                        <div className="text-gray-900">{inst.issuing_bank_name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{inst.issuing_bank_bic ?? ''}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {inst.amount
                          ? `${inst.currency} ${parseFloat(String(inst.amount)).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
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
                          <span className="ml-1 text-xs text-amber-600">⚠ human gate</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {inst.verification_status === 'UNVERIFIED' && (
                            <button
                              onClick={() => runVerification(inst.id)}
                              disabled={actionLoading === inst.id + '_verify'}
                              className="px-2 py-1 text-xs rounded bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === inst.id + '_verify' ? '…' : 'Run Checks'}
                            </button>
                          )}
                          {inst.verification_status === 'PENDING_HUMAN_REVIEW' && (
                            <>
                              <button
                                onClick={() => humanApprove(inst.id)}
                                disabled={!!actionLoading}
                                className="px-2 py-1 text-xs rounded bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-50 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => humanReject(inst.id)}
                                disabled={!!actionLoading}
                                className="px-2 py-1 text-xs rounded bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {inst.verification_status === 'HUMAN_APPROVED' && (
                            <span className="text-xs text-green-600">
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
      )}
    </div>
  );
}
