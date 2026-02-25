# Commodity-Agnostic Platform Architecture

## Overview

FTH Trading's platform is designed as a **commodity-agnostic** trading intelligence system. While initially focused on coffee, the architecture was intentionally built to accommodate **any commodity** that can be sourced, structured, and traded globally.

This document explains how the platform handles multiple commodity types without hardcoding commodity-specific logic into core systems.

---

## Design Principles

### 1. Metadata-Driven Approach

Rather than hardcoding commodity rules, we store commodity metadata in the database:

```typescript
// commodities table schema
{
  commodity_id: uuid,
  name: string,
  hs_code: string,           // Harmonized System code (e.g., "0901.11" for Arabica Coffee)
  category: string,          // agricultural | metals | energy | chemicals
  restricted: boolean,       // Triggers export control screening
  compliance_notes: text,    // Human-readable compliance guidance
  created_at: timestamp
}
```

### 2. Category-Based Processing

Commodities are grouped into **categories** that share similar characteristics:

| Category | Examples | Common Requirements | TradeComplianceAgent Logic |
|----------|----------|---------------------|----------------------------|
| **Agricultural** | Coffee, Cocoa, Sugar | Phytosanitary certificates, grading standards, moisture content specs | Standard AML screening, LOW flag for documentation |
| **Metals** | Gold, Silver, Platinum, Copper | Chain-of-custody, LBMA refiners, source verification | HIGH flag if restricted=true (precious metals), MEDIUM flag for custody requirements |
| **Energy** | Crude Oil, Natural Gas, Coal | OFAC screening mandatory, export authorizations, shipping intermediaries | CRITICAL flag if origin/destination high-risk, HIGH flag for all energy deals |
| **Chemicals** | Industrial chemicals, fertilizers | REACH compliance (EU), Safety Data Sheets, hazmat shipping | MEDIUM flag for REACH/SDS requirements |

### 3. HS Code Mapping

All commodities classified using **World Customs Organization (WCO) Harmonized System** codes:

- **Coffee**: 0901.11 (Arabica), 0901.12 (Robusta), 0901.21 (Roasted)
- **Cocoa**: 1801.00 (Whole beans), 1803.10 (Defatted), 1803.20 (Shells/husks)
- **Gold**: 7108.13 (Semi-manufactured), 7108.20 (Monetary)
- **Copper**: 7403.11 (Cathodes), 7403.12 (Wire bars)
- **Crude Oil**: 2709.00
- **Sugar**: 1701.14 (Cane sugar), 1701.91 (Beet sugar)

### 4. Incoterms Independence

Incoterms (EXW, FOB, CIF, DDP, etc.) apply to **all commodities**. Platform validates incoterms at the trade structure level, not the commodity level.

---

## Adding a New Commodity

### Step 1: Classify the Commodity

Determine:
1. **Category**: agricultural | metals | energy | chemicals | textiles | electronics | minerals
2. **HS Code**: 6-digit code from WCO Harmonized System (search: [https://www.wcotradetools.org/en/harmonized-system](https://www.wcotradetools.org/en/harmonized-system))
3. **Restricted Status**: Does it require export licenses? (Gold, crude oil, defense articles → YES)
4. **Compliance Notes**: Any special handling? (e.g., LBMA Good Delivery for gold, phytosanitary certs for agricultural)

### Step 2: Add to Database

Insert into `commodities` table:

```sql
INSERT INTO commodities (
  commodity_id,
  name,
  hs_code,
  category,
  restricted,
  compliance_notes
) VALUES (
  gen_random_uuid(),
  'Soybeans',
  '1201.10',
  'agricultural',
  false,
  'Phytosanitary certificate required. Moisture content <14%. USDA grading standards apply.'
);
```

### Step 3: Create Public Catalog Page

Add to `app/commodities/page.tsx`:

```typescript
const commodities = [
  // ... existing commodities
  {
    icon: Sprout,
    title: "Soybeans",
    slug: "soybeans",
    description: "Non-GMO and conventional soybeans from Brazil, U.S., Argentina",
    hsCode: "HS 1201.10",
    origins: "Brazil, United States, Argentina",
    incoterms: "FOB, CIF, CFR",
    restricted: false,
  },
];
```

### Step 4: Create Detail Page

Add to `app/commodities/[slug]/page.tsx`:

```typescript
const commodityData = {
  // ... existing commodities
  soybeans: {
    name: "Soybeans",
    description: "Non-GMO and conventional soybeans for food, feed, and industrial applications.",
    hsCode: "1201.10",
    origins: ["Brazil", "United States", "Argentina", "Paraguay"],
    grades: [
      "U.S. Grade 1 (max 2% damage)",
      "U.S. Grade 2 (max 3% damage)",
      "Brazilian Grade A",
    ],
    incoterms: ["FOB", "CIF", "CFR"],
    packaging: [
      "Bulk shipments (container or vessel)",
      "Super sacks (1 MT)",
      "Bagged (50kg bags)",
    ],
    certifications: ["Non-GMO Project Verified", "Organic (USDA/EU)", "Rainforest Alliance"],
    leadTime: "30-45 days",
    minOrder: "1 container (25-27 MT)",
    complianceNotes: [
      "Phytosanitary certificate required from origin country",
      "USDA grading certificate recommended",
      "Fumigation certificate (if applicable)",
      "Non-GMO declaration (if Non-GMO)",
    ],
    restricted: false,
  },
};
```

### Step 5: Update generateStaticParams

```typescript
export async function generateStaticParams() {
  return [
    { slug: "coffee" },
    { slug: "cocoa" },
    { slug: "precious-metals" },
    { slug: "base-metals" },
    { slug: "sugar" },
    { slug: "energy" },
    { slug: "soybeans" }, // NEW
  ];
}
```

### Step 6: Test Compliance Screening

Create a test deal with the new commodity:

```sql
INSERT INTO deals (
  deal_id,
  deal_number,
  client_name,
  commodity_id,
  deal_value_usd,
  origin_country,
  destination_country,
  incoterm,
  compliance_status
) VALUES (
  gen_random_uuid(),
  'DEAL-TEST-001',
  'Test Client Inc.',
  (SELECT commodity_id FROM commodities WHERE name = 'Soybeans'),
  150000.00,
  'BR',
  'US',
  'FOB',
  'pending_compliance'
);
```

Run TradeComplianceAgent:

```typescript
import { runComplianceScreen } from '@/agents/trade-compliance-agent';

const deal = await db.query.deals.findFirst({
  where: eq(deals.deal_number, 'DEAL-TEST-001'),
  with: { commodity: true, originJurisdiction: true, destinationJurisdiction: true }
});

await runComplianceScreen(deal);
```

Verify flags generated:
- ✅ LOW flag for $150K value (>$10K threshold)
- ✅ HIGH flag for $150K AML (>$50K threshold)
- ✅ MEDIUM flag for phytosanitary certificate requirement

---

## Restricted vs. Unrestricted Commodities

### Unrestricted Commodities

**Definition**: Commodities that can be traded without export licenses under normal circumstances.

**Examples**: Coffee, Cocoa, Sugar, Base Metals (Copper, Aluminum)

**TradeComplianceAgent Logic**:
- Standard sanctions screening (OFAC SDN check)
- AML screening based on value thresholds ($50K, $100K)
- Documentation flags (phytosanitary certs, certificates of origin)
- LOW to MEDIUM flags unless high-value or sanctioned jurisdiction

**Required Documentation**:
- Commercial Invoice
- Packing List
- Bill of Lading
- Certificate of Origin
- Phytosanitary Certificate (if agricultural)

### Restricted Commodities

**Definition**: Commodities subject to export controls, licensing requirements, or enhanced due diligence.

**Examples**: Precious Metals (Gold, Silver), Crude Oil, Dual-Use Technology, Defense Articles

**TradeComplianceAgent Logic**:
- `commodity.restricted = true` triggers **HIGH or CRITICAL flags**
- Enhanced OFAC screening (all parties, intermediaries, banks, freight forwarders)
- Export license verification required
- Chain-of-custody documentation (for precious metals)
- End-use verification (for dual-use items)

**Required Documentation**:
- All unrestricted docs PLUS:
- Export License (if jurisdiction requires)
- End-Use Certificate
- Chain-of-Custody Documentation (precious metals)
- LBMA Refiner Certificate (gold/silver)
- Source of Funds Verification (precious metals)

---

## Commodity-Specific Compliance Notes

### Agricultural Commodities

**Key Requirements**:
1. **Phytosanitary Certificates**: Required for cross-border agricultural trade (issued by origin country's ag ministry)
2. **Grading Standards**: USDA grading (U.S.), BSCA (Brazil), CONAB (general)
3. **Moisture Content**: Specs vary by commodity (coffee <12.5%, cocoa <7.5%, soybeans <14%)
4. **Fumigation**: May be required if container inspection reveals pests

**TradeComplianceAgent Impact**:
- LOW flag: "Phytosanitary certificate required from [origin country] Ministry of Agriculture."
- Recommendation: "Verify certificate authentic via IPPC ePhyto system."

### Metals (Precious & Base)

**Key Requirements**:
1. **Chain-of-Custody**: Document movement from mine → refiner → dealer → buyer (especially for gold)
2. **LBMA Refiners**: Gold/silver should be from LBMA-approved refiners (list: [https://www.lbma.org.uk/](https://www.lbma.org.uk/))
3. **OECD Due Diligence Guidance**: For conflict minerals (gold from high-risk areas)
4. **Source Verification**: Enhanced KYC, beneficial ownership, source of funds

**TradeComplianceAgent Impact**:
- HIGH flag if `restricted = true`: "Precious metals. Enhanced AML/KYC required."
- MEDIUM flag: "Verify LBMA refiner status and chain-of-custody."
- Recommendation: "Obtain: (1) Assay certificate, (2) LBMA cert, (3) OECD Due Diligence docs."

### Energy (Crude Oil, Natural Gas)

**Key Requirements**:
1. **OFAC Screening MANDATORY**: Screen all parties, intermediaries, shipping companies, insurers, banks
2. **Export Authorization**: Origin country must authorize export (e.g., U.S. requires export license for crude to certain countries)
3. **Import Authorization**: Destination country must authorize import
4. **Shipping Intermediaries**: Verify vessel not on OFAC SDN, insurer not sanctioned

**TradeComplianceAgent Impact**:
- CRITICAL flag if origin/destination high-risk: "Energy commodity + high-risk jurisdiction. BLOCKED pending legal review."
- HIGH flag for all energy deals: "Enhanced due diligence required on all intermediaries."
- Recommendation: "Verify: (1) OFAC screening on vessel, (2) Export/import authorizations, (3) Payment routed through non-sanctioned banks."

### Chemicals

**Key Requirements**:
1. **REACH Compliance** (EU): Registration, Evaluation, Authorization of Chemicals
2. **Safety Data Sheets** (SDS): Required for hazardous materials
3. **Hazmat Shipping**: Special packaging, labeling, carrier certifications
4. **Dual-Use Screening**: Some chemicals have both commercial and weapons applications (export controls apply)

**TradeComplianceAgent Impact**:
- MEDIUM flag: "Chemical commodity. REACH compliance check required if EU destination."
- Recommendation: "Verify: (1) SDS provided, (2) REACH registration (if EU), (3) Hazmat carrier certified, (4) Not dual-use item per EAR."

---

## HS Code Reference Guide

### Finding HS Codes

1. **WCO Trade Tools**: [https://www.wcotradetools.org/en/harmonized-system](https://www.wcotradetools.org/en/harmonized-system)
2. **U.S. Customs (HTS)**: [https://hts.usitc.gov/](https://hts.usitc.gov/)
3. **EU TARIC**: [https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp](https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp)
4. **National Customs Authorities**: Each country maintains national tariff schedules (extensions of 6-digit HS codes)

### HS Code Structure

- **2 digits**: Chapter (e.g., 09 = Coffee, Tea, Spices)
- **4 digits**: Heading (e.g., 0901 = Coffee)
- **6 digits**: Subheading (e.g., 0901.11 = Coffee, not roasted, not decaffeinated, Arabica)
- **8-10 digits**: National extensions (e.g., U.S. adds 4 digits for HTS: 0901.11.0010)

### Example: Coffee

- **09**: Coffee, tea, maté, and spices (Chapter)
- **0901**: Coffee, whether or not roasted or decaffeinated; coffee husks and skins; coffee substitutes (Heading)
- **0901.11**: Coffee, not roasted, not decaffeinated, Arabica (Subheading)
- **0901.12**: Coffee, not roasted, not decaffeinated, Robusta (Subheading)
- **0901.21**: Coffee, roasted, not decaffeinated (Subheading)

### Commodities by HS Chapter

| Chapter | Commodity Group | Examples |
|---------|-----------------|----------|
| 09 | Coffee, Tea, Spices | Coffee (0901), Cocoa (1801 - wrong chapter, actually 18) |
| 18 | Cocoa & Cocoa Preparations | Cocoa beans (1801), Cocoa powder (1805) |
| 17 | Sugars & Sugar Confectionery | Cane sugar (1701.14), Beet sugar (1701.91) |
| 12 | Oil Seeds, Grains | Soybeans (1201), Sunflower seeds (1206) |
| 27 | Mineral Fuels, Oils | Crude oil (2709), Natural gas (2711) |
| 71 | Precious Metals, Stones | Gold (7108), Silver (7106), Platinum (7110), Diamonds (7102) |
| 74 | Copper & Articles | Copper cathodes (7403.11), Copper wire (7408) |
| 76 | Aluminum & Articles | Aluminum ingots (7601), Aluminum sheets (7606) |

---

## Incoterms by Commodity Type

### Agricultural Commodities

**Common Incoterms**:
- **FOB** (Free On Board): Seller loads goods on vessel. Buyer arranges ocean freight + insurance. (Most common for commodities)
- **CIF** (Cost, Insurance, Freight): Seller arranges ocean freight + insurance to destination port. Buyer handles import customs.
- **EXW** (Ex Works): Buyer arranges everything from seller's warehouse. (Less common for international)

**Why**: Agricultural commodities are bulk shipments requiring vessel transport. FOB/CIF align with port-to-port movement.

### Precious Metals

**Common Incoterms**:
- **EXW** (Ex Works): Buyer collects from refiner's vault (e.g., Switzerland). Common for high-value metals.
- **FOB**: For international shipments from LBMA refiners.
- **DDP** (Delivered Duty Paid): Seller handles all import duties, customs, delivery to buyer's vault. (Less common due to complexity)

**Why**: High-value, low-volume. Often stored in bonded warehouses (London, Zurich, Singapore). Buyer prefers control over shipping/insurance.

### Energy (Crude Oil)

**Common Incoterms**:
- **FOB**: Most common for crude oil contracts (e.g., "FOB Houston" or "FOB Dubai").
- **CIF**: Seller arranges tanker + insurance.
- **DES** (Delivered Ex Ship): Seller delivers to destination port (older term, replaced by DAT/DAP in Incoterms 2020).

**Why**: Crude oil is shipped by tanker. FOB allows buyer to charter vessel. CIF used when seller has better freight rates.

### Chemicals

**Common Incoterms**:
- **CIF**: Seller arranges ocean freight + insurance (common for containerized chemicals).
- **DAP** (Delivered at Place): Seller delivers to buyer's facility but doesn't handle import customs.
- **DDP**: Seller handles everything (less common due to hazmat complexity).

**Why**: Hazmat shipping requires specialized carriers. CIF/DAP balance responsibility.

---

## Category-Specific Features

### Agricultural: Grading & Certifications

**Platform Features**:
- Store grading standards in commodity metadata: `commodity.grades` (JSON array)
- Certification tracking: Rainforest Alliance, Fair Trade, Organic, B Corp
- Moisture content specs: Validated in quality control workflow
- Defect ratios: Track in supplier scorecards

**Example (Coffee)**:
```json
{
  "grades": [
    "Specialty Grade (80+ SCA points)",
    "Premium Grade (75-79.99 SCA)",
    "Commercial Grade (<75 SCA)"
  ],
  "certifications": ["Rainforest Alliance", "Fair Trade", "Organic"],
  "moisture_content_max": "12.5%",
  "defect_ratio_max": "5% Category 1 defects"
}
```

### Metals: Chain-of-Custody & Refiners

**Platform Features**:
- LBMA refiner registry: Store in `refiners` table (linked to commodities)
- Chain-of-custody tracking: Mine → Refiner → Dealer → Buyer (stored in `custody_chain` JSONB field)
- Assay certificates: Upload to document management system
- Conflict minerals compliance: OECD Due Diligence Guidance checklist

**Example (Gold)**:
```json
{
  "refiner": "PAMP Suisse",
  "lbma_approved": true,
  "assay_fineness": "999.9",
  "custody_chain": [
    {"stage": "mine", "entity": "Newmont Mining", "date": "2025-01-15"},
    {"stage": "refiner", "entity": "PAMP Suisse", "date": "2025-02-10"},
    {"stage": "dealer", "entity": "FTH Trading", "date": "2025-02-20"}
  ]
}
```

### Energy: Shipping Intermediaries

**Platform Features**:
- Vessel registry: Store vessel names, IMO numbers, sanctions screening results
- Insurer verification: Track insurance company against OFAC SDN
- Bank screening: Verify payment routing through non-sanctioned banks
- Origin/destination authorizations: Upload export/import licenses

**Example (Crude Oil)**:
```json
{
  "vessel_name": "Pacific Navigator",
  "imo_number": "9234567",
  "vessel_screened": true,
  "vessel_screening_date": "2025-02-20",
  "insurer": "Lloyd's of London",
  "insurer_screened": true,
  "export_license_number": "DOC-2025-1234",
  "import_license_number": "US-IMP-2025-5678"
}
```

---

## Extensibility: Adding New Categories

If adding a **new category** (e.g., textiles, electronics, timber):

### 1. Define Category Characteristics

- **Regulatory Focus**: What's the primary compliance concern? (Export controls? Environmental regulations? Labor standards?)
- **Documentation**: What unique docs are required? (e.g., Forest Stewardship Council cert for timber)
- **Storage/Shipping**: Any special handling? (e.g., refrigerated containers for perishables)

### 2. Update TradeComplianceAgent

Add category-specific screening logic:

```typescript
// In trade-compliance-agent.ts, add to screenCommodity()
if (commodity.category === 'textiles') {
  // Check for forced labor concerns (Uyghur Forced Labor Prevention Act)
  if (deal.origin_country === 'CN' && commodity.name.includes('Cotton')) {
    flags.push({
      flag_type: 'FORCED_LABOR',
      severity: 'CRITICAL',
      blocks_execution: true,
      message: 'Cotton from China (Xinjiang region). UFLPA import ban may apply.',
      recommendation: 'Verify: (1) Cotton NOT from Xinjiang, (2) Supply chain mapping, (3) Third-party audit. Consult legal counsel.',
    });
  }
}
```

### 3. Add to UI

- Update `/commodities` page with new category card
- Create detail pages with category-specific specs
- Add certifications/standards to commodity data (e.g., FSC for timber, GOTS for textiles)

### 4. Test Compliance Screening

Create test deals with new category, verify flags generated appropriately.

---

## Migration Path: From Coffee-Focused to Multi-Commodity

### Phase 1: Database Refactoring ✅ COMPLETE

- ✅ Rename `coffee_grades` → `commodities`
- ✅ Add `category`, `hs_code`, `restricted` fields
- ✅ Generalize `proposals` table to handle any commodity
- ✅ Update TradeComplianceAgent to use `commodity.restricted` instead of hardcoded list

### Phase 2: UI Updates ✅ COMPLETE

- ✅ Transform homepage from "Coffee Advisory OS" → "FTH Trading"
- ✅ Create `/commodities` catalog page with 6 commodities
- ✅ Create dynamic `/commodities/[slug]` detail pages
- ✅ Add multi-commodity dropdown to `/request-terms` form

### Phase 3: Agent Updates ⏸ IN PROGRESS

- ✅ TradeComplianceAgent: Commodity-agnostic screening
- ⏸ ProposalAgent: Generate proposals for any commodity (currently coffee-focused)
- ⏸ SupplierAgent: Generalize supplier scoring (currently coffee roaster-specific)
- ⏸ OutreachAgent: Update email templates for multi-commodity

### Phase 4: Documentation 🔄 CURRENT

- ✅ compliance.md: Architecture documentation
- ✅ commodities.md: This file (commodity-agnostic guide)
- ⏸ DEPLOYMENT-GUIDE.md: Add compliance deployment steps

---

## Best Practices

### ✅ DO

- **Use HS codes consistently**: Always store 6-digit HS codes (can extend to 8-10 for national variants)
- **Category-based logic**: Group commodities by category for shared processing rules
- **Metadata-driven**: Store commodity rules in database, not in code
- **Document sources**: Link to official HS code lookups, LBMA refiner lists, etc.
- **Test compliance**: Create test deals for each new commodity to verify TradeComplianceAgent logic

### ❌ DON'T

- **Hardcode commodity names**: Use `commodity.category` or `commodity.restricted` flag instead of `if (name === 'Gold')`
- **Assume incoterms**: Different commodities use different incoterms. Store in deal, not in commodity metadata.
- **Skip HS code**: Every commodity MUST have an HS code for customs classification
- **Over-generalize**: Some commodities have unique requirements (e.g., precious metals chain-of-custody). Handle as category-specific logic.
- **Forget compliance notes**: Always populate `commodity.compliance_notes` with human-readable guidance for deal managers

---

## FAQ

**Q: Can we add services (e.g., freight forwarding, customs brokerage) as "commodities"?**  
A: No. Services are not commodities (no HS code, no physical shipment). Model services separately (e.g., `services` table).

**Q: What if a client wants a commodity not in our catalog?**  
A: Deal manager can add to database via `/dashboard/rules` → Commodities tab. Compliance officer reviews, assigns `restricted` flag and compliance notes.

**Q: How do we handle commodity bundles (e.g., coffee + cocoa in one shipment)?**  
A: Not yet supported. Future: Create `deal_items` table (many-to-many relationship). For now, create separate deals.

**Q: Do we need separate YAML files for commodities (like we have for jurisdictions)?**  
A: Optional. Currently, commodities stored in database only. Could add `rules/commodities/*.yaml` for complex commodities (e.g., precious metals YAML with LBMA refiner list).

**Q: How often should we update HS codes?**  
A: HS codes are updated by WCO every 5 years (HS 2022, HS 2027, etc.). Review annually.

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-25  
**Next Review**: 2026-05-25  
**Maintained By**: Product & Compliance Team
