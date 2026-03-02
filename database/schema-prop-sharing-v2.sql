-- ============================================================
-- Prop Sharing V2: Hardening & Treasury
-- FTH Trading / Boutique Platform
-- ============================================================
-- Adds:
--   1. Treasury ledger (double-entry capital accounting)
--   2. Immutable audit log
--   3. Trader KYC/compliance
--   4. Daily risk snapshots
--   5. Evaluation fee payments
--
-- Run after schema-prop-sharing.sql:
--   psql $DATABASE_URL -f database/schema-prop-sharing-v2.sql
-- ============================================================

-- Enums
CREATE TYPE treasury_entry_type AS ENUM (
  'capital_allocated',       -- firm allocates capital to a prop account
  'capital_returned',        -- capital returned from terminated/closed account
  'trader_payout',           -- profit share paid to trader
  'firm_revenue',            -- firm's share of profit
  'eval_fee_received',       -- evaluation fee collected from trader
  'loss_absorbed',           -- firm absorbs loss from funded account
  'adjustment'               -- manual adjustment
);

CREATE TYPE kyc_status AS ENUM (
  'pending',                 -- submitted, not yet reviewed
  'in_review',               -- under manual review
  'approved',                -- cleared for funding
  'rejected',                -- failed KYC
  'expired'                  -- needs renewal
);

CREATE TYPE challenge_application_status AS ENUM (
  'submitted',
  'payment_pending',
  'payment_received',
  'kyc_pending',
  'kyc_approved',
  'kyc_rejected',
  'active',                  -- evaluation started
  'completed',               -- passed evaluation
  'failed',                  -- failed evaluation
  'cancelled',
  'refunded'
);

-- ============================================================
-- TABLE: prop_treasury_ledger
-- Double-entry capital accounting for the prop desk
-- Every capital movement is recorded as an immutable entry
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_treasury_ledger (
  entry_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type        treasury_entry_type NOT NULL,

  -- References
  account_id        UUID REFERENCES prop_accounts(account_id) ON DELETE SET NULL,
  payout_id         UUID REFERENCES prop_payouts(payout_id) ON DELETE SET NULL,
  program_id        UUID REFERENCES prop_programs(program_id) ON DELETE SET NULL,

  -- Financials
  amount            NUMERIC(18,2) NOT NULL,             -- always positive
  direction         VARCHAR(6) NOT NULL CHECK (direction IN ('debit', 'credit')),
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  running_balance   NUMERIC(18,2),                      -- running total after this entry

  -- Context
  description       TEXT NOT NULL,
  reference         VARCHAR(255),                       -- external payment ref, wire ref, etc.
  performed_by      VARCHAR(255),                       -- admin who triggered
  metadata          JSONB DEFAULT '{}'::jsonb,

  -- Immutability
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — ledger entries are immutable
);

CREATE INDEX IF NOT EXISTS idx_treasury_type ON prop_treasury_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_treasury_account ON prop_treasury_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_created ON prop_treasury_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_direction ON prop_treasury_ledger(direction);

-- ============================================================
-- TABLE: prop_audit_log
-- Immutable record of every state change in the prop system
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_audit_log (
  log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       VARCHAR(50) NOT NULL,               -- 'account', 'trade', 'payout', 'program', 'risk_event'
  entity_id         UUID NOT NULL,
  action            VARCHAR(100) NOT NULL,               -- 'phase_change', 'trade_opened', 'trade_closed', 'payout_approved', etc.
  old_value         JSONB,                               -- previous state
  new_value         JSONB,                               -- new state
  performed_by      VARCHAR(255) DEFAULT 'system',
  ip_address        VARCHAR(45),
  user_agent        TEXT,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — audit logs are immutable
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON prop_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON prop_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON prop_audit_log(created_at DESC);

-- ============================================================
-- TABLE: prop_trader_kyc
-- KYC/compliance records for external prop traders
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_trader_kyc (
  kyc_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID REFERENCES prop_accounts(account_id) ON DELETE CASCADE,
  trader_email      VARCHAR(255) NOT NULL,

  -- Identity
  legal_name        VARCHAR(255) NOT NULL,
  date_of_birth     DATE,
  nationality       VARCHAR(100),
  country_of_residence VARCHAR(100) NOT NULL,
  government_id_type   VARCHAR(50),                     -- 'passport', 'national_id', 'drivers_license'
  government_id_number VARCHAR(100),
  government_id_expiry DATE,

  -- Address
  address_line1     VARCHAR(255),
  address_line2     VARCHAR(255),
  city              VARCHAR(100),
  state_province    VARCHAR(100),
  postal_code       VARCHAR(20),

  -- Compliance
  status            kyc_status NOT NULL DEFAULT 'pending',
  risk_level        VARCHAR(20) DEFAULT 'standard',     -- 'low', 'standard', 'enhanced', 'prohibited'
  sanctions_checked BOOLEAN DEFAULT FALSE,
  sanctions_clear   BOOLEAN,
  sanctions_checked_at TIMESTAMPTZ,
  pep_status        BOOLEAN DEFAULT FALSE,              -- politically exposed person
  source_of_funds   TEXT,

  -- Documents (URLs or references)
  id_document_url   TEXT,
  proof_of_address_url TEXT,
  selfie_url        TEXT,

  -- Review
  reviewed_by       VARCHAR(255),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  notes             TEXT,

  -- Expiry & renewal
  expires_at        TIMESTAMPTZ,
  renewed_at        TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_account ON prop_trader_kyc(account_id);
CREATE INDEX IF NOT EXISTS idx_kyc_email ON prop_trader_kyc(trader_email);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON prop_trader_kyc(status);

-- ============================================================
-- TABLE: prop_challenge_applications
-- Public prop challenge application funnel
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_challenge_applications (
  application_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        UUID NOT NULL REFERENCES prop_programs(program_id) ON DELETE RESTRICT,

  -- Applicant
  full_name         VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone             VARCHAR(50),
  country           VARCHAR(100) NOT NULL,
  trading_experience VARCHAR(50),                       -- 'beginner', 'intermediate', 'advanced', 'professional'
  trading_style     VARCHAR(100),                       -- 'scalper', 'day_trader', 'swing', 'position'
  commodities_interest TEXT[],                          -- ['gold', 'coffee', 'crude_oil']
  bio               TEXT,

  -- Application State
  status            challenge_application_status NOT NULL DEFAULT 'submitted',

  -- Payment
  eval_fee_amount   NUMERIC(10,2),
  eval_fee_currency CHAR(3) DEFAULT 'USD',
  payment_method    VARCHAR(50),                        -- 'stripe', 'wire', 'xrpl', 'stellar'
  payment_reference VARCHAR(255),
  payment_received_at TIMESTAMPTZ,

  -- Resulting Account
  account_id        UUID REFERENCES prop_accounts(account_id) ON DELETE SET NULL,

  -- Tracking
  ip_address        VARCHAR(45),
  referral_code     VARCHAR(50),
  utm_source        VARCHAR(100),
  utm_campaign      VARCHAR(100),

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_app_program ON prop_challenge_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_challenge_app_status ON prop_challenge_applications(status);
CREATE INDEX IF NOT EXISTS idx_challenge_app_email ON prop_challenge_applications(email);

-- ============================================================
-- TABLE: prop_daily_snapshots
-- End-of-day risk snapshot for every active account
-- Used for daily loss tracking and historical performance
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_daily_snapshots (
  snapshot_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id) ON DELETE CASCADE,
  snapshot_date     DATE NOT NULL,

  -- Balances
  opening_balance   NUMERIC(18,2) NOT NULL,
  closing_balance   NUMERIC(18,2) NOT NULL,
  high_balance      NUMERIC(18,2),
  low_balance       NUMERIC(18,2),
  peak_balance      NUMERIC(18,2) NOT NULL,

  -- Daily Metrics
  daily_pnl         NUMERIC(18,2) NOT NULL DEFAULT 0,
  daily_pnl_pct     NUMERIC(8,4),
  daily_drawdown_pct NUMERIC(8,4),
  trades_opened     INTEGER DEFAULT 0,
  trades_closed     INTEGER DEFAULT 0,
  winning_trades    INTEGER DEFAULT 0,
  losing_trades     INTEGER DEFAULT 0,

  -- Risk
  max_drawdown_pct  NUMERIC(8,4),                       -- max intraday drawdown
  open_positions    INTEGER DEFAULT 0,
  locked_out        BOOLEAN DEFAULT FALSE,              -- was the account locked this day?

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (account_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_account_date ON prop_daily_snapshots(account_id, snapshot_date DESC);

-- ============================================================
-- TABLE: prop_performance_metrics
-- Pre-calculated performance analytics per account
-- Updated periodically by the prop-sharing agent
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_performance_metrics (
  metrics_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL UNIQUE REFERENCES prop_accounts(account_id) ON DELETE CASCADE,

  -- Core Metrics
  sharpe_ratio      NUMERIC(8,4),
  sortino_ratio     NUMERIC(8,4),
  calmar_ratio      NUMERIC(8,4),
  max_drawdown_pct  NUMERIC(8,4),
  max_drawdown_amount NUMERIC(18,2),
  max_drawdown_duration_days INTEGER,

  -- Win/Loss
  win_rate          NUMERIC(8,4),
  loss_rate         NUMERIC(8,4),
  avg_win           NUMERIC(18,2),
  avg_loss          NUMERIC(18,2),
  largest_win       NUMERIC(18,2),
  largest_loss      NUMERIC(18,2),
  profit_factor     NUMERIC(8,4),                       -- gross profit / gross loss
  expectancy        NUMERIC(18,2),                      -- (win_rate * avg_win) - (loss_rate * avg_loss)
  expectancy_ratio  NUMERIC(8,4),                       -- expectancy / avg_loss

  -- Streaks
  current_streak    INTEGER DEFAULT 0,                   -- positive = wins, negative = losses
  longest_win_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,

  -- Volume
  total_trades      INTEGER DEFAULT 0,
  total_lots        NUMERIC(18,4) DEFAULT 0,
  avg_hold_time_hours NUMERIC(10,2),
  avg_trades_per_day NUMERIC(8,2),

  -- Risk-Adjusted
  risk_reward_avg   NUMERIC(8,4),
  kelly_criterion   NUMERIC(8,4),                       -- optimal position sizing

  -- Time
  calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_account ON prop_performance_metrics(account_id);

-- ============================================================
-- Add locked_out column to prop_accounts for daily lock
-- ============================================================
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS locked_out BOOLEAN DEFAULT FALSE;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS locked_out_at TIMESTAMPTZ;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS scaling_level INTEGER DEFAULT 1;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'pending';

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_prop_trader_kyc_ts
  BEFORE UPDATE ON prop_trader_kyc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_app_ts
  BEFORE UPDATE ON prop_challenge_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perf_metrics_ts
  BEFORE UPDATE ON prop_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
