# Security Policy

## 🛡️ Supported Versions
We prioritize security updates for the most recent versions of the PR-reviewer agent.

| Version | Supported          |
| ------- | ------------------ |
| Main    | ✅ Yes              |
| < 1.0.0 | ❌ No               |

## 🚀 Built-in Security Features
Our application implements top-tier, multi-layered "Defense in Depth" strategies including:

### 1. Edge & Frontend Protections (Next.js)
- **Vercel Edge Middleware:** Acts as a code-first WAF (Web Application Firewall). It filters incoming requests *before* waking up serverless functions, blocking known DDoS bots (`k6`, `jmeter`, `postmanruntime`, etc.) and preventing buffer overflows by sanitizing over-sized query strings at the edge.
- **Strict HTTP Security Headers:** Enforced via `next.config.ts`, returning `Strict-Transport-Security` (HSTS), `X-Frame-Options` (preventing clickjacking), and `X-XSS-Protection`.
- **API Proxy Routes:** The Next.js client does not store backend configuration secrets (like `FRONTEND_SECRET`). These are kept securely inside Next.js server-side `route.ts` handlers and proxied downstream.
- **Client-Side Sanitization:** Direct inputs to customizable prompt fields are scrubbed of HTML tags safely via `DOMPurify` to mitigate reflected XSS.

### 2. Backend API Fortifications (Express/Node.js)
- **Multi-lane Rate Limiting:** A global rate limiter is applied to general routes, paired with a strict limiter strictly protecting API and webhook routes to block brute-force attempts and spam traffic.
- **Payload Limits:** Requests payloads exceeding 500kb are outright rejected to prevent memory exhaustion and large-payload DDoS scenarios.
- **NoSQL Injection Prevention:** Utilizes `express-mongo-sanitize` to strip prohibited characters (`$` and `.`) from req structures to safeguard MongoDB.
- **HTTP Parameter Pollution Protection:** Implements `hpp` to ignore duplicated parameter trickery.

## 🚀 Reporting a Vulnerability
If you discover a security vulnerability (such as AI prompt injection risks or exposed API handling), please do **not** open a public issue. Publicly disclosing a vulnerability can put all users of this agent at risk.

Instead, please report it privately:
* **Email:** [narayanpauliit20@gmail.com](mailto:narayanpauliit20@gmail.com)
* **Subject:** `Security Vulnerability Report - [Brief Description]`

We will acknowledge your report in future and provide a fix as soon as possible. We value your help in keeping this project secure.

---

## 🔍 Scope of Security Concerns
We are particularly interested in reports related to:

### 1. AI Prompt Injection
If the agent can be "tricked" into ignoring its system instructions or leaking internal logic via a malicious Pull Request description or code comment.

### 2. Webhook & Authentication
- Bypassing the `X-Hub-Signature-256` verification.
- Unauthorized access to the Next.js dashboard.
- Improper handling of GitHub App Installation Tokens.

### 3. Data Privacy & Leakage
- Scenarios where private repository code might be logged or cached in a way that is accessible to unauthorized users.
- Exposure of the Gemini API key or GitHub App secrets.

### 4. Dependency Vulnerabilities
Known vulnerabilities in our core stack (Node.js, Express, Next.js) that could lead to Remote Code Execution (RCE).


---

## 🚫 Out of Scope Report
The following are generally **not** considered security vulnerabilities:
* **AI Hallucinations:** Incorrect code review suggestions (these are quality issues, not security flaws).
* **UI/UX Bugs:** Minor visual glitches in the dashboard that do not compromise data.
* **Brute-force:** Issues that rely on a lack of rate-limiting (unless they lead to a crash).

## 💡 Best Practices for Users
To keep your deployment secure, always:
1. Use a strong `WEBHOOK_SECRET` in your `.env` file.
2. Regularly update your Gemini API keys.
3. Keep your Node.js environment updated to the latest LTS version.
