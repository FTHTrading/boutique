import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { updateClientCreditScore } from '@/lib/creditScorer'

/**
 * GET /api/leads/[id] - Get lead details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`
      SELECT * FROM clients WHERE id = ${params.id}
    `
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lead: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/leads/[id] - Update lead
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Build dynamic update query
    const updates = Object.keys(body)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')
    
    const values = Object.values(body)
    
    const result = await sql.query(
      `UPDATE clients SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [params.id, ...values]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Recalculate credit score if relevant fields changed
    if (body.years_in_business || body.monthly_revenue || body.dnb_score) {
      try {
        await updateClientCreditScore(params.id)
      } catch (error) {
        console.error('Error updating credit score:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      lead: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/leads/[id] - Delete lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`
      DELETE FROM clients WHERE id = ${params.id} RETURNING id
    `
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lead deleted',
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
