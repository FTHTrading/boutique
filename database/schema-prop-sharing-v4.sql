-- ============================================================
-- FTH Prop Sharing — V4 Schema: Execution, Behavior, Treasury Guard, Funnel
-- Run AFTER schema-prop-sharing-v3.sql
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- V4.1: EXECUTION ARCHITECTURE LAYER
-- ──────────────────────────────────────────────────────────────

-- Order types for simulated execution
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE order_status AS ENUM ('pending', 'filled', 'partial', 'rejected', 'cancelled', 'expired');
CREATE TYPE fill_type AS ENUM ('full', 'partial', 'none');
CREATE TYPE blackout_action AS ENUM ('block', 'warn', 'log_only');

-- Execution configuration: spread, slippage, fees per instrument
CREATE TABLE IF NOT EXISTS prop_execution_config (
  config_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument    VARCHAR(50) NOT NULL,           -- e.g. 'crude_oil', 'gold', 'wheat'
  session_name  VARCHAR(50) DEFAULT 'default',  -- e.g. 'us_session', 'asia_session'
  base_spread_bps   NUMERIC(8,2) NOT NULL DEFAULT 2.0,   -- basis points
  volatility_spread_mult NUMERIC(6,3) DEFAULT 1.5,       -- multiplier during high vol
  base_slippage_bps NUMERIC(8,2) NOT NULL DEFAULT 1.0,
  size_slippage_mult NUMERIC(6,3) DEFAULT 0.5,           -- extra slippage per lot above threshold
  size_threshold_lots NUMERIC(10,2) DEFAULT 10,           -- lots before size slippage kicks in
  commission_per_lot NUMERIC(10,4) DEFAULT 2.50,
  partial_fill_enabled BOOLEAN DEFAULT false,
  max_partial_pct NUMERIC(5,2) DEFAULT 100,               -- max % filled
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instrument, session_name)
);

-- Market sessions: defines trading windows per instrument
CREATE TABLE IF NOT EXISTS prop_market_sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument    VARCHAR(50) NOT NULL,
  session_name  VARCHAR(50) NOT NULL,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  open_time     TIME NOT NULL,
  close_time    TIME NOT NULL,
  timezone      VARCHAR(50) DEFAULT 'America/New_York',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Market holidays: configurable closures
CREATE TABLE IF NOT EXISTS prop_market_holidays (
  holiday_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date  DATE NOT NULL,
  instrument    VARCHAR(50),        -- NULL = all instruments
  description   VARCHAR(200),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- News blackout configuration
CREATE TABLE IF NOT EXISTS prop_news_blackouts (
  blackout_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(200) NOT NULL,
  instruments       TEXT[] DEFAULT '{}',           -- empty = all
  blackout_start    TIMESTAMPTZ NOT NULL,
  blackout_end      TIMESTAMPTZ NOT NULL,
  pre_window_mins   INT DEFAULT 2,
  post_window_mins  INT DEFAULT 2,
  action            blackout_action DEFAULT 'block',
  severity          VARCHAR(20) DEFAULT 'medium',
  is_recurring      BOOLEAN DEFAULT false,
  recurrence_rule   VARCHAR(200),                  -- e.g. 'first_friday_monthly' for NFP
  created_by        VARCHAR(200) DEFAULT 'system',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Execution trace: every simulated fill gets a trace record
CREATE TABLE IF NOT EXISTS prop_execution_traces (
  trace_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id          UUID NOT NULL REFERENCES prop_trades(trade_id),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id),
  order_type        order_type NOT NULL DEFAULT 'market',
  order_status      order_status NOT NULL DEFAULT 'filled',
  intended_price    NUMERIC(18,6) NOT NULL,
  fill_price        NUMERIC(18,6) NOT NULL,
  spread_applied    NUMERIC(12,6) DEFAULT 0,
  slippage_applied  NUMERIC(12,6) DEFAULT 0,
  commission_charged NUMERIC(10,4) DEFAULT 0,
  fill_type         fill_type DEFAULT 'full',
  fill_pct          NUMERIC(5,2) DEFAULT 100,
  quantity_requested NUMERIC(18,6) NOT NULL,
  quantity_filled   NUMERIC(18,6) NOT NULL,
  execution_latency_ms INT DEFAULT 0,
  market_session    VARCHAR(50),
  volatility_regime VARCHAR(20) DEFAULT 'normal',  -- normal, elevated, extreme
  blackout_active   BOOLEAN DEFAULT false,
  blackout_id       UUID REFERENCES prop_news_blackouts(blackout_id),
  notes             TEXT,
  executed_at       TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Daily execution summary snapshots
CREATE TABLE IF NOT EXISTS prop_execution_daily_summary (
  summary_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date      DATE NOT NULL,
  account_id        UUID REFERENCES prop_accounts(account_id),  -- NULL = firm-wide
  total_orders       INT DEFAULT 0,
  fills              INT DEFAULT 0,
  partial_fills      INT DEFAULT 0,
  rejections         INT DEFAULT 0,
  avg_spread_bps     NUMERIC(8,4) DEFAULT 0,
  avg_slippage_bps   NUMERIC(8,4) DEFAULT 0,
  total_commissions  NUMERIC(12,4) DEFAULT 0,
  blackout_violations INT DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(summary_date, account_id)
);

-- Indexes for execution
CREATE INDEX IF NOT EXISTS idx_exec_trace_trade ON prop_execution_traces(trade_id);
CREATE INDEX IF NOT EXISTS idx_exec_trace_account ON prop_execution_traces(account_id);
CREATE INDEX IF NOT EXISTS idx_exec_daily_date ON prop_execution_daily_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_blackout_active ON prop_news_blackouts(is_active, blackout_start, blackout_end);


-- ──────────────────────────────────────────────────────────────
-- V4.2: BEHAVIORAL RISK SCORING
-- ──────────────────────────────────────────────────────────────

CREATE TYPE intervention_type AS ENUM ('warning', 'restriction', 'freeze', 'phase_rollback');
CREATE TYPE intervention_status AS ENUM ('pending', 'active', 'expired', 'overridden');

-- Trader stability scores: composite scoring
CREATE TABLE IF NOT EXISTS prop_stability_scores (
  score_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id),
  overall_score     NUMERIC(5,2) NOT NULL DEFAULT 50,  -- 0-100
  discipline_score  NUMERIC(5,2) DEFAULT 50,
  consistency_score NUMERIC(5,2) DEFAULT 50,
  aggression_score  NUMERIC(5,2) DEFAULT 50,           -- higher = less aggressive = better
  rule_adherence    NUMERIC(5,2) DEFAULT 50,
  -- Component signals
  position_sizing_variance NUMERIC(8,4) DEFAULT 0,
  leverage_escalation_slope NUMERIC(8,4) DEFAULT 0,
  revenge_trade_count    INT DEFAULT 0,
  martingale_count       INT DEFAULT 0,
  overtrade_burst_count  INT DEFAULT 0,
  panic_exit_count       INT DEFAULT 0,
  rule_violation_count   INT DEFAULT 0,
  post_loss_aggression   NUMERIC(8,4) DEFAULT 0,       -- avg size increase after loss
  hold_time_cv           NUMERIC(8,4) DEFAULT 0,       -- coefficient of variation
  -- Trend
  previous_score    NUMERIC(5,2),
  score_delta       NUMERIC(5,2) DEFAULT 0,
  trend_direction   VARCHAR(10) DEFAULT 'stable',       -- improving, degrading, stable
  calculated_at     TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stability_account ON prop_stability_scores(account_id);
CREATE INDEX IF NOT EXISTS idx_stability_overall ON prop_stability_scores(overall_score);

-- Stability score history (keep trend data)
CREATE TABLE IF NOT EXISTS prop_stability_history (
  history_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id),
  overall_score     NUMERIC(5,2) NOT NULL,
  discipline_score  NUMERIC(5,2),
  consistency_score NUMERIC(5,2),
  aggression_score  NUMERIC(5,2),
  rule_adherence    NUMERIC(5,2),
  snapshot_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stab_hist_account ON prop_stability_history(account_id, snapshot_at);

-- Behavioral interventions
CREATE TABLE IF NOT EXISTS prop_interventions (
  intervention_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id),
  intervention_type intervention_type NOT NULL,
  trigger_reason    TEXT NOT NULL,
  trigger_score     NUMERIC(5,2),
  trigger_signals   JSONB DEFAULT '{}',
  action_details    JSONB DEFAULT '{}',            -- e.g. {max_lots: 1, restricted_instruments: [...]}
  status            intervention_status DEFAULT 'pending',
  auto_triggered    BOOLEAN DEFAULT true,
  approved_by       VARCHAR(200),
  expires_at        TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intervention_account ON prop_interventions(account_id);
CREATE INDEX IF NOT EXISTS idx_intervention_status ON prop_interventions(status);

-- Behavior scoring config (thresholds)
CREATE TABLE IF NOT EXISTS prop_behavior_config (
  config_key        VARCHAR(100) PRIMARY KEY,
  config_value      JSONB NOT NULL,
  description       TEXT,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

INSERT INTO prop_behavior_config (config_key, config_value, description) VALUES
  ('revenge_threshold', '{"loss_count": 2, "size_increase_pct": 50, "window_minutes": 30}', 'Trigger: 50%+ size increase within 30 min after 2+ consecutive losses'),
  ('martingale_threshold', '{"consecutive_doubles": 3, "size_ratio": 1.8}', 'Trigger: 3+ consecutive size increases with 1.8x+ ratio'),
  ('overtrade_threshold', '{"max_trades_per_hour": 20, "max_trades_per_day": 50}', 'Trigger: excessive trade frequency'),
  ('panic_exit_threshold', '{"hold_under_seconds": 5, "count_window_hours": 1, "min_count": 5}', 'Trigger: 5+ trades held under 5s in 1 hour'),
  ('freeze_score_threshold', '{"score": 20, "consecutive_periods": 2}', 'Auto-freeze if score drops below 20 for 2 consecutive periods'),
  ('warning_score_threshold', '{"score": 40}', 'Issue warning when score drops below 40'),
  ('restriction_score_threshold', '{"score": 30, "max_lots": 1}', 'Restrict position size when score below 30')
ON CONFLICT (config_key) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- V4.3: TREASURY CAPITAL GUARD
-- ──────────────────────────────────────────────────────────────

CREATE TYPE throttle_status AS ENUM ('normal', 'caution', 'throttled', 'frozen');

-- Reserve policy configuration
CREATE TABLE IF NOT EXISTS prop_reserve_policy (
  policy_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(200) NOT NULL DEFAULT 'Default Reserve Policy',
  min_reserve_absolute  NUMERIC(14,2) NOT NULL DEFAULT 100000,   -- $100K hard floor
  min_reserve_pct       NUMERIC(5,2) NOT NULL DEFAULT 25,        -- 25% of funded exposure
  dynamic_buffer_enabled BOOLEAN DEFAULT true,
  volatility_lookback_days INT DEFAULT 30,
  volatility_buffer_mult NUMERIC(5,2) DEFAULT 1.5,               -- buffer = firm_vol * multiplier
  max_funded_traders     INT DEFAULT 100,
  max_total_notional     NUMERIC(16,2) DEFAULT 5000000,
  max_per_instrument     NUMERIC(16,2) DEFAULT 1000000,
  max_per_sector_pct     NUMERIC(5,2) DEFAULT 40,
  stress_gap_pct         NUMERIC(5,2) DEFAULT 10,                 -- overnight gap scenario %
  stress_correlation     NUMERIC(3,2) DEFAULT 0.85,               -- correlation spike scenario
  is_active              BOOLEAN DEFAULT true,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

INSERT INTO prop_reserve_policy (name) VALUES ('Default Reserve Policy')
ON CONFLICT DO NOTHING;

-- Throttle state: tracks current firm funding status
CREATE TABLE IF NOT EXISTS prop_throttle_state (
  state_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status            throttle_status NOT NULL DEFAULT 'normal',
  available_capital NUMERIC(14,2) DEFAULT 0,
  reserve_required  NUMERIC(14,2) DEFAULT 0,
  reserve_actual    NUMERIC(14,2) DEFAULT 0,
  reserve_pct       NUMERIC(5,2) DEFAULT 0,
  buffer_health     NUMERIC(5,2) DEFAULT 100,          -- 0-100
  funded_count      INT DEFAULT 0,
  funded_cap        INT DEFAULT 100,
  scaling_paused    BOOLEAN DEFAULT false,
  new_funding_paused BOOLEAN DEFAULT false,
  reason            TEXT,
  checked_at        TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Throttle history
CREATE TABLE IF NOT EXISTS prop_throttle_history (
  history_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_status        throttle_status,
  new_status        throttle_status NOT NULL,
  trigger_reason    TEXT,
  metrics_snapshot  JSONB DEFAULT '{}',
  changed_at        TIMESTAMPTZ DEFAULT now()
);

-- Stress test results
CREATE TABLE IF NOT EXISTS prop_stress_tests (
  test_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name     VARCHAR(200) NOT NULL,
  scenario_type     VARCHAR(50) NOT NULL,               -- 'gap', 'correlation', 'liquidity', 'combined'
  gap_pct           NUMERIC(5,2),
  correlation_shock NUMERIC(3,2),
  estimated_loss    NUMERIC(14,2) NOT NULL,
  capital_remaining NUMERIC(14,2) NOT NULL,
  survival          BOOLEAN NOT NULL,
  survival_score    NUMERIC(5,2) NOT NULL,               -- 0-100
  affected_accounts INT DEFAULT 0,
  details           JSONB DEFAULT '{}',
  run_at            TIMESTAMPTZ DEFAULT now()
);

-- Firm daily capital snapshot (extends firm exposure)
CREATE TABLE IF NOT EXISTS prop_capital_snapshots (
  snapshot_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date     DATE NOT NULL,
  total_capital     NUMERIC(14,2) NOT NULL,
  deployed_capital  NUMERIC(14,2) NOT NULL,
  reserve_capital   NUMERIC(14,2) NOT NULL,
  unrealized_pnl    NUMERIC(14,2) DEFAULT 0,
  retained_earnings NUMERIC(14,2) DEFAULT 0,
  eval_fee_revenue  NUMERIC(14,2) DEFAULT 0,
  payout_obligations NUMERIC(14,2) DEFAULT 0,
  net_position      NUMERIC(14,2) DEFAULT 0,
  firm_volatility_30d NUMERIC(8,4) DEFAULT 0,
  throttle_status   throttle_status DEFAULT 'normal',
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_capital_snap_date ON prop_capital_snapshots(snapshot_date);


-- ──────────────────────────────────────────────────────────────
-- V4.4: FUNNEL OPTIMIZATION ENGINE
-- ──────────────────────────────────────────────────────────────

-- Attribution tracking (extends applications table)
ALTER TABLE prop_applications
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(200),
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(200),
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200),
  ADD COLUMN IF NOT EXISTS utm_term VARCHAR(200),
  ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200),
  ADD COLUMN IF NOT EXISTS referrer_url TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS geo_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS geo_region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS geo_city VARCHAR(200),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cohort_id VARCHAR(50);

-- Cohort definitions
CREATE TABLE IF NOT EXISTS prop_cohorts (
  cohort_id         VARCHAR(50) PRIMARY KEY,            -- e.g. '2026-03-W1', '2026-03'
  cohort_type       VARCHAR(20) NOT NULL DEFAULT 'weekly',  -- weekly, monthly, campaign
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  total_applicants  INT DEFAULT 0,
  total_paid        INT DEFAULT 0,
  total_started     INT DEFAULT 0,
  total_passed      INT DEFAULT 0,
  total_funded      INT DEFAULT 0,
  total_fraud_flagged INT DEFAULT 0,
  avg_time_to_pass_days NUMERIC(6,2) DEFAULT 0,
  total_eval_revenue NUMERIC(12,2) DEFAULT 0,
  total_payouts     NUMERIC(12,2) DEFAULT 0,
  net_revenue       NUMERIC(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Channel quality scores
CREATE TABLE IF NOT EXISTS prop_channel_quality (
  channel_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_source        VARCHAR(200) NOT NULL,
  utm_medium        VARCHAR(200),
  utm_campaign      VARCHAR(200),
  -- Volume
  total_applications INT DEFAULT 0,
  total_paid        INT DEFAULT 0,
  total_passed      INT DEFAULT 0,
  total_funded      INT DEFAULT 0,
  total_fraud       INT DEFAULT 0,
  -- Rates
  pay_rate          NUMERIC(5,2) DEFAULT 0,         -- paid / applied %
  pass_rate         NUMERIC(5,2) DEFAULT 0,         -- passed / started %
  fund_rate         NUMERIC(5,2) DEFAULT 0,         -- funded / passed %
  fraud_rate        NUMERIC(5,2) DEFAULT 0,         -- fraud / funded %
  -- Quality
  quality_score     NUMERIC(5,2) DEFAULT 50,        -- 0-100 composite
  ltv_proxy         NUMERIC(12,2) DEFAULT 0,        -- avg payout per funded from channel
  avg_funded_days   NUMERIC(8,2) DEFAULT 0,
  avg_time_to_pass  NUMERIC(8,2) DEFAULT 0,
  -- Control
  is_suppressed     BOOLEAN DEFAULT false,
  suppress_reason   TEXT,
  -- Geo breakdown
  top_countries     JSONB DEFAULT '[]',
  calculated_at     TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(utm_source, utm_medium, utm_campaign)
);

-- Auto-suppress rules
CREATE TABLE IF NOT EXISTS prop_channel_suppress_rules (
  rule_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(200) NOT NULL,
  condition_field   VARCHAR(50) NOT NULL,      -- 'fraud_rate', 'pass_rate', 'quality_score'
  condition_op      VARCHAR(10) NOT NULL,      -- 'gt', 'lt', 'gte', 'lte'
  condition_value   NUMERIC(10,2) NOT NULL,
  min_sample_size   INT DEFAULT 20,            -- don't trigger until N applications
  auto_suppress     BOOLEAN DEFAULT true,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

INSERT INTO prop_channel_suppress_rules (name, condition_field, condition_op, condition_value, min_sample_size) VALUES
  ('High Fraud Rate', 'fraud_rate', 'gt', 15, 20),
  ('Very Low Quality', 'quality_score', 'lt', 20, 30),
  ('Zero Conversion', 'pass_rate', 'lt', 1, 50)
ON CONFLICT DO NOTHING;

-- Funnel snapshots (daily aggregate)
CREATE TABLE IF NOT EXISTS prop_funnel_snapshots (
  snapshot_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date     DATE NOT NULL,
  utm_source        VARCHAR(200),
  utm_medium        VARCHAR(200),
  geo_country       VARCHAR(100),
  applications      INT DEFAULT 0,
  payments          INT DEFAULT 0,
  starts            INT DEFAULT 0,
  passes            INT DEFAULT 0,
  funded            INT DEFAULT 0,
  fraud_flags       INT DEFAULT 0,
  revenue           NUMERIC(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(snapshot_date, utm_source, utm_medium, geo_country)
);

CREATE INDEX IF NOT EXISTS idx_funnel_snap_date ON prop_funnel_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_channel_quality_source ON prop_channel_quality(utm_source);


-- ──────────────────────────────────────────────────────────────
-- CROSS-CUTTING: Kill Switches
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_kill_switches (
  switch_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope             VARCHAR(50) NOT NULL,              -- 'trader', 'instrument', 'firm'
  target_id         VARCHAR(200),                      -- account_id, instrument name, or NULL for firm
  is_active         BOOLEAN DEFAULT false,
  reason            TEXT,
  activated_by      VARCHAR(200),
  activated_at      TIMESTAMPTZ,
  deactivated_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kill_switch_active ON prop_kill_switches(is_active, scope);


-- ──────────────────────────────────────────────────────────────
-- VIEWS
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_throttle_current AS
SELECT * FROM prop_throttle_state ORDER BY checked_at DESC LIMIT 1;

CREATE OR REPLACE VIEW v_active_interventions AS
SELECT i.*, a.account_number, a.trader_name, a.trader_email
FROM prop_interventions i
JOIN prop_accounts a ON a.account_id = i.account_id
WHERE i.status IN ('pending', 'active')
ORDER BY i.created_at DESC;

CREATE OR REPLACE VIEW v_channel_leaderboard AS
SELECT * FROM prop_channel_quality
WHERE total_applications >= 10
ORDER BY quality_score DESC;

CREATE OR REPLACE VIEW v_active_kill_switches AS
SELECT * FROM prop_kill_switches WHERE is_active = true ORDER BY activated_at DESC;
