import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { scoreCredit } from '@/lib/creditScorer'

/**
 * GET /api/leads - List all leads
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = `
      SELECT * FROM clients
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    
    const result = await sql.query(query, params)
    
    return NextResponse.json({
      success: true,
      leads: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leads - Create new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.business_name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: business_name, email' },
        { status: 400 }
      )
    }
    
    // Insert lead
    const result = await sql`
      INSERT INTO clients (
        business_name,
        contact_name,
        email,
        phone,
        ein,
        address,
        city,
        state,
        zip,
        years_in_business,
        monthly_revenue,
        shop_type,
        current_supplier,
        monthly_volume_lbs,
        preferred_roast,
        has_trade_references,
        lead_source,
        status
      ) VALUES (
        ${body.business_name},
        ${body.contact_name || null},
        ${body.email},
        ${body.phone || null},
        ${body.ein || null},
        ${body.address || null},
        ${body.city || null},
        ${body.state || null},
        ${body.zip || null},
        ${body.years_in_business || null},
        ${body.monthly_revenue || null},
        ${body.shop_type || 'boutique'},
        ${body.current_supplier || null},
        ${body.monthly_volume_lbs || null},
        ${body.preferred_roast || 'medium'},
        ${body.has_trade_references || false},
        ${body.lead_source || 'direct'},
        ${'lead'}
      )
      RETURNING *
    `
    
    const lead = result.rows[0]
    
    // Auto-score credit if enough info provided
    let creditScore = null
    if (lead.years_in_business && lead.monthly_revenue) {
      try {
        creditScore = scoreCredit(lead)
        
        // Update with credit score
        await sql`
          UPDATE clients
          SET credit_score = ${creditScore.total_score},
              payment_terms = ${creditScore.recommendation}
          WHERE id = ${lead.id}
        `
      } catch (error) {
        console.error('Error scoring credit:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      lead,
      creditScore,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
