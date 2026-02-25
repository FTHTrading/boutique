export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateProposal } from '@/lib/proposalGenerator'

/**
 * GET /api/proposals - List proposals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    
    // Implementation would fetch from database
    
    return NextResponse.json({
      success: true,
      proposals: [],
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proposals - Generate new proposal
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
    
    // Generate proposal using AI
    const proposal = await generateProposal({
      clientId: body.clientId,
      volumeTier: body.volumeTier,
      roastProfile: body.roastProfile,
      paymentTerms: body.paymentTerms,
      originRegion: body.originRegion,
      customMessage: body.customMessage,
      brandingProfile: body.brandingProfile,
    })
    
    return NextResponse.json({
      success: true,
      proposal,
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating proposal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate proposal' },
      { status: 500 }
    )
  }
}
