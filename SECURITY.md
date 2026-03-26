# Security Policy

## 🛡️ Supported Versions
We prioritize security updates for the most recent versions of the PR-reviewer agent.

| Version | Supported          |
| ------- | ------------------ |
| Main    | ✅ Yes              |
| < 1.0.0 | ❌ No               |

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
