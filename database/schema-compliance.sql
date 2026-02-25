-- Compliance-Ready Database Schema
-- PostgreSQL 15+ with pgvector extension
-- Adds: commodities, deals, compliance_flags, jurisdictions
-- Philosophy: FLAG risks, don't certify legality

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- COMMODITY REGISTRY (Agnostic) --
-----------------------------------------

CREATE TABLE commodities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'agricultural', 'metals', 'energy', 'industrial'
    hs_code TEXT, -- Harmonized System code (optional, populate when known)
    restricted BOOLEAN DEFAULT FALSE,
    restricted_reason TEXT, -- "Export controls", "Dual-use", etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed common commodities
INSERT INTO commodities (name, category, hs_code, restricted, notes) VALUES
('Coffee (Arabica, green)', 'agricultural', '0901.11', FALSE, 'Flagship product. Regenerative sourcing preferred.'),
('Cocoa beans', 'agricultural', '1801.00', FALSE, 'Fair Trade certification recommended.'),
('Raw cane sugar', 'agricultural', '1701.14', FALSE, ''),
('Gold bars (.999 fine)', 'metals', '7108.13', FALSE, 'LBMA Good Delivery standard. AML/KYC enhanced diligence required.'),
('Silver bars (.999 fine)', 'metals', '7106.92', FALSE, 'LBMA standard. Allocated storage recommended.'),
('Copper cathode (Grade A)', 'metals', '7403.11', FALSE, 'LME specifications.'),
('Crude oil (WTI)', 'energy', '2709.00', FALSE, 'Terminal logistics required. DOE reporting may apply.');

-----------------------------------------
-- DEALS (Transaction Records) --
-----------------------------------------

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_number TEXT UNIQUE NOT NULL, -- e.g., 'DEAL-2026-001'
    client_id UUID NOT NULL, -- references clients(id) from main schema
    commodity_id INT NOT NULL REFERENCES commodities(id),
    
    -- Trade terms
    incoterm TEXT NOT NULL, -- EXW/FOB/CIF/DDP/etc. (Incoterms® 2020)
    origin_country TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    
    -- Value
    quantity NUMERIC NOT NULL,
    quantity_unit TEXT NOT NULL, -- 'lbs', 'kg', 'troy_oz', 'barrels'
    unit_price_usd NUMERIC NOT NULL,
    deal_value_usd NUMERIC NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- draft/review/approved/rejected/executed
    
    -- Compliance gates
    compliance_cleared BOOLEAN DEFAULT FALSE,
    critical_flags_count INT DEFAULT 0,
    
    -- Audit
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    approved_by TEXT,
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_client ON deals(client_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_compliance_cleared ON deals(compliance_cleared);

-----------------------------------------
-- COMPLIANCE FLAGS (Risk Flagging System) --
-----------------------------------------

CREATE TABLE compliance_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    
    -- Flag classification
    flag_type TEXT NOT NULL, -- SANCTIONS / EXPORT_CONTROL / LICENSE / AML / DOCS / INCOTERM
    severity TEXT NOT NULL, -- LOW / MEDIUM / HIGH / CRITICAL
    
    -- Details
    message TEXT NOT NULL,
    recommendation TEXT, -- What humans should do
    
    -- Review gates
    requires_human_review BOOLEAN DEFAULT TRUE,
    blocks_execution BOOLEAN DEFAULT FALSE, -- CRITICAL flags = TRUE
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_compliance_flags_deal ON compliance_flags(deal_id);
CREATE INDEX idx_compliance_flags_severity ON compliance_flags(severity);
CREATE INDEX idx_compliance_flags_resolved ON compliance_flags(resolved);
CREATE INDEX idx_compliance_flags_type ON compliance_flags(flag_type);

-----------------------------------------
-- JURISDICTIONS (Compliance Metadata) --
-----------------------------------------

CREATE TABLE jurisdictions (
    id SERIAL PRIMARY KEY,
    country TEXT UNIQUE NOT NULL, -- ISO country name
    country_code CHAR(2) UNIQUE NOT NULL, -- ISO 3166-1 alpha-2
    
    -- Risk classification (risk-based compliance approach)
    sanctions_risk TEXT DEFAULT 'unknown', -- low/medium/high/critical
    sanctions_notes TEXT, -- Brief summary, NOT legal advice
    
    -- Compliance requirements
    aml_notes TEXT,
    licensing_notes TEXT,
    docs_required JSONB DEFAULT '[]'::jsonb, -- Array of required doc types
    
    -- Source tracking (defensibility)
    source_urls TEXT[], -- Where this info came from
    last_reviewed_date DATE,
    reviewed_by TEXT,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed key jurisdictions
INSERT INTO jurisdictions (country, country_code, sanctions_risk, sanctions_notes, aml_notes, docs_required, last_reviewed_date, reviewed_by) VALUES
('United States', 'US', 'low', 'Primary operating jurisdiction. OFAC screening required for all counterparties.', 'Apply risk-based KYC/AML. Enhanced due diligence for high-value transactions (>$50K).', '["KYC Pack", "Beneficial Ownership", "Source of Funds"]', '2026-02-25', 'Compliance Team'),
('Brazil', 'BR', 'low', 'Major coffee origin. No sanctions.', 'Standard KYC. Tax documentation for export transactions.', '["Certificate of Origin", "Phytosanitary Certificate", "Export License"]', '2026-02-25', 'Compliance Team'),
('Switzerland', 'CH', 'low', 'LBMA vault partnerships. No sanctions.', 'Enhanced due diligence for precious metals custody.', '["KYC Pack", "Custody Agreement", "Insurance Certificate"]', '2026-02-25', 'Compliance Team'),
('Russian Federation', 'RU', 'critical', 'OFAC sanctions active. Transactions generally prohibited.', 'BLOCKED. Do not transact without legal counsel and OFAC license.', '["OFAC License Required"]', '2026-02-25', 'Compliance Team'),
('China', 'CN', 'medium', 'Export controls may apply for certain commodities. Monitor Entity List.', 'Standard KYC. Enhanced screening for state-owned entities.', '["Export License (if controlled items)", "End-Use Certificate"]', '2026-02-25', 'Compliance Team');

CREATE INDEX idx_jurisdictions_country_code ON jurisdictions(country_code);
CREATE INDEX idx_jurisdictions_sanctions_risk ON jurisdictions(sanctions_risk);

-----------------------------------------
-- COMPLIANCE ACTIONS LOG (Audit Trail) --
-----------------------------------------

CREATE TABLE compliance_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id),
    flag_id UUID REFERENCES compliance_flags(id),
    
    -- Action details
    action_type TEXT NOT NULL, -- SCREEN / FLAG / REVIEW / APPROVE / REJECT / OVERRIDE
    action_by TEXT NOT NULL,
    action_notes TEXT,
    
    -- Context
    metadata JSONB, -- Additional context (e.g., screening results, approver justification)
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_compliance_actions_deal ON compliance_actions(deal_id);
CREATE INDEX idx_compliance_actions_action_type ON compliance_actions(action_type);

-----------------------------------------
-- TRIGGERS --
-----------------------------------------

-- Auto-update timestamp on deals
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deals_updated_at 
BEFORE UPDATE ON deals 
FOR EACH ROW EXECUTE FUNCTION update_deals_updated_at();

-- Auto-count critical flags on deals
CREATE OR REPLACE FUNCTION update_critical_flags_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE deals
    SET critical_flags_count = (
        SELECT COUNT(*) 
        FROM compliance_flags 
        WHERE deal_id = NEW.deal_id 
        AND severity = 'CRITICAL' 
        AND resolved = FALSE
    )
    WHERE id = NEW.deal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_critical_flags
AFTER INSERT OR UPDATE ON compliance_flags
FOR EACH ROW EXECUTE FUNCTION update_critical_flags_count();

-----------------------------------------
-- VIEWS (Convenience) --
-----------------------------------------

-- Deals with unresolved critical flags
CREATE VIEW deals_blocked_by_compliance AS
SELECT 
    d.*,
    COUNT(cf.id) as unresolved_critical_count
FROM deals d
LEFT JOIN compliance_flags cf ON d.id = cf.deal_id
WHERE cf.severity = 'CRITICAL' AND cf.resolved = FALSE
GROUP BY d.id;

-- Compliance dashboard summary
CREATE VIEW compliance_dashboard AS
SELECT 
    severity,
    COUNT(*) as flag_count,
    COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_count,
    COUNT(CASE WHEN resolved = TRUE THEN 1 END) as resolved_count
FROM compliance_flags
GROUP BY severity
ORDER BY 
    CASE severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END;

-----------------------------------------
-- COMMENTS (Documentation) --
-----------------------------------------

COMMENT ON TABLE commodities IS 'Registry of all tradeable commodities. Commodity-agnostic design.';
COMMENT ON TABLE deals IS 'Transaction records. Linked to compliance flags before execution.';
COMMENT ON TABLE compliance_flags IS 'Risk flagging system. Flags potential compliance issues; does NOT certify legality.';
COMMENT ON TABLE jurisdictions IS 'Country-level compliance metadata. Risk-based approach. Updated by humans, not AI.';
COMMENT ON TABLE compliance_actions IS 'Audit trail of all compliance-related actions. Required for regulatory defensibility.';

COMMENT ON COLUMN compliance_flags.severity IS 'CRITICAL = blocks execution. HIGH = requires review. MEDIUM/LOW = advisory.';
COMMENT ON COLUMN compliance_flags.requires_human_review IS 'If TRUE, flag must be manually reviewed and resolved.';
COMMENT ON COLUMN jurisdictions.sanctions_risk IS 'Risk band for sanctions screening. NOT a legal determination.';
COMMENT ON COLUMN jurisdictions.source_urls IS 'Where compliance info came from (e.g., OFAC website, trade.gov). For audit trail.';
