-- ============================================================
-- Funding Layer Schema
-- FTH Trading / Boutique Platform
-- ============================================================
-- Run after schema-crm.sql:
--   psql $DATABASE_URL -f database/schema-funding.sql
-- ============================================================

-- Funding requirement types for a deal
CREATE TYPE funding_requirement_type AS ENUM (
  'KYC', 'KYB', 'POF', 'BANK_LETTER',
  'FIN_STATEMENTS', 'INSURANCE', 'COLLATERAL', 'UCC', 'LICENSE', 'OTHER'
);

CREATE TYPE requirement_status AS ENUM (
  'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAIVED'
);

-- Banking instrument types
CREATE TYPE instrument_type AS ENUM (
  'SBLC', 'LC', 'ESCROW', 'PREPAY', 'NET_TERMS', 'FACTORING', 'BANK_GUARANTEE', 'OTHER'
);

CREATE TYPE instrument_stage AS ENUM (
  'DRAFT', 'ISSUED', 'TRANSMITTED', 'CONFIRMED', 'ACTIVE',
  'DRAWN', 'EXPIRED', 'CANCELLED', 'REJECTED'
);

-- Bank message types (MT series)
CREATE TYPE bank_message_type AS ENUM (
  'MT760', 'MT799', 'MT700', 'MT710', 'MT720', 'MT103', 'MT202', 'SWIFT_GPI', 'OTHER'
);

CREATE TYPE verification_status AS ENUM (
  'UNVERIFIED', 'PENDING_HUMAN_REVIEW', 'HUMAN_APPROVED', 'HUMAN_REJECTED',
  'VERIFIED', 'FAILED'
);

-- Settlement rail types
CREATE TYPE settlement_rail AS ENUM ('FIAT', 'XRPL', 'STELLAR', 'HYBRID');

-- Proof anchor chains
CREATE TYPE anchor_chain AS ENUM ('XRPL', 'STELLAR', 'BOTH');

-- ============================================================
-- TABLE 1: funding_requirements
-- Checklist of documents / conditions required per deal
-- ============================================================
CREATE TABLE IF NOT EXISTS funding_requirements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  requirement_type  funding_requirement_type NOT NULL,
  label             TEXT NOT NULL,                         -- human readable e.g. "KYC – Counterparty A"
  description       TEXT,
  status            requirement_status NOT NULL DEFAULT 'PENDING',
  is_critical       BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE = blocks funding if missing
  due_date          DATE,
  submitted_at      TIMESTAMPTZ,
  reviewed_by       TEXT,                                  -- user ID or name of reviewer
  reviewed_at       TIMESTAMPTZ,
  document_url      TEXT,                                  -- link to uploaded doc / S3 key
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funding_req_deal ON funding_requirements(deal_id);
CREATE INDEX idx_funding_req_status ON funding_requirements(status);

-- ============================================================
-- TABLE 2: funding_instruments
-- Banking instruments: SBLC, LC, Escrow, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS funding_instruments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  instrument_type   instrument_type NOT NULL,
  stage             instrument_stage NOT NULL DEFAULT 'DRAFT',

  -- Issuing bank
  issuing_bank_name TEXT,
  issuing_bank_bic  TEXT,                                  -- BIC / SWIFT code
  issuing_bank_country TEXT,

  -- Advising / confirming bank
  advising_bank_name TEXT,
  advising_bank_bic  TEXT,

  -- Instrument details
  reference_number  TEXT,                                  -- bank's reference or LC number
  amount            NUMERIC(18,2),
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  issue_date        DATE,
  expiry_date       DATE,
  beneficiary_name  TEXT,
  beneficiary_account TEXT,
  applicant_name    TEXT,

  -- Rules & conditions
  applicable_rules  TEXT DEFAULT 'UCP 600',                -- UCP600, ISP98, URDG758
  special_conditions TEXT,
  presentation_days INTEGER DEFAULT 21,

  -- Verification
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verification_notes TEXT,
  verified_by       TEXT,                                  -- user who approved
  verified_at       TIMESTAMPTZ,
  human_approval_required BOOLEAN NOT NULL DEFAULT TRUE,   -- ALWAYS true per platform rules

  -- Raw data
  raw_swift_text    TEXT,                                  -- original SWIFT message body
  agent_analysis    JSONB,                                 -- InstrumentVerificationAgent output

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fi_deal ON funding_instruments(deal_id);
CREATE INDEX idx_fi_stage ON funding_instruments(stage);
CREATE INDEX idx_fi_verification ON funding_instruments(verification_status);

-- ============================================================
-- TABLE 3: bank_messages
-- Raw inbound/outbound MT messages linked to instruments
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id     UUID REFERENCES funding_instruments(id) ON DELETE SET NULL,
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  message_type      bank_message_type NOT NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  sender_bic        TEXT,
  receiver_bic      TEXT,
  reference         TEXT,
  value_date        DATE,
  amount            NUMERIC(18,2),
  currency          CHAR(3),
  raw_content       TEXT NOT NULL,                         -- full MT body
  parsed_fields     JSONB,                                 -- structured parse result
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bm_deal ON bank_messages(deal_id);
CREATE INDEX idx_bm_instrument ON bank_messages(instrument_id);
CREATE INDEX idx_bm_type ON bank_messages(message_type);

-- ============================================================
-- TABLE 4: settlement_instructions
-- FIAT + XRPL + Stellar instructions per deal
-- ============================================================
CREATE TABLE IF NOT EXISTS settlement_instructions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  instrument_id     UUID REFERENCES funding_instruments(id) ON DELETE SET NULL,
  rail              settlement_rail NOT NULL,

  -- FIAT fields
  beneficiary_name  TEXT,
  beneficiary_iban  TEXT,
  beneficiary_account TEXT,
  beneficiary_bank  TEXT,
  swift_bic         TEXT,
  routing_number    TEXT,
  reference_text    TEXT,
  intermediary_bank TEXT,
  amount            NUMERIC(18,2),
  currency          CHAR(3) NOT NULL DEFAULT 'USD',

  -- XRPL fields
  xrpl_address      TEXT,
  xrpl_destination_tag BIGINT,
  xrpl_currency     TEXT DEFAULT 'XRP',
  xrpl_issuer       TEXT,                                  -- for IOU tokens
  xrpl_condition    TEXT,                                  -- crypto condition for escrow
  xrpl_fulfillment  TEXT,

  -- Stellar fields
  stellar_address   TEXT,
  stellar_memo      TEXT,
  stellar_memo_type TEXT DEFAULT 'text',                   -- text | hash | id
  stellar_asset_code TEXT DEFAULT 'XLM',
  stellar_asset_issuer TEXT,
  stellar_federation TEXT,

  -- Validation checklist (JSON array of check items + pass status)
  validation_checklist JSONB DEFAULT '[]'::jsonb,
  is_validated      BOOLEAN NOT NULL DEFAULT FALSE,
  validated_by      TEXT,
  validated_at      TIMESTAMPTZ,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_si_deal ON settlement_instructions(deal_id);
CREATE INDEX idx_si_rail ON settlement_instructions(rail);

-- ============================================================
-- TABLE 5: escrow_milestones
-- Release schedule for escrow-based instruments
-- ============================================================
CREATE TABLE IF NOT EXISTS escrow_milestones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id     UUID NOT NULL REFERENCES settlement_instructions(id) ON DELETE CASCADE,
  deal_id           UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  milestone_name    TEXT NOT NULL,
  description       TEXT,
  amount            NUMERIC(18,2) NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  release_condition TEXT NOT NULL,                         -- e.g. "BL presented + inspected"
  release_status    TEXT NOT NULL DEFAULT 'LOCKED'
    CHECK (release_status IN ('LOCKED', 'CONDITION_MET', 'RELEASED', 'DISPUTED', 'REFUNDED')),
  condition_met_at  TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  released_by       TEXT,
  xrpl_escrow_seq   BIGINT,                                -- XRPL EscrowCreate sequence
  xrpl_finish_after TIMESTAMPTZ,
  xrpl_cancel_after TIMESTAMPTZ,
  proof_anchor_id   UUID,                                  -- FK added after proof_anchors table
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_em_settlement ON escrow_milestones(settlement_id);
CREATE INDEX idx_em_deal ON escrow_milestones(deal_id);
CREATE INDEX idx_em_status ON escrow_milestones(release_status);

-- ============================================================
-- TABLE 6: proof_anchors
-- Audit-grade hash anchoring to XRPL / Stellar
-- ============================================================
CREATE TABLE IF NOT EXISTS proof_anchors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID REFERENCES deals(id) ON DELETE SET NULL,
  object_type       TEXT NOT NULL,                         -- e.g. 'INSTRUMENT', 'CONTRACT', 'MILESTONE', 'BANK_MESSAGE'
  object_id         UUID NOT NULL,                         -- ID of the anchored record
  object_hash       TEXT NOT NULL,                         -- SHA-256 hex of the canonical JSON/text
  hash_algorithm    TEXT NOT NULL DEFAULT 'SHA-256',
  anchor_chain      anchor_chain NOT NULL DEFAULT 'XRPL',

  -- XRPL anchor
  xrpl_account      TEXT,
  xrpl_tx_hash      TEXT,                                  -- transaction hash on XRPL ledger
  xrpl_ledger_index BIGINT,
  xrpl_memo_type    TEXT DEFAULT 'FTH_PROOF',
  xrpl_confirmed    BOOLEAN DEFAULT FALSE,
  xrpl_confirmed_at TIMESTAMPTZ,

  -- Stellar anchor
  stellar_account   TEXT,
  stellar_tx_hash   TEXT,
  stellar_ledger    BIGINT,
  stellar_memo_hash TEXT,
  stellar_confirmed BOOLEAN DEFAULT FALSE,
  stellar_confirmed_at TIMESTAMPTZ,

  -- Status
  status            TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED')),
  error_message     TEXT,

  anchored_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pa_deal ON proof_anchors(deal_id);
CREATE INDEX idx_pa_object ON proof_anchors(object_type, object_id);
CREATE INDEX idx_pa_xrpl_tx ON proof_anchors(xrpl_tx_hash);
CREATE INDEX idx_pa_stellar_tx ON proof_anchors(stellar_tx_hash);

-- ============================================================
-- Cross-table FK: escrow_milestones.proof_anchor_id
-- ============================================================
ALTER TABLE escrow_milestones
  ADD CONSTRAINT fk_em_proof_anchor
  FOREIGN KEY (proof_anchor_id) REFERENCES proof_anchors(id) ON DELETE SET NULL;

-- ============================================================
-- Trigger: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'funding_requirements', 'funding_instruments',
    'settlement_instructions', 'escrow_milestones'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;
