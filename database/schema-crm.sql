-- CRM Schema for FTH Trading Intelligence System
-- Enterprise Sales Intelligence + Contract Lifecycle Management
-- PostgreSQL 15+

-- ============================================================
-- COMPANY INTELLIGENCE
-- Sources: Company websites, public filings, trade directories
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  company_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  domain          VARCHAR(255),                      -- e.g. 'acme.com'
  website         TEXT,

  -- Classification
  industry        VARCHAR(100),                      -- 'commodity_trading', 'roaster', 'retailer', 'hedge_fund'
  sub_industry    VARCHAR(100),
  company_type    VARCHAR(50),                       -- 'prospect', 'partner', 'competitor', 'supplier'
  size_category   VARCHAR(20),                       -- 'SMB', 'mid-market', 'enterprise'
  employee_count  INTEGER,
  annual_revenue_usd BIGINT,

  -- Location
  hq_country      VARCHAR(100),
  hq_city         VARCHAR(100),
  hq_address      TEXT,
  regions         TEXT[],                            -- ['EMEA', 'North America']

  -- Commodities of interest
  commodities     TEXT[],                            -- ['coffee', 'cocoa', 'gold']
  trade_volumes   JSONB,                             -- { "coffee": "500mt/year" }

  -- Public Data Sourced
  linkedin_url    TEXT,
  company_reg_num VARCHAR(100),                      -- Public filing number
  source          VARCHAR(100),                      -- 'website', 'trade_directory', 'public_filing', 'manual'
  sourced_at      TIMESTAMP,
  raw_scraped_data JSONB,                            -- Full public-source extract

  -- Research Status
  research_status VARCHAR(30) DEFAULT 'pending',    -- 'pending', 'researched', 'enriched', 'archived'
  last_researched_at TIMESTAMP,
  research_notes  TEXT,

  -- CRM Status
  crm_status      VARCHAR(30) DEFAULT 'new',         -- 'new', 'qualified', 'engaged', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'
  assigned_to     VARCHAR(255),
  opportunity_score INTEGER,                         -- 1-100 AI-generated fit score

  -- Compliance
  sanctions_checked   BOOLEAN DEFAULT false,
  sanctions_checked_at TIMESTAMP,
  sanctions_status    VARCHAR(20),                   -- 'clear', 'flagged', 'reviewing'

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_crm_status ON companies(crm_status);
CREATE INDEX IF NOT EXISTS idx_companies_commodities ON companies USING GIN(commodities);

-- ============================================================
-- CONTACTS
-- Consent-based. No harvested emails. No brute-force guessing.
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
  contact_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(company_id) ON DELETE CASCADE,

  -- Identity
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100),
  title           VARCHAR(200),                      -- 'Head of Procurement', 'CEO'
  department      VARCHAR(100),

  -- Contact Details (only publicly listed or directly provided)
  email           VARCHAR(255),
  email_source    VARCHAR(100),                      -- 'company_website', 'conference_card', 'referral', 'inbound', 'manual'
  email_type      VARCHAR(20),                       -- 'direct', 'generic', 'unknown'
  phone           VARCHAR(50),
  linkedin_url    TEXT,

  -- Consent & Compliance
  consent_status  VARCHAR(30) DEFAULT 'unknown',     -- 'opted_in', 'opted_out', 'unknown', 'unsubscribed'
  consent_date    TIMESTAMP,
  consent_source  VARCHAR(100),                      -- 'inbound_form', 'conference', 'referral'
  unsubscribed_at TIMESTAMP,
  gdpr_basis      VARCHAR(50),                       -- 'legitimate_interest', 'consent', 'contract'

  -- Outreach History
  last_contacted_at TIMESTAMP,
  contact_count    INTEGER DEFAULT 0,
  response_count   INTEGER DEFAULT 0,

  -- Relationship
  is_decision_maker BOOLEAN DEFAULT false,
  is_primary_contact BOOLEAN DEFAULT false,
  notes           TEXT,

  -- Validation
  email_valid     BOOLEAN,
  email_validated_at TIMESTAMP,
  bounced         BOOLEAN DEFAULT false,
  bounced_at      TIMESTAMP,

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_consent ON contacts(consent_status);

-- ============================================================
-- OUTREACH LOG
-- Every email sent. Every interaction tracked.
-- CAN-SPAM compliant audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS outreach_log (
  outreach_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id      UUID REFERENCES contacts(contact_id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(company_id) ON DELETE SET NULL,

  -- Email
  from_address    VARCHAR(255) NOT NULL,
  to_address      VARCHAR(255) NOT NULL,
  subject         VARCHAR(500) NOT NULL,
  body_text       TEXT,
  body_html       TEXT,
  template_id     VARCHAR(100),

  -- Type
  outreach_type   VARCHAR(50),                       -- 'initial', 'follow_up', 'proposal', 'contract', 'nurture'
  campaign_id     VARCHAR(100),

  -- Status
  status          VARCHAR(30) DEFAULT 'pending',     -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sent_at         TIMESTAMP,
  delivered_at    TIMESTAMP,
  opened_at       TIMESTAMP,
  clicked_at      TIMESTAMP,
  bounced_at      TIMESTAMP,
  failed_reason   TEXT,

  -- CAN-SPAM Compliance
  includes_unsubscribe BOOLEAN DEFAULT true,
  unsubscribe_link TEXT,
  physical_address_included BOOLEAN DEFAULT true,

  -- Provider
  provider        VARCHAR(50),                       -- 'sendgrid', 'ses'
  provider_message_id VARCHAR(255),

  -- AI Generation
  ai_generated    BOOLEAN DEFAULT false,
  ai_model        VARCHAR(100),
  prompt_version  VARCHAR(50),

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outreach_contact ON outreach_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_log(status);
CREATE INDEX IF NOT EXISTS idx_outreach_sent_at ON outreach_log(sent_at);

-- ============================================================
-- CONTRACTS
-- Version-tracked. eSignature capable. Full audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  contract_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(company_id) ON DELETE SET NULL,
  deal_id         UUID,                              -- References deals table

  -- Identity
  contract_number VARCHAR(50) UNIQUE NOT NULL,       -- 'CTR-2026-001'
  contract_type   VARCHAR(50) NOT NULL,              -- 'NCNDA', 'supply_agreement', 'MOU', 'LOI', 'purchase_order'
  title           VARCHAR(500) NOT NULL,
  version         INTEGER DEFAULT 1,
  parent_contract_id UUID REFERENCES contracts(contract_id),  -- For amendments

  -- Parties
  party_a_name    VARCHAR(255),                      -- Usually FTH Trading
  party_a_signatory VARCHAR(255),
  party_b_name    VARCHAR(255),
  party_b_signatory VARCHAR(255),
  party_b_email   VARCHAR(255),

  -- Terms
  effective_date  DATE,
  expiry_date     DATE,
  governing_law   VARCHAR(100),                      -- 'New York', 'England & Wales'
  jurisdiction    VARCHAR(100),
  commodity       VARCHAR(100),
  deal_value_usd  DECIMAL(20,2),
  currency        VARCHAR(10) DEFAULT 'USD',

  -- Status
  status          VARCHAR(30) DEFAULT 'draft',       -- 'draft', 'sent_for_review', 'under_negotiation', 'signed', 'executed', 'expired', 'terminated'

  -- Document
  template_used   VARCHAR(100),                      -- 'ncnda_v3', 'supply_v2'
  document_html   TEXT,                              -- Generated HTML
  document_pdf_url TEXT,                             -- Storage path
  document_hash   VARCHAR(64),                       -- SHA-256 of final signed document
  redline_notes   TEXT,

  -- Signature
  signed_by_a     VARCHAR(255),
  signed_by_a_at  TIMESTAMP,
  signed_by_b     VARCHAR(255),
  signed_by_b_at  TIMESTAMP,
  signature_method VARCHAR(30),                      -- 'internal_esign', 'docusign', 'wet_ink'

  -- eSignature
  esign_token     VARCHAR(255) UNIQUE,               -- Secure signing token
  esign_expires_at TIMESTAMP,
  esign_ip_address INET,
  esign_user_agent TEXT,

  -- Compliance
  compliance_reviewed BOOLEAN DEFAULT false,
  compliance_reviewed_by VARCHAR(255),
  compliance_reviewed_at TIMESTAMP,
  compliance_notes TEXT,

  -- Metadata
  tags            TEXT[],
  internal_notes  TEXT,
  created_by      VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_esign_token ON contracts(esign_token);

-- ============================================================
-- CONTRACT VERSIONS
-- Full version history. Never overwrite. Append-only.
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_versions (
  version_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID REFERENCES contracts(contract_id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  document_html   TEXT NOT NULL,
  document_hash   VARCHAR(64),
  changed_by      VARCHAR(255),
  change_notes    TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONTRACT AUDIT LOG
-- Append-only. Every action logged.
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_audit_log (
  log_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID REFERENCES contracts(contract_id) ON DELETE CASCADE,
  action          VARCHAR(100) NOT NULL,             -- 'created', 'sent', 'viewed', 'signed', 'rejected', 'amended'
  actor           VARCHAR(255),
  actor_ip        INET,
  actor_user_agent TEXT,
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EMAIL TEMPLATES
-- Versioned. CAN-SPAM compliant. Multi-commodity.
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
  template_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) UNIQUE NOT NULL,
  description     TEXT,
  template_type   VARCHAR(50),                       -- 'initial_outreach', 'follow_up', 'proposal', 'contract', 'nurture'
  commodity       VARCHAR(100),                      -- NULL = all commodities

  -- Content
  subject_line    VARCHAR(500) NOT NULL,
  body_text       TEXT NOT NULL,
  body_html       TEXT,

  -- Variables (mustache-style {{variable}} replacement)
  variables       TEXT[],                            -- ['company_name', 'contact_first_name', 'commodity']

  -- CAN-SPAM Required Fields
  includes_unsubscribe BOOLEAN DEFAULT true,
  includes_physical_address BOOLEAN DEFAULT true,
  sender_name     VARCHAR(255),
  sender_title    VARCHAR(255),

  -- Status
  active          BOOLEAN DEFAULT true,
  version         INTEGER DEFAULT 1,

  created_by      VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RAG DOCUMENTS
-- Vector store for contracts, templates, deal playbooks
-- ============================================================

CREATE TABLE IF NOT EXISTS rag_documents (
  doc_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(500) NOT NULL,
  document_type   VARCHAR(50),                       -- 'contract', 'template', 'playbook', 'commodity_spec', 'compliance_note'
  content         TEXT NOT NULL,
  embedding       vector(1536),                      -- OpenAI text-embedding-ada-002
  metadata        JSONB,
  source_id       UUID,                              -- Reference to source contracts, templates etc.
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_rag_doc_type ON rag_documents(document_type);

-- ============================================================
-- DEALS (Extended from schema-compliance.sql)
-- Wires /api/deals to real DB
-- ============================================================

CREATE TABLE IF NOT EXISTS deals (
  deal_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_number     VARCHAR(50) UNIQUE NOT NULL,
  lead_id         UUID,

  -- Parties
  client_name     VARCHAR(255) NOT NULL,
  client_email    VARCHAR(255),
  company_id      UUID REFERENCES companies(company_id) ON DELETE SET NULL,

  -- Commodity
  commodity       VARCHAR(100) NOT NULL,
  category        VARCHAR(50),                       -- 'agricultural', 'metals', 'energy'
  quantity        DECIMAL(12,2),
  quantity_unit   VARCHAR(20),                       -- 'MT', 'lbs', 'oz', 'barrels'
  hs_code         VARCHAR(20),

  -- Commercial
  deal_value_usd  DECIMAL(20,2),
  currency        VARCHAR(10) DEFAULT 'USD',
  incoterm        VARCHAR(10),
  origin_country  VARCHAR(3),
  destination_country VARCHAR(3),
  payment_terms   VARCHAR(50),

  -- Status
  status          VARCHAR(30) DEFAULT 'inquiry',     -- 'inquiry', 'qualified', 'proposal_sent', 'negotiating', 'compliance_review', 'on_hold', 'closed_won', 'closed_lost'
  compliance_status VARCHAR(30) DEFAULT 'pending',   -- 'pending', 'cleared', 'flagged', 'blocked', 'escalated'
  compliance_cleared_at TIMESTAMP,
  compliance_cleared_by VARCHAR(255),

  -- Timeline
  inquiry_date    DATE DEFAULT CURRENT_DATE,
  target_delivery DATE,
  closed_at       TIMESTAMP,

  -- Metadata
  notes           TEXT,
  assigned_to     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_compliance ON deals(compliance_status);
CREATE INDEX IF NOT EXISTS idx_deals_commodity ON deals(commodity);

-- ============================================================
-- COMPLIANCE FLAGS (Extended from schema-compliance.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_flags (
  flag_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID REFERENCES deals(deal_id) ON DELETE CASCADE,

  flag_type       VARCHAR(50) NOT NULL,              -- 'SANCTIONS', 'AML', 'EXPORT_CONTROL', 'DOCS', 'VALUE', 'INCOTERM'
  severity        VARCHAR(10) NOT NULL,              -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  message         TEXT NOT NULL,
  recommendation  TEXT,
  requires_human_review BOOLEAN DEFAULT true,
  blocks_execution BOOLEAN DEFAULT false,

  -- Resolution
  resolved        BOOLEAN DEFAULT false,
  resolved_by     VARCHAR(255),
  resolved_at     TIMESTAMP,
  resolution_notes TEXT,

  -- Metadata
  jurisdiction    VARCHAR(3),
  rule_reference  VARCHAR(255),
  auto_generated  BOOLEAN DEFAULT true,

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flags_deal ON compliance_flags(deal_id);
CREATE INDEX IF NOT EXISTS idx_flags_severity ON compliance_flags(severity);
CREATE INDEX IF NOT EXISTS idx_flags_resolved ON compliance_flags(resolved);

-- ============================================================
-- COMPLIANCE ACTIONS (Audit Trail - Append Only)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_actions (
  action_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID REFERENCES deals(deal_id) ON DELETE CASCADE,
  flag_id         UUID REFERENCES compliance_flags(flag_id) ON DELETE SET NULL,
  action_type     VARCHAR(50) NOT NULL,              -- 'flag_created', 'flag_reviewed', 'flag_resolved', 'status_change', 'jurisdiction_updated'
  performed_by    VARCHAR(255),
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- JURISDICTIONS (From schema-compliance.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS jurisdictions (
  jurisdiction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code    VARCHAR(3) UNIQUE NOT NULL,
  country         VARCHAR(100) NOT NULL,
  region          VARCHAR(50),
  sanctions_risk  VARCHAR(20) NOT NULL,              -- 'low', 'medium', 'high', 'critical'
  sanctions_notes TEXT,
  aml_notes       TEXT,
  licensing_notes TEXT,
  docs_required   TEXT[],
  source_urls     TEXT[],
  effective_date  DATE,
  next_review_date DATE,
  reviewed_by     VARCHAR(255),
  version         VARCHAR(10) DEFAULT '1.0',
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COMMODITIES REGISTRY
-- ============================================================

CREATE TABLE IF NOT EXISTS commodities (
  commodity_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) UNIQUE NOT NULL,
  slug            VARCHAR(100) UNIQUE,
  hs_code         VARCHAR(20),
  category        VARCHAR(50),                       -- 'agricultural', 'metals', 'energy', 'chemicals'
  restricted      BOOLEAN DEFAULT false,
  compliance_notes TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED: Default email templates
-- ============================================================

INSERT INTO email_templates (name, template_type, subject_line, body_text, variables, sender_name, sender_title)
VALUES
(
  'initial_outreach_commodity',
  'initial_outreach',
  'FTH Trading — Commodity Supply Partnership Opportunity',
  E'Dear {{contact_first_name}},\n\nI am reaching out from FTH Trading, a global commodity advisory firm with over 50 years of experience structuring transactions in {{commodity_category}}.\n\nGiven {{company_name}}\'s positioning in this space, I believe there is a compelling opportunity to discuss a supply partnership that could deliver {{key_benefit}}.\n\nFTH Trading currently facilitates transactions in:\n- Coffee and Agricultural Commodities (Brazil, Colombia, Ethiopia origins)\n- Precious Metals (LBMA-certified custody through Swiss vaults)\n- Base Metals and Industrial Materials\n- Energy Products\n\nWould you be open to a 20-minute call to explore fit?\n\nBest regards,\n{{sender_name}}\n{{sender_title}}\nFTH Trading\n\n--\nFTH Trading | Global Commodity Advisory\nYou are receiving this email because {{company_name}} operates in the {{commodity_category}} sector.\nTo unsubscribe: {{unsubscribe_link}}\nFTH Trading, [Physical Address Required]',
  ARRAY['contact_first_name', 'company_name', 'commodity_category', 'key_benefit', 'sender_name', 'sender_title', 'unsubscribe_link'],
  'Bradley',
  'Managing Director, FTH Trading'
),
(
  'follow_up_1',
  'follow_up',
  'Re: FTH Trading — Following Up',
  E'Dear {{contact_first_name}},\n\nI wanted to follow up on my previous email regarding a potential supply partnership between FTH Trading and {{company_name}}.\n\nI understand you receive many outreach messages. I will keep this brief:\n\nFTH Trading specialises in {{commodity}}. We have active supply relationships across {{origin_regions}} and can offer {{key_differentiator}}.\n\nIf this is not relevant to you, simply reply to let me know and I will not contact you again.\n\nIf there is interest, I would welcome a brief call at your convenience.\n\nBest regards,\n{{sender_name}}\nFTH Trading\n\n--\nTo unsubscribe: {{unsubscribe_link}}\nFTH Trading, [Physical Address Required]',
  ARRAY['contact_first_name', 'company_name', 'commodity', 'origin_regions', 'key_differentiator', 'sender_name', 'unsubscribe_link'],
  'Bradley',
  'Managing Director, FTH Trading'
),
(
  'ncnda_cover',
  'contract',
  'FTH Trading — Non-Circumvention Non-Disclosure Agreement for Execution',
  E'Dear {{contact_first_name}},\n\nPlease find enclosed a Non-Circumvention Non-Disclosure Agreement (NCNDA) for the proposed transaction:\n\nTransaction Reference: {{deal_number}}\nCommodity: {{commodity}}\nEstimated Value: {{deal_value}}\n\nThis agreement protects both parties\' business relationships and confidential information throughout the transaction process.\n\nPlease review and execute via the secure signing link below:\n\n{{signing_link}}\n\nThis link expires in 72 hours. If you have questions, please contact me directly.\n\nUpon execution, we will proceed to the next stage of the transaction.\n\nBest regards,\n{{sender_name}}\nFTH Trading\n\n--\nFTH Trading, [Physical Address Required]',
  ARRAY['contact_first_name', 'deal_number', 'commodity', 'deal_value', 'signing_link', 'sender_name'],
  'Bradley',
  'Managing Director, FTH Trading'
)
ON CONFLICT (name) DO NOTHING;
