# Compliance System Deployment Addendum

This addendum covers deployment of the compliance intelligence layer added in February 2026. See main [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for core platform deployment.

## Quick Start

```bash
# 1. Initialize compliance database schema
psql $DATABASE_URL -f database/schema-compliance.sql

# 2. Sync jurisdiction YAML files to database
npm install js-yaml
node scripts/sync-yaml-to-db.js

# 3. Seed commodity data
psql $DATABASE_URL -f database/seed-commodities.sql

# 4. Test compliance screening
node scripts/test-compliance.js

# 5. Deploy to Vercel (compliance routes included)
vercel --prod
```

## Architecture

**TradeComplianceAgent** screens deals for:
- **Sanctions** (OFAC, Entity List) → CRITICAL if destination/origin is sanctioned
- **AML** ($50K+ → HIGH, $100K+ precious metals → CRITICAL)
- **Export Controls** (restricted commodities → HIGH)
- **Incoterms** (DDP → MEDIUM, others → LOW)
- **Documentation** (phytosanitary certs, licenses)
- **Value Thresholds** ($10K+ → LOW advisory)

**Severity Levels**:
- **CRITICAL** - Blocks execution, requires compliance officer + legal counsel review within 24h
- **HIGH** - Requires compliance officer approval within 48h
- **MEDIUM** - Requires deal manager review within 72h
- **LOW** - Advisory only, no formal sign-off required

See [docs/compliance.md](docs/compliance.md) for full architecture documentation with Mermaid diagrams.

## Database Setup

**Initialize Schema**:

```bash
# Run compliance schema (adds 5 tables: jurisdictions, commodities, deals, compliance_flags, compliance_actions)
psql $DATABASE_URL -f database/schema-compliance.sql

# Verify tables created
psql $DATABASE_URL -c "\dt *compliance*"
```

**Seed Jurisdictions** (from YAML files):

Create `scripts/sync-yaml-to-db.js`:

```javascript
// See full script in DEPLOYMENT-GUIDE.md main file
// Reads rules/jurisdictions/*.yaml, upserts to jurisdictions table
```

Run sync:

```bash
node scripts/sync-yaml-to-db.js
# Expected: 7 jurisdictions synced (US, RU, CN, BR, CH, GB, EU)
```

**Seed Commodities**:

```sql
-- database/seed-commodities.sql
INSERT INTO commodities (commodity_id, name, hs_code, category, restricted, compliance_notes) VALUES
(gen_random_uuid(), 'Coffee', '0901.11', 'agricultural', false, 'Phytosanitary certificate required.'),
(gen_random_uuid(), 'Cocoa', '1801.00', 'agricultural', false, 'Phytosanitary certificate, moisture <7.5%.'),
(gen_random_uuid(), 'Gold', '7108.13', 'metals', true, 'Enhanced AML/KYC mandatory. LBMA Good Delivery. Chain-of-custody required.'),
(gen_random_uuid(), 'Silver', '7106.92', 'metals', true, 'LBMA Good Delivery. Chain-of-custody required.'),
(gen_random_uuid(), 'Copper', '7403.11', 'metals', false, 'Standard documentation. LME grading.'),
(gen_random_uuid(), 'Crude Oil', '2709.00', 'energy', true, 'OFAC screening MANDATORY. Export/import authorization required.'),
(gen_random_uuid(), 'Sugar', '1701.14', 'agricultural', false, 'Phytosanitary certificate. ICUMSA standards.');
```

Run:

```bash
psql $DATABASE_URL -f database/seed-commodities.sql

# Verify
psql $DATABASE_URL -c "SELECT name, hs_code, restricted FROM commodities;"
```

## Testing

**Create Test Deal**:

```sql
INSERT INTO deals (deal_id, deal_number, client_name, commodity_id, deal_value_usd, origin_country, destination_country, incoterm, compliance_status)
VALUES (
  gen_random_uuid(), 'TEST-001', 'Test Client',
  (SELECT commodity_id FROM commodities WHERE name='Coffee'), 100000, 'BR', 'US', 'FOB', 'pending_compliance'
);
```

**Run Screening**:

```javascript
// scripts/test-compliance.js
const { runComplianceScreen } = require('../agents/trade-compliance-agent');
const { db } = require('../lib/db');

async function test() {
  const deal = await db.query.deals.findFirst({
    where: eq(deals.deal_number, 'TEST-001'),
    with: { commodity: true, originJurisdiction: true, destinationJurisdiction: true }
  });
  
  await runComplianceScreen(deal);
  
  // Check flags created
  const flags = await db.query.compliance_flags.findMany({
    where: eq(compliance_flags.deal_id, deal.deal_id)
  });
  
  console.log('Flags generated:', flags.length);
  flags.forEach(f => console.log(`  ${f.severity}: ${f.message}`));
}

test();
```

Expected output:
```
Flags generated: 2
  HIGH: High-value transaction ($100,000 USD). Enhanced KYC required.
  LOW: Transaction value $100,000 exceeds $10,000 reporting threshold.
```

## Routes

**Public** (no auth):
- `/` - Homepage with multi-commodity positioning
- `/commodities` - Catalog of 6 commodities (Coffee, Cocoa, Precious Metals, Base Metals, Sugar, Energy)
- `/commodities/[slug]` - Dynamic detail pages (e.g., `/commodities/coffee`)
- `/request-terms` - Client intake form
- `/compliance` - Compliance framework explanation with legal disclaimers

**Dashboard** (requires Clerk auth):
- `/dashboard/deals` - Deals table with compliance status badges
- `/dashboard/compliance` - Flag review and resolution workflow
- `/dashboard/rules` - Jurisdiction + commodity metadata management

Test routes:

```bash
# Public (should load)
curl https://your-domain.vercel.app/commodities

# Dashboard (should redirect to /sign-in)
curl https://your-domain.vercel.app/dashboard/deals
```

## User Roles

Configure in Clerk Dashboard → Users → Public Metadata:

**Compliance Officer** (sarah.chen@fthtrading.com):
```json
{
  "role": "compliance_officer",
  "permissions": ["view_flags", "resolve_flags", "edit_jurisdictions"]
}
```

**Legal Counsel** (michael.rodriguez@fthtrading.com):
```json
{
  "role": "legal_counsel",
  "permissions": ["view_critical_flags", "provide_legal_opinions"]
}
```

**Deal Manager**:
```json
{
  "role": "deal_manager",
  "permissions": ["view_own_deals", "resolve_medium_flags"]
}
```

## Maintenance

**Quarterly Review** (Jan 15, Apr 15, Jul 15, Oct 15):

```bash
# 1. Review jurisdiction YAML files for regulatory changes
cd rules/jurisdictions
# Edit files: update sanctions_notes, next_review_date, version

# 2. Sync updates to database
node scripts/sync-yaml-to-db.js

# 3. Commit changes
git add rules/jurisdictions/*.yaml
git commit -m "chore: Q2 2026 jurisdiction review"
git push origin main
```

**Compliance Metrics**:

```sql
-- Unresolved CRITICAL flags (should be 0 after 24h)
SELECT COUNT(*) FROM compliance_flags 
WHERE severity='CRITICAL' AND resolved=false AND created_at < NOW() - INTERVAL '24 hours';

-- Average resolution time by severity
SELECT severity, 
       AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,1) AS avg_hours
FROM compliance_flags 
WHERE resolved=true 
GROUP BY severity;
```

## Next Steps

**Current State**: 
- ✅ Database schema deployed
- ✅ 7 jurisdictions seeded from YAML files
- ✅ 7 commodities seeded
- ✅ TradeComplianceAgent operational
- ✅ Public routes deployed (catalog, request form, compliance page)
- ✅ Dashboard routes deployed (deals, compliance, rules - using mock data)

**To Make Fully Operational**:

1. **Implement API Routes** (2-3 days):
   - `POST /api/leads` - Submit request, create deal, run screening
   - `GET /api/deals` - List deals
   - `GET /api/compliance/flags` - List flags
   - `POST /api/compliance/flags/[id]/resolve` - Resolve flag
   - `GET/POST/PATCH /api/jurisdictions` - Jurisdiction CRUD
   - `GET/POST/PATCH /api/commodities` - Commodity CRUD

2. **Configure Email Notifications**:
   - SendGrid template for CRITICAL flags
   - Email compliance officer + legal counsel on CRITICAL flags
   - Daily digest for HIGH flags

3. **Monitoring**:
   - Alert if CRITICAL flag unresolved >24h
   - Alert if HIGH flag unresolved >48h
   - Database connection health checks

See [docs/compliance.md](docs/compliance.md) for detailed API specifications and full architecture documentation.

## Troubleshooting

**Issue: Jurisdictions not seeding**

```bash
# Check YAML syntax
npm install -g js-yaml
js-yaml rules/jurisdictions/US.yaml

# Verify database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check table exists
psql $DATABASE_URL -c "\d jurisdictions"
```

**Issue: Flags not generating**

```bash
# Verify jurisdictions exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM jurisdictions;"  # Should be 7

# Verify commodities exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM commodities;"  # Should be 7

# Test TradeComplianceAgent directly
node scripts/test-compliance.js
```

**Issue: Dashboard shows no data**

Currently dashboard uses mock data. API routes not yet implemented. To see real data, implement API routes per [docs/compliance.md](docs/compliance.md).

## Security

- [ ] Database backups enabled (daily)
- [ ] SSL/TLS configured (Vercel automatic)
- [ ] `.env.local` not committed to Git
- [ ] Clerk roles assigned (3 users minimum)
- [ ] Audit trail tested (`compliance_actions` logs created)
- [ ] 7-year retention policy documented
- [ ] Quarterly review calendar reminders set

## Resources

- [docs/compliance.md](docs/compliance.md) - Full architecture with Mermaid diagrams
- [docs/commodities.md](docs/commodities.md) - Commodity-agnostic platform guide
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Main platform deployment

---

**Last Updated**: 2026-02-25  
**Compliance System Version**: 1.0  
**Status**: ✅ Architecture deployed, ⏸ API routes to be implemented
