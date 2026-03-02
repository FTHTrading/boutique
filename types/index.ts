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

// -----------------------------------------------------------------
// Prop Sharing V3: Firm Risk, Fraud Detection, Dynamic Scaling
// -----------------------------------------------------------------

export type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudAlertStatus = 'open' | 'investigating' | 'confirmed' | 'dismissed' | 'resolved';
export type FraudAlertType =
  | 'latency_arbitrage'
  | 'overfit_scalping'
  | 'copy_trade_cluster'
  | 'statistical_anomaly'
  | 'wash_trading'
  | 'news_straddling'
  | 'overnight_gap_exploit'
  | 'manual_flag';
export type ScalingDirection = 'scale_up' | 'scale_down' | 'hold';

export interface FirmRiskConfig {
  config_id: string;
  config_key: string;
  config_value: Record<string, any>;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FirmExposureSnapshot {
  snapshot_id: string;
  snapshot_time: string;
  total_funded_accounts: number;
  total_capital_deployed: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  net_exposure: number;
  capital_utilization_pct?: number;
  margin_reserve?: number;
  breach_flags: string[];
  is_within_limits: boolean;
  created_at: string;
}

export interface SectorExposure {
  exposure_id: string;
  snapshot_id: string;
  sector: string;
  commodity?: string;
  long_exposure: number;
  short_exposure: number;
  net_exposure: number;
  num_accounts: number;
  pct_of_total?: number;
  breach: boolean;
  created_at: string;
}

export interface CorrelationAlert {
  alert_id: string;
  account_ids: string[];
  commodity: string;
  direction: string;
  correlation?: number;
  combined_exposure?: number;
  num_accounts: number;
  is_active: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface FraudAlert {
  alert_id: string;
  account_id: string;
  alert_type: FraudAlertType;
  severity: FraudAlertSeverity;
  status: FraudAlertStatus;
  title: string;
  description?: string;
  evidence: Record<string, any>;
  flagged_trades: string[];
  detection_score?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  action_taken?: string;
  // Joined fields
  account_number?: string;
  trader_name?: string;
  trader_email?: string;
  program_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TraderBehaviorProfile {
  profile_id: string;
  account_id: string;
  avg_hold_seconds?: number;
  median_hold_seconds?: number;
  min_hold_seconds?: number;
  pct_under_60s?: number;
  pct_under_10s?: number;
  avg_entry_slippage_pct?: number;
  avg_exit_slippage_pct?: number;
  avg_mfe_pct?: number;
  avg_mae_pct?: number;
  preferred_session?: string;
  trades_around_news?: number;
  pct_trades_around_news?: number;
  avg_lot_size?: number;
  lot_size_stddev?: number;
  max_concurrent_positions?: number;
  most_similar_account_id?: string;
  similarity_score?: number;
  calculated_at: string;
  updated_at: string;
}

export interface ScalingRule {
  rule_id: string;
  name: string;
  is_active: boolean;
  priority: number;
  min_sharpe_ratio: number;
  min_profit_factor: number;
  max_drawdown_pct: number;
  min_trading_days: number;
  min_consistency_score: number;
  min_trades: number;
  scale_up_pct: number;
  scale_down_pct: number;
  max_scale_level: number;
  cooldown_days: number;
  volatility_lookback_days: number;
  max_volatility_pct: number;
  created_at: string;
  updated_at: string;
}

export interface ScalingEvent {
  event_id: string;
  account_id: string;
  rule_id?: string;
  direction: ScalingDirection;
  previous_level: number;
  new_level: number;
  previous_capital: number;
  new_capital: number;
  reason: string;
  metrics_snapshot: Record<string, any>;
  approved_by?: string;
  auto_approved: boolean;
  // Joined
  account_number?: string;
  trader_name?: string;
  rule_name?: string;
  created_at: string;
}

// ── V4: Execution Architecture Types ──────────────────────────

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'pending' | 'filled' | 'partial' | 'rejected' | 'cancelled' | 'expired';
export type FillType = 'full' | 'partial' | 'none';
export type BlackoutAction = 'block' | 'warn' | 'log_only';

export interface ExecutionConfig {
  config_id: string;
  instrument: string;
  session_name: string;
  base_spread_bps: number;
  volatility_spread_mult: number;
  base_slippage_bps: number;
  size_slippage_mult: number;
  size_threshold_lots: number;
  commission_per_lot: number;
  partial_fill_enabled: boolean;
  max_partial_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketSession {
  session_id: string;
  instrument: string;
  session_name: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  timezone: string;
  is_active: boolean;
}

export interface NewsBlackout {
  blackout_id: string;
  name: string;
  instruments: string[];
  blackout_start: string;
  blackout_end: string;
  pre_window_mins: number;
  post_window_mins: number;
  action: BlackoutAction;
  severity: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  is_active: boolean;
  created_at: string;
}

export interface ExecutionTrace {
  trace_id: string;
  trade_id: string;
  account_id: string;
  order_type: OrderType;
  order_status: OrderStatus;
  intended_price: number;
  fill_price: number;
  spread_applied: number;
  slippage_applied: number;
  commission_charged: number;
  fill_type: FillType;
  fill_pct: number;
  quantity_requested: number;
  quantity_filled: number;
  execution_latency_ms: number;
  market_session?: string;
  volatility_regime: string;
  blackout_active: boolean;
  blackout_id?: string;
  notes?: string;
  executed_at: string;
}

export interface ExecutionDailySummary {
  summary_id: string;
  summary_date: string;
  account_id?: string;
  total_orders: number;
  fills: number;
  partial_fills: number;
  rejections: number;
  avg_spread_bps: number;
  avg_slippage_bps: number;
  total_commissions: number;
  blackout_violations: number;
}

// ── V4: Behavioral Risk Scoring Types ─────────────────────────

export type InterventionType = 'warning' | 'restriction' | 'freeze' | 'phase_rollback';
export type InterventionStatus = 'pending' | 'active' | 'expired' | 'overridden';

export interface StabilityScore {
  score_id: string;
  account_id: string;
  overall_score: number;
  discipline_score: number;
  consistency_score: number;
  aggression_score: number;
  rule_adherence: number;
  position_sizing_variance: number;
  leverage_escalation_slope: number;
  revenge_trade_count: number;
  martingale_count: number;
  overtrade_burst_count: number;
  panic_exit_count: number;
  rule_violation_count: number;
  post_loss_aggression: number;
  hold_time_cv: number;
  previous_score?: number;
  score_delta: number;
  trend_direction: string;
  calculated_at: string;
  // Joined
  account_number?: string;
  trader_name?: string;
}

export interface Intervention {
  intervention_id: string;
  account_id: string;
  intervention_type: InterventionType;
  trigger_reason: string;
  trigger_score?: number;
  trigger_signals: Record<string, any>;
  action_details: Record<string, any>;
  status: InterventionStatus;
  auto_triggered: boolean;
  approved_by?: string;
  expires_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  // Joined
  account_number?: string;
  trader_name?: string;
}

// ── V4: Treasury Capital Guard Types ──────────────────────────

export type ThrottleStatus = 'normal' | 'caution' | 'throttled' | 'frozen';

export interface ReservePolicy {
  policy_id: string;
  name: string;
  min_reserve_absolute: number;
  min_reserve_pct: number;
  dynamic_buffer_enabled: boolean;
  volatility_lookback_days: number;
  volatility_buffer_mult: number;
  max_funded_traders: number;
  max_total_notional: number;
  max_per_instrument: number;
  max_per_sector_pct: number;
  stress_gap_pct: number;
  stress_correlation: number;
  is_active: boolean;
}

export interface ThrottleState {
  state_id: string;
  status: ThrottleStatus;
  available_capital: number;
  reserve_required: number;
  reserve_actual: number;
  reserve_pct: number;
  buffer_health: number;
  funded_count: number;
  funded_cap: number;
  scaling_paused: boolean;
  new_funding_paused: boolean;
  reason?: string;
  checked_at: string;
}

export interface StressTest {
  test_id: string;
  scenario_name: string;
  scenario_type: string;
  gap_pct?: number;
  correlation_shock?: number;
  estimated_loss: number;
  capital_remaining: number;
  survival: boolean;
  survival_score: number;
  affected_accounts: number;
  details: Record<string, any>;
  run_at: string;
}

export interface CapitalSnapshot {
  snapshot_id: string;
  snapshot_date: string;
  total_capital: number;
  deployed_capital: number;
  reserve_capital: number;
  unrealized_pnl: number;
  retained_earnings: number;
  eval_fee_revenue: number;
  payout_obligations: number;
  net_position: number;
  firm_volatility_30d: number;
  throttle_status: ThrottleStatus;
}

// ── V4: Funnel Optimization Types ─────────────────────────────

export interface Cohort {
  cohort_id: string;
  cohort_type: string;
  start_date: string;
  end_date: string;
  total_applicants: number;
  total_paid: number;
  total_started: number;
  total_passed: number;
  total_funded: number;
  total_fraud_flagged: number;
  avg_time_to_pass_days: number;
  total_eval_revenue: number;
  total_payouts: number;
  net_revenue: number;
}

export interface ChannelQuality {
  channel_id: string;
  utm_source: string;
  utm_medium?: string;
  utm_campaign?: string;
  total_applications: number;
  total_paid: number;
  total_passed: number;
  total_funded: number;
  total_fraud: number;
  pay_rate: number;
  pass_rate: number;
  fund_rate: number;
  fraud_rate: number;
  quality_score: number;
  ltv_proxy: number;
  avg_funded_days: number;
  avg_time_to_pass: number;
  is_suppressed: boolean;
  suppress_reason?: string;
  top_countries: any[];
  calculated_at: string;
}

export interface KillSwitch {
  switch_id: string;
  scope: 'trader' | 'instrument' | 'firm';
  target_id?: string;
  is_active: boolean;
  reason?: string;
  activated_by?: string;
  activated_at?: string;
  deactivated_at?: string;
}

// ── V5-D: Stress Simulation Types ───────────────────────────

export type SimulationStatus = 'pending' | 'running' | 'completed' | 'failed';
export type AssertionResult = 'pass' | 'fail' | 'warn' | 'skip';
export type ScenarioType = 'full_lifecycle' | 'treasury_throttle' | 'behavior_seams' | 'funnel_suppression' | 'execution_blackout' | 'enforcement_verify' | 'custom';

export interface SimulationRun {
  run_id: number;
  scenario: ScenarioType;
  scenario_name: string;
  status: SimulationStatus;
  seed: number;
  config: Record<string, any>;
  total_events: number;
  total_assertions: number;
  passed: number;
  failed: number;
  warnings: number;
  enforcement_score: number;
  trace_integrity_score: number;
  behavior_seam_score: number;
  funnel_cliff_score: number;
  compounding_readiness: number;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export interface SimulationEvent {
  event_id: number;
  run_id: number;
  sequence_num: number;
  event_type: string;
  description: string;
  input_state: Record<string, any>;
  output_state: Record<string, any>;
  entity_type: string;
  entity_id: string;
  audit_log_id?: string;
  execution_trace_id?: string;
  duration_ms: number;
  created_at: string;
}

export interface SimulationAssertion {
  assertion_id: number;
  run_id: number;
  event_id?: number;
  category: string;
  assertion_name: string;
  description: string;
  expected_value: string;
  actual_value: string;
  result: AssertionResult;
  tolerance?: number;
  deviation?: number;
  severity: 'critical' | 'major' | 'minor';
  created_at: string;
}

// ── V5-B: Capital Compounding Types ─────────────────────────

export type CompoundingPolicyStatus = 'active' | 'paused' | 'draft' | 'retired';
export type CompoundingActionType = 'allocate_to_vertical' | 'adjust_capacity' | 'adjust_marketing_cap' | 'propose_dividend' | 'lock_compounding';
export type CompoundingRunMode = 'dry_run' | 'execute' | 'proposed';

export interface CompoundingPolicy {
  policy_id: number;
  name: string;
  description: string;
  status: CompoundingPolicyStatus;
  priority: number;
  min_retained_earnings?: number;
  min_buffer_health?: number;
  min_buffer_days: number;
  min_channel_quality?: number;
  min_channel_quality_days: number;
  min_cohort_survival?: number;
  max_fraud_rate?: number;
  min_readiness_score: number;
  action_type: CompoundingActionType;
  action_params: Record<string, any>;
  requires_approval: boolean;
  max_executions_per_quarter: number;
  cooldown_days: number;
  last_evaluated?: string;
  last_executed?: string;
  created_at: string;
  updated_at: string;
}

export interface CompoundingRun {
  run_id: number;
  mode: CompoundingRunMode;
  retained_earnings: number;
  buffer_health: number;
  buffer_consecutive_days: number;
  avg_channel_quality: number;
  avg_cohort_survival: number;
  fraud_rate: number;
  readiness_score: number;
  treasury_status: string;
  policies_evaluated: number;
  policies_eligible: number;
  actions_proposed: number;
  actions_executed: number;
  actions_blocked: number;
  blocked_reason?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface CompoundingAction {
  action_id: number;
  run_id: number;
  policy_id: number;
  action_type: CompoundingActionType;
  action_params: Record<string, any>;
  amount: number;
  target_vertical?: string;
  mode: CompoundingRunMode;
  executed: boolean;
  approved_by?: string;
  approved_at?: string;
  blocked: boolean;
  blocked_reason?: string;
  input_snapshot: Record<string, any>;
  treasury_entry_id?: string;
  audit_log_id?: string;
  created_at: string;
}

export interface VerticalAllocation {
  allocation_id: number;
  vertical: string;
  amount: number;
  source: string;
  action_id?: number;
  policy_id?: number;
  treasury_entry_id?: string;
  status: 'pending' | 'allocated' | 'deployed' | 'returned';
  deployed_at?: string;
  notes?: string;
  created_at: string;
}

