import { NextRequest, NextResponse } from 'next/server';
import { contactValidationAgent } from '@/agents/contact-validation-agent';

/**
 * GET /unsubscribe?email=...&token=...
 * CAN-SPAM mandated unsubscribe handler.
 * Must be honored within 10 business days (immediate in this system).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new NextResponse(
      '<html><body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px"><h1>Unsubscribe Error</h1><p>No email address provided.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  await contactValidationAgent.processUnsubscribe(decodeURIComponent(email), 'email_link');

  return new NextResponse(
    `<html>
<head><title>Unsubscribed — FTH Trading</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;color:#1a1a1a">
  <h1 style="font-size:22px">You Have Been Unsubscribed</h1>
  <p>${decodeURIComponent(email)} has been removed from all FTH Trading commercial emails.</p>
  <p>This takes effect immediately. You will not receive further commercial emails from FTH Trading.</p>
  <p>If you believe this was done in error, please reply directly to any previous email from us or 
  contact <a href="mailto:compliance@fthtrading.com">compliance@fthtrading.com</a>.</p>
  <hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb">
  <p style="font-size:11px;color:#9ca3af">FTH Trading | Global Commodity Advisory | Est. 1976</p>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
