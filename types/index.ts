// Type Definitions for Coffee Advisory OS

export interface Client {
  id: string;
  business_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  ein?: string;
  
  // Location
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Business Profile
  years_in_business?: number;
  monthly_revenue?: number;
  shop_type?: 'boutique' | 'gas_station' | 'chain';
  current_supplier?: string;
  
  // Credit Profile
  credit_score?: number;
  dnb_score?: number;
  has_trade_references?: boolean;
  no_late_payments?: boolean;
  payment_terms?: 'net-30' | 'net-15' | 'prepay';
  
  // Coffee Preferences
  monthly_volume_lbs?: number;
  preferred_roast?: 'light' | 'medium' | 'dark' | 'mixed';
  
  // Status
  status: 'lead' | 'qualified' | 'active' | 'inactive';
  lead_source?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_contact_date?: Date;
  next_follow_up?: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  
  // Coffee Details
  roast_level?: 'light' | 'medium' | 'dark';
  origin_region?: string;
  origin_country?: string;
  farm_name?: string;
  
  // Sustainability
  is_regenerative?: boolean;
  sustainability_cert?: string;
  impact_metrics?: ImpactMetrics;
  
  // Pricing
  wholesale_price: number;
  tier_pricing?: TierPricing;
  margin_target?: number;
  
  // Inventory
  stock_lbs: number;
  warehouse_location: string;
  reorder_point?: number;
  
  // Metadata
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Proposal {
  id: string;
  proposal_number: string;
  client_id: string;
  
  // Content
  title?: string;
  custom_message?: string;
  product_ids: string[];
  volume_tier?: 'low' | 'mid' | 'high';
  total_volume_lbs?: number;
  
  // Pricing
  unit_price?: number;
  total_price?: number;
  margin?: number;
  
  // Terms
  payment_terms?: string;
  delivery_timeline?: string;
  credit_approved?: boolean;
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  sent_at?: Date;
  viewed_at?: Date;
  responded_at?: Date;
  
  // Files
  pdf_url?: string;
  web_url?: string;
  
  // Agent Metadata
  generated_by?: string;
  agent_confidence?: number;
  rag_sources?: RAGSource[];
  
  // Versioning
  version: number;
  parent_proposal_id?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  proposal_id?: string;
  
  // Amounts
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  
  // Terms
  payment_terms?: string;
  due_date?: Date;
  
  // Status
  status: 'pending' | 'paid' | 'overdue' | 'void';
  paid_at?: Date;
  days_overdue: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  document_type: 'proposal' | 'email' | 'note' | 'contract' | 'cert';
  
  // Associations
  client_id?: string;
  proposal_id?: string;
  
  // Vector Embedding
  embedding?: number[];
  
  // Metadata
  file_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AgentLog {
  id: string;
  agent_name: string;
  action: string;
  
  // Context
  client_id?: string;
  proposal_id?: string;
  
  // Details
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  confidence?: number;
  tokens_used?: number;
  
  // Status
  success: boolean;
  error_message?: string;
  
  // Metadata
  created_at: Date;
}

export interface SupplierOrigin {
  id: string;
  lot_id: string;
  
  // Location
  country: string;
  region: string;
  farm_name: string;
  farmer_name?: string;
  
  // Sustainability
  is_regenerative: boolean;
  certifications: string[];
  sustainability_practices: string[];
  
  // Impact Metrics
  carbon_sequestration_kg?: number;
  biodiversity_score?: number;
  water_conservation_m3?: number;
  fair_trade: boolean;
  
  // Supply
  available_lbs: number;
  harvest_date?: Date;
  arrival_date?: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Supporting Types

export interface ImpactMetrics {
  carbon_sequestration_kg?: number;
  biodiversity_score?: number;
  water_conservation_m3?: number;
  soil_health_improvement?: number;
}

export interface TierPricing {
  low: number;    // < 100 lbs/month
  mid: number;    // 100-500 lbs/month
  high: number;   // > 500 lbs/month
}

export interface RAGSource {
  document_id: string;
  similarity_score: number;
  excerpt: string;
}

export interface CreditScore {
  total_score: number;
  years_in_business_score: number;
  revenue_score: number;
  dnb_score: number;
  references_score: number;
  payment_history_score: number;
  recommendation: 'net-30' | 'net-15' | 'prepay';
  risk_level: 'low' | 'medium' | 'high';
}

export interface ProposalGenerationRequest {
  clientId: string;
  volumeTier?: 'low' | 'mid' | 'high';
  roastProfile?: 'light' | 'medium' | 'dark' | 'mixed';
  paymentTerms?: 'net-30' | 'net-15' | 'prepay';
  originRegion?: string;
  customMessage?: string;
  brandingProfile?: 'premium' | 'standard' | 'economy';
}

export interface ProposalGenerationResponse {
  proposalId: string;
  pdfUrl: string;
  webUrl: string;
  emailHtml: string;
  confidence: number;
  ragSources: RAGSource[];
}

export interface DashboardMetrics {
  total_leads: number;
  qualified_leads: number;
  active_clients: number;
  
  // Revenue
  monthly_revenue: number;
  monthly_revenue_change: number;
  average_deal_size: number;
  
  // Credit
  credit_risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Proposals
  proposals_sent: number;
  proposals_accepted: number;
  conversion_rate: number;
  
  // Inventory
  total_stock_lbs: number;
  inventory_turnover_days: number;
  low_stock_products: number;
  
  // Invoices
  outstanding_invoices: number;
  overdue_amount: number;
  average_days_to_payment: number;
}

export interface LeadIntakeForm {
  business_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  ein?: string;
  
  // Business Info
  years_in_business?: number;
  monthly_revenue?: number;
  shop_type: 'boutique' | 'gas_station' | 'chain';
  current_supplier?: string;
  
  // Coffee Needs
  monthly_volume_lbs?: number;
  preferred_roast?: 'light' | 'medium' | 'dark' | 'mixed';
  
  // Trade References
  has_trade_references?: boolean;
  trade_reference_1?: string;
  trade_reference_2?: string;
  
  lead_source?: string;
}
