# Compliance Intelligence Layer - Architecture Documentation

## ⚠️ Critical Legal Disclaimer

**This platform is a risk-flagging system, NOT a legal compliance certification tool.**

The TradeComplianceAgent screens transactions for potential compliance risks based on programmatic rules and stored jurisdiction metadata. It generates flags that **require human review by qualified compliance personnel and/or legal counsel**.

### This System Does NOT:
1. Provide legal advice or regulatory interpretations
2. Certify compliance with any specific law or regulation
3. Replace the need for licensed attorneys or compliance professionals
4. Guarantee regulatory approval or transaction legality

### This System DOES:
1. Flag potential compliance risks based on risk-based screening rules
2. Enforce human review gates for CRITICAL and HIGH severity issues
3. Maintain audit trails of all compliance decisions
4. Store jurisdiction metadata with source tracking for defensibility

**All transactions are subject to final review and approval by FTH Trading's compliance team and may require additional legal counsel depending on complexity and jurisdiction.**

---

## Architecture Overview

The compliance intelligence layer implements a **risk-based approach** aligned with OFAC Framework for Compliance Commitments and FinCEN BSA/AML guidance. It does not attempt to hardcode "all laws" but rather:

1. **Stores jurisdiction metadata** (risk bands, required docs, licensing notes)
2. **Performs screening hooks** (sanctions, AML, export controls, documentation)
3. **Enforces human review gates** (blocks execution for CRITICAL flags)
4. **Logs every compliance decision** (audit trail with 7-year retention)

### High-Level Data Flow

\`\`\`mermaid
flowchart TB
    A[Client Submits Request] --> B[Deal Created in System]
    B --> C[TradeComplianceAgent.runComplianceScreen]
    C --> D[screenSanctions]
    C --> E[screenAML]
    C --> F[screenCommodity]
    C --> G[screenIncoterms]
    C --> H[screenDocumentation]
    C --> I[screenValue]
    
    D --> J{Sanctions Risk?}
    E --> K{AML Risk?}
    F --> L{Export Control?}
    G --> M{Incoterm Complexity?}
    H --> N{Docs Missing?}
    I --> O{Value Threshold?}
    
    J -->|CRITICAL| P[CRITICAL Flag - Blocks Execution]
    J -->|None| Q[No Flag]
    
    K -->|HIGH| R[HIGH Flag - Requires Approval]
    K -->|None| Q
    
    L -->|HIGH| R
    L -->|None| Q
    
    M -->|MEDIUM| S[MEDIUM Flag - Review Required]
    M -->|LOW| T[LOW Flag - Advisory]
    M -->|None| Q
    
    N -->|MEDIUM| S
    N -->|None| Q
    
    O -->|LOW| T
    O -->|None| Q
    
    P --> U[persistFlags to DB]
    R --> U
    S --> U
    T --> U
    
    U --> V{Any CRITICAL Flags?}
    V -->|Yes| W[Deal Status: BLOCKED]
    V -->|No| X{Any HIGH Flags?}
    X -->|Yes| Y[Deal Status: PENDING_COMPLIANCE]
    X -->|No| Z[Deal Status: CLEARED]
    
    W --> AA[Notification to Compliance Team]
    Y --> AA
    Z --> AB[Deal Proceeds to Credit Scoring]
\`\`\`

---

## Compliance Screening Workflow

### Detailed Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant LeadForm as /request-terms Form
    participant API as API Route
    participant TCA as TradeComplianceAgent
    participant DB as PostgreSQL Database
    participant Team as Compliance Team
    
    Client->>LeadForm: Submit sourcing request
    LeadForm->>API: POST /api/leads
    API->>DB: Create deal record
    DB-->>API: deal_id returned
    
    API->>TCA: runComplianceScreen(deal)
    
    TCA->>DB: Fetch destination jurisdiction metadata
    DB-->>TCA: jurisdiction data (sanctions_risk, etc.)
    
    TCA->>TCA: screenSanctions()
    Note over TCA: If sanctions_risk = 'critical' → CRITICAL flag
    
    TCA->>TCA: screenAML()
    Note over TCA: If deal_value_usd >= $50K → HIGH flag
    
    TCA->>TCA: screenCommodity()
    Note over TCA: If commodity.restricted = true → HIGH flag
    
    TCA->>TCA: screenIncoterms()
    Note over TCA: If incoterm = 'DDP' → MEDIUM flag
    
    TCA->>TCA: screenDocumentation()
    Note over TCA: Generate required docs list → LOW flag
    
    TCA->>TCA: screenValue()
    Note over TCA: If value >= $10K → LOW flag (advisory)
    
    TCA->>DB: persistFlags(dealId, flags[])
    Note over DB: Insert into compliance_flags table
    
    TCA->>DB: Log to compliance_actions (audit trail)
    
    TCA->>DB: Update deal.compliance_status
    alt CRITICAL flags exist
        DB-->>TCA: deal.status = 'blocked'
    else HIGH flags exist
        DB-->>TCA: deal.status = 'pending_compliance'
    else No flags
        DB-->>TCA: deal.status = 'cleared'
    end
    
    TCA-->>API: Flags returned
    API-->>LeadForm: Response with flag summary
    LeadForm-->>Client: Confirmation + compliance notes
    
    alt CRITICAL or HIGH flags
        API->>Team: Email notification with flag details
        Team->>DB: Review flags in /dashboard/compliance
        Team->>DB: Resolve flag with notes
        Note over DB: Flag marked resolved_by, resolved_at, resolution_notes
    end
\`\`\`

---

## Flag Severity Decision Tree

\`\`\`mermaid
graph TD
    A[Deal Submitted] --> B{Destination in CRITICAL jurisdiction?}
    B -->|Yes e.g., Russia, North Korea| C[CRITICAL Flag: SANCTIONS]
    B -->|No| D{Origin in CRITICAL jurisdiction?}
    D -->|Yes| C
    D -->|No| E{Deal value >= $100K?}
    E -->|Yes AND Commodity is Precious Metals| F[CRITICAL Flag: AML - Extraordinary EDD]
    E -->|No| G{Deal value >= $50K?}
    G -->|Yes| H[HIGH Flag: AML - Enhanced KYC Required]
    G -->|No| I{Commodity restricted?}
    
    I -->|Yes e.g., Gold, Crude Oil| J[HIGH Flag: EXPORT_CONTROL]
    I -->|No| K{Incoterm is DDP?}
    
    K -->|Yes| L[MEDIUM Flag: INCOTERM - IOR Obligations]
    K -->|No| M{Incoterm is FOB/CIF/EXW?}
    M -->|Yes| N[LOW Flag: INCOTERM - Advisory]
    M -->|No| O{Deal value >= $10K?}
    
    O -->|Yes| P[LOW Flag: VALUE - Reporting Threshold]
    O -->|No| Q[No Flag: Deal Cleared]
    
    C --> R[blocks_execution = true]
    F --> R
    J --> S[requires_human_review = true]
    H --> S
    L --> T[requires_review = true]
    N --> U[Advisory only]
    P --> U
    
    R --> V[Deal Status: BLOCKED]
    S --> W[Deal Status: PENDING_COMPLIANCE]
    T --> X[Deal Status: PENDING_REVIEW]
    U --> Y[Deal Status: CLEARED with advisories]
    Q --> Z[Deal Status: CLEARED]
\`\`\`

---

## Database Schema Relationships

\`\`\`mermaid
erDiagram
    DEALS ||--o{ COMPLIANCE_FLAGS : has
    DEALS ||--o{ COMPLIANCE_ACTIONS : generates
    JURISDICTIONS ||--o{ DEALS : destination
    JURISDICTIONS ||--o{ DEALS : origin
    COMMODITIES ||--o{ DEALS : commodity
    COMPLIANCE_FLAGS ||--o{ COMPLIANCE_ACTIONS : triggers
    
    DEALS {
        uuid deal_id PK
        string deal_number
        string client_name
        decimal deal_value_usd
        string origin_country FK
        string destination_country FK
        uuid commodity_id FK
        string incoterm
        string compliance_status
        timestamp created_at
    }
    
    COMPLIANCE_FLAGS {
        uuid flag_id PK
        uuid deal_id FK
        string flag_type
        string severity
        string message
        text recommendation
        boolean blocks_execution
        boolean requires_human_review
        boolean resolved
        string resolved_by
        timestamp resolved_at
        text resolution_notes
        timestamp created_at
    }
    
    JURISDICTIONS {
        uuid jurisdiction_id PK
        string country
        string country_code
        string sanctions_risk
        text sanctions_notes
        text aml_notes
        text licensing_notes
        jsonb docs_required
        text customs_notes
        jsonb source_urls
        date last_reviewed_date
        string reviewed_by
        string version
    }
    
    COMMODITIES {
        uuid commodity_id PK
        string name
        string hs_code
        string category
        boolean restricted
        text compliance_notes
    }
    
    COMPLIANCE_ACTIONS {
        uuid action_id PK
        uuid deal_id FK
        uuid flag_id FK
        string action_type
        string action_by
        text action_notes
        jsonb metadata
        timestamp timestamp
    }
\`\`\`

---

## Human Review Gate Requirements

| Flag Severity | Blocks Execution? | Required Reviewer(s) | SLA | Documentation Required |
|---------------|-------------------|----------------------|-----|------------------------|
| **CRITICAL** | ✅ YES | Compliance Officer + Legal Counsel | 24 hours | Written legal opinion, OFAC license verification (if applicable), board approval (if >$1M) |
| **HIGH** | ❌ NO | Compliance Officer | 48 hours | Enhanced KYC, beneficial ownership, source of funds, export license (if applicable) |
| **MEDIUM** | ❌ NO | Deal Manager | 72 hours | Standard documentation verification, customs broker engagement (if applicable) |
| **LOW** | ❌ NO | None (advisory only) | N/A | Acknowledged by deal manager, no formal sign-off required |

### Review Workflow

1. **Flag Generated**: TradeComplianceAgent creates flag in database
2. **Notification Sent**: Email/Slack notification to compliance team with deal details
3. **Review Initiated**: Assigned reviewer opens flag in `/dashboard/compliance`
4. **Investigation**: Reviewer gathers documentation, consults external sources (OFAC website, BIS, legal counsel)
5. **Decision Made**: Reviewer decides: (a) Approve with conditions, (b) Reject transaction, (c) Request additional information
6. **Resolution Documented**: Reviewer enters `resolved_by`, `resolution_notes` explaining: (i) What was verified, (ii) Sources consulted, (iii) Conditions imposed, (iv) Rationale for decision
7. **Audit Trail Saved**: All actions logged to `compliance_actions` table with timestamps
8. **Deal Proceeds or Halts**: If approved, deal status changes to `cleared`. If rejected, deal status changes to `rejected`.

---

## Regulatory Alignment

### OFAC Framework for Compliance Commitments

The system implements the **Five Essential Components of Sanctions Compliance**:

1. **Management Commitment**: Compliance architecture approved by FTH Trading management. Compliance officer designated.
2. **Risk Assessment**: Risk-based flagging (CRITICAL for sanctioned jurisdictions, HIGH for restricted commodities/high-value deals).
3. **Internal Controls**: Human review gates enforced programmatically. CRITICAL flags block execution.
4. **Testing & Auditing**: Quarterly review of jurisdiction YAML files (next_review_date tracked). Annual audit of compliance_actions logs.
5. **Training**: Compliance team trained on flag resolution procedures. Deal managers trained on advisory flag interpretation.

### FinCEN BSA/AML Guidance

AML screening aligns with FinCEN guidance:

- **$10K Threshold**: LOW flag for reporting awareness (not CTR filing - system does not file CTRs)
- **$50K Threshold**: HIGH flag triggers Enhanced Due Diligence (EDD)
- **$100K+ for Precious Metals**: CRITICAL flag requires extraordinary EDD + legal counsel review
- **Beneficial Ownership**: Recommended in flag notes per FinCEN Customer Due Diligence Rule
- **5-Year Retention**: All compliance_actions logged and retained 7 years (exceeds 5-year requirement)

### BIS Export Administration Regulations (EAR)

Export control screening:

- **Commodity Restricted Flag**: If `commodity.restricted = true` → HIGH flag
- **Entity List Screening**: Recommended in flag notes for China/Russia deals
- **ECCN/USML Classification**: Recommended in flag notes for restricted commodities
- **End-Use Verification**: Recommended in flag notes for dual-use items

### WCO Harmonized System (HS) Codes

- All commodities classified using 6-digit HS codes (e.g., Coffee 0901.11, Gold 7108.13)
- HS codes stored in `commodities.hs_code` field
- Used for customs documentation and tariff classification

### ICC Incoterms 2020

- Incoterm validation: EXW, FOB, CIF, CFR, DAP, DDP
- Risk flagging: DDP → MEDIUM flag (importer-of-record obligations)
- Advisory flags: EXW, FOB, CIF → LOW flag (reminders about responsibility transfer points)

---

## Data Sources & Maintenance

### Sanctions Lists (Checked via manual screening - future: API integration)

| Source | URL | Update Frequency | Review Responsibility |
|--------|-----|------------------|------------------------|
| OFAC SDN List | https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists | Daily | Compliance Officer |
| BIS Entity List | https://www.bis.doc.gov/index.php/policy-guidance/lists-of-parties-of-concern/entity-list | Weekly | Compliance Officer |
| DDTC ITAR Debarred | https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_debarred_parties | Monthly | Compliance Officer |
| UN Security Council Consolidated List | https://www.un.org/securitycouncil/content/un-sc-consolidated-list | Weekly | Compliance Officer |
| EU Consolidated List | https://www.sanctionsmap.eu/ | Daily | Compliance Officer |

### Jurisdiction Metadata Sources

Jurisdiction YAML files include `source_urls` array with official government sources:
- OFAC (sanctions): https://ofac.treasury.gov
- BIS (export controls): https://www.bis.doc.gov
- FinCEN (AML): https://www.fincen.gov
- CBP (customs): https://www.cbp.gov
- National customs authorities (e.g., HMRC for UK, BAZG for Switzerland)

**Maintenance Schedule**:
- Quarterly review of all jurisdiction YAML files (tracked in `next_review_date` field)
- Immediate update if major regulatory change (e.g., new sanctions, export control expansion)
- Version tracking in YAML files (increment version on each update)
- Last reviewed date and reviewer name tracked for audit trails

---

## Audit Trail & Recordkeeping

### What's Logged

All compliance-related actions logged to `compliance_actions` table:

1. **Flag Creation**: When TradeComplianceAgent generates flags
   - `action_type`: 'flag_created'
   - `metadata`: JSON with flag details (severity, message, recommendation)

2. **Manual Review**: When compliance team reviews flags
   - `action_type`: 'flag_reviewed'
   - `metadata`: JSON with reviewer comments, external sources consulted

3. **Flag Resolution**: When flags are resolved
   - `action_type`: 'flag_resolved'
   - `metadata`: JSON with resolution decision, conditions, rationale

4. **Deal Status Changes**: When deal compliance status changes
   - `action_type`: 'status_change'
   - `metadata`: JSON with old_status, new_status, reason

5. **Jurisdiction Updates**: When YAML files are synced to database
   - `action_type`: 'jurisdiction_updated'
   - `metadata`: JSON with old_version, new_version, changes

### Retention Policy

- **Database Records**: 7 years (exceeds OFAC 5-year, FinCEN 5-year requirements)
- **YAML Files**: Version-controlled in Git (indefinite retention)
- **Email Notifications**: 7 years in email archive
- **Supporting Documentation**: 7 years (scanned PDFs of licenses, legal opinions)

### Audit Query Examples

```sql
-- View all compliance actions for a specific deal
SELECT * FROM compliance_actions 
WHERE deal_id = 'uuid-here' 
ORDER BY timestamp DESC;

-- View all CRITICAL flags in last 90 days
SELECT cf.*, d.deal_number, d.client_name 
FROM compliance_flags cf
JOIN deals d ON cf.deal_id = d.deal_id
WHERE cf.severity = 'CRITICAL' 
AND cf.created_at >= NOW() - INTERVAL '90 days'
ORDER BY cf.created_at DESC;

-- View all unresolved HIGH flags
SELECT * FROM compliance_flags
WHERE severity = 'HIGH' AND resolved = false
ORDER BY created_at ASC;

-- View compliance action volume by month (for reporting)
SELECT DATE_TRUNC('month', timestamp) AS month,
       action_type,
       COUNT(*) as action_count
FROM compliance_actions
GROUP BY month, action_type
ORDER BY month DESC, action_count DESC;
```

---

## YAML Rules Library

### Structure

Jurisdiction metadata stored as YAML files in `rules/jurisdictions/*.yaml`:

```yaml
country: "United States"
country_code: "US"
iso_alpha3: "USA"
sanctions_risk: "low"  # Enum: low, medium, high, critical

sanctions_notes: |
  Multi-line string with sanctions guidance...

aml_notes: |
  Multi-line string with AML requirements...

licensing_notes: |
  Multi-line string with export/import licensing...

docs_required:
  - Commercial Invoice
  - Packing List
  - Bill of Lading

source_urls:
  - "https://ofac.treasury.gov"
  - "https://www.bis.doc.gov"

effective_date: "2025-12-15"
next_review_date: "2026-03-15"
reviewed_by: "Sarah Chen"
version: "1.0"

compliance_automation_notes: |
  Optional: Notes for TradeComplianceAgent behavior
```

### Sync Process

1. **Manual Updates**: Compliance team edits YAML files in `/rules/jurisdictions/`
2. **Git Commit**: Changes committed to Git with version increment
3. **Sync to Database**: Run `node scripts/sync-yaml-to-db.js` (or Python equivalent)
4. **Validation**: Script validates YAML syntax, required fields
5. **Database Update**: Script UPSERTs rows in `jurisdictions` table
6. **Audit Log**: Sync logged to `compliance_actions` table

### Current Jurisdictions

- **US.yaml**: United States (low risk) - OFAC/FinCEN/BIS baseline
- **RU.yaml**: Russia (CRITICAL risk) - Comprehensive sanctions
- **CN.yaml**: China (medium risk) - Entity List screening
- **BR.yaml**: Brazil (low risk) - Coffee origin, phytosanitary certs
- **CH.yaml**: Switzerland (low risk) - LBMA custody, precious metals
- **GB.yaml**: United Kingdom (low risk) - LBMA Good Delivery
- **EU.yaml**: European Union (low risk) - Customs union, REACH compliance

(Additional jurisdictions to be added as needed)

---

## Deployment Checklist

### Prerequisites

1. ✅ PostgreSQL 15+ database provisioned
2. ✅ Database schema created (`database/schema-compliance.sql` executed)
3. ✅ Environment variables configured (see DEPLOYMENT-GUIDE.md)
4. ✅ Clerk authentication set up (user roles: compliance_officer, deal_manager, legal_counsel)

### Initial Setup

1. **Seed Jurisdiction Data**: Run YAML sync script to load jurisdiction metadata
2. **Seed Commodity Data**: Insert initial commodities (Coffee, Cocoa, Metals, etc.) with HS codes
3. **Create Test Deals**: Create sample deals to verify screening logic
4. **Verify Flag Generation**: Confirm CRITICAL flags block execution, HIGH flags require approval
5. **Test Resolution Workflow**: Mark flags as resolved in `/dashboard/compliance`
6. **Verify Audit Trail**: Query `compliance_actions` table to confirm logging

### Ongoing Maintenance

- **Quarterly**: Review all jurisdiction YAML files, update if regulations changed
- **Monthly**: Review compliance_flags metrics (resolution time, flag volume by type)
- **Weekly**: Review unresolved CRITICAL and HIGH flags
- **Daily**: Monitor email alerts for new CRITICAL flags

---

## Future Enhancements

### Phase 2: API Integration

- **OFAC API**: Auto-check SDN list via API (currently manual screening)
- **World-Check API**: Third-party sanctions/PEP screening
- **BIS API**: Programmatic Entity List checks

### Phase 3: Machine Learning

- **Anomaly Detection**: Flag unusual trade patterns (e.g., coffee shipment to non-consuming country)
- **Risk Scoring**: ML model to predict compliance risk beyond rule-based flags
- **Document OCR**: Auto-extract data from licenses, certificates

### Phase 4: Advanced Workflows

- **Multi-Level Approvals**: Workflow engine for escalations
- **External Counsel Portal**: Dedicated interface for outside law firms
- **Client Self-Service**: Limited compliance status visibility for clients

---

## Contact & Escalation

For compliance questions or system support:

- **Compliance Officer**: Sarah Chen (sarah.chen@fthtrading.com)
- **Legal Counsel**: Michael Rodriguez (michael.rodriguez@fthtrading.com)
- **System Administrator**: DevOps team (devops@fthtrading.com)

**Emergency Escalation** (CRITICAL flags requiring immediate legal counsel):
- Email: compliance-emergency@fthtrading.com
- Phone: [to be configured]

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-25  
**Next Review**: 2026-05-25  
**Maintained By**: Compliance Team
