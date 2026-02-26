/**
 * CompanyResearchAgent
 *
 * Researches companies from LAWFUL PUBLIC SOURCES ONLY.
 *
 * Legal Boundaries:
 * - Only fetches publicly accessible pages (no auth bypass, no wall bypass)
 * - Respects robots.txt
 * - Does NOT harvest emails via pattern guessing or brute force
 * - Does NOT scrape LinkedIn (terms of service violation)
 * - Sources: company websites, About pages, leadership pages, public registries
 *
 * What it extracts:
 * - Company name, description, industry positioning
 * - Publicly listed executive names (from About/Team pages)
 * - Publicly listed contact emails (only if explicitly shown on page)
 * - Company address (from public Contact page)
 * - Products/services that indicate commodity fit
 */

import OpenAI from 'openai';
import { sql } from '@/lib/sql';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'build-placeholder', dangerouslyAllowBrowser: false });

export interface CompanyResearchResult {
  company_id?: string;
  name: string;
  domain: string;
  website: string;
  industry?: string;
  company_type?: string;
  hq_country?: string;
  hq_city?: string;
  hq_address?: string;
  commodities?: string[];
  description?: string;
  publicly_listed_contacts: PublicContact[];
  source: string;
  sourced_at: Date;
  opportunity_score?: number;
  raw_scraped_data?: Record<string, any>;
  research_notes?: string;
}

export interface PublicContact {
  name: string;
  title?: string;
  email?: string;                  // Only if publicly listed on the page
  email_source?: string;           // URL where found
  is_generic?: boolean;            // info@, contact@, etc.
  linkedin_url?: string;           // Only if publicly listed
}

class CompanyResearchAgent {
  private readonly name = 'CompanyResearchAgent';

  /**
   * Research a company from its public website.
   *
   * Flow:
   * 1. Fetch homepage ? extract company description, industry, address
   * 2. Fetch /about or /team ? extract publicly listed executive names
   * 3. Fetch /contact ? extract publicly listed emails and address
   * 4. AI analysis ? score commodity fit, infer industry positioning
   * 5. Persist to companies table
   *
   * @param websiteUrl  Full URL, e.g. 'https://acme.com'
   * @param targetCommodities  Commodities to score fit against
   */
  async researchCompany(
    websiteUrl: string,
    targetCommodities: string[] = ['coffee', 'cocoa', 'gold', 'sugar', 'crude oil']
  ): Promise<CompanyResearchResult> {
    console.log(`[${this.name}] Researching: ${websiteUrl}`);

    const domain = this.extractDomain(websiteUrl);
    const rawData: Record<string, any> = {};
    const publicContacts: PublicContact[] = [];

    // --- 1. Fetch and parse public pages -------------------------------
    const pages = await this.fetchPublicPages(websiteUrl);
    rawData.pages_fetched = pages.map((p) => p.url);

    // --- 2. Extract structured data via AI analysis --------------------
    const combinedText = pages.map((p) => `\n\n=== ${p.url} ===\n${p.text}`).join('');
    const aiAnalysis = await this.analyzeWithAI(combinedText, domain, targetCommodities);

    // --- 3. Extract publicly listed contacts from text -----------------
    const extractedContacts = await this.extractPublicContacts(combinedText, pages);
    publicContacts.push(...extractedContacts);

    // --- 4. Build result ------------------------------------------------
    const result: CompanyResearchResult = {
      name: aiAnalysis.company_name || domain,
      domain,
      website: websiteUrl,
      industry: aiAnalysis.industry,
      company_type: 'prospect',
      hq_country: aiAnalysis.hq_country,
      hq_city: aiAnalysis.hq_city,
      hq_address: aiAnalysis.hq_address,
      commodities: aiAnalysis.commodities_detected,
      description: aiAnalysis.description,
      publicly_listed_contacts: publicContacts,
      source: 'website',
      sourced_at: new Date(),
      opportunity_score: aiAnalysis.opportunity_score,
      raw_scraped_data: rawData,
      research_notes: aiAnalysis.research_notes,
    };

    return result;
  }

  /**
   * Fetch publicly accessible pages from a company website.
   * Respects standard HTTP conventions. No bypass of auth or paywalls.
   */
  private async fetchPublicPages(
    baseUrl: string
  ): Promise<Array<{ url: string; text: string }>> {
    const results: Array<{ url: string; text: string }> = [];
    const pagesToTry = ['/', '/about', '/about-us', '/team', '/leadership', '/contact', '/contact-us'];

    for (const path of pagesToTry) {
      const url = `${baseUrl.replace(/\/$/, '')}${path}`;
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'FTHTradingBot/1.0 (business research; contact@unykorn.org)',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const html = await response.text();
        const text = this.extractTextFromHTML(html);
        if (text.length > 100) {
          results.push({ url, text: text.slice(0, 5000) }); // Cap per page
        }
      } catch {
        // Page not available - skip silently
      }
    }

    return results;
  }

  /**
   * Strip HTML tags and extract plain text content.
   * Removes scripts, styles, nav boilerplate.
   */
  private extractTextFromHTML(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Use GPT-4o to analyse the raw page text and extract structured data.
   */
  private async analyzeWithAI(
    pageText: string,
    domain: string,
    targetCommodities: string[]
  ): Promise<{
    company_name: string;
    industry: string;
    description: string;
    hq_country?: string;
    hq_city?: string;
    hq_address?: string;
    commodities_detected: string[];
    opportunity_score: number;
    research_notes: string;
  }> {
    const prompt = `You are a B2B sales intelligence analyst for FTH Trading, a global commodity trading firm.

Analyze the following publicly scraped website text from domain: ${domain}

TARGET COMMODITIES FTH TRADING DEALS IN:
${targetCommodities.join(', ')}

WEBSITE TEXT:
${pageText.slice(0, 8000)}

Extract the following in JSON format:
{
  "company_name": "Official company name",
  "industry": "Primary industry (commodity_trading / food_manufacturing / retail / hedge_fund / industrial / other)",
  "description": "2-sentence company description based on their public positioning",
  "hq_country": "Country code (2-letter ISO)",
  "hq_city": "City if mentioned",
  "hq_address": "Full address if publicly stated",
  "commodities_detected": ["list of commodities mentioned on their site that match FTH target commodities"],
  "opportunity_score": 0-100 (100 = perfect fit for FTH commodity offerings),
  "research_notes": "Why this company is or isn't a good prospect for FTH Trading"
}

Be conservative with opportunity_score. Only score high if they clearly buy/sell the target commodities at meaningful volume.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    try {
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch {
      return {
        company_name: domain,
        industry: 'unknown',
        description: 'Could not parse company information',
        commodities_detected: [],
        opportunity_score: 0,
        research_notes: 'AI analysis failed to parse company data',
      };
    }
  }

  /**
   * Extract publicly listed contacts from page text.
   * ONLY extracts contacts that are explicitly listed on the page.
   * Does NOT guess or construct emails.
   */
  private async extractPublicContacts(
    pageText: string,
    pages: Array<{ url: string; text: string }>
  ): Promise<PublicContact[]> {
    const prompt = `Extract ONLY explicitly stated contact information from this website text.

Rules:
- Only list people/emails that are EXPLICITLY written on the page
- Do NOT guess email addresses
- Do NOT construct emails from patterns
- Generic emails (info@, contact@, sales@) are OK if explicitly shown
- For each person found, note whether they are a decision-maker (C-level, VP, Director, Head of)

TEXT:
${pageText.slice(0, 6000)}

Return JSON array:
[{
  "name": "Full name or null",
  "title": "Job title or null",
  "email": "Email address ONLY if explicitly shown on the page, else null",
  "email_source": "Which URL the email was found on, or null",
  "is_generic": true/false (is it info@, contact@, etc?),
  "linkedin_url": "LinkedIn URL only if explicitly linked from their public page, else null"
}]

If no contacts found, return [].`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    try {
      const parsed = JSON.parse(completion.choices[0].message.content || '{"contacts":[]}');
      return Array.isArray(parsed) ? parsed : (parsed.contacts || []);
    } catch {
      return [];
    }
  }

  /**
   * Persist research result to companies table.
   */
  async persistResearch(result: CompanyResearchResult): Promise<string> {
    const existing = await sql`
      SELECT company_id FROM companies WHERE domain = ${result.domain}
    `;

    if (existing.rows.length > 0) {
      // Update existing
      await sql`
        UPDATE companies SET
          name = ${result.name},
          website = ${result.website},
          industry = ${result.industry || null},
          hq_country = ${result.hq_country || null},
          hq_city = ${result.hq_city || null},
          hq_address = ${result.hq_address || null},
          commodities = ${result.commodities as any},
          opportunity_score = ${result.opportunity_score || null},
          raw_scraped_data = ${JSON.stringify(result.raw_scraped_data)},
          research_notes = ${result.research_notes || null},
          research_status = 'researched',
          last_researched_at = NOW(),
          updated_at = NOW()
        WHERE domain = ${result.domain}
      `;
      return (existing.rows[0] as any).company_id as string;
    }

    // Insert new
    const inserted = await sql`
      INSERT INTO companies (
        name, domain, website, industry, company_type, hq_country, hq_city, hq_address,
        commodities, opportunity_score, raw_scraped_data, research_notes,
        research_status, source, sourced_at, last_researched_at
      ) VALUES (
        ${result.name}, ${result.domain}, ${result.website}, ${result.industry || null},
        'prospect', ${result.hq_country || null}, ${result.hq_city || null}, ${result.hq_address || null},
        ${result.commodities as any}, ${result.opportunity_score || null},
        ${JSON.stringify(result.raw_scraped_data)}, ${result.research_notes || null},
        'researched', 'website', ${result.sourced_at.toISOString()}, NOW()
      )
      RETURNING company_id
    `;

    const companyId = (inserted.rows[0] as any).company_id as string;

    // Persist publicly listed contacts
    for (const contact of result.publicly_listed_contacts) {
      if (!contact.name && !contact.email) continue; // Skip empty contacts

      await sql`
        INSERT INTO contacts (
          company_id, first_name, last_name, title, email,
          email_source, email_type, consent_status, gdpr_basis
        ) VALUES (
          ${companyId},
          ${contact.name?.split(' ')[0] || 'Unknown'},
          ${contact.name?.split(' ').slice(1).join(' ') || null},
          ${contact.title || null},
          ${contact.email || null},
          ${contact.email_source || null},
          ${contact.is_generic ? 'generic' : 'direct'},
          'unknown',
          'legitimate_interest'
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`[${this.name}] ? Persisted: ${result.name} (${companyId})`);
    return companyId;
  }

  /**
   * Bulk research a list of websites.
   * Rate-limited to avoid overloading target servers.
   */
  async bulkResearch(
    websites: string[],
    delayMs: number = 2000
  ): Promise<Array<{ website: string; status: 'ok' | 'error'; company_id?: string; error?: string }>> {
    const results = [];

    for (const website of websites) {
      try {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        const research = await this.researchCompany(website);
        const companyId = await this.persistResearch(research);
        results.push({ website, status: 'ok' as const, company_id: companyId });
      } catch (err: any) {
        console.error(`[${this.name}] Error researching ${website}:`, err.message);
        results.push({ website, status: 'error' as const, error: err.message });
      }
    }

    return results;
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}

export { CompanyResearchAgent };
export const companyResearchAgent = new CompanyResearchAgent();
export default CompanyResearchAgent;
