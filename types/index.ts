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

// ============================================================
// Prop Sharing Layer — Proprietary Trading + Profit Sharing
// ============================================================

export type PropProgramStatus = 'active' | 'paused' | 'archived';
export type PropAccountPhase = 'evaluation' | 'verification' | 'funded' | 'suspended' | 'terminated';
export type PropPayoutStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'disputed' | 'cancelled';
export type PropTradeSide = 'long' | 'short';
export type PropTradeStatus = 'open' | 'closed' | 'cancelled';
export type PropRiskSeverity = 'warning' | 'breach' | 'critical';

export interface PropProgram {
  program_id: string;
  name: string;
  slug: string;
  description?: string;
  commodity_focus?: string[];
  status: PropProgramStatus;

  // Funding
  funded_capital: number;
  currency: string;

  // Evaluation Rules
  eval_duration_days: number;
  eval_profit_target: number;
  eval_max_drawdown: number;
  eval_daily_loss_limit: number;
  eval_min_trading_days: number;
  eval_fee: number;

  // Funded Account Rules
  max_drawdown: number;
  daily_loss_limit: number;
  max_position_size?: number;
  max_open_positions?: number;
  leverage_limit?: number;
  scaling_plan?: Record<string, string>;

  // Profit Split
  trader_profit_pct: number;
  firm_profit_pct: number;
  payout_frequency: 'weekly' | 'biweekly' | 'monthly';
  min_payout_amount?: number;
  first_payout_delay?: number;

  created_at: Date;
  updated_at: Date;
}

export interface PropAccount {
  account_id: string;
  account_number: string;
  program_id: string;
  member_id?: string;

  // Trader Info
  trader_name: string;
  trader_email: string;
  trader_country?: string;
  trader_experience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';

  // Account State
  phase: PropAccountPhase;
  starting_capital: number;
  current_balance: number;
  peak_balance: number;
  current_drawdown: number;
  daily_pnl: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  active_trading_days: number;

  // Evaluation Tracking
  eval_started_at?: Date;
  eval_deadline?: Date;
  eval_passed?: boolean;
  eval_passed_at?: Date;

  // Funded Tracking
  funded_at?: Date;
  last_payout_at?: Date;
  total_payouts: number;

  // Risk
  risk_score: number;
  risk_flags?: Array<{ rule: string; timestamp: string; detail: string }>;
  suspended_at?: Date;
  suspension_reason?: string;
  terminated_at?: Date;
  termination_reason?: string;

  notes?: string;
  created_at: Date;
  updated_at: Date;

  // Joined fields
  program_name?: string;
  program_slug?: string;
}

export interface PropTrade {
  trade_id: string;
  account_id: string;
  trade_number: string;
  commodity: string;
  side: PropTradeSide;
  quantity: number;
  quantity_unit: string;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;

  pnl?: number;
  pnl_pct?: number;
  fees: number;

  status: PropTradeStatus;
  opened_at: Date;
  closed_at?: Date;
  position_size_pct?: number;
  risk_reward_ratio?: number;
  notes?: string;
  created_at: Date;
}

export interface PropPayout {
  payout_id: string;
  account_id: string;
  program_id: string;

  period_start: Date;
  period_end: Date;
  period_label?: string;

  gross_profit: number;
  trader_share_pct: number;
  trader_payout: number;
  firm_share: number;
  fees_deducted: number;

  status: PropPayoutStatus;
  approved_by?: string;
  approved_at?: Date;
  paid_at?: Date;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;

  // Joined
  trader_name?: string;
  account_number?: string;
  program_name?: string;
}

export interface PropRiskEvent {
  event_id: string;
  account_id: string;
  trade_id?: string;

  rule_violated: string;
  severity: PropRiskSeverity;
  description: string;
  threshold_value?: number;
  actual_value?: number;

  resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  resolution_notes?: string;
  action_taken?: string;

  created_at: Date;
}

export interface PropDashboardMetrics {
  total_programs: number;
  active_programs: number;
  total_accounts: number;
  accounts_by_phase: Record<PropAccountPhase, number>;
  total_funded_capital: number;
  total_pnl: number;
  total_payouts_distributed: number;
  pending_payouts: number;
  active_risk_events: number;
  avg_win_rate: number;
}

// -----------------------------------------------------------------
// Prop Sharing V2: Treasury, Audit, KYC, Metrics
// -----------------------------------------------------------------

export type TreasuryEntryType =
  | 'capital_allocated'
  | 'capital_returned'
  | 'trader_payout'
  | 'firm_revenue'
  | 'eval_fee_received'
  | 'loss_absorbed'
  | 'adjustment';

export type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';

export type ChallengeApplicationStatus =
  | 'submitted'
  | 'payment_pending'
  | 'payment_received'
  | 'kyc_pending'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'active'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface TreasuryEntry {
  entry_id: string;
  entry_type: TreasuryEntryType;
  account_id?: string;
  payout_id?: string;
  program_id?: string;
  amount: number;
  direction: 'debit' | 'credit';
  currency: string;
  running_balance?: number;
  description: string;
  reference?: string;
  performed_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TreasurySummary {
  total_capital_allocated: number;
  total_capital_returned: number;
  net_capital_deployed: number;
  total_trader_payouts: number;
  total_firm_revenue: number;
  total_eval_fees: number;
  total_losses_absorbed: number;
  net_position: number;
  entry_count: number;
}

export interface PropAuditLog {
  log_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  performed_by: string;
  ip_address?: string;
  reason?: string;
  created_at: string;
}

export interface PropTraderKyc {
  kyc_id: string;
  account_id?: string;
  trader_email: string;
  legal_name: string;
  date_of_birth?: string;
  nationality?: string;
  country_of_residence: string;
  government_id_type?: string;
  government_id_number?: string;
  status: KycStatus;
  risk_level: string;
  sanctions_checked: boolean;
  sanctions_clear?: boolean;
  pep_status: boolean;
  source_of_funds?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeApplication {
  application_id: string;
  program_id: string;
  full_name: string;
  email: string;
  phone?: string;
  country: string;
  trading_experience?: string;
  trading_style?: string;
  commodities_interest?: string[];
  bio?: string;
  status: ChallengeApplicationStatus;
  eval_fee_amount?: number;
  eval_fee_currency?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_received_at?: string;
  account_id?: string;
  referral_code?: string;
  program_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PropPerformanceMetrics {
  metrics_id: string;
  account_id: string;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  calmar_ratio?: number;
  max_drawdown_pct?: number;
  max_drawdown_amount?: number;
  max_drawdown_duration_days?: number;
  win_rate?: number;
  loss_rate?: number;
  avg_win?: number;
  avg_loss?: number;
  largest_win?: number;
  largest_loss?: number;
  profit_factor?: number;
  expectancy?: number;
  expectancy_ratio?: number;
  current_streak: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  total_trades: number;
  total_lots: number;
  avg_hold_time_hours?: number;
  avg_trades_per_day?: number;
  risk_reward_avg?: number;
  kelly_criterion?: number;
  calculated_at: string;
  updated_at: string;
}

export interface DailySnapshot {
  snapshot_id: string;
  account_id: string;
  snapshot_date: string;
  opening_balance: number;
  closing_balance: number;
  high_balance?: number;
  low_balance?: number;
  peak_balance: number;
  daily_pnl: number;
  daily_pnl_pct?: number;
  daily_drawdown_pct?: number;
  trades_opened: number;
  trades_closed: number;
  winning_trades: number;
  losing_trades: number;
  max_drawdown_pct?: number;
  open_positions: number;
  locked_out: boolean;
}

