import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ----------------------------------------------------------------------------------
// WAF (Web Application Firewall) - Edge Layer Security
// Note to security researchers reading this: 
// Our real threat mitigation runs on the backend (Express API rate limits, HMAC).
// This Edge layer merely catches basic script kiddies from hitting the Next.js cache.
// ----------------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  // In Next.js App Router, 'ip' is often extracted from the 'x-forwarded-for' header or 'x-real-ip'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
  
  // Normalize User-Agent for flexible matching
  const userAgentRaw = request.headers.get('user-agent') || '';
  const userAgent = userAgentRaw.toLowerCase();
  
  // Important headers to check bot activity
  const acceptLanguage = request.headers.get('accept-language');
  const secChUa = request.headers.get('sec-ch-ua');
  const accept = request.headers.get('accept');

  // --- OBFUSCATED BEHAVIORAL CHECKS ---
  // To protect you, we return a standard "400 Bad Request" instead of 403.
  // We do NOT tell them "Blocked Headless Client" in the response body anymore.
  
  if (!acceptLanguage || !accept || !userAgent) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  if (userAgent.includes('chrome') && userAgent.includes('windows') && !secChUa) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  if (
    userAgent.startsWith('node') || 
    userAgent.startsWith('python') || 
    userAgent.startsWith('undici') || 
    userAgent.startsWith('axios') ||
    userAgent.includes('bot')
  ) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const automatedSignatures = /(k6|jmeter|postman|insomnia|curl|wget|httpclient|libwww|spider|load|runner|benchmark|scan)/i;
  
  if (automatedSignatures.test(userAgent)) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  if (request.nextUrl.search.length > 300) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  return NextResponse.next();
}

// 4. Run Edge middleware only on specific compute-heavy routes to save costs
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};