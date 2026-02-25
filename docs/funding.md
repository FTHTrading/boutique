# FTHTrading Funding Layer — Operational Framework

> **Internal policy document. Not for public distribution without legal review.**
> Last updated: February 2026

---

## What This Is

The Funding Layer is a **deal structuring and transaction support system** designed to:

- Model transaction terms
- Screen instruments for basic validity
- Generate settlement instructions
- Log proof-of-performance
- Track readiness

It is **not**:

- A bank
- A broker-dealer
- An investment advisor
- A money transmitter
- A securities issuer
- A guarantee of funding

It is a structuring and orchestration engine.

---

## Funding Categories Supported

### 1. Trade Finance

Short-term funding to support commodity transactions.

Examples:
- Letters of Credit
- Documentary Collections
- Invoice Factoring
- Supply Chain Finance

Purpose: Bridge timing gap between shipment and payment.

---

### 2. Instrument-Backed Transactions

Deals involving financial instruments such as:

- Bank Guarantees (BG)
- Standby Letters of Credit (SBLC)
- Documentary Letters of Credit (DLC)
- Performance Bonds

Purpose: Secure payment obligations between counterparties.

---

### 3. Structured Commodity Funding

Used for:

- Inventory financing
- Forward contracts
- Hedged supply agreements
- Prepaid commodity structures

---

### 4. Settlement Rail Orchestration

Supports:

- Traditional wire (SWIFT)
- Domestic ACH
- Blockchain settlement (XRPL / Stellar anchoring)
- Escrow coordination

---

## Core Funding Terms & Definitions

**Letter of Credit (LC)**
A bank-issued guarantee that payment will be made once conditions are met.

**Standby Letter of Credit (SBLC)**
A backup guarantee used if contractual obligations are not fulfilled.

**Bank Guarantee (BG)**
A promise from a bank covering losses if a counterparty defaults.

**Documentary Collection**
Bank-facilitated document exchange tied to payment.

**Invoice Factoring**
Selling receivables at a discount for immediate cash.

**Margin**
Difference between cost and sale price.

**Hedging**
Using futures/options to reduce price risk exposure.

**Settlement Instruction**
Formal routing details for payment execution.

**SWIFT**
Global messaging network used by banks.

**BIC Code**
Bank Identifier Code used in SWIFT transactions. Format: 8 or 11 characters (e.g. `CITIUS33` or `CITIUS33XXX`).

**KYC (Know Your Customer)**
Identity verification process for individuals.

**KYB (Know Your Business)**
Entity-level verification process for companies.

**AML (Anti-Money Laundering)**
Monitoring and reporting suspicious financial activity. FATF threshold: $10,000.

**OFAC**
U.S. Office of Foreign Assets Control — sanctions authority screening restricted parties.

**Incoterms**
International shipping terms governing risk transfer (FOB, CIF, DDP, etc.).

**Proof of Performance**
Evidence that contractual obligations were met.

**UCP 600**
Uniform Customs and Practice for Documentary Credits — governing rules for Letters of Credit.

**ISP98**
International Standby Practices — governing rules for Standby Letters of Credit.

**URDG 758**
Uniform Rules for Demand Guarantees — governing rules for Bank Guarantees.

---

## Funding Flow

```
ClientRequest
    │
    ▼
StructureProposal (FundingStructureAgent)
    │
    ▼
ComplianceScreen (jurisdiction, OFAC, AML threshold)
    │
    ▼
InstrumentReview (InstrumentVerificationAgent — format checks only)
    │
    ▼
HumanApproval ← MANDATORY GATE — no automatic advancement
    │
    ▼
SettlementInstructions (SettlementRailAgent)
    │
    ▼
Execution (external — requires bank and/or wallet signing)
    │
    ▼
ProofAnchor (hash anchored to XRPL/Stellar ledger)
```

---

## Readiness Score Formula

```
score = (kyc_status + document_completeness + collateral_strength + counterparty_rating) / 4
```

| Component             | How Computed                                              | Range |
|-----------------------|-----------------------------------------------------------|-------|
| kyc_status            | % of KYC/KYB requirements with APPROVED status           | 0–100 |
| document_completeness | % of all requirements SUBMITTED, APPROVED, or WAIVED     | 0–100 |
| collateral_strength   | Instrument backing: 100 (ACTIVE/CONFIRMED) / 50 (ISSUED) | 0–100 |
| counterparty_rating   | Deal risk_level: LOW=90, MEDIUM=65, HIGH=30, CRITICAL=0  | 0–100 |

Outputs:
- Funding viability %
- Required documentation checklist
- Risk flags (LOW / MEDIUM / HIGH / CRITICAL)

---

## Funding Structure Agent — What It Does

Generates draft:
- Term sheets with recommended instruments
- Payment structure recommendation
- Required documentation checklist
- Risk scoring (AML, jurisdiction, counterparty)
- Readiness assessment (0–100)

It does NOT:
- Issue instruments
- Replace banking institutions
- Constitute legal or financial advice

Human review required before use with counterparties.

---

## Instrument Verification Agent — What It Does

Checks:
- BIC/SWIFT code format (regex: `^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$`)
- Expiry date logic (flags expired, flags < 30 days remaining)
- Issue date sanity (future-dated instruments flagged)
- Amount validity and AML threshold screening
- Beneficiary and applicant name presence
- Reference number presence

It does NOT:
- Verify with the issuing bank
- Authenticate SWIFT message origin
- Guarantee funds exist
- Replace MT760 / MT700 bank-to-bank authentication

**Human verification is always mandatory.** The agent can only advance status to `PENDING_HUMAN_REVIEW`. A human operator must explicitly call `HUMAN_APPROVE` to advance further.

---

## Settlement Rail Agent — What It Does

### FIAT Rail
Generates:
- Draft MT103 wire template (NOT for transmission — requires bank authorisation)
- SWIFT BIC/IBAN format validation
- AML threshold flag
- Dual approval checklist

### XRPL Rail
Generates:
- Payment or EscrowCreate instruction set
- Address format validation (`r...`, 25–34 chars)
- Destination tag reminder
- Network reserve check
- Crypto condition support for escrow

### Stellar Rail
Generates:
- Payment instruction set
- Address format validation (`G...`, 56 chars)
- Memo/memo type requirements
- Trustline check reminder
- Federation address support

### Proof Anchoring
- Computes SHA-256 hash of document/record data
- Stores hash in `proof_anchors` table
- Ledger submission (XRPL/Stellar) requires separate authorised wallet signing — NOT automated

No automatic fund movement. No automatic transaction signing.

---

## Example Funding Structures

### Example 1 — Coffee Shipment Trade Finance

**Transaction:** 500,000 lbs Brazilian coffee

**Structure:**
- Buyer issues Documentary LC
- Seller ships under FOB Santos
- Documents submitted to bank
- Payment released upon inspection

**Funding Logic:**
- LC covers shipment value
- Margin locked at contract signing
- Compliance check runs before document release

**Revenue:** Margin on physical commodity + structuring fee

---

### Example 2 — Gold Custody Transaction

**Transaction:** $2,000,000 allocated gold

**Structure:**
- SBLC provided by buyer
- Assay verification
- Vault custody confirmation
- Settlement via SWIFT

**System Role:**
- Log instrument metadata
- Check expiry logic and BIC format
- Flag AML thresholds
- Record custody ID
- Anchor proof hash (optional)

---

### Example 3 — Invoice Factoring

**Transaction:** $100,000 Net-60 invoice

**Structure:**
- Invoice sold at 4% discount
- $96,000 advanced
- Buyer pays at maturity

**System Tracks:**
- Invoice ID, advance date, discount rate, risk tier, payment confirmation

**Revenue:** $4,000 funding spread

---

## Regulatory Boundaries

The system:
- Flags AML thresholds (> $10,000)
- Flags high-risk / sanctioned jurisdictions
- Requires manual approval for CRITICAL risks
- Logs all decisions with timestamps
- Retains audit records (7-year recommendation)

The system does NOT:
- Issue financial instruments
- Guarantee performance
- Replace banking institutions
- Replace licensed professionals
- Certify compliance

**All funding decisions require human oversight.**

---

## Risk Layers

| Risk Type             | Mitigation                      |
|-----------------------|---------------------------------|
| Counterparty Risk     | KYC/KYB + readiness scoring     |
| Instrument Fraud      | Human verification gate (mandatory) |
| Sanctions Risk        | Jurisdiction screening (OFAC/FATF) |
| Settlement Error      | Dual approval checklist         |
| Margin Compression    | Locked pricing logic in deal    |
| Documentation Failure | Checklist enforcement + status tracking |

---

## Revenue Models

1. **Structuring Fee** (0.5–2%) — charged for deal analysis and term sheet generation
2. **Spread on Factoring** (2–6%) — discount on invoice advance
3. **Commodity Margin Protection** — locked margin at contract signing
4. **Retainer Advisory** — ongoing deal advisory
5. **Custody Management Fee** — for precious metal / warehouse receipt deals

---

## Deployment Modes

### Mode A — Internal Advisory Only
Used to model deals before human review. Lowest regulatory exposure.

### Mode B — Counterparty Coordination
Used to coordinate structured deals between institutions. Requires legal counsel review.

### Mode C — Active Financial Operations
Requires licensing and full compliance infrastructure. Not currently active.

---

## Funding Layer Guardrails

Human approval **required** for:
- Transactions > $50,000
- High-risk jurisdictions
- Any instrument-backed deal
- Any XRPL/Stellar settlement

**Hard limits:**
- No automatic settlement execution
- No automatic instrument validation with banks
- No public marketing of funding services without legal review
- Explicit disclaimer attached to all system outputs

---

## Summary

**The Funding Layer is:**
- A structuring engine
- A compliance logging tool
- A workflow orchestrator
- A settlement instruction generator (drafts only)
- A readiness assessment system

**It is not:**
- A bank
- A securities platform
- A capital issuer
- A money transmitter
- A licensed financial advisor

---

*All outputs from this system require human review and approval before use. FTH Trading does not issue financial instruments or guarantee funding outcomes.*
