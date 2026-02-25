-- Coffee Advisory OS Database Schema
-- PostgreSQL 15+ with pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients (Coffee Shops)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    -- Business Profile
    years_in_business DECIMAL(4,1),
    monthly_revenue DECIMAL(12,2),
    shop_type VARCHAR(50), -- 'boutique', 'gas_station', 'chain'
    current_supplier VARCHAR(255),
    
    -- Credit Profile
    credit_score INTEGER,
    dnb_score INTEGER,
    has_trade_references BOOLEAN DEFAULT false,
    no_late_payments BOOLEAN DEFAULT true,
    payment_terms VARCHAR(20), -- 'net-30', 'net-15', 'prepay'
    
    -- Coffee Preferences
    monthly_volume_lbs DECIMAL(10,2),
    preferred_roast VARCHAR(50), -- 'light', 'medium', 'dark', 'mixed'
    
    -- Status
    status VARCHAR(20) DEFAULT 'lead', -- 'lead', 'qualified', 'active', 'inactive'
    lead_source VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contact_date TIMESTAMP,
    next_follow_up TIMESTAMP
);

-- Products (Coffee Inventory)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Coffee Details
    roast_level VARCHAR(20), -- 'light', 'medium', 'dark'
    origin_region VARCHAR(100), -- 'brazil-cerrado', 'colombia-huila'
    origin_country VARCHAR(50),
    farm_name VARCHAR(255),
    
    -- Sustainability
    is_regenerative BOOLEAN DEFAULT false,
    sustainability_cert TEXT,
    impact_metrics JSONB,
    
    -- Pricing (per lb)
    wholesale_price DECIMAL(10,2) NOT NULL,
    tier_pricing JSONB, -- Volume-based pricing
    margin_target DECIMAL(5,2), -- Target margin %
    
    -- Inventory
    stock_lbs DECIMAL(10,2) DEFAULT 0,
    warehouse_location VARCHAR(100) DEFAULT 'NY-01',
    reorder_point DECIMAL(10,2),
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    custom_message TEXT,
    product_ids UUID[],
    volume_tier VARCHAR(20), -- 'low', 'mid', 'high'
    total_volume_lbs DECIMAL(10,2),
    
    -- Pricing
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    margin DECIMAL(5,2),
    
    -- Terms
    payment_terms VARCHAR(20),
    delivery_timeline VARCHAR(100),
    credit_approved BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'accepted', 'rejected'
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Files
    pdf_url TEXT,
    web_url TEXT,
    
    -- Agent Metadata
    generated_by VARCHAR(50), -- 'ProposalAgent'
    agent_confidence DECIMAL(3,2),
    rag_sources JSONB, -- References to similar past proposals
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_proposal_id UUID REFERENCES proposals(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id),
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    
    -- Terms
    payment_terms VARCHAR(20),
    due_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'void'
    paid_at TIMESTAMP,
    days_overdue INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (Fulfilled Proposals)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id),
    invoice_id UUID REFERENCES invoices(id),
    
    -- Order Details
    product_ids UUID[],
    total_volume_lbs DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    
    -- Fulfillment
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered'
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_number VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents (RAG Knowledge Base)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(50), -- 'proposal', 'email', 'note', 'contract', 'cert'
    
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

-- Agent Activity Log
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    
    -- Context
    client_id UUID REFERENCES clients(id),
    proposal_id UUID REFERENCES proposals(id),
    
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

-- Supplier Origins (Regenerative Sources)
CREATE TABLE supplier_origins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Location
    country VARCHAR(50),
    region VARCHAR(100),
    farm_name VARCHAR(255),
    farmer_name VARCHAR(255),
    
    -- Sustainability
    is_regenerative BOOLEAN DEFAULT true,
    certifications TEXT[],
    sustainability_practices TEXT[],
    
    -- Impact Metrics
    carbon_sequestration_kg DECIMAL(10,2),
    biodiversity_score INTEGER,
    water_conservation_m3 DECIMAL(10,2),
    fair_trade BOOLEAN DEFAULT false,
    
    -- Supply
    available_lbs DECIMAL(10,2),
    harvest_date DATE,
    arrival_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_payment_terms ON clients(payment_terms);
CREATE INDEX idx_clients_credit_score ON clients(credit_score);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Vector similarity search index
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);

-- Agent logs index
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
