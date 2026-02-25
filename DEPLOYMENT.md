# 🚀 Deployment Guide - Coffee Advisory OS

## Production Deployment Checklist

---

## Pre-Deployment

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] API endpoints tested
- [ ] Error handling implemented

### ✅ Security
- [ ] API keys in environment variables (never committed)
- [ ] CORS configured properly
- [ ] Rate limiting on API routes
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection enabled

### ✅ Database
- [ ] PostgreSQL 15+ with pgvector extension
- [ ] Connection pooling configured
- [ ] Indexes created (see schema.sql)
- [ ] Backup strategy planned
- [ ] SSL/TLS enabled

---

## Vercel Deployment (Recommended)

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Coffee Advisory OS"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/coffee-advisory-os.git
git push -u origin main
```

### Step 2: Setup Vercel Postgres

1. Go to [vercel.com](https://vercel.com)
2. Create new project from GitHub repo
3. Add **Vercel Postgres** in Storage tab
4. Note: Vercel Postgres includes pgvector support

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# Database (auto-populated by Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# OpenAI
OPENAI_API_KEY=sk-...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# SendGrid (optional)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=bradley@advisorycoffee.com

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Step 4: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**That's it!** Your app is live.

---

## Alternative: AWS Deployment

### Infrastructure

```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Load Balancer          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         ECS Fargate                     │
│      (Next.js containers)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         RDS PostgreSQL                  │
│        (with pgvector)                  │
└─────────────────────────────────────────┘
```

### Step 1: Create RDS Instance

```bash
# Create PostgreSQL 15 instance
# Enable pgvector extension
# Configure security groups
```

### Step 2: Build Docker Image

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and push:

```bash
docker build -t coffee-advisory-os .
docker tag coffee-advisory-os:latest YOUR_ECR_REPO:latest
docker push YOUR_ECR_REPO:latest
```

### Step 3: Deploy to ECS

```bash
# Create ECS cluster
# Create task definition
# Create service
# Configure environment variables
```

---

## Database Migration

### First Deployment

```bash
# Connect to production database
psql $POSTGRES_URL

# Run schema
\i database/schema.sql

# Optional: Load sample data
\i database/seed.sql
```

### Future Migrations

Create migration files in `database/migrations/`:

```sql
-- 001_add_new_field.sql
ALTER TABLE clients ADD COLUMN preferred_delivery_day VARCHAR(10);
```

Run:

```bash
psql $POSTGRES_URL -f database/migrations/001_add_new_field.sql
```

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
POSTGRES_URL=postgresql://localhost:5432/advisory_os
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```env
NODE_ENV=staging
POSTGRES_URL=postgresql://staging-db:5432/advisory_os
NEXT_PUBLIC_APP_URL=https://staging.advisoryos.com
```

### Production

```env
NODE_ENV=production
POSTGRES_URL=postgresql://prod-db:5432/advisory_os
NEXT_PUBLIC_APP_URL=https://advisoryos.com
```

---

## SSL/TLS Configuration

### Vercel
- ✅ Automatic SSL for custom domains
- ✅ Auto-renewal

### AWS
```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name advisoryos.com \
  --validation-method DNS

# Attach to load balancer
```

---

## Monitoring & Observability

### Vercel Analytics
- Enable in dashboard
- Real-time traffic metrics
- Error tracking

### Custom Logging

Add in `next.config.js`:

```javascript
module.exports = {
  // ... other config
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

### Error Tracking (Optional)

Add Sentry:

```bash
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

---

## Performance Optimization

### Enable Caching

```typescript
// app/api/leads/route.ts
export const revalidate = 60; // Cache for 60 seconds
```

### Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-s3-bucket.com'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### Database Connection Pooling

Vercel Postgres includes connection pooling by default.

For custom setup:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Backup Strategy

### Automated Backups

**Vercel Postgres**:
- Automatic daily backups
- 7-day retention
- Point-in-time recovery

**AWS RDS**:
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier coffee-advisory-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Manual Backup

```bash
# Dump database
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $POSTGRES_URL < backup_20260225.sql
```

---

## Custom Domain Setup

### Vercel

1. Go to Project Settings → Domains
2. Add custom domain
3. Configure DNS:

```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

### AWS Route 53

```bash
# Create hosted zone
# Add A record pointing to CloudFront
# Add CNAME for www
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Health Checks

### Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/db';

export async function GET() {
  const dbHealthy = await healthCheck();
  
  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy,
  });
}
```

### Monitoring

```bash
# Uptime monitoring
curl https://your-app.vercel.app/api/health
```

---

## Cost Estimation

### Vercel (Startup Plan)

- Hosting: $20/month
- Postgres: $20/month (512MB)
- Bandwidth: Included
- **Total: ~$40/month**

### AWS (Production)

- ECS Fargate: ~$30/month
- RDS PostgreSQL: ~$50/month
- Load Balancer: ~$20/month
- CloudFront: ~$10/month
- **Total: ~$110/month**

### Third-Party Services

- OpenAI API: Pay-per-use (~$20-100/month)
- Clerk Auth: Free (up to 10k users)
- SendGrid: Free (up to 100 emails/day)

---

## Post-Deployment

### ✅ Verification Checklist

- [ ] Homepage loads
- [ ] Dashboard accessible
- [ ] API endpoints responding
- [ ] Database connection working
- [ ] Authentication functional
- [ ] Create test lead
- [ ] Generate test proposal
- [ ] Check agent logs

### ✅ User Onboarding

1. Create admin account
2. Load sample data
3. Generate first proposal
4. Verify email delivery
5. Test full workflow

---

## Troubleshooting

### Issue: Database connection timeout

**Solution**:
```typescript
// Increase timeout
const client = await pool.connect();
client.query('SET statement_timeout = 30000');
```

### Issue: OpenAI rate limits

**Solution**:
- Upgrade OpenAI tier
- Implement request queuing
- Add retry logic with exponential backoff

### Issue: Memory limits on Vercel

**Solution**:
- Upgrade to Pro plan
- Optimize image sizes
- Reduce bundle size

---

## Support & Maintenance

### Regular Tasks

- **Daily**: Monitor errors, check health
- **Weekly**: Review agent logs, analyze metrics
- **Monthly**: Database optimization, backup verification
- **Quarterly**: Security updates, dependency updates

---

**Your Coffee Advisory OS is now production-ready.** ☕🚀
