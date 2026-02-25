-- FTHTrading Boutique OS - Multi-Commodity Database Schema
-- PostgreSQL 15+ with pgvector extension
-- Supports: Coffee, Precious Metals, Base Metals, Energy, Agricultural Commodities

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- COMMODITY REGISTRY & CLASSIFICATION --
-----------------------------------------

-- Master Commodity Categories
CREATE TABLE commodity_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- 'COFFEE', 'GOLD', 'COPPER', 'OIL'
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50), -- 'agricultural', 'precious_metal', 'base_metal', 'energy'
    
    -- Regulatory
    requires_special_licensing BOOLEAN DEFAULT false,
    licensing_authority VARCHAR(100),
    
    -- Trading
    primary_exchange VARCHAR(100), -- 'ICE', 'LME', 'COMEX', 'NYMEX'
    trading_unit VARCHAR(50), -- 'lbs', 'troy oz', 'metric tons', 'barrels'
    
    -- Compliance
    ofac_screening_required BOOLEAN DEFAULT true,
    aml_enhanced_diligence BOOLEAN DEFAULT false,
    export_control_sensitive BOOLEAN DEFAULT false,
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commodity Specifications & HS Codes
CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES commodity_categories(id),
    
    -- Classification
    hs_code VARCHAR(20), -- Harmonized System tariff code
    commodity_code VARCHAR(50) UNIQUE NOT NULL, -- Internal: 'BRAZIL-SANTOS-17/18'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Specifications
    grade VARCHAR(100), -- Coffee: 'Screen 17/18', Gold: '.999 Fine', Copper: 'Grade A Cathode'
    quality_standard VARCHAR(100), -- 'LBMA', 'ASTM', 'ICO', 'ISO'
    
    -- Pricing
    pricing_basis VARCHAR(50), -- 'spot', 'futures', 'fixed', 'differential'
    benchmark_exchange VARCHAR(100), -- 'LME', 'ICE', 'COMEX'
    base_price DECIMAL(12,4), -- Updated from real-time feeds
    price_unit VARCHAR(20), -- '$per_lb', '$per_troy_oz', '$per_barrel'
    last_price_update TIMESTAMP,
    
    -- Compliance
    requires_phytosanitary BOOLEAN DEFAULT false,
    requires_assay BOOLEAN DEFAULT false,
    requires_origin_cert BOOLEAN DEFAULT true,
    conflict_sensitive BOOLEAN DEFAULT false, -- Metals from conflict regions
    
    -- Inventory
    stock_quantity DECIMAL(15,4) DEFAULT 0,
    stock_unit VARCHAR(20),
    reorder_point DECIMAL(15,4),
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- JURISDICTION & COMPLIANCE ENGINE --
-----------------------------------------

-- Country Regulations & Trade Rules
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2 ('US', 'BR', 'CN')
    country_name VARCHAR(100) NOT NULL,
    
    -- Trade Classification
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'sanctioned'
    ofac_sanctioned BOOLEAN DEFAULT false,
    export_restrictions TEXT[], -- Array of restricted commodities
    
    -- Currency & Tax
    currency_code CHAR(3), -- 'USD', 'BRL', 'EUR'
    vat_rate DECIMAL(5,2),
    import_duty_rate DECIMAL(5,2),
    
    -- Compliance Requirements
    requires_export_license BOOLEAN DEFAULT false,
    requires_import_license BOOLEAN DEFAULT false,
    aml_enhanced BOOLEAN DEFAULT false,
    
    -- Documentation
    required_documents TEXT[], -- ['certificate_of_origin', 'bill_of_lading', 'phytosanitary']
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commodity-Specific Trade Rules by Jurisdiction
CREATE TABLE jurisdiction_commodity_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    commodity_id UUID REFERENCES commodities(id),
    
    -- Import/Export Rules
    import_allowed BOOLEAN DEFAULT true,
    export_allowed BOOLEAN DEFAULT true,
    import_quota DECIMAL(15,4), -- Quantity limit
    export_quota DECIMAL(15,4),
    
    -- Tariffs & Duties
    import_duty_rate DECIMAL(5,2),
    export_duty_rate DECIMAL(5,2),
    
    -- Special Requirements
    requires_license BOOLEAN DEFAULT false,
    license_authority VARCHAR(255),
    processing_time_days INTEGER,
    
    -- Sanctions & Restrictions
    sanctioned BOOLEAN DEFAULT false,
    restriction_reason TEXT,
    restriction_start_date DATE,
    restriction_end_date DATE,
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- CLIENTS & ACCOUNTS --
-----------------------------------------

-- Unified Client Registry (All Commodity Types)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    ein VARCHAR(20),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country_code CHAR(2) DEFAULT 'US',
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    
    -- Business Profile
    years_in_business DECIMAL(4,1),
    monthly_revenue DECIMAL(12,2),
    business_type VARCHAR(100), -- 'gas_station', 'boutique_cafe', 'jewelry_manufacturer', 'industrial_buyer'
    current_suppliers TEXT[],
    
    -- Credit Profile
    credit_score INTEGER,
    dnb_score INTEGER,
    has_trade_references BOOLEAN DEFAULT false,
    no_late_payments BOOLEAN DEFAULT true,
    payment_terms VARCHAR(20), -- 'prepay', 'net-15', 'net-30', 'net-60', 'lc'
    credit_limit DECIMAL(12,2),
    
    -- Commodity Preferences
    primary_commodities TEXT[], -- ['coffee', 'sugar', 'gold']
    monthly_volume JSONB, -- {'coffee_lbs': 500, 'gold_troy_oz': 100}
    
    -- Compliance (KYC/AML)
    kyc_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'enhanced', 'rejected'
    kyc_completed_at TIMESTAMP,
    pep_screening_status VARCHAR(20), -- 'clear', 'flagged', 'pending'
    ofac_screening_status VARCHAR(20), -- 'clear', 'flagged', 'blocked'
    last_compliance_check TIMESTAMP,
    
    -- Risk Classification
    risk_tier VARCHAR(20), -- 'low', 'medium', 'high'
    requires_enhanced_diligence BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'lead', -- 'lead', 'qualified', 'active', 'inactive', 'suspended'
    lead_source VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contact_date TIMESTAMP,
    next_follow_up TIMESTAMP
);

-----------------------------------------
-- PRODUCTS & INVENTORY --
-----------------------------------------

-- Multi-Commodity Product Catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity_id UUID REFERENCES commodities(id),
    
    -- Product Identity
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Commodity-Specific Attributes (JSONB for flexibility)
    attributes JSONB, -- Coffee: {roast:'medium', cupping_score:87}, Gold: {fineness:.999, bar_weight:400oz}
    
    -- Origin/Source
    origin_country VARCHAR(50),
    origin_region VARCHAR(100),
    supplier_name VARCHAR(255),
    
    -- Sustainability (Agricultural Commodities)
    is_regenerative BOOLEAN DEFAULT false,
    sustainability_cert TEXT[],
    impact_metrics JSONB, -- {carbon_sequestration_kg: 1200, biodiversity_score: 87}
    
    -- Certification (Metals)
    certification TEXT[], -- ['LBMA', 'COMEX', 'Good Delivery']
    assay_certificate_url TEXT,
    
    -- Pricing
    cost_basis DECIMAL(12,4) NOT NULL,
    wholesale_price DECIMAL(12,4) NOT NULL,
    margin_target DECIMAL(5,2),
    tier_pricing JSONB, -- Volume-based pricing
    
    -- Inventory
    stock_quantity DECIMAL(15,4) DEFAULT 0,
    stock_unit VARCHAR(20),
    warehouse_location VARCHAR(100),
    reorder_point DECIMAL(15,4),
    
    -- Custody (Precious Metals)
    custody_type VARCHAR(20), -- 'allocated', 'unallocated', 'physical'
    vault_location VARCHAR(100),
    bar_serial_numbers TEXT[], -- For allocated precious metals
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- PROPOSALS & TRANSACTIONS --
-----------------------------------------

-- Multi-Commodity Proposals
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Proposal Type
    commodity_category VARCHAR(50), -- 'coffee', 'precious_metals', 'base_metals', 'energy'
    
    -- Content
    title VARCHAR(255),
    custom_message TEXT,
    product_ids UUID[],
    volume_tier VARCHAR(20),
    
    -- Pricing Summary
    total_quantity DECIMAL(15,4),
    quantity_unit VARCHAR(20),
    unit_price DECIMAL(12,4),
    total_price DECIMAL(12,2),
    margin DECIMAL(5,2),
    
    -- Terms
    payment_terms VARCHAR(20),
    delivery_timeline VARCHAR(100),
    credit_approved BOOLEAN DEFAULT false,
    
    -- Trade Compliance
    requires_export_license BOOLEAN DEFAULT false,
    requires_import_license BOOLEAN DEFAULT false,
    jurisdiction_compliance_status VARCHAR(20), -- 'clear', 'pending', 'flagged'
    ofac_screening_status VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'accepted', 'rejected'
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Files
    pdf_url TEXT,
    web_url TEXT,
    
    -- Agent Metadata
    generated_by VARCHAR(50),
    agent_confidence DECIMAL(3,2),
    rag_sources JSONB,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_proposal_id UUID REFERENCES proposals(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (Invoices, Orders, Documents tables remain similar - refer to original schema)

-----------------------------------------
-- COMPLIANCE & AUDIT --
-----------------------------------------

-- OFAC/Sanctions Screening Log
CREATE TABLE compliance_screenings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Subject
    client_id UUID REFERENCES clients(id),
    proposal_id UUID REFERENCES proposals(id),
    
    -- Screening Type
    screening_type VARCHAR(50), -- 'ofac', 'un_sanctions', 'eu_sanctions', 'pep', 'aml'
    
    -- Results
    status VARCHAR(20), -- 'clear', 'flagged', 'blocked'
    match_found BOOLEAN DEFAULT false,
    match_details JSONB,
    risk_score INTEGER, -- 0-100
    
    -- Review
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Finance Documents
CREATE TABLE trade_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id),
    commodity_id UUID REFERENCES commodities(id),
    
    -- Document Type
    document_type VARCHAR(50), -- 'bill_of_lading', 'certificate_of_origin', 'phytosanitary', 'assay', 'lc'
    
    -- Content
    title VARCHAR(255),
    file_url TEXT,
    document_data JSONB, -- Structured data extraction
    
    -- Validity
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- PRECIOUS METALS CUSTODY TRACKING --
-----------------------------------------

-- Vault Holdings & Custody Records
CREATE TABLE custody_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    product_id UUID REFERENCES products(id),
    
    -- Metal Details
    metal_type VARCHAR(50), -- 'gold', 'silver', 'platinum', 'palladium'
    fineness VARCHAR(10), -- '.999', '.9995'
    weight DECIMAL(15,4),
    weight_unit VARCHAR(20), -- 'troy_oz', 'kg'
    
    -- Bar/Lot Identification
    bar_serial_numbers TEXT[],
    lot_id VARCHAR(100),
    assay_certificate_url TEXT,
    
    -- Custody Type
    custody_type VARCHAR(20), -- 'allocated', 'unallocated'
    vault_location VARCHAR(100), -- 'London', 'Zurich', 'New York'
    vault_partner VARCHAR(100),
    
    -- Insurance
    insured BOOLEAN DEFAULT true,
    insurance_value DECIMAL(12,2),
    insurance_certificate_url TEXT,
    
    -- Movement Tracking
    status VARCHAR(20), -- 'stored', 'in_transit', 'withdrawn'
    last_movement_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- RAG KNOWLEDGE BASE --
-----------------------------------------

-- Documents (Vector Embeddings for RAG)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(50), -- 'proposal', 'email', 'contract', 'blog', 'compliance'
    
    -- Commodity Context
    commodity_category VARCHAR(50),
    
    -- Associations
    client_id UUID REFERENCES clients(id),
    proposal_id UUID REFERENCES proposals(id),
    
    -- Vector Embedding for RAG
    embedding vector(1536), -- OpenAI ada-002 dimensions
    
    -- Metadata
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- AGENT ACTIVITY & AUDIT --
-----------------------------------------

-- Agent Execution Logs
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(50) NOT NULL, -- 'ProposalAgent', 'ComplianceAgent', 'MetalsCustodyAgent'
    action VARCHAR(100) NOT NULL,
    
    -- Context
    client_id UUID REFERENCES clients(id),
    proposal_id UUID REFERENCES proposals(id),
    commodity_id UUID REFERENCES commodities(id),
    
    -- Details
    input_data JSONB,
    output_data JSONB,
    confidence DECIMAL(3,2),
    tokens_used INTEGER,
    
    -- Status
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- INDEXES --
-----------------------------------------

-- Clients
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_kyc_status ON clients(kyc_status);
CREATE INDEX idx_clients_risk_tier ON clients(risk_tier);
CREATE INDEX idx_clients_country ON clients(country_code);

-- Commodities
CREATE INDEX idx_commodities_category ON commodities(category_id);
CREATE INDEX idx_commodities_hs_code ON commodities(hs_code);
CREATE INDEX idx_commodities_active ON commodities(active);

-- Proposals
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_commodity ON proposals(commodity_category);

-- Compliance
CREATE INDEX idx_compliance_screenings_client ON compliance_screenings(client_id);
CREATE INDEX idx_compliance_screenings_status ON compliance_screenings(status);

-- Custody
CREATE INDEX idx_custody_client ON custody_records(client_id);
CREATE INDEX idx_custody_metal_type ON custody_records(metal_type);
CREATE INDEX idx_custody_status ON custody_records(status);

-- Documents (RAG)
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_commodity ON documents(commodity_category);

-- Vector similarity search
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);

-- Agent logs
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);

-----------------------------------------
-- TRIGGERS --
-----------------------------------------

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commodities_updated_at BEFORE UPDATE ON commodities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custody_records_updated_at BEFORE UPDATE ON custody_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
