-- Team Members & Commission Tracking Schema
-- FTH Trading — Internal Team Portal
-- PostgreSQL 15+

-- ============================================================
-- TEAM MEMBERS
-- Linked to Clerk user IDs for auth, but can also be used
-- without Clerk (clerk_user_id is nullable).
-- ============================================================

CREATE TABLE IF NOT EXISTS team_members (
  member_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   VARCHAR(255) UNIQUE,              -- Clerk user ID (nullable when Clerk not configured)

  -- Identity
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  title           VARCHAR(200),                     -- 'Senior Trader', 'Business Development', 'Compliance Officer'
  avatar_url      TEXT,

  -- Role & Permissions
  role            VARCHAR(50) DEFAULT 'sales',       -- 'admin', 'sales', 'trader', 'compliance', 'operations', 'viewer'
  permissions     TEXT[],                            -- ['deals:write', 'compliance:read', 'team:admin']

  -- Commission Configuration
  default_commission_pct DECIMAL(5,2) DEFAULT 2.00, -- default deal commission rate

  -- Status
  active          BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMP,

  joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_clerk_id ON team_members(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_team_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_role ON team_members(role);

-- ============================================================
-- COMMISSIONS
-- One record per deal+member+type. Supports splits and overrides.
-- ============================================================

CREATE TABLE IF NOT EXISTS commissions (
  commission_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID REFERENCES deals(deal_id) ON DELETE SET NULL,
  member_id       UUID REFERENCES team_members(member_id) ON DELETE CASCADE,

  -- Denormalized for quick reads
  member_name     VARCHAR(255) NOT NULL,
  deal_number     VARCHAR(50),
  client_name     VARCHAR(255),
  commodity       VARCHAR(100),

  -- Commission structure
  commission_type VARCHAR(30) DEFAULT 'deal_close', -- 'deal_close', 'referral', 'management_override', 'bonus', 'penalty'
  deal_value_usd  DECIMAL(20,2),
  rate_pct        DECIMAL(5,2),                     -- e.g. 2.50 for 2.5%
  commission_usd  DECIMAL(20,2) NOT NULL,

  -- Period (for monthly reporting)
  period_month    VARCHAR(7),                       -- '2026-02'

  -- Status lifecycle
  status          VARCHAR(20) DEFAULT 'pending',    -- 'pending', 'approved', 'paid', 'disputed', 'cancelled'
  approved_by     VARCHAR(255),
  approved_at     TIMESTAMP,
  paid_at         TIMESTAMP,
  payment_ref     VARCHAR(255),                     -- bank ref, payroll ID, etc.

  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commissions_member ON commissions(member_id);
CREATE INDEX IF NOT EXISTS idx_commissions_deal ON commissions(deal_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_month);

-- ============================================================
-- TEAM ACTIVITY LOG
-- Personal audit trail per team member
-- ============================================================

CREATE TABLE IF NOT EXISTS team_activity (
  activity_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID REFERENCES team_members(member_id) ON DELETE CASCADE,
  activity_type   VARCHAR(50) NOT NULL,             -- 'deal_created', 'contact_added', 'contract_sent', 'commission_earned', 'login'
  description     TEXT NOT NULL,
  entity_type     VARCHAR(30),                      -- 'deal', 'contact', 'contract', 'commission'
  entity_id       UUID,
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_member ON team_activity(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON team_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON team_activity(created_at DESC);

-- ============================================================
-- DEFAULT SEED: Admin user (update email before running)
-- ============================================================

-- INSERT INTO team_members (full_name, email, role, default_commission_pct)
-- VALUES ('Admin User', 'admin@fthtrading.com', 'admin', 3.00)
-- ON CONFLICT (email) DO NOTHING;
