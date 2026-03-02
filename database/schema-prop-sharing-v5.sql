-- ============================================================
-- V5 Schema: Stress Simulation (D) + Capital Compounding (B)
-- V5-D: Prove every V4 reflex fires under load
-- V5-B: Autonomous retained-earnings reinvestment engine
-- ============================================================

-- ── V5-D: Stress Simulation ─────────────────────────────────

CREATE TYPE simulation_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE assertion_result AS ENUM ('pass', 'fail', 'warn', 'skip');
CREATE TYPE scenario_type AS ENUM (
  'full_lifecycle',
  'treasury_throttle',
  'behavior_seams',
  'funnel_suppression',
  'execution_blackout',
  'enforcement_verify',
  'custom'
);

-- Master simulation run
CREATE TABLE IF NOT EXISTS simulation_runs (
  run_id          SERIAL PRIMARY KEY,
  scenario        scenario_type NOT NULL,
  scenario_name   TEXT NOT NULL,
  status          simulation_status NOT NULL DEFAULT 'pending',
  seed            INTEGER DEFAULT 42,
  config          JSONB NOT NULL DEFAULT '{}',
  
  -- Results
  total_events    INTEGER DEFAULT 0,
  total_assertions INTEGER DEFAULT 0,
  passed          INTEGER DEFAULT 0,
  failed          INTEGER DEFAULT 0,
  warnings        INTEGER DEFAULT 0,
  
  -- Readiness output
  enforcement_score    NUMERIC(5,2),
  trace_integrity_score NUMERIC(5,2),
  behavior_seam_score  NUMERIC(5,2),
  funnel_cliff_score   NUMERIC(5,2),
  compounding_readiness NUMERIC(5,2),
  
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual events in a simulation timeline
CREATE TABLE IF NOT EXISTS simulation_events (
  event_id        SERIAL PRIMARY KEY,
  run_id          INTEGER NOT NULL REFERENCES simulation_runs(run_id) ON DELETE CASCADE,
  sequence_num    INTEGER NOT NULL,
  event_type      TEXT NOT NULL, -- 'application_created', 'fraud_scan', 'trade_executed', etc.
  description     TEXT NOT NULL,
  
  -- State tracking
  input_state     JSONB, -- snapshot before
  output_state    JSONB, -- snapshot after
  entity_type     TEXT,  -- 'account', 'application', 'trade', 'treasury'
  entity_id       TEXT,
  
  -- Audit linkage
  audit_log_id    TEXT,
  execution_trace_id TEXT,
  
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assertions: expected vs actual
CREATE TABLE IF NOT EXISTS simulation_assertions (
  assertion_id    SERIAL PRIMARY KEY,
  run_id          INTEGER NOT NULL REFERENCES simulation_runs(run_id) ON DELETE CASCADE,
  event_id        INTEGER REFERENCES simulation_events(event_id) ON DELETE SET NULL,
  category        TEXT NOT NULL, -- 'treasury_gate', 'behavior_trigger', 'execution_trace', etc.
  assertion_name  TEXT NOT NULL,
  description     TEXT,
  
  expected_value  TEXT,
  actual_value    TEXT,
  result          assertion_result NOT NULL DEFAULT 'skip',
  
  -- For numeric comparisons
  tolerance       NUMERIC(10,4),
  deviation       NUMERIC(10,4),
  
  severity        TEXT DEFAULT 'critical', -- 'critical', 'major', 'minor'
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sim_events_run ON simulation_events(run_id, sequence_num);
CREATE INDEX idx_sim_assertions_run ON simulation_assertions(run_id, result);
CREATE INDEX idx_sim_runs_status ON simulation_runs(status, created_at DESC);


-- ── V5-B: Capital Compounding Engine ────────────────────────

CREATE TYPE compounding_policy_status AS ENUM ('active', 'paused', 'draft', 'retired');
CREATE TYPE compounding_action_type AS ENUM (
  'allocate_to_vertical',
  'adjust_capacity',
  'adjust_marketing_cap',
  'propose_dividend',
  'lock_compounding'
);
CREATE TYPE compounding_run_mode AS ENUM ('dry_run', 'execute', 'proposed');

-- Declarative policy rules
CREATE TABLE IF NOT EXISTS compounding_policies (
  policy_id       SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  status          compounding_policy_status NOT NULL DEFAULT 'draft',
  priority        INTEGER NOT NULL DEFAULT 100,
  
  -- Conditions (all must be true)
  min_retained_earnings    NUMERIC(14,2),
  min_buffer_health        INTEGER,               -- 0-100
  min_buffer_days          INTEGER DEFAULT 30,     -- consecutive days at min_buffer_health
  min_channel_quality      NUMERIC(5,2),
  min_channel_quality_days INTEGER DEFAULT 90,
  min_cohort_survival      NUMERIC(5,2),
  max_fraud_rate           NUMERIC(5,2),
  min_readiness_score      NUMERIC(5,2) DEFAULT 80,
  
  -- Action to take
  action_type     compounding_action_type NOT NULL,
  action_params   JSONB NOT NULL DEFAULT '{}',
  -- e.g. { "vertical": "deals", "amount_pct": 10, "amount_abs": 50000 }
  -- e.g. { "capacity_increase": 5 }
  -- e.g. { "marketing_cap_increase_pct": 15 }
  -- e.g. { "dividend_pct": 20 }
  
  -- Safety
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  max_executions_per_quarter INTEGER DEFAULT 1,
  cooldown_days   INTEGER DEFAULT 30,
  
  last_evaluated  TIMESTAMPTZ,
  last_executed   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each evaluation/execution run
CREATE TABLE IF NOT EXISTS compounding_runs (
  run_id          SERIAL PRIMARY KEY,
  mode            compounding_run_mode NOT NULL DEFAULT 'dry_run',
  
  -- Input snapshots
  retained_earnings       NUMERIC(14,2),
  buffer_health           INTEGER,
  buffer_consecutive_days INTEGER,
  avg_channel_quality     NUMERIC(5,2),
  avg_cohort_survival     NUMERIC(5,2),
  fraud_rate              NUMERIC(5,2),
  readiness_score         NUMERIC(5,2),
  treasury_status         TEXT,
  
  -- Results
  policies_evaluated      INTEGER DEFAULT 0,
  policies_eligible       INTEGER DEFAULT 0,
  actions_proposed        INTEGER DEFAULT 0,
  actions_executed        INTEGER DEFAULT 0,
  actions_blocked         INTEGER DEFAULT 0,
  
  blocked_reason          TEXT,
  
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual compounding actions (proposed or executed)
CREATE TABLE IF NOT EXISTS compounding_actions (
  action_id       SERIAL PRIMARY KEY,
  run_id          INTEGER NOT NULL REFERENCES compounding_runs(run_id) ON DELETE CASCADE,
  policy_id       INTEGER NOT NULL REFERENCES compounding_policies(policy_id),
  action_type     compounding_action_type NOT NULL,
  
  -- What would/did happen
  action_params   JSONB NOT NULL DEFAULT '{}',
  amount          NUMERIC(14,2),
  target_vertical TEXT,
  
  -- Execution state
  mode            compounding_run_mode NOT NULL DEFAULT 'dry_run',
  executed        BOOLEAN NOT NULL DEFAULT false,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  blocked         BOOLEAN NOT NULL DEFAULT false,
  blocked_reason  TEXT,
  
  -- Proof
  input_snapshot  JSONB,
  treasury_entry_id TEXT,
  audit_log_id    TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allocation tracking across verticals
CREATE TABLE IF NOT EXISTS vertical_allocations (
  allocation_id   SERIAL PRIMARY KEY,
  vertical        TEXT NOT NULL, -- 'deals', 'contacts', 'commissions', 'compliance', 'funding', 'settlement'
  amount          NUMERIC(14,2) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'prop_retained_earnings',
  
  action_id       INTEGER REFERENCES compounding_actions(action_id),
  policy_id       INTEGER REFERENCES compounding_policies(policy_id),
  
  -- Ledger linkage
  treasury_entry_id TEXT,
  
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'allocated', 'deployed', 'returned'
  deployed_at     TIMESTAMPTZ,
  
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comp_policies_status ON compounding_policies(status, priority);
CREATE INDEX idx_comp_runs_mode ON compounding_runs(mode, created_at DESC);
CREATE INDEX idx_comp_actions_run ON compounding_actions(run_id, executed);
CREATE INDEX idx_vert_alloc_vertical ON vertical_allocations(vertical, status);

-- Seed default compounding policies
INSERT INTO compounding_policies (name, description, status, priority, min_retained_earnings, min_buffer_health, min_buffer_days, action_type, action_params, requires_approval, max_executions_per_quarter, cooldown_days) VALUES
  ('Capacity Growth',
   'Increase max funded traders when reserve buffer is consistently healthy',
   'draft', 10, 50000, 90, 30,
   'adjust_capacity', '{"capacity_increase": 5}',
   false, 1, 60),
  ('Organic Marketing Scale',
   'Increase marketing spend cap when organic channel quality is proven',
   'draft', 20, 25000, 80, 30,
   'adjust_marketing_cap', '{"marketing_cap_increase_pct": 15, "min_channel_score": 80}',
   false, 1, 90),
  ('Vertical Allocation - Deals',
   'Allocate retained earnings to deals vertical when surplus exceeds threshold',
   'draft', 30, 100000, 85, 30,
   'allocate_to_vertical', '{"vertical": "deals", "amount_pct": 10, "max_amount": 50000}',
   true, 1, 90),
  ('Quarterly Dividend',
   'Propose dividend distribution when quarterly targets exceeded',
   'draft', 100, 200000, 90, 60,
   'propose_dividend', '{"dividend_pct": 15, "min_quarter_pnl": 150000}',
   true, 1, 90),
  ('Emergency Lock',
   'Lock all compounding when readiness drops below threshold',
   'active', 1, null, null, null,
   'lock_compounding', '{"lock_duration_days": 14}',
   false, null, 0);
