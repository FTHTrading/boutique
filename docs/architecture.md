# Coffee Advisory OS - Architecture Deep Dive

## System Architecture

Coffee Advisory OS is built as a three-tier AI-native platform:

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│         Next.js 14 + React + TailwindCSS            │
│   Dashboard | Leads | Proposals | Analytics         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│            Intelligence Layer                        │
│          MCP-Orchestrated Agent System               │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Proposal  │  │Credit    │  │Supplier  │          │
│  │Agent     │  │Agent     │  │Agent     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  ┌──────────┐  ┌──────────┐                         │
│  │Outreach  │  │Compliance│                         │
│  │Agent     │  │Agent     │                         │
│  └──────────┘  └──────────┘                         │
│                                                      │
│         RAG System (pgvector)                       │
│    Semantic Search | Context Retrieval              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│               Data Layer                            │
│        PostgreSQL 15 + pgvector                     │
│                                                      │
│  Clients | Proposals | Products | Invoices          │
│  Documents (Vectorized) | Agent Logs                │
└─────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Agent System

Each agent is a specialized module with:
- **Specific responsibility domain**
- **Tool access** (database, LLM, external APIs)
- **Memory** (RAG context retrieval)
- **Action logging** (audit trail)

#### ProposalAgent
**Purpose**: Generate tailored proposals

**Process**:
1. Fetch client profile
2. Retrieve similar successful proposals via RAG
3. Select matching products
4. Generate custom message using GPT-4
5. Calculate pricing based on volume & credit
6. Create PDF, web version, email
7. Index proposal for future retrieval

**Key Functions**:
- `generateProposal(request)` - Full generation
- `regenerateProposal(id, mods)` - Version updates
- `analyzeConversionRates()` - Performance metrics

#### CreditRiskAgent
**Purpose**: Assess creditworthiness

**Scoring Algorithm**:
```typescript
Total Score = 
  Years in Business (0-20) +
  Monthly Revenue (0-25) +
  D&B Score (0-30) +
  Trade References (0-15) +
  Payment History (0-20)
  
80+ = Net 30 (Low Risk)
65-79 = Net 15 (Medium Risk)
<65 = Prepay (High Risk)
```

**Key Functions**:
- `scoreClient(id)` - Calculate credit score
- `getHighRiskClients()` - Risk monitoring
- `monitorOverdueInvoices()` - Payment tracking
- `flagRiskAccounts()` - Automatic term adjustment

#### SupplierOriginAgent
**Purpose**: Track regenerative sourcing

**Capabilities**:
- Generate sustainability certificates
- Calculate environmental impact
- Monitor inventory by origin
- Link products to farm data

**Impact Metrics**:
- Carbon sequestration (kg)
- Biodiversity score
- Water conservation (m³)
- Fair trade status

#### OutreachAgent
**Purpose**: Automate client communication

**Features**:
- AI-drafted personalized emails
- Scheduled follow-ups
- Response tracking
- Messaging optimization

**Email Types**:
- `initial` - First outreach
- `follow_up` - Check-ins
- `proposal` - Proposal delivery
- `reorder` - Repeat business

#### ComplianceAgent
**Purpose**: Ensure regulatory compliance

**Verification Checks**:
1. Payment terms match credit score
2. Pricing within margin thresholds
3. Required fields present
4. High-value deal approval
5. Legal language included

**Output**: Pass/fail with specific issues flagged

---

### 2. RAG (Retrieval Augmented Generation)

**Purpose**: Provide contextual memory across all operations

**Implementation**:
- OpenAI `text-embedding-ada-002` for vectorization
- PostgreSQL `pgvector` for storage
- Cosine similarity search

**Indexed Content**:
- Past proposals
- Client communications
- Product specifications
- Sustainability certificates
- Contract templates

**Process**:
```
User Query
  ↓
Generate embedding (OpenAI)
  ↓
Vector similarity search (pgvector)
  ↓
Retrieve top K documents (threshold > 0.7)
  ↓
Inject as context into GPT-4 prompt
  ↓
Generate contextual response
```

**Key Functions**:
- `indexDocument()` - Add to knowledge base
- `retrieveRelevant()` - Semantic search
- `ragQuery()` - Question answering
- `findSimilarProposals()` - Historical matching

---

### 3. MCP (Model Context Protocol)

**Purpose**: Standardized interface for agent orchestration

**Architecture**:
- STDIO transport
- JSON-RPC protocol
- Tool registry
- Request/response pattern

**Benefits**:
- External systems can invoke agents
- Claude Desktop integration
- Unified logging
- Error handling

**Available Tools**:
- `generate_proposal`
- `score_credit`
- `get_regenerative_certificate`
- `draft_outreach_email`
- `schedule_follow_up`
- `verify_proposal_compliance`
- `get_dashboard_metrics`

---

## Data Model

### Key Tables

#### clients
Core customer data:
- Business profile
- Credit scoring inputs
- Coffee preferences
- Contact history

#### proposals
Generated offers:
- Content & pricing
- Status tracking
- Agent metadata
- Version history

#### products
Coffee inventory:
- SKU details
- Origin data
- Sustainability info
- Pricing tiers

#### documents
RAG knowledge base:
- Text content
- Vector embeddings
- Associations
- Metadata

#### agent_logs
Audit trail:
- Agent actions
- Input/output data
- Success/failure
- Token usage

---

## AI Integration Points

### OpenAI GPT-4
**Use Cases**:
1. Custom proposal message generation
2. Email draft composition
3. Client inquiry responses

**Configuration**:
- Model: `gpt-4-turbo-preview`
- Temperature: 0.7-0.8 (creative)
- Max tokens: 500-1000
- Context injection via RAG

### OpenAI Embeddings
**Use Cases**:
- Document vectorization
- Semantic search
- Similar proposal matching

**Configuration**:
- Model: `text-embedding-ada-002`
- Dimensions: 1536
- Batch processing for efficiency

---

## Security & Compliance

### Authentication
- Clerk for user management
- Row-level security on client data
- API key rotation

### Data Privacy
- Client data encrypted at rest
- PII handling compliance
- GDPR-ready architecture

### Audit Trail
- All agent actions logged
- Proposal approval chain
- Payment term verification

---

## Scalability

### Current Architecture
- Supports: 100-500 clients
- Proposal generation: <5s
- Concurrent users: 10-20

### Scaling Path
**Phase 1** (500-2000 clients):
- Add Redis caching
- Implement job queue
- Optimize vector search

**Phase 2** (2000+ clients):
- Read replicas
- CDN for static assets
- Microservices split

---

## Deployment

### Development
```bash
npm run dev      # Next.js (port 3000)
npm run mcp:start # MCP server (port 3001)
```

### Production (Vercel)
- Next.js: Vercel Edge Runtime
- Database: Vercel Postgres (pgvector)
- Files: Vercel Blob Storage
- Functions: Serverless

### Environment Variables
```
POSTGRES_URL
OPENAI_API_KEY
CLERK_SECRET_KEY
SENDGRID_API_KEY
```

---

## Performance Optimization

### Database
- Indexed fields: status, client_id, created_at
- Vector index: IVFFlat on embeddings
- Connection pooling

### API
- Response caching
- Request debouncing
- Lazy loading

### AI
- Prompt caching
- Batch embedding generation
- Token optimization

---

## Monitoring

### Key Metrics
- Proposal generation time
- Credit scoring accuracy
- RAG retrieval quality
- Email response rates
- Conversion rates

### Logging
- Structured JSON logs
- Agent action tracking
- Error monitoring
- Token usage

---

## Future Enhancements

1. **Stripe Integration** - Automated invoicing
2. **Plaid Credit Checks** - Real-time credit verification
3. **Inventory Forecasting** - ML-based demand prediction
4. **Mobile App** - Native iOS/Android
5. **Multi-tenant** - SaaS for other distributors
6. **Blockchain Provenance** - Immutable origin tracking

---

**This architecture scales from boutique advisory to enterprise distribution.**
