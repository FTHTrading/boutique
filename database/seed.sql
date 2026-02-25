-- Sample seed data for Coffee Advisory OS

-- Sample Clients
INSERT INTO clients (
  business_name, contact_name, email, phone,
  years_in_business, monthly_revenue, shop_type,
  monthly_volume_lbs, preferred_roast,
  has_trade_references, no_late_payments,
  credit_score, payment_terms, status,
  lead_source, city, state
) VALUES 
  (
    'Espresso Haven', 'Maria Garcia', 'maria@espressohaven.com', '555-0123',
    5, 25000, 'boutique', 200, 'medium',
    true, true, 85, 'net-30', 'active',
    'referral', 'Brooklyn', 'NY'
  ),
  (
    'Bean & Brew Co', 'James Chen', 'james@beanandbrewco.com', '555-0456',
    3, 15000, 'boutique', 120, 'light',
    true, true, 72, 'net-15', 'active',
    'direct', 'Manhattan', 'NY'
  ),
  (
    'Highway 95 Gas & Coffee', 'Tom Anderson', 'tom@highway95.com', '555-0789',
    8, 45000, 'gas_station', 350, 'dark',
    true, true, 88, 'net-30', 'active',
    'cold_call', 'Queens', 'NY'
  ),
  (
    'Morning Brew Cafe', 'Sarah Williams', 'sarah@morningbrew.com', '555-0321',
    1, 8000, 'boutique', 80, 'medium',
    false, true, 58, 'prepay', 'qualified',
    'website', 'Brooklyn', 'NY'
  );

-- Sample Supplier Origins
INSERT INTO supplier_origins (
  lot_id, country, region, farm_name, farmer_name,
  is_regenerative, certifications, sustainability_practices,
  carbon_sequestration_kg, biodiversity_score, water_conservation_m3, fair_trade,
  available_lbs, harvest_date, arrival_date
) VALUES 
  (
    'BRZ-CER-001', 'Brazil', 'Cerrado', 'Fazenda Santa Clara', 'Carlos Silva',
    true, ARRAY['Rainforest Alliance', 'Organic'], 
    ARRAY['Cover cropping', 'Composting', 'Water conservation', 'Agroforestry'],
    2500, 85, 150, true,
    5000, '2025-06-15', '2025-08-01'
  ),
  (
    'COL-HUI-001', 'Colombia', 'Huila', 'Finca Los Naranjos', 'Ana Rodriguez',
    true, ARRAY['Fair Trade', 'Bird Friendly', 'Organic'],
    ARRAY['Shade-grown', 'No pesticides', 'Soil restoration', 'Biodiversity corridors'],
    3200, 92, 200, true,
    3500, '2025-05-20', '2025-07-15'
  ),
  (
    'BRZ-MOG-001', 'Brazil', 'Mogiana', 'Sitio Boa Vista', 'Pedro Santos',
    true, ARRAY['UTZ', 'Organic'],
    ARRAY['Integrated pest management', 'Water recycling', 'Native tree planting'],
    1800, 78, 120, false,
    4200, '2025-07-01', '2025-08-20'
  );

-- Sample Products
INSERT INTO products (
  sku, name, description,
  roast_level, origin_region, origin_country, farm_name,
  is_regenerative, sustainability_cert,
  wholesale_price, stock_lbs, warehouse_location, reorder_point, active
) VALUES 
  (
    'BRZ-MED-001', 
    'Brazil Cerrado Medium Roast',
    'Smooth, nutty notes with chocolate undertones. Perfect for espresso or drip.',
    'medium', 'brazil-cerrado', 'Brazil', 'Fazenda Santa Clara',
    true, 'Rainforest Alliance, Organic',
    8.50, 1200, 'NY-01', 200, true
  ),
  (
    'COL-LGT-001',
    'Colombia Huila Light Roast',
    'Bright acidity with fruity notes. Citrus and berry flavors.',
    'light', 'colombia-huila', 'Colombia', 'Finca Los Naranjos',
    true, 'Fair Trade, Bird Friendly',
    9.25, 800, 'NY-01', 150, true
  ),
  (
    'BRZ-DRK-001',
    'Brazil Mogiana Dark Roast',
    'Bold, full-bodied with caramel sweetness. Low acidity.',
    'dark', 'brazil-mogiana', 'Brazil', 'Sitio Boa Vista',
    true, 'UTZ, Organic',
    8.00, 950, 'NY-01', 200, true
  ),
  (
    'COL-MED-001',
    'Colombia Supremo Medium Roast',
    'Balanced, smooth with hints of caramel and nuts.',
    'medium', 'colombia-huila', 'Colombia', 'Finca Los Naranjos',
    true, 'Fair Trade',
    8.75, 600, 'NY-01', 150, true
  );

-- Sample Proposals
INSERT INTO proposals (
  proposal_number, client_id,
  title, custom_message,
  product_ids, volume_tier, total_volume_lbs,
  unit_price, total_price, margin,
  payment_terms, delivery_timeline,
  status, generated_by, agent_confidence
)
SELECT 
  'PROP-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint || '-ESP',
  c.id,
  'Custom Coffee Proposal for Espresso Haven',
  'Dear Maria, Based on your boutique café profile and preference for medium roast...',
  ARRAY(SELECT id FROM products WHERE roast_level = 'medium' LIMIT 2),
  'mid', 200,
  8.00, 1600, 22.5,
  'net-30', 'Delivery within 5-7 business days from our NY warehouse',
  'sent', 'ProposalAgent', 0.87
FROM clients c WHERE business_name = 'Espresso Haven';

-- Sample Agent Logs
INSERT INTO agent_logs (
  agent_name, action,
  client_id, proposal_id,
  input_data, output_data,
  success, tokens_used
)
SELECT
  'ProposalAgent', 'generate_proposal',
  c.id, p.id,
  '{"clientId": "' || c.id || '", "volumeTier": "mid"}',
  '{"proposalId": "' || p.id || '", "confidence": 0.87}',
  true, 1250
FROM clients c
JOIN proposals p ON p.client_id = c.id
WHERE c.business_name = 'Espresso Haven';

-- Update timestamps
UPDATE clients SET last_contact_date = CURRENT_TIMESTAMP - INTERVAL '2 days' WHERE business_name = 'Morning Brew Cafe';
UPDATE clients SET next_follow_up = CURRENT_DATE + INTERVAL '1 day' WHERE business_name = 'Morning Brew Cafe';
