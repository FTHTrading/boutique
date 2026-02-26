import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firmName, contactName, email, phone, country, licenseNumber, regulatoryBody, commodity, volume, experience, message } = body

    if (!firmName || !contactName || !email || !country || !commodity || !volume) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Store in DB if available
    if (process.env.DATABASE_URL) {
      const { sql } = await import('@/lib/sql')
      await sql`
        INSERT INTO broker_inquiries (
          firm_name, contact_name, email, phone, country,
          license_number, regulatory_body, commodity_specialty,
          annual_volume, years_experience, message, status, created_at
        ) VALUES (
          ${firmName}, ${contactName}, ${email}, ${phone || null}, ${country},
          ${licenseNumber || null}, ${regulatoryBody || null}, ${commodity},
          ${volume}, ${experience || null}, ${message || null}, 'pending', now()
        )
      `
    }

    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[broker-inquiry]', { firmName, contactName, email, country, commodity, volume })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[broker-inquiry] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
