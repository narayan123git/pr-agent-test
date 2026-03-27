import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const ip = request.ip || 'Unknown IP';
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const acceptLanguage = request.headers.get('accept-language');

  // 1. Behavioral Trap: Catch lazy bot scripts
  // Real browsers almost always send an Accept-Language and User-Agent header.
  if (!acceptLanguage || !userAgent) {
    console.log(`[SECURITY AUDIT] 🚨 Behavioral Trap Triggered. Missing headers from IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Invalid request signature.' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 2. Static Blacklist: Block known load-testing tools & bot frameworks
  const blockedAgents = ['k6', 'jmeter', 'postmanruntime', 'curl', 'python-requests', 'go-http-client'];
  if (blockedAgents.some((agent) => userAgent.includes(agent))) {
    console.log(`[SECURITY AUDIT] 🛑 Blacklist Triggered. Bot type '${userAgent}' blocked from IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Automated access denied.' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 3. Prevent ReDoS / Buffer Overflow by restricting query string length
  if (request.nextUrl.search.length > 500) {
    console.log(`[SECURITY AUDIT] 🛡️ Buffer overflow attempt blocked. Query string too long from IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Bad Request: Query string too long.' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
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