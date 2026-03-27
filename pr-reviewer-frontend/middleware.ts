import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // 1. ADVANCED BEHAVIORAL TRAPS & HEURISTICS 
  // Trap A: Missing basic browser markers. Bots frequently lack 'Accept-Language' or don't set 'Accept'.
  if (!acceptLanguage || !accept || !userAgent) {
    console.warn(`[WAF] Blocked headless client (Missing headers). IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Trap B: Inconsistent User-Agent metrics (Headless Chrome check).
  // If the agent mentions Chrome/Windows but lacks Sec-Fetch headers (new Chromium standard), it's highly suspect.
  if (userAgent.includes('chrome') && userAgent.includes('windows') && !secChUa) {
    console.warn(`[WAF] Blocked likely headless Chrome/Puppeteer. IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Trap C: Generic "Fetch" or strictly programmatic agents (blocks basic Node/Python scripts without hardcoding names)
  if (
    userAgent.startsWith('node') || 
    userAgent.startsWith('python') || 
    userAgent.startsWith('undici') || 
    userAgent.startsWith('axios') ||
    userAgent.includes('bot')
  ) {
    console.warn(`[WAF] Blocked programmatic HTTP client. IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. DYNAMIC SIGNATURE ANALYSIS / PATTERN MATCHING
  // Instead of an exact keyword blacklist (which attackers can read), we look for mechanical networking patterns.
  // Attackers use 'k6', 'jmeter', 'postman', etc. We use regex to catch "http client", "request", "runner", "load".
  const automatedSignatures = /(k6|jmeter|postman|insomnia|curl|wget|httpclient|libwww|spider|load|runner|benchmark|scan)/i;
  
  if (automatedSignatures.test(userAgent)) {
    console.warn(`[WAF] Blocked automated signature match. Agent: '${userAgentRaw}' | IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. PREVENT ReDoS / BUFFER OVERFLOW
  // Sanitize query dimensions natively at the edge.
  if (request.nextUrl.search.length > 300) {
    console.warn(`[WAF] Blocked overflow attempt (URI too long). IP: ${ip}`);
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