# Global Commodity Portfolio

FTHTrading has been structuring commodity transactions for over 50 years. Our AI-native intelligence layer modernizes five decades of institutional expertise.

---

## 🌍 Commodity Categories Supported

### Agricultural Commodities

| Commodity | HS Codes | Typical Origins | Specialty |
|:----------|:---------|:----------------|:----------|
| **Coffee** | 0901 | Brazil, Colombia, Ethiopia | Regenerative sourcing, micro-lots |
| **Cocoa** | 1801 | Côte d'Ivoire, Ghana, Ecuador | Fair trade certification |
| **Sugar** | 1701 | Brazil, India, Thailand | Raw & refined |
| **Spices** | 0904-0910 | India, Vietnam, Indonesia | Organic certification |
| **Grains** | 1001-1008 | US, Argentina, Ukraine | Non-GMO verification |

### Precious Metals

| Metal | Specification | Trading Standards | Custody |
|:------|:--------------|:------------------|:--------|
| **Gold** | .999 Fine, LBMA certified | London Good Delivery | Secured vaults, insured |
| **Silver** | .999 Fine | LBMA, COMEX | Allocated storage |
| **Platinum** | .9995 Fine | LPPM standards | Private vault network |
| **Palladium** | .9995 Fine | LPPM standards | Segregated storage |

### Base Metals

| Metal | Grades | Exchanges | Applications |
|:------|:-------|:----------|:-------------|
| **Copper** | Grade A Cathode | LME, COMEX | Industrial supply |
| **Aluminum** | Primary A7 | LME | Manufacturing |
| **Nickel** | Class 1 | LME | Battery sector |
| **Zinc** | SHG | LME | Galvanization |

### Energy Products

| Product | Specifications | Delivery Points |
|:--------|:---------------|:----------------|
| **Crude Oil** | WTI, Brent | Cushing, Houston |
| **Natural Gas** | Henry Hub | US pipelines |
| **Refined Products** | ULSD, RBOB | Terminal delivery |

---

## 🏗 System Architecture by Commodity

### Tier 1: Coffee (Flagship Product)
**Status:** Fully operational AI infrastructure

- Complete RAG system for historical proposals
- Regenerative sourcing certification
- Automated credit scoring
- Dynamic proposal generation
- Micro-lot origin tracking

**Target Market:** Convenience stores, gas stations, boutique cafes

---

### Tier 2: Precious Metals
**Status:** Trade compliance + custody protocols active

**Additional Requirements:**
- LBMA certification verification
- Vault custody tracking
- Assay documentation
- Chain of custody logging
- Insurance certificate generation

**New Agent:** `MetalsCustodyAgent`

```typescript
export class MetalsCustodyAgent {
  async arrangeDelivery(order: MetalOrder): Promise<CustodyPlan> {
    // 1. Verify LBMA certification
    // 2. Arrange allocated storage
    // 3. Generate custody certificate
    // 4. Coordinate insured transport
    // 5. Provide tracking + assay docs
  }
}
```

**Target Market:** Investment clients, jewelers, industrial buyers

---

### Tier 3: Agricultural Commodities (Sugar, Cocoa, Spices)
**Status:** Commodity registry active, compliance layer operational

**Requirements:**
- Phytosanitary certificates
- Fair trade/organic certification verification
- HS code classification
- Origin documentation
- Quality grading (ICO/ISO standards)

**Expansion of:** `SupplierOriginAgent` → handles multiple commodity certifications

**Target Market:** Food manufacturers, wholesalers, retail chains

---

### Tier 4: Base Metals & Energy
**Status:** Trade finance structures ready, licensing protocols established

**Requirements:**
- LME/COMEX exchange integration
- Forward contracts modeling
- Hedging strategy automation
- Quality specifications (ASTM/ISO)
- Storage/warehousing logistics

**New Agent:** `HedgingAgent`

```typescript
export class HedgingAgent {
  async structureHedge(exposure: Exposure): Promise<HedgeStrategy> {
    // 1. Calculate price exposure
    // 2. Model forward contracts
    // 3. Generate hedge recommendations
    // 4. Execute via exchange APIs
    // 5. Monitor margin requirements
  }
}
```

**Target Market:** Industrial buyers, manufacturers, traders

---

## ⚖️ Compliance Framework by Commodity

### Coffee (Agricultural)
- USDA import requirements
- Organic/Fair Trade certification
- Phytosanitary documentation
- FDA food safety

### Precious Metals
- Anti-Money Laundering (AML) protocols
- Know Your Customer (KYC) enhanced due diligence
- OFAC sanctions screening
- Suspicious Activity Reporting (SAR)
- Large Currency Transaction Reporting (>$10K)

### Base Metals
- Export Control Administration (ECA) licenses
- Strategic material restrictions
- Tariff classification
- Certificate of Origin

### Energy Products
- Department of Energy export approval
- Pipeline capacity allocation
- FERC regulations
- EPA environmental compliance

---

## 🧠 Trade Compliance Agent Expansion

New comprehensive compliance engine:

```typescript
export class TradeComplianceAgent {
  async screenTransaction(deal: Deal): Promise<ComplianceResult> {
    const checks = [];
    
    // 1. Sanctions screening
    checks.push(await this.ofacCheck(deal.counterparty));
    
    // 2. Commodity-specific regulations
    if (deal.commodity.category === 'metals') {
      checks.push(await this.amlCheck(deal));
    }
    
    // 3. Export controls
    checks.push(await this.exportControlCheck(deal.destination));
    
    // 4. Value thresholds
    if (deal.value > 10000) {
      checks.push({ type: 'CTR', required: true });
    }
    
    // 5. Licensing requirements
    checks.push(await this.licenseCheck(deal));
    
    return this.aggregate(checks);
  }
}
```

---

## 📊 Pricing Intelligence by Commodity

### Coffee
- ICO composite indicator
- Differential pricing by origin/grade
- Volume tier discounts
- Credit-based terms

### Precious Metals
- LBMA spot pricing + premium
- Fabrication fees
- Storage/insurance costs
- Delivery charges

### Base Metals
- LME 3-month forward pricing
- Warehouse premiums
- Freight differentials
- Quality adjustments

### Energy
- Futures market pricing (NYMEX/ICE)
- Basis differentials
- Transportation costs
- Storage contango/backwardation

---

## 🌐 Global Sourcing Network

### Established Relationships (50 Years)

**Agricultural:**
- Brazil: 15+ coffee cooperatives, sugar mills
- Colombia: Direct farm relationships
- India: Spice traders, tea estates
- Vietnam: Rice, coffee processors

**Metals:**
- Switzerland: Precious metals refineries (LBMA)
- South Africa: Gold producers
- Chile: Copper mining operations
- Australia: Iron ore, aluminum

**Energy:**
- US Gulf Coast: Crude oil, refined products
- Middle East: Petroleum relationships
- Canada: Natural gas pipelines

---

## 🔐 Risk Management by Commodity

### Agricultural
- Weather/crop risk
- Currency fluctuations
- Quality variation
- Logistics delays

**Mitigation:** Multi-origin sourcing, forward contracts, quality inspection protocols

### Precious Metals
- Price volatility
- Custody risk
- Authentication/counterfeit
- Regulatory changes

**Mitigation:** Allocated storage, LBMA certification, insurance, legal review

### Base Metals
- Exchange price swings
- Supply chain disruption
- Quality disputes
- Freight costs

**Mitigation:** Hedging strategies, quality specifications, freight forwarding partners

---

## 📈 Expansion Roadmap

### Phase 1: Coffee Excellence (Q1 2026) ✅
- Fully operational AI infrastructure
- 10+ active clients
- Regenerative sourcing established
- Dashboard analytics proven

### Phase 2: Precious Metals Integration (Q2 2026)
- Custody agent deployment
- LBMA certification tracking
- Vault partner integration
- AML/KYC automation

### Phase 3: Agricultural Portfolio (Q3 2026)
- Sugar, cocoa, spices added
- Multi-commodity proposals
- Cross-commodity analytics
- Supply chain diversification

### Phase 4: Industrial Commodities (Q4 2026)
- Base metals trading
- Energy products
- Hedging automation
- Exchange API integration

### Phase 5: Trade Finance Layer (2027)
- Letter of credit workflows
- Invoice factoring
- Supply chain financing
- Receivables management

---

## 🏆 Competitive Differentiation

| Traditional Commodity Broker | FTHTtrading Boutique OS |
|:----------------------------|:------------------------|
| Manual proposal creation | AI-generated with RAG memory |
| Phone/email pricing | Real-time intelligence dashboard |
| Generic credit checks | 110-point algorithmic scoring |
| Reactive compliance | AI-flagged jurisdiction risks |
| Single commodity focus | Multi-commodity portfolio |
| Transactional relationship | Strategic advisory partnership |
| Paper documentation | Blockchain provenance (Phase 5) |

---

## 🌍 Jurisdiction Intelligence

### High-Priority Corridors

**US → Latin America**
- Coffee, sugar, metals
- USMCA considerations
- Tariff classifications
- Phytosanitary requirements

**US → Asia**
- Precious metals
- Industrial commodities
- Export licensing
- Currency controls

**US → Europe**
- Agricultural certification (EU standards)
- REACH compliance (chemicals/metals)
- VAT/customs procedures

**US → Middle East**
- Energy products
- Precious metals
- Islamic finance compatibility
- Free trade zone benefits

---

## 📋 Required Documentation by Commodity

### Coffee
- Bill of Lading
- Certificate of Origin
- Quality certificate (cupping scores)
- Organic/Fair Trade certification
- Phytosanitary certificate
- Commercial invoice

### Precious Metals
- Assay certificate
- LBMA certification
- Certificate of Origin
- Insurance certificate
- Custody agreement
- AML documentation

### Base Metals
- Mill test certificate
- Certificate of conformity (ASTM/ISO)
- Warehouse receipt
- Inspection report
- Letter of credit

### Energy
- Certificate of Quality
- Certificate of Origin
- Pipeline nomination
- Terminal loading docs
- Safety Data Sheet (SDS)

---

## 🧠 AI Agent Specialization by Commodity

| Agent | Coffee | Metals | Base | Energy |
|:------|:-------|:-------|:-----|:-------|
| Proposal Agent | ✅ Primary | ✅ Adapted | ✅ Adapted | ✅ Adapted |
| Credit Agent | ✅ Active | ✅ Enhanced AML | ✅ Active | ✅ Active |
| Supplier Agent | ✅ Regenerative tracking | ✅ Custody tracking | ✅ Quality certs | ✅ Pipeline mgmt |
| Compliance Agent | ✅ FDA/USDA | ✅ OFAC/AML | ✅ Export controls | ✅ DOE/EPA |
| Outreach Agent | ✅ Active | ✅ Active | ✅ Active | ✅ Active |
| Hedging Agent | 🔜 Phase 3 | 🔜 Phase 2 | ✅ LME integration | ✅ NYMEX integration |
| Trade Finance Agent | 🔜 Phase 5 | 🔜 Phase 2 | 🔜 Phase 4 | 🔜 Phase 4 |

---

## 🎯 Client Segmentation by Commodity

### Retail/Small Business (Coffee Focus)
- Gas stations, convenience stores
- Boutique cafes, roasters
- Small grocery chains
- Volume: 100-1000 lbs/month
- Terms: Prepay to Net-30

### Investment/Wealth Management (Precious Metals)
- High-net-worth individuals
- Family offices
- Jewelry manufacturers
- Volume: $50K-$1M transactions
- Terms: Wire transfer, allocated storage

### Industrial/Manufacturing (Base Metals)
- Manufacturers, fabricators
- Construction companies
- Electronics producers
- Volume: Metric tons, container loads
- Terms: Net-30 to Net-60, LC available

### Trading Firms/Institutions (Energy)
- Commodity trading houses
- Refineries, distributors
- Hedge funds, prop traders
- Volume: Futures contracts, physical delivery
- Terms: Margin accounts, exchange settlement

---

## 📞 Next Steps for Full Deployment

1. **Deploy Coffee System** (immediate)
2. **Add Commodity Registry** (database expansion)
3. **Integrate LBMA API** (precious metals pricing)
4. **Build Compliance Screening** (OFAC/AML)
5. **Create Multi-Commodity Proposals** (template engine)
6. **Establish Vault Partnerships** (metals custody)
7. **Connect Exchange APIs** (LME/COMEX)
8. **Implement Trade Finance** (LC workflows)

---

**Coffee is the doorway. Commodities are the business.**

Built on 50 years of relationships.  
Powered by AI-native intelligence.

☕🥇⚡🌍
