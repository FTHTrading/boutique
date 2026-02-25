import { NextRequest, NextResponse } from 'next/server'
import { updateClientCreditScore, getCreditRiskDistribution } from '@/lib/creditScorer'

/**
 * POST /api/credit/score - Score a client's credit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: clientId' },
        { status: 400 }
      )
    }
    
    const creditScore = await updateClientCreditScore(body.clientId)
    
    return NextResponse.json({
      success: true,
      creditScore,
    })
  } catch (error) {
    console.error('Error scoring credit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to score credit' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credit/distribution - Get credit risk distribution
 */
export async function GET(request: NextRequest) {
  try {
    const distribution = await getCreditRiskDistribution()
    
    return NextResponse.json({
      success: true,
      distribution,
    })
  } catch (error) {
    console.error('Error fetching distribution:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch distribution' },
      { status: 500 }
    )
  }
}
