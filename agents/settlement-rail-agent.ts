/**
 * SettlementRailAgent
 *
 * Generates FIAT, XRPL, and Stellar settlement instructions for trade deals.
 * Also provides proof anchoring: hashes documents and anchors to XRPL/Stellar.
 *
 * IMPORTANT:
 * - XRPL and Stellar are programmable settlement and audit rails ONLY.
 * - They are NOT replacements for banking instruments (MT760, MT700, etc.).
 * - FTH Trading does NOT custody or move funds directly.
 * - All settlement instructions require human review before execution.
 * - Always recommend a small test transaction before full settlement.
 */

import * as xrpl from 'xrpl';
import * as StellarSdk from '@stellar/stellar-sdk';
import { createHash } from 'crypto';
import { sql } from '@/lib/sql';

// Environment
const XRPL_NODE_URL = process.env.XRPL_NODE_URL ?? 'wss://xrplcluster.com';
const STELLAR_HORIZON = process.env.STELLAR_HORIZON_URL ?? 'https://horizon.stellar.org';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FiatInstructions {
  rail: 'FIAT';
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  swiftBic: string;
  routingNumber?: string;
  iban?: string;
  referenceText: string;
  intermediaryBank?: string;
  amount: number;
  currency: string;
  validationChecklist: ValidationItem[];
}

export interface XrplInstructions {
  rail: 'XRPL';
  destinationAddress: string;
  destinationTag: number;
  currency: string;            // 'XRP' or IOU currency code
  issuer?: string;             // IOU issuer account
  amount: number | string;
  escrowCondition?: string;    // PREIMAGE-SHA-256 crypto condition
  escrowFinishAfter?: number;  // Unix timestamp
  escrowCancelAfter?: number;
  trustlineRequired: boolean;
  networkUrl: string;
  validationChecklist: ValidationItem[];
}

export interface StellarInstructions {
  rail: 'STELLAR';
  destinationAddress: string;
  memo: string;
  memoType: 'text' | 'hash' | 'id';
  assetCode: string;
  assetIssuer?: string;
  amount: string;
  federationAddress?: string;
  networkPassphrase: string;
  horizonUrl: string;
  validationChecklist: ValidationItem[];
}

export interface ProofAnchorResult {
  objectType: string;
  objectId: string;
  objectHash: string;     // SHA-256 hex
  xrplTxHash?: string;
  stellarTxHash?: string;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
  anchorId?: string;      // UUID from DB
}

interface ValidationItem {
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'TODO';
  detail: string;
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export class SettlementRailAgent {

  // ─── FIAT ──────────────────────────────────────────────────────────────────

  buildFiatInstructions(params: {
    dealId: string;
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryBank: string;
    swiftBic: string;
    routingNumber?: string;
    iban?: string;
    amount: number;
    currency: string;
    referenceText?: string;
    intermediaryBank?: string;
  }): FiatInstructions {
    const validationChecklist: ValidationItem[] = [
      {
        check: 'BIC Format Valid',
        status: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(params.swiftBic.toUpperCase())
          ? 'PASS' : 'FAIL',
        detail: `BIC: ${params.swiftBic}`,
      },
      {
        check: 'Beneficiary Name Present',
        status: params.beneficiaryName.trim().length > 0 ? 'PASS' : 'FAIL',
        detail: params.beneficiaryName,
      },
      {
        check: 'Account / IBAN Present',
        status: (params.beneficiaryAccount || params.iban) ? 'PASS' : 'FAIL',
        detail: params.iban ?? params.beneficiaryAccount,
      },
      {
        check: 'Currency ISO Code',
        status: /^[A-Z]{3}$/.test(params.currency) ? 'PASS' : 'FAIL',
        detail: params.currency,
      },
      {
        check: 'Test Transaction Recommended',
        status: 'WARN',
        detail: 'Send USD 1 test payment first; confirm receipt before full settlement',
      },
      {
        check: 'Intermediary Bank',
        status: params.intermediaryBank ? 'PASS' : 'TODO',
        detail: params.intermediaryBank ?? 'Not provided — may cause routing delays',
      },
    ];

    return {
      rail: 'FIAT',
      beneficiaryName: params.beneficiaryName,
      beneficiaryAccount: params.beneficiaryAccount,
      beneficiaryBank: params.beneficiaryBank,
      swiftBic: params.swiftBic.toUpperCase(),
      routingNumber: params.routingNumber,
      iban: params.iban,
      referenceText: params.referenceText ?? `FTH-${params.dealId.toUpperCase().slice(0, 8)}`,
      intermediaryBank: params.intermediaryBank,
      amount: params.amount,
      currency: params.currency,
      validationChecklist,
    };
  }

  // ─── XRPL ──────────────────────────────────────────────────────────────────

  buildXrplInstructions(params: {
    destinationAddress: string;
    amount: number;
    currency?: string;       // defaults to XRP
    issuer?: string;
    escrowCondition?: string;
    escrowFinishAfterDate?: Date;
    escrowCancelAfterDate?: Date;
  }): XrplInstructions {
    // Validate XRP address
    let addressValid = false;
    try {
      addressValid = xrpl.isValidAddress(params.destinationAddress);
    } catch {
      addressValid = false;
    }

    // Generate deterministic destination tag from random origin (production use sends a unique integer)
    const destinationTag = Math.floor(Math.random() * 2_147_483_647);

    const currency = params.currency ?? 'XRP';
    const trustlineRequired = currency !== 'XRP';

    const validationChecklist: ValidationItem[] = [
      {
        check: 'XRPL Address Valid',
        status: addressValid ? 'PASS' : 'FAIL',
        detail: `Address: ${params.destinationAddress}`,
      },
      {
        check: 'Destination Tag Included',
        status: 'PASS',
        detail: `Tag: ${destinationTag} — MUST be included or funds may be unrecoverable`,
      },
      {
        check: 'Trustline Required',
        status: trustlineRequired ? 'WARN' : 'PASS',
        detail: trustlineRequired
          ? `Trustline to issuer ${params.issuer ?? 'UNKNOWN'} must exist on destination account`
          : 'Native XRP — no trustline required',
      },
      {
        check: 'Test Transaction Recommended',
        status: 'WARN',
        detail: 'Send 1 drop (0.000001 XRP) test first; verify destination tag acceptance',
      },
      {
        check: 'Escrow Condition',
        status: params.escrowCondition ? 'PASS' : 'TODO',
        detail: params.escrowCondition
          ? 'Crypto condition present — ensure fulfillment is stored securely'
          : 'No escrow condition — standard payment',
      },
    ];

    return {
      rail: 'XRPL',
      destinationAddress: params.destinationAddress,
      destinationTag,
      currency,
      issuer: params.issuer,
      amount: params.amount,
      escrowCondition: params.escrowCondition,
      escrowFinishAfter: params.escrowFinishAfterDate
        ? Math.floor(params.escrowFinishAfterDate.getTime() / 1000)
        : undefined,
      escrowCancelAfter: params.escrowCancelAfterDate
        ? Math.floor(params.escrowCancelAfterDate.getTime() / 1000)
        : undefined,
      trustlineRequired,
      networkUrl: XRPL_NODE_URL,
      validationChecklist,
    };
  }

  // ─── Stellar ───────────────────────────────────────────────────────────────

  buildStellarInstructions(params: {
    destinationAddress: string;
    amount: string;
    assetCode?: string;        // defaults to XLM
    assetIssuer?: string;
    memo?: string;             // required for most exchanges
    memoType?: 'text' | 'hash' | 'id';
    federationAddress?: string;
  }): StellarInstructions {
    // Validate Stellar address
    let addressValid = false;
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(params.destinationAddress);
      addressValid = true;
    } catch {
      addressValid = false;
    }

    const assetCode = params.assetCode ?? 'XLM';
    const memoType = params.memoType ?? 'text';

    const validationChecklist: ValidationItem[] = [
      {
        check: 'Stellar Address Valid',
        status: addressValid ? 'PASS' : 'FAIL',
        detail: `Address: ${params.destinationAddress}`,
      },
      {
        check: 'Memo Present',
        status: params.memo ? 'PASS' : 'WARN',
        detail: params.memo
          ? `Memo (${memoType}): ${params.memo}`
          : 'No memo — required by most exchanges; omission may cause loss of funds',
      },
      {
        check: 'Asset Issuer',
        status: assetCode === 'XLM' || params.assetIssuer ? 'PASS' : 'FAIL',
        detail: assetCode === 'XLM'
          ? 'Native XLM — no issuer required'
          : `Issuer: ${params.assetIssuer ?? 'MISSING'}`,
      },
      {
        check: 'Test Transaction Recommended',
        status: 'WARN',
        detail: 'Send 1 XLM test first; confirm memo is accepted before full payment',
      },
      {
        check: 'Minimum Balance Reserve',
        status: 'WARN',
        detail: 'Destination account must have minimum 1 XLM reserve',
      },
    ];

    return {
      rail: 'STELLAR',
      destinationAddress: params.destinationAddress,
      memo: params.memo ?? '',
      memoType,
      assetCode,
      assetIssuer: params.assetIssuer,
      amount: params.amount,
      federationAddress: params.federationAddress,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
      horizonUrl: STELLAR_HORIZON,
      validationChecklist,
    };
  }

  // ─── Persist settlement instructions ──────────────────────────────────────

  async persistSettlement(
    dealId: string,
    instructions: FiatInstructions | XrplInstructions | StellarInstructions,
    instrumentId?: string
  ): Promise<string> {
    const isXrpl = instructions.rail === 'XRPL';
    const isStellar = instructions.rail === 'STELLAR';
    const isFiat = instructions.rail === 'FIAT';
    const fi = isFiat ? (instructions as FiatInstructions) : null;
    const xi = isXrpl ? (instructions as XrplInstructions) : null;
    const si = isStellar ? (instructions as StellarInstructions) : null;

    const { rows } = await sql`
      INSERT INTO settlement_instructions (
        deal_id, instrument_id, rail,
        beneficiary_name, beneficiary_iban, beneficiary_account,
        beneficiary_bank, swift_bic, routing_number, reference_text,
        intermediary_bank, amount, currency,
        xrpl_address, xrpl_destination_tag, xrpl_currency, xrpl_issuer,
        xrpl_condition,
        stellar_address, stellar_memo, stellar_memo_type,
        stellar_asset_code, stellar_asset_issuer, stellar_federation,
        validation_checklist
      ) VALUES (
        ${dealId}, ${instrumentId ?? null}, ${instructions.rail},
        ${fi?.beneficiaryName ?? null},
        ${fi?.iban ?? null},
        ${fi?.beneficiaryAccount ?? null},
        ${fi?.beneficiaryBank ?? null},
        ${fi?.swiftBic ?? null},
        ${fi?.routingNumber ?? null},
        ${fi?.referenceText ?? null},
        ${fi?.intermediaryBank ?? null},
        ${fi?.amount ?? xi?.amount ?? si?.amount ?? null},
        ${fi?.currency ?? (si ? si.assetCode : 'XRP')},
        ${xi?.destinationAddress ?? null},
        ${xi?.destinationTag ?? null},
        ${xi?.currency ?? null},
        ${xi?.issuer ?? null},
        ${xi?.escrowCondition ?? null},
        ${si?.destinationAddress ?? null},
        ${si?.memo ?? null},
        ${si?.memoType ?? null},
        ${si?.assetCode ?? null},
        ${si?.assetIssuer ?? null},
        ${si?.federationAddress ?? null},
        ${JSON.stringify(instructions.validationChecklist) as any}
      )
      RETURNING id
    `;
    return rows[0].id;
  }

  // ─── Proof Anchoring ──────────────────────────────────────────────────────

  /**
   * Hash a canonical representation of an object and anchor to XRPL and/or Stellar.
   * Stores the result in proof_anchors table.
   * This provides audit-grade evidence of document state at a point in time.
   *
   * NOTE: This sends a real on-chain transaction if XRPL_SIGNING_SECRET /
   * STELLAR_SIGNING_SECRET are configured. Otherwise it runs in dry-run mode
   * and stores PENDING status.
   */
  async anchorProof(params: {
    dealId?: string;
    objectType: string;    // 'INSTRUMENT' | 'CONTRACT' | 'MILESTONE' | 'BANK_MESSAGE'
    objectId: string;
    objectData: unknown;   // the data to hash
    chains?: ('XRPL' | 'STELLAR')[];
  }): Promise<ProofAnchorResult> {
    const chains = params.chains ?? ['XRPL'];
    const canonical = JSON.stringify(params.objectData, Object.keys(params.objectData as object).sort());
    const objectHash = createHash('sha256').update(canonical).digest('hex');

    let xrplTxHash: string | undefined;
    let stellarTxHash: string | undefined;
    let status: ProofAnchorResult['status'] = 'PENDING';

    // ── XRPL anchor ──
    if (chains.includes('XRPL') && process.env.XRPL_SIGNING_SECRET) {
      try {
        xrplTxHash = await this.anchorToXrpl(objectHash, params.objectType, params.objectId);
        status = 'SUBMITTED';
      } catch (err) {
        console.error('[SettlementRailAgent] XRPL anchor error:', err);
      }
    }

    // ── Stellar anchor ──
    if (chains.includes('STELLAR') && process.env.STELLAR_SIGNING_SECRET) {
      try {
        stellarTxHash = await this.anchorToStellar(objectHash, params.objectType, params.objectId);
        status = 'SUBMITTED';
      } catch (err) {
        console.error('[SettlementRailAgent] Stellar anchor error:', err);
      }
    }

    // Persist to DB
    const anchorChain = (chains.includes('XRPL') && chains.includes('STELLAR'))
      ? 'BOTH'
      : chains[0];

    const { rows } = await sql`
      INSERT INTO proof_anchors (
        deal_id, object_type, object_id, object_hash, anchor_chain,
        xrpl_tx_hash, stellar_tx_hash, status
      ) VALUES (
        ${params.dealId ?? null},
        ${params.objectType},
        ${params.objectId},
        ${objectHash},
        ${anchorChain},
        ${xrplTxHash ?? null},
        ${stellarTxHash ?? null},
        ${status}
      )
      RETURNING id
    `;

    return {
      objectType: params.objectType,
      objectId: params.objectId,
      objectHash,
      xrplTxHash,
      stellarTxHash,
      status,
      anchorId: rows[0]?.id,
    };
  }

  // ─── Private: XRPL submission ─────────────────────────────────────────────

  private async anchorToXrpl(
    objectHash: string,
    objectType: string,
    objectId: string
  ): Promise<string> {
    const client = new xrpl.Client(XRPL_NODE_URL);
    await client.connect();

    const wallet = xrpl.Wallet.fromSecret(process.env.XRPL_SIGNING_SECRET!);

    const memoData = xrpl.convertStringToHex(
      JSON.stringify({ type: objectType, id: objectId, hash: objectHash })
    );
    const memoType = xrpl.convertStringToHex('FTH_PROOF');
    const memoFormat = xrpl.convertStringToHex('application/json');

    const tx: xrpl.Payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: wallet.address,  // self-payment to embed memo
      Amount: '1',                   // 1 drop
      Memos: [
        {
          Memo: {
            MemoData: memoData,
            MemoType: memoType,
            MemoFormat: memoFormat,
          },
        },
      ],
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    return signed.hash;
  }

  // ─── Private: Stellar submission ──────────────────────────────────────────

  private async anchorToStellar(
    objectHash: string,
    objectType: string,
    objectId: string
  ): Promise<string> {
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON);
    const keypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SIGNING_SECRET!);

    const account = await server.loadAccount(keypair.publicKey());

    // Encode hash as Stellar Memo (hash type = 32 bytes)
    const hashBytes = Buffer.from(objectHash, 'hex');
    const memo = StellarSdk.Memo.hash(hashBytes.toString('base64'));

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    });

    // Minimal XLM self-payment to record memo on ledger
    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: keypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: '0.0000001',
      })
    );

    txBuilder.addMemo(memo);
    txBuilder.setTimeout(30);

    const tx = txBuilder.build();
    tx.sign(keypair);

    const result = await server.submitTransaction(tx);
    return result.hash;
  }
}
