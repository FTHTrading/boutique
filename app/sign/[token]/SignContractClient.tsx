'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText, Loader2 } from 'lucide-react';

interface ContractData {
  contract_id: string;
  contract_number: string;
  contract_type: string;
  party_b_name: string;
  party_b_signatory: string;
  commodity: string;
  effective_date: string;
  expiry_date: string;
  governing_law: string;
  document_html: string;
  esign_expires_at: string;
  status: string;
  signed_by_b?: string;
  signed_by_b_at?: string;
}

export default function SignContractClient({ token }: { token: string }) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatoryName, setSignatoryName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContract(data.contract);
          setSignatoryName(data.contract.party_b_signatory || '');
          if (data.contract.signed_by_b) setSigned(true);
        } else {
          setError(data.error || 'Invalid or expired signing link');
        }
      })
      .catch(() => setError('Failed to load contract'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    if (!agreed || !signatoryName.trim()) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatory_name: signatoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSigned(true);
      } else {
        setError(data.error || 'Signature could not be processed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-red-100 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing Link Error</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <p className="text-sm text-gray-400">
            Contact <a href="mailto:contracts@unykorn.org" className="underline">contracts@unykorn.org</a> to request a new link.
          </p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-green-100 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Contract Executed</h1>
          <p className="text-gray-600 mb-2">
            <strong>{contract.contract_number}</strong> has been successfully signed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            A copy will be sent to {contract.party_b_signatory}.
          </p>
          <div className="bg-gray-50 rounded p-4 text-left text-sm text-gray-600">
            <div className="flex justify-between mb-1"><span className="text-gray-400">Contract</span><span>{contract.contract_number}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-400">Type</span><span>{contract.contract_type}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-400">Commodity</span><span>{contract.commodity}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Effective</span><span>{contract.effective_date}</span></div>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(contract.esign_expires_at);
  const hoursRemaining = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3600000));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">FTH TRADING</p>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              {contract.contract_type} — {contract.contract_number}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            Expires in {hoursRemaining}h
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Contract Document</span>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">DRAFT — REVIEW CAREFULLY</span>
              </div>
              <div
                className="p-6 overflow-y-auto max-h-[600px] text-sm"
                dangerouslySetInnerHTML={{ __html: contract.document_html }}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Execute Agreement</h2>
              <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1 mb-6">
                <div className="flex justify-between"><span className="text-gray-400">Reference</span><span>{contract.contract_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Party A</span><span>FTH Trading</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Party B</span><span className="truncate ml-2 text-right">{contract.party_b_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Commodity</span><span>{contract.commodity}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Governing Law</span><span className="truncate ml-2 text-right">{contract.governing_law}</span></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Legal Name</label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="As it appears in official records"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  By entering your name, you confirm you are authorised to sign on behalf of {contract.party_b_name}.
                </p>
              </div>
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-600">
                  I have read and understood the full agreement above. I agree to be bound by its terms and confirm I have authority to execute this contract.
                </span>
              </label>
              <button
                onClick={handleSign}
                disabled={!agreed || !signatoryName.trim() || signing}
                className="w-full bg-gray-900 text-white rounded px-4 py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Execute Agreement</>
                )}
              </button>
              {error && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 rounded p-2">{error}</div>
              )}
              <p className="text-xs text-gray-400 mt-4 text-center">
                This signature is legally binding. Timestamp and IP address are recorded.
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-400 bg-amber-50 rounded p-3 border border-amber-100">
              <strong className="text-amber-700">Important:</strong> Review all terms carefully before signing.
              Consider seeking independent legal counsel.
              FTH Trading recommends you retain a signed copy for your records.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
