-- ============================================================
-- Prop Sharing Layer Schema
-- FTH Trading / Boutique Platform
-- ============================================================
-- Proprietary Trading + Profit Sharing Programs
-- Funded commodity trader accounts with evaluation phases,
-- risk management rules, and profit-split payouts.
--
-- Run after schema-team.sql:
--   psql $DATABASE_URL -f database/schema-prop-sharing.sql
-- ============================================================

-- Enums
CREATE TYPE prop_program_status AS ENUM ('active', 'paused', 'archived');

CREATE TYPE prop_account_phase AS ENUM (
  'evaluation',       -- trader is being evaluated (paper / sim)
  'verification',     -- passed eval, under review
  'funded',           -- live funded account
  'suspended',        -- breached a rule, under review
  'terminated'        -- permanently closed
);

CREATE TYPE prop_payout_status AS ENUM (
  'pending',          -- calculated but not yet approved
  'approved',         -- approved for payment
  'processing',       -- payment in progress
  'paid',             -- funds disbursed
  'disputed',         -- trader disputes amount
  'cancelled'         -- voided
);

CREATE TYPE prop_trade_side AS ENUM ('long', 'short');
CREATE TYPE prop_trade_status AS ENUM ('open', 'closed', 'cancelled');

-- ============================================================
-- TABLE 1: prop_programs
-- Each program defines a funding tier with rules & profit split
-- e.g. "Gold Trader $50K", "Coffee Specialist $100K"
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_programs (
  program_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) UNIQUE NOT NULL,       -- 'gold-trader-50k'
  description       TEXT,
  commodity_focus    TEXT[],                             -- ['gold', 'coffee'] or NULL for all
  status            prop_program_status NOT NULL DEFAULT 'active',

  -- Funding
  funded_capital    NUMERIC(18,2) NOT NULL,              -- e.g. 50000.00
  currency          CHAR(3) NOT NULL DEFAULT 'USD',

  -- Evaluation Rules
  eval_duration_days    INTEGER NOT NULL DEFAULT 30,     -- calendar days to pass eval
  eval_profit_target    NUMERIC(5,2) NOT NULL DEFAULT 8.00,   -- % gain required
  eval_max_drawdown     NUMERIC(5,2) NOT NULL DEFAULT 5.00,   -- % max drawdown allowed
  eval_daily_loss_limit NUMERIC(5,2) NOT NULL DEFAULT 2.00,   -- % max daily loss
  eval_min_trading_days INTEGER NOT NULL DEFAULT 10,     -- minimum active trading days
  eval_fee              NUMERIC(10,2) DEFAULT 0.00,      -- one-time evaluation fee

  -- Funded Account Rules
  max_drawdown          NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- % max drawdown on funded
  daily_loss_limit      NUMERIC(5,2) NOT NULL DEFAULT 3.00,   -- % daily loss limit
  max_position_size     NUMERIC(5,2) DEFAULT 20.00,           -- % of capital per position
  max_open_positions    INTEGER DEFAULT 5,
  leverage_limit        NUMERIC(5,2) DEFAULT 1.00,            -- 1.0 = no leverage
  scaling_plan          JSONB,                                 -- e.g. { "25%_profit": "2x_capital" }

  -- Profit Split
  trader_profit_pct     NUMERIC(5,2) NOT NULL DEFAULT 80.00,  -- trader keeps 80%
  firm_profit_pct       NUMERIC(5,2) NOT NULL DEFAULT 20.00,  -- firm keeps 20%
  payout_frequency      VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly'
  min_payout_amount     NUMERIC(10,2) DEFAULT 100.00,
  first_payout_delay    INTEGER DEFAULT 30,                    -- days after funding before first payout

  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_programs_status ON prop_programs(status);
CREATE INDEX IF NOT EXISTS idx_prop_programs_slug ON prop_programs(slug);

-- ============================================================
-- TABLE 2: prop_accounts
-- A trader's funded (or evaluating) account within a program
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_accounts (
  account_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number    VARCHAR(50) UNIQUE NOT NULL,         -- 'PROP-2026-0001'
  program_id        UUID NOT NULL REFERENCES prop_programs(program_id) ON DELETE RESTRICT,
  member_id         UUID REFERENCES team_members(member_id) ON DELETE SET NULL,

  -- Trader Info
  trader_name       VARCHAR(255) NOT NULL,
  trader_email      VARCHAR(255) NOT NULL,
  trader_country    VARCHAR(100),
  trader_experience VARCHAR(50),                         -- 'beginner', 'intermediate', 'advanced', 'professional'

  -- Account State
  phase             prop_account_phase NOT NULL DEFAULT 'evaluation',
  starting_capital  NUMERIC(18,2) NOT NULL,
  current_balance   NUMERIC(18,2) NOT NULL,
  peak_balance      NUMERIC(18,2) NOT NULL,              -- high-water mark
  current_drawdown  NUMERIC(5,2) DEFAULT 0.00,           -- % from peak
  daily_pnl         NUMERIC(18,2) DEFAULT 0.00,          -- today's P&L
  total_pnl         NUMERIC(18,2) DEFAULT 0.00,          -- lifetime P&L
  total_trades      INTEGER DEFAULT 0,
  winning_trades    INTEGER DEFAULT 0,
  losing_trades     INTEGER DEFAULT 0,
  active_trading_days INTEGER DEFAULT 0,

  -- Evaluation Tracking
  eval_started_at   TIMESTAMPTZ,
  eval_deadline     TIMESTAMPTZ,
  eval_passed       BOOLEAN,
  eval_passed_at    TIMESTAMPTZ,

  -- Funded Tracking
  funded_at         TIMESTAMPTZ,
  last_payout_at    TIMESTAMPTZ,
  total_payouts     NUMERIC(18,2) DEFAULT 0.00,

  -- Risk Flags
  risk_score        INTEGER DEFAULT 0,                   -- 0 = clean, 100 = max risk
  risk_flags        JSONB DEFAULT '[]'::jsonb,           -- array of { rule, timestamp, detail }
  suspended_at      TIMESTAMPTZ,
  suspension_reason TEXT,
  terminated_at     TIMESTAMPTZ,
  termination_reason TEXT,

  -- Metadata
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_accounts_program ON prop_accounts(program_id);
CREATE INDEX IF NOT EXISTS idx_prop_accounts_member ON prop_accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_prop_accounts_phase ON prop_accounts(phase);
CREATE INDEX IF NOT EXISTS idx_prop_accounts_email ON prop_accounts(trader_email);

-- ============================================================
-- TABLE 3: prop_trades
-- Individual trades within a prop account
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_trades (
  trade_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id) ON DELETE CASCADE,

  -- Trade Details
  trade_number      VARCHAR(50) UNIQUE NOT NULL,         -- 'PT-2026-00001'
  commodity         VARCHAR(100) NOT NULL,               -- 'gold', 'coffee', 'crude_oil'
  side              prop_trade_side NOT NULL,
  quantity          NUMERIC(18,4) NOT NULL,
  quantity_unit     VARCHAR(20) DEFAULT 'lots',
  entry_price       NUMERIC(18,6) NOT NULL,
  exit_price        NUMERIC(18,6),
  stop_loss         NUMERIC(18,6),
  take_profit       NUMERIC(18,6),

  -- P&L
  pnl               NUMERIC(18,2),                       -- realized P&L
  pnl_pct           NUMERIC(8,4),                        -- % return on position
  fees              NUMERIC(10,2) DEFAULT 0.00,          -- commission + swap

  -- Status
  status            prop_trade_status NOT NULL DEFAULT 'open',
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,

  -- Risk Context
  position_size_pct NUMERIC(5,2),                        -- % of account capital
  risk_reward_ratio NUMERIC(5,2),                        -- R:R at entry

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_trades_account ON prop_trades(account_id);
CREATE INDEX IF NOT EXISTS idx_prop_trades_commodity ON prop_trades(commodity);
CREATE INDEX IF NOT EXISTS idx_prop_trades_status ON prop_trades(status);
CREATE INDEX IF NOT EXISTS idx_prop_trades_opened ON prop_trades(opened_at DESC);

-- ============================================================
-- TABLE 4: prop_payouts
-- Profit-share payout records
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_payouts (
  payout_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id) ON DELETE CASCADE,
  program_id        UUID NOT NULL REFERENCES prop_programs(program_id) ON DELETE RESTRICT,

  -- Period
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  period_label      VARCHAR(20),                         -- '2026-03'

  -- Financials
  gross_profit      NUMERIC(18,2) NOT NULL,              -- total profit in period
  trader_share_pct  NUMERIC(5,2) NOT NULL,               -- e.g. 80.00
  trader_payout     NUMERIC(18,2) NOT NULL,              -- trader receives
  firm_share        NUMERIC(18,2) NOT NULL,              -- firm retains
  fees_deducted     NUMERIC(10,2) DEFAULT 0.00,

  -- Status
  status            prop_payout_status NOT NULL DEFAULT 'pending',
  approved_by       VARCHAR(255),
  approved_at       TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  payment_method    VARCHAR(50),                         -- 'wire', 'xrpl', 'stellar', 'crypto'
  payment_reference VARCHAR(255),

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_payouts_account ON prop_payouts(account_id);
CREATE INDEX IF NOT EXISTS idx_prop_payouts_status ON prop_payouts(status);
CREATE INDEX IF NOT EXISTS idx_prop_payouts_period ON prop_payouts(period_label);

-- ============================================================
-- TABLE 5: prop_risk_events
-- Logged whenever a risk rule is triggered
-- ============================================================
CREATE TABLE IF NOT EXISTS prop_risk_events (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id) ON DELETE CASCADE,
  trade_id          UUID REFERENCES prop_trades(trade_id) ON DELETE SET NULL,

  -- Event
  rule_violated     VARCHAR(100) NOT NULL,               -- 'max_drawdown', 'daily_loss_limit', 'max_position_size'
  severity          VARCHAR(20) NOT NULL DEFAULT 'warning', -- 'warning', 'breach', 'critical'
  description       TEXT NOT NULL,
  threshold_value   NUMERIC(18,4),                       -- the limit
  actual_value      NUMERIC(18,4),                       -- what was recorded

  -- Resolution
  resolved          BOOLEAN DEFAULT FALSE,
  resolved_by       VARCHAR(255),
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT,
  action_taken      VARCHAR(50),                         -- 'warning_issued', 'position_closed', 'account_suspended', 'account_terminated'

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_risk_account ON prop_risk_events(account_id);
CREATE INDEX IF NOT EXISTS idx_prop_risk_severity ON prop_risk_events(severity);
CREATE INDEX IF NOT EXISTS idx_prop_risk_resolved ON prop_risk_events(resolved);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_prop_programs_ts
  BEFORE UPDATE ON prop_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prop_accounts_ts
  BEFORE UPDATE ON prop_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prop_payouts_ts
  BEFORE UPDATE ON prop_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
