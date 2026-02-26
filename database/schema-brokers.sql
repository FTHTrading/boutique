-- Broker Inquiries
-- Stores inbound broker / agent onboarding applications

CREATE TABLE IF NOT EXISTS broker_inquiries (
  id                SERIAL PRIMARY KEY,
  firm_name         TEXT NOT NULL,
  contact_name      TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  country           TEXT NOT NULL,
  license_number    TEXT,
  regulatory_body   TEXT,
  commodity_specialty TEXT NOT NULL,
  annual_volume     TEXT NOT NULL,
  years_experience  TEXT,
  message           TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | follow_up
  assigned_to       TEXT,                              -- team member email
  notes             TEXT,                              -- internal notes
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_inquiries_status ON broker_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_broker_inquiries_email  ON broker_inquiries (email);
CREATE INDEX IF NOT EXISTS idx_broker_inquiries_created ON broker_inquiries (created_at DESC);
