import { sql } from '@/lib/sql';
import type { SupplierOrigin } from '@/types';

/**
 * Supplier Origin Agent
 * 
 * Responsibilities:
 * - Track regenerative coffee origins
 * - Generate sustainability certificates
 * - Inject impact metrics into proposals
 * - Monitor supply chain
 */

class SupplierOriginAgent {
  private readonly name = 'SupplierOriginAgent';
  
  /**
   * Generate sustainability certificate
   */
  async generateCertificate(lotId: string, clientId?: string): Promise<{
    certificate: any;
    impactMetrics: any;
    pdfUrl: string;
  }> {
    console.log(`[${this.name}] Generating certificate for lot: ${lotId}`);
    
    try {
      // Fetch origin data
      const result = await sql`
        SELECT * FROM supplier_origins
        WHERE lot_id = ${lotId}
      `;
      
      if (result.rows.length === 0) {
        throw new Error(`Origin lot not found: ${lotId}`);
      }
      
      const origin = result.rows[0] as SupplierOrigin;
      
      // Build certificate data
      const certificate = {
        lot_id: origin.lot_id,
        origin: {
          country: origin.country,
          region: origin.region,
          farm_name: origin.farm_name,
          farmer_name: origin.farmer_name,
        },
        sustainability: {
          is_regenerative: origin.is_regenerative,
          certifications: origin.certifications,
          practices: origin.sustainability_practices,
        },
        impact: {
          carbon_sequestration_kg: origin.carbon_sequestration_kg,
          biodiversity_score: origin.biodiversity_score,
          water_conservation_m3: origin.water_conservation_m3,
          fair_trade: origin.fair_trade,
        },
        supply: {
          harvest_date: origin.harvest_date,
          arrival_date: origin.arrival_date,
        },
        issued_at: new Date(),
        issued_to: clientId,
      };
      
      // Generate PDF URL (would be actual PDF generation)
      const pdfUrl = `/api/certificates/${lotId}.pdf`;
      
      // Log action
      await this.logAction('generate_certificate', { lotId, clientId }, certificate);
      
      console.log(`[${this.name}] ✅ Certificate generated for ${origin.farm_name}`);
      
      return {
        certificate,
        impactMetrics: certificate.impact,
        pdfUrl,
      };
    } catch (error) {
      console.error(`[${this.name}] ❌ Error generating certificate:`, error);
      throw error;
    }
  }
  
  /**
   * Get all regenerative origins
   */
  async getRegenerativeOrigins(): Promise<SupplierOrigin[]> {
    try {
      const result = await sql`
        SELECT * FROM supplier_origins
        WHERE is_regenerative = true
        AND available_lbs > 0
        ORDER BY arrival_date DESC
      `;
      
      return result.rows as SupplierOrigin[];
    } catch (error) {
      console.error(`[${this.name}] Error fetching regenerative origins:`, error);
      throw error;
    }
  }
  
  /**
   * Get origin by region
   */
  async getOriginsByRegion(region: string): Promise<SupplierOrigin[]> {
    try {
      const result = await sql`
        SELECT * FROM supplier_origins
        WHERE region ILIKE ${'%' + region + '%'}
        AND available_lbs > 0
        ORDER BY carbon_sequestration_kg DESC
      `;
      
      return result.rows as SupplierOrigin[];
    } catch (error) {
      console.error(`[${this.name}] Error fetching origins by region:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate total impact metrics
   */
  async calculateTotalImpact(): Promise<{
    total_carbon_sequestered: number;
    total_water_conserved: number;
    farms_supported: number;
    fair_trade_percentage: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          SUM(carbon_sequestration_kg) as total_carbon,
          SUM(water_conservation_m3) as total_water,
          COUNT(DISTINCT lot_id) as total_farms,
          COUNT(CASE WHEN fair_trade = true THEN 1 END)::float / COUNT(*)::float * 100 as fair_trade_pct
        FROM supplier_origins
        WHERE is_regenerative = true
      `;
      
      const data = result.rows[0];
      
      return {
        total_carbon_sequestered: parseFloat(data.total_carbon) || 0,
        total_water_conserved: parseFloat(data.total_water) || 0,
        farms_supported: parseInt(data.total_farms) || 0,
        fair_trade_percentage: parseFloat(data.fair_trade_pct) || 0,
      };
    } catch (error) {
      console.error(`[${this.name}] Error calculating impact:`, error);
      throw error;
    }
  }
  
  /**
   * Monitor low stock origins
   */
  async monitorLowStock(threshold: number = 100): Promise<SupplierOrigin[]> {
    try {
      const result = await sql`
        SELECT * FROM supplier_origins
        WHERE available_lbs < ${threshold}
        AND available_lbs > 0
        ORDER BY available_lbs ASC
      `;
      
      if (result.rows.length > 0) {
        console.warn(`[${this.name}] ⚠️ ${result.rows.length} origins below ${threshold} lbs`);
      }
      
      return result.rows as SupplierOrigin[];
    } catch (error) {
      console.error(`[${this.name}] Error monitoring stock:`, error);
      throw error;
    }
  }
  
  /**
   * Add new origin to system
   */
  async addOrigin(originData: Omit<SupplierOrigin, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierOrigin> {
    try {
      const result = await sql`
        INSERT INTO supplier_origins (
          lot_id,
          country,
          region,
          farm_name,
          farmer_name,
          is_regenerative,
          certifications,
          sustainability_practices,
          carbon_sequestration_kg,
          biodiversity_score,
          water_conservation_m3,
          fair_trade,
          available_lbs,
          harvest_date,
          arrival_date
        ) VALUES (
          ${originData.lot_id},
          ${originData.country},
          ${originData.region},
          ${originData.farm_name},
          ${originData.farmer_name || null},
          ${originData.is_regenerative},
          ${originData.certifications},
          ${originData.sustainability_practices},
          ${originData.carbon_sequestration_kg || 0},
          ${originData.biodiversity_score || 0},
          ${originData.water_conservation_m3 || 0},
          ${originData.fair_trade},
          ${originData.available_lbs},
          ${originData.harvest_date || null},
          ${originData.arrival_date || null}
        )
        RETURNING *
      `;
      
      console.log(`[${this.name}] ✅ Added origin: ${originData.farm_name}`);
      
      return result.rows[0] as SupplierOrigin;
    } catch (error) {
      console.error(`[${this.name}] Error adding origin:`, error);
      throw error;
    }
  }
  
  /**
   * Log agent action
   */
  private async logAction(
    action: string,
    inputData: any,
    outputData: any
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO agent_logs (
          agent_name,
          action,
          input_data,
          output_data,
          success
        ) VALUES (
          ${this.name},
          ${action},
          ${JSON.stringify(inputData)},
          ${outputData ? JSON.stringify(outputData) : null},
          ${outputData !== null}
        )
      `;
    } catch (error) {
      console.error(`[${this.name}] Error logging action:`, error);
    }
  }
}

// Export singleton instance
export default new SupplierOriginAgent();
