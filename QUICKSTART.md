# 🚀 Quick Start Guide

## Prerequisites

1. **Node.js 18+**
   ```powershell
   node --version
   ```

2. **PostgreSQL 15+ with pgvector**
   - Install PostgreSQL
   - Enable pgvector extension

3. **API Keys**
   - OpenAI API key
   - Clerk account (for auth)
   - SendGrid account (optional, for email)

---

## Step 1: Install Dependencies

```powershell
cd coffee-advisory-os
npm install
```

---

## Step 2: Setup Environment

```powershell
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

Required variables:
- `POSTGRES_URL` - Your PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

---

## Step 3: Initialize Database

```powershell
# Create database
createdb advisory_os

# Run schema
npm run db:push
```

Or manually:
```powershell
psql -U postgres -d advisory_os -f database/schema.sql
```

---

## Step 4: Start Development

```powershell
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start MCP Server (optional)
npm run mcp:start
```

Navigate to: `http://localhost:3000`

---

## Step 5: Add Sample Data (Optional)

```powershell
# Insert sample origins
psql -U postgres -d advisory_os

INSERT INTO supplier_origins (
  lot_id, country, region, farm_name, 
  is_regenerative, certifications, sustainability_practices,
  carbon_sequestration_kg, available_lbs, fair_trade
) VALUES (
  'BRZ-CER-001', 'Brazil', 'Cerrado', 'Fazenda Santa Clara',
  true, ARRAY['Rainforest Alliance', 'Organic'], 
  ARRAY['Cover cropping', 'Composting', 'Water conservation'],
  2500, 5000, true
);

# Insert sample product
INSERT INTO products (
  sku, name, roast_level, origin_region, origin_country,
  is_regenerative, wholesale_price, stock_lbs, warehouse_location, active
) VALUES (
  'BRZ-MED-001', 'Brazil Cerrado Medium Roast', 'medium', 
  'brazil-cerrado', 'Brazil', true, 8.50, 1000, 'NY-01', true
);
```

---

## Step 6: Create Your First Lead

1. Go to `http://localhost:3000/leads/new` (or use API)

```powershell
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Espresso Haven",
    "email": "owner@espressohaven.com",
    "phone": "555-0123",
    "years_in_business": 5,
    "monthly_revenue": 25000,
    "shop_type": "boutique",
    "monthly_volume_lbs": 200,
    "preferred_roast": "medium"
  }'
```

---

## Step 7: Generate First Proposal

```powershell
curl -X POST http://localhost:3000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<CLIENT_ID_FROM_STEP_6>",
    "volumeTier": "mid",
    "roastProfile": "medium"
  }'
```

---

## Production Deployment

### Deploy to Vercel

```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database

Use **Vercel Postgres** or **Supabase** (both support pgvector).

In Vercel dashboard:
1. Add Postgres database
2. Copy connection string
3. Set environment variables
4. Deploy

---

## MCP Integration

To use MCP agents from Claude Desktop:

1. Create `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "coffee-advisory": {
      "command": "node",
      "args": ["C:\\Users\\Kevan\\coffee-advisory-os\\agents\\mcp-server.ts"],
      "env": {
        "POSTGRES_URL": "your-connection-string",
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. You'll see MCP tools available:
   - `generate_proposal`
   - `score_credit`
   - `get_regenerative_certificate`
   - `draft_outreach_email`
   - And more...

---

## Testing

```powershell
# Test database connection
psql -U postgres -d advisory_os -c "SELECT 1"

# Test pgvector
psql -U postgres -d advisory_os -c "SELECT * FROM pg_extension WHERE extname = 'vector'"

# Test Next.js
curl http://localhost:3000/api/leads
```

---

## Troubleshooting

### Issue: pgvector not found

```powershell
# Install pgvector
git clone --branch v0.5.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

Then in psql:
```sql
CREATE EXTENSION vector;
```

### Issue: OpenAI rate limits

Add delay between requests or upgrade OpenAI plan.

### Issue: Clerk auth not working

1. Check Clerk dashboard for correct keys
2. Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is prefixed correctly
3. Restart dev server

---

## Next Steps

1. Customize branding in `tailwind.config.ts`
2. Add real PDF generation (replace placeholder URLs)
3. Set up SendGrid for actual email sending
4. Configure S3 for document storage
5. Add Stripe for invoicing
6. Deploy to production

---

## Support

For issues or questions:
- Check README.md
- Review agent logs in database: `SELECT * FROM agent_logs`
- Check Next.js logs: `npm run dev`

---

**You're ready to transform coffee distribution with AI.** ☕🚀
