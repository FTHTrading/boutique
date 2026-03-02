-- ============================================================
-- Prop Sharing V3: Firm Risk, Fraud Detection, Dynamic Scaling
-- Run AFTER schema-prop-sharing.sql AND schema-prop-sharing-v2.sql
-- ============================================================

-- ── New Enums ─────────────────────────────────────────────────

CREATE TYPE fraud_alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE fraud_alert_status   AS ENUM ('open', 'investigating', 'confirmed', 'dismissed', 'resolved');
CREATE TYPE fraud_alert_type     AS ENUM (
  'latency_arbitrage',
  'overfit_scalping',
  'copy_trade_cluster',
  'statistical_anomaly',
  'wash_trading',
  'news_straddling',
  'overnight_gap_exploit',
  'manual_flag'
);
CREATE TYPE scaling_direction    AS ENUM ('scale_up', 'scale_down', 'hold');

-- ── Firm-Wide Risk Configuration ──────────────────────────────

CREATE TABLE IF NOT EXISTS prop_firm_risk_config (
  config_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key        TEXT NOT NULL UNIQUE,
  config_value      JSONB NOT NULL,
  description       TEXT,
  updated_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Seed default firm risk config
INSERT INTO prop_firm_risk_config (config_key, config_value, description) VALUES
  ('max_total_exposure',       '{"amount": 5000000, "currency": "USD"}'::jsonb,   'Maximum total capital deployed across all funded accounts'),
  ('max_single_account',       '{"amount": 500000, "currency": "USD"}'::jsonb,    'Maximum capital for any single funded account'),
  ('max_sector_concentration', '{"pct": 40}'::jsonb,                               'Max % of total exposure in any one commodity sector'),
  ('max_correlated_positions', '{"count": 5, "correlation_threshold": 0.85}'::jsonb, 'Max simultaneous positions with correlation > threshold'),
  ('max_concurrent_funded',    '{"count": 100}'::jsonb,                            'Maximum number of concurrently funded accounts'),
  ('daily_firm_loss_limit',    '{"pct": 3}'::jsonb,                                'Max daily firm-wide loss as % of total deployed capital'),
  ('margin_reserve_pct',       '{"pct": 20}'::jsonb,                               'Capital reserved as margin buffer, not deployable')
ON CONFLICT (config_key) DO NOTHING;

-- ── Firm Exposure Snapshots ───────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_firm_exposure (
  snapshot_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time      TIMESTAMPTZ DEFAULT now(),

  -- Aggregate numbers
  total_funded_accounts   INT NOT NULL DEFAULT 0,
  total_capital_deployed  NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_unrealized_pnl    NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_realized_pnl      NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_exposure            NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Utilization
  capital_utilization_pct NUMERIC(5,2),
  margin_reserve          NUMERIC(15,2),

  -- Risk flags
  breach_flags            JSONB DEFAULT '[]'::jsonb,
  is_within_limits        BOOLEAN NOT NULL DEFAULT TRUE,

  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_firm_exposure_time ON prop_firm_exposure (snapshot_time DESC);

-- ── Sector / Commodity Exposure Tracking ──────────────────────

CREATE TABLE IF NOT EXISTS prop_sector_exposure (
  exposure_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id    UUID REFERENCES prop_firm_exposure(snapshot_id) ON DELETE CASCADE,
  sector         TEXT NOT NULL,                -- e.g. 'energy', 'metals', 'agriculture'
  commodity      TEXT,                         -- e.g. 'gold', 'crude_oil', 'wheat'
  long_exposure  NUMERIC(15,2) DEFAULT 0,
  short_exposure NUMERIC(15,2) DEFAULT 0,
  net_exposure   NUMERIC(15,2) DEFAULT 0,
  num_accounts   INT DEFAULT 0,
  pct_of_total   NUMERIC(5,2),
  breach         BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sector_exposure_snapshot ON prop_sector_exposure (snapshot_id);
CREATE INDEX idx_sector_exposure_sector   ON prop_sector_exposure (sector);

-- ── Correlation Alerts ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_correlation_alerts (
  alert_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_ids     UUID[] NOT NULL,             -- Array of correlated accounts
  commodity       TEXT NOT NULL,
  direction       TEXT NOT NULL,               -- 'long' or 'short'
  correlation     NUMERIC(4,3),                -- 0.000 to 1.000
  combined_exposure NUMERIC(15,2),
  num_accounts    INT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_correlation_active ON prop_correlation_alerts (is_active) WHERE is_active = TRUE;

-- ── Fraud / Gaming Detection ──────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_fraud_alerts (
  alert_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL REFERENCES prop_accounts(account_id),
  alert_type       fraud_alert_type NOT NULL,
  severity         fraud_alert_severity NOT NULL DEFAULT 'medium',
  status           fraud_alert_status NOT NULL DEFAULT 'open',
  title            TEXT NOT NULL,
  description      TEXT,

  -- Evidence
  evidence         JSONB NOT NULL DEFAULT '{}'::jsonb,
  flagged_trades   UUID[] DEFAULT '{}',
  detection_score  NUMERIC(5,3),               -- 0.000 to 1.000 confidence score

  -- Resolution
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  resolution_notes TEXT,
  action_taken     TEXT,                       -- e.g. 'account_suspended', 'warning_issued', 'cleared'

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fraud_account   ON prop_fraud_alerts (account_id);
CREATE INDEX idx_fraud_status    ON prop_fraud_alerts (status);
CREATE INDEX idx_fraud_severity  ON prop_fraud_alerts (severity);
CREATE INDEX idx_fraud_type      ON prop_fraud_alerts (alert_type);

-- ── Trader Behavior Profiles ──────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_trader_behavior (
  profile_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL UNIQUE REFERENCES prop_accounts(account_id),

  -- Timing patterns
  avg_hold_seconds        NUMERIC(12,2),
  median_hold_seconds     NUMERIC(12,2),
  min_hold_seconds        NUMERIC(12,2),
  pct_under_60s           NUMERIC(5,2),        -- % of trades held < 60 seconds
  pct_under_10s           NUMERIC(5,2),        -- % of trades held < 10 seconds

  -- Entry precision
  avg_entry_slippage_pct  NUMERIC(6,4),
  avg_exit_slippage_pct   NUMERIC(6,4),
  avg_mfe_pct             NUMERIC(6,4),        -- max favorable excursion
  avg_mae_pct             NUMERIC(6,4),        -- max adverse excursion

  -- Session patterns
  preferred_session       TEXT,                -- 'asia', 'london', 'new_york', 'mixed'
  trades_around_news      INT DEFAULT 0,       -- trades within 5 min of major news
  pct_trades_around_news  NUMERIC(5,2),

  -- Volume patterns
  avg_lot_size            NUMERIC(10,4),
  lot_size_stddev         NUMERIC(10,4),
  max_concurrent_positions INT,

  -- Similarity to other traders (copy-trade detection)
  most_similar_account_id UUID,
  similarity_score        NUMERIC(5,3),        -- 0.000 to 1.000

  calculated_at           TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_behavior_account ON prop_trader_behavior (account_id);

-- ── Dynamic Scaling Rules ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_scaling_rules (
  rule_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  priority         INT DEFAULT 0,

  -- Thresholds for scale-up
  min_sharpe_ratio         NUMERIC(5,2) DEFAULT 1.0,
  min_profit_factor        NUMERIC(5,2) DEFAULT 1.5,
  max_drawdown_pct         NUMERIC(5,2) DEFAULT 5.0,
  min_trading_days         INT DEFAULT 30,
  min_consistency_score    NUMERIC(5,2) DEFAULT 0.6,
  min_trades               INT DEFAULT 50,

  -- Scaling amounts
  scale_up_pct             NUMERIC(5,2) DEFAULT 25.0,    -- Increase capital by this %
  scale_down_pct           NUMERIC(5,2) DEFAULT 25.0,    -- Decrease capital by this %
  max_scale_level          INT DEFAULT 5,                  -- Maximum scaling tiers

  -- Cooldown
  cooldown_days            INT DEFAULT 30,     -- Days between scaling events

  -- Volatility guard
  volatility_lookback_days INT DEFAULT 14,
  max_volatility_pct       NUMERIC(5,2) DEFAULT 3.0,     -- Pause scaling if vol > this

  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- Seed a default scaling rule
INSERT INTO prop_scaling_rules (name, is_active, priority) VALUES
  ('Standard Growth Path', TRUE, 1)
ON CONFLICT DO NOTHING;

-- ── Scaling History ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_scaling_history (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES prop_accounts(account_id),
  rule_id           UUID REFERENCES prop_scaling_rules(rule_id),
  direction         scaling_direction NOT NULL,
  previous_level    INT NOT NULL DEFAULT 0,
  new_level         INT NOT NULL,
  previous_capital  NUMERIC(15,2) NOT NULL,
  new_capital       NUMERIC(15,2) NOT NULL,
  reason            TEXT NOT NULL,

  -- Snapshot of metrics at time of scaling
  metrics_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,

  approved_by       TEXT,
  auto_approved     BOOLEAN DEFAULT TRUE,

  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scaling_account ON prop_scaling_history (account_id);
CREATE INDEX idx_scaling_time    ON prop_scaling_history (created_at DESC);

-- ── ALTER prop_accounts for scaling fields ────────────────────

ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS scaling_eligible   BOOLEAN DEFAULT FALSE;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS last_scaling_event TIMESTAMPTZ;
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS consistency_score  NUMERIC(5,2);
ALTER TABLE prop_accounts ADD COLUMN IF NOT EXISTS volatility_30d    NUMERIC(5,2);

-- ── Useful Views ──────────────────────────────────────────────

-- Firm-wide exposure summary (latest snapshot)
CREATE OR REPLACE VIEW v_firm_exposure_latest AS
SELECT * FROM prop_firm_exposure
ORDER BY snapshot_time DESC
LIMIT 1;

-- Active fraud alerts requiring attention
CREATE OR REPLACE VIEW v_active_fraud_alerts AS
SELECT
  fa.*,
  a.account_number,
  a.trader_name,
  a.trader_email,
  p.name as program_name
FROM prop_fraud_alerts fa
JOIN prop_accounts a ON a.account_id = fa.account_id
JOIN prop_programs p ON p.program_id = a.program_id
WHERE fa.status IN ('open', 'investigating')
ORDER BY
  CASE fa.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  fa.created_at DESC;

-- Scaling eligible accounts
CREATE OR REPLACE VIEW v_scaling_candidates AS
SELECT
  a.account_id,
  a.account_number,
  a.trader_name,
  a.current_balance,
  a.starting_balance,
  a.scaling_level,
  a.consistency_score,
  a.volatility_30d,
  pm.sharpe_ratio,
  pm.sortino_ratio,
  pm.profit_factor,
  pm.max_drawdown_pct,
  pm.win_rate,
  pm.total_trades
FROM prop_accounts a
LEFT JOIN prop_performance_metrics pm ON pm.account_id = a.account_id
WHERE a.current_phase = 'funded'
  AND a.status = 'active'
  AND a.scaling_eligible = TRUE
ORDER BY pm.sharpe_ratio DESC NULLS LAST;
