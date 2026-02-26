import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'

// Static post content map
const POSTS: Record<string, {
  category: string
  title: string
  date: string
  readTime: string
  intro: string
  sections: { heading: string; body: string }[]
  tags: string[]
  relatedSlugs: string[]
}> = {
  'ucp-600-lc-structuring-guide': {
    category: 'Trade Finance',
    title: 'UCP 600 & Letter of Credit Structuring: A Practical Guide for Commodity Buyers',
    date: 'February 2026',
    readTime: '8 min',
    intro: 'The Letter of Credit (LC) remains the dominant payment mechanism in international commodity trade. Governed by the Uniform Customs and Practice for Documentary Credits (UCP 600), it provides a bank-backed payment guarantee to the seller while protecting the buyer by tying payment to specific document presentation.',
    sections: [
      {
        heading: 'What is UCP 600?',
        body: 'UCP 600 is the ICC publication that governs the issuance and operation of Letters of Credit globally. Effective since July 2007, it replaced UCP 500 and introduced clearer definitions of key terms, refined rules on document examination, and reduced the time banks have to examine documents from 7 to 5 banking days. Under UCP 600, an LC is irrevocable unless otherwise stated, and once confirmed by a confirming bank, the confirming bank undertakes to honour complying presentations independently of the issuing bank.',
      },
      {
        heading: 'Key LC Types in Commodity Trade',
        body: 'Sight LCs require immediate payment upon presentation of complying documents. Usance (deferred payment) LCs allow a credit period  -  typically 30, 60, 90, or 180 days  -  enabling the buyer to take delivery and sell before payment falls due. Red Clause LCs allow the seller to draw an advance before shipment, useful for pre-financing production. Transferable LCs allow a middleman to transfer part of the credit to a supplier, essential in multi-tier commodity chains.',
      },
      {
        heading: 'Critical Documents for Commodity LCs',
        body: 'A typical commodity LC requires: (1) Commercial Invoice  -  must match LC terms exactly; (2) Full set of original Clean On-Board Bills of Lading; (3) Packing List; (4) Certificate of Origin (preferably from Chamber of Commerce); (5) Phytosanitary / Health Certificate for agricultural commodities; (6) SGS or Bureau Veritas inspection report; (7) Weight & Quality Certificate from an accredited laboratory. Any discrepancy between presented documents and LC terms gives the issuing bank the right to refuse payment  -  a major risk if documents are not carefully reviewed pre-shipment.',
      },
      {
        heading: 'Common Discrepancies and How to Avoid Them',
        body: 'The most common LC discrepancies in commodity trade are: late presentation (documents presented after the expiry date or beyond the 21-day default); late shipment (B/L date after the latest shipment date in the LC); description mismatch (invoice description does not exactly match LC commodity description); quantity or amount tolerance breaches; and missing endorsements on B/L. To avoid these, FTH structures all LCs with clear tolerance clauses (typically +/-5-10% on quantity and amount), realistic shipment windows, and a document review step before presentation.',
      },
      {
        heading: 'FTH Trading\'s LC Structuring Approach',
        body: 'At FTH, every LC is structured by the desk with the benefit of 50 years of trade experience. We review the proforma invoice and agree terms before the LC is opened, negotiating acceptable clauses, confirming bank selection, and pre-aligning on inspection requirements. All LCs are compliance-screened before we raise an instrument request. Our platform generates the draft LC application ready for presentation to the issuing bank, reducing errors and processing time.',
      },
    ],
    tags: ['UCP 600', 'Letter of Credit', 'Trade Finance', 'Documentary Credits', 'Commodities'],
    relatedSlugs: ['sblc-bg-trade-finance', 'incoterms-guide-fob-cif', 'kyc-kyb-commodity-buyers'],
  },
  'xrpl-commodity-escrow': {
    category: 'RWA & Blockchain',
    title: 'How XRPL Escrow Is Changing Commodity Settlement',
    date: 'January 2026',
    readTime: '6 min',
    intro: 'Cross-border commodity settlement has historically relied on correspondent banking, SWIFT messaging, and paper-based documentation  -  a process that can take days and carries significant counterparty risk. XRPL\'s native escrow functionality offers a programmatic alternative that reduces risk and time drastically.',
    sections: [
      {
        heading: 'What is XRPL EscrowCreate?',
        body: 'XRPL is a public blockchain with native escrow functionality built into the protocol layer  -  no smart contracts required. The EscrowCreate transaction locks XRP (or issued tokens) in escrow until one of two conditions is met: a specific expiry time passes (time-based escrow), or a cryptographic condition (hashlock) is fulfilled (crypto-condition escrow). This is ideal for commodity transactions where payment should only be released upon confirmed delivery or inspection.',
      },
      {
        heading: 'Milestone-Based Release in Commodity Deals',
        body: 'FTH structures XRPL escrow with defined release milestones. Typical triggers include: (1) SGS inspection certificate issued; (2) Clean On-Board Bill of Lading presented; (3) Port discharge confirmation from receiving terminal. Each milestone is hashed and the hash is set as the crypto-condition for the escrow release. The seller provides the pre-image to unlock funds only once the corresponding physical event has been verified.',
      },
      {
        heading: 'SHA-256 Document Anchoring',
        body: 'Beyond escrow, FTH anchors all deal documents to XRPL using SHA-256 hash records in transaction memos. This creates an immutable timestamp proving that a specific document existed at a specific point in time  -  providing tamper-evident proof of existence for contracts, inspection reports, and settlement instructions without exposing sensitive content on-chain.',
      },
      {
        heading: 'Settlement Speed Advantage',
        body: 'XRPL achieves finality in 3-5 seconds at fractions of a cent per transaction, compared to SWIFT\'s 1-5 business day settlement window. For commodity deals where speed of payment confirmation is operationally critical (e.g., port demurrage charges accumulate daily), this is a material advantage.',
      },
    ],
    tags: ['XRPL', 'Blockchain', 'RWA', 'Escrow', 'Settlement', 'Commodity Trade'],
    relatedSlugs: ['rwa-commodity-tokenization', 'stellar-anchor-settlement', 'xrpl-commodity-escrow'],
  },
  'ofac-sanctions-commodity-trade': {
    category: 'Compliance',
    title: 'OFAC Sanctions Screening in Commodity Trade: What Every Buyer Needs to Know',
    date: 'December 2025',
    readTime: '7 min',
    intro: 'The Office of Foreign Assets Control (OFAC) administers and enforces US economic sanctions. For international commodity traders, even those not based in the US, OFAC\'s reach extends broadly through the correspondent banking system and USD-denominated transactions.',
    sections: [
      {
        heading: 'Who Does OFAC Apply To?',
        body: 'OFAC sanctions apply directly to US persons and entities, but have extraterritorial reach through secondary sanctions  -  which threaten to cut off non-US persons from the US financial system if they transact with sanctioned parties. Since most commodity transactions settle in USD and pass through US correspondent banks, OFAC compliance is effectively mandatory for any firm operating in global commodity markets.',
      },
      {
        heading: 'SDN List: The Primary Screening Target',
        body: 'The Specially Designated Nationals (SDN) list is OFAC\'s primary sanctions list. It contains individuals, companies, and vessels designated under various sanctions programs (OFAC Iran, Russia, North Korea, Cuba, Venezuela, etc.). Any transaction with an SDN, or any entity 50%+ owned by an SDN, is prohibited. FTH screens all counterparties, beneficial owners, vessels, and jurisdictions against the full SDN list before initiating any deal structure or instrument request.',
      },
      {
        heading: 'Secondary Sanctions & Jurisdictional Risk',
        body: 'Secondary sanctions create additional risk for firms transacting in or through high-risk jurisdictions  -  including Russia, Iran, North Korea, Cuba, Venezuela, Syria, and portions of Ukraine. Even if no SDN is directly involved, transacting through these jurisdictions may trigger enforcement. FTH applies a FATF-aligned jurisdiction risk matrix to all deals and escalates high-risk jurisdictions to human review.',
      },
      {
        heading: 'FTH Compliance Screening Protocol',
        body: 'FTH\'s compliance layer runs automated OFAC SDN checks on: buyer entity and all named directors, seller entity and all named directors, freight forwarder, vessel name and IMO number, port and jurisdiction of origin/destination, and beneficiary banks. Every check is logged, timestamped, and attached to the deal record. High-risk flags are held for human review  -  no instrument is raised until compliance approval is granted.',
      },
    ],
    tags: ['OFAC', 'Sanctions', 'Compliance', 'SDN', 'AML', 'Trade Finance'],
    relatedSlugs: ['fatf-grey-list-impact', 'kyc-kyb-commodity-buyers', 'ucp-600-lc-structuring-guide'],
  },
}

// Stub for all other slugs
function getPost(slug: string) {
  if (POSTS[slug]) return POSTS[slug]
  // Return a generic stub for stubs not yet written
  const stubTitles: Record<string, string> = {
    'incoterms-guide-fob-cif': 'Incoterms 2020: FOB vs CIF vs DDP',
    'rwa-commodity-tokenization': 'Real World Asset Tokenization in Agriculture',
    'sblc-bg-trade-finance': 'SBLC vs Bank Guarantee',
    'kyc-kyb-commodity-buyers': 'KYC & KYB in Commodity Trade',
    'stellar-anchor-settlement': 'Using Stellar Anchors for Settlement',
    'fatf-grey-list-impact': 'FATF Grey List & Commodity Trade',
  }
  if (!stubTitles[slug]) return null
  return {
    category: 'Trade Finance',
    title: stubTitles[slug],
    date: '2025',
    readTime: '6 min',
    intro: 'This article is coming soon. FTH Trading publishes regular insights on commodity trade finance, compliance, and blockchain settlement. Check back shortly.',
    sections: [],
    tags: [],
    relatedSlugs: ['ucp-600-lc-structuring-guide', 'xrpl-commodity-escrow', 'ofac-sanctions-commodity-trade'],
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Trade Finance': 'text-amber-500 border-amber-900/40 bg-amber-950/30',
  'RWA & Blockchain': 'text-blue-400 border-blue-900/40 bg-blue-950/30',
  'Compliance': 'text-red-400 border-red-900/40 bg-red-950/30',
}

export default function InsightPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">
      {/* Nav */}
      <header className="border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={13} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight text-sm">FTH Trading</span>
          </Link>
          <Link href="/insights" className="flex items-center gap-1.5 text-xs text-[#6d4c41] hover:text-[#a1887f] transition-colors">
            <ArrowLeft size={13} /> Insights
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] ?? 'text-[#6d4c41] border-white/5'}`}>
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#3e2723]">
            <Calendar size={11} /> {post.date}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#3e2723]">
            <Clock size={11} /> {post.readTime} read
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-6 leading-tight">
          {post.title}
        </h1>

        <p className="text-base text-[#a1887f] leading-relaxed mb-10 border-l-2 border-amber-800/40 pl-4">
          {post.intro}
        </p>

        {post.sections.map(({ heading, body }) => (
          <section key={heading} className="mb-10">
            <h2 className="text-lg font-bold text-[#efebe9] mb-3">{heading}</h2>
            <p className="text-sm text-[#a1887f] leading-[1.85]">{body}</p>
          </section>
        ))}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 my-12 pt-8 border-t border-white/5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-white/5 text-[#6d4c41] bg-white/[0.03]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-amber-950/40 to-[#0d0906] border border-amber-900/30 rounded-2xl p-7 mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-2">FTH Trading</p>
          <h3 className="font-bold text-[#efebe9] mb-2">Ready to structure a deal?</h3>
          <p className="text-sm text-[#6d4c41] mb-4">Submit a term request to our structuring desk. All inquiries subject to compliance review.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/request-terms" className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Request Terms <ArrowRight size={13} />
            </Link>
            <Link href="/brokers" className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Broker Inquiry
            </Link>
          </div>
        </div>

        {/* Related */}
        {post.relatedSlugs.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#6d4c41] mb-5">Related Articles</p>
            <div className="space-y-3">
              {post.relatedSlugs.filter(s => s !== params.slug).slice(0, 3).map((s) => {
                const rel = getPost(s)
                if (!rel) return null
                return (
                  <Link key={s} href={`/insights/${s}`} className="flex items-start justify-between gap-4 bg-white/[0.025] hover:bg-white/[0.04] border border-white/5 rounded-xl px-5 py-4 transition-colors group">
                    <span className="text-sm text-[#a1887f] group-hover:text-[#efebe9] transition-colors leading-snug">{rel.title}</span>
                    <ArrowRight size={14} className="text-amber-800 shrink-0 mt-0.5" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </article>
    </main>
  )
}
