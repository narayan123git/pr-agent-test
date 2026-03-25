# 🤖 AI Pull Request Reviewer SaaS

An automated, AI-powered GitHub PR review tool. This application operates as a customized GitHub App, listening to Pull Request events, analyzing code diffs using Google's Gemini AI, and providing actionable feedback directly on GitHub. It includes a secure, Next.js-based developer dashboard for managing API keys, custom agent rules, and tracking code health analytics.

## ✨ Key Features

* **Automated Code Reviews:** Triggers instantly when a PR is opened or reopened.
* **Context-Aware AI:** Analyzes the PR title, description, and code diff to provide highly relevant feedback.
* **Customizable Agent Rules:** Users can define specific prompt instructions (e.g., "Focus on security," "Ignore CSS") via the dashboard.
* **Security & Metrics Extraction:** AI dynamically formats output to extract actionable metrics (Vulnerabilities, Bugs, Security Status).
* **GitHub Integration:** Posts formatted Markdown comments directly to the PR timeline.
* **Developer Analytics Dashboard:**
    * OAuth 2.0 Authentication via GitHub (NextAuth).
    * High-level metrics: Total PRs scanned, Vulnerabilities blocked, Bugs found.
    * Detailed historical log of all AI reviews.
* **Enterprise-Grade Security:**
    * Cryptographic Webhook Verification (`x-hub-signature-256`).
    * Dynamic GitHub Installation Token generation via JWT.
    * API Route protection with custom SaaS secrets.
    * Express Rate Limiting and Helmet protection.

## 🛠️ Tech Stack

**Frontend:**
* Next.js (App Router)
* React & Tailwind CSS
* NextAuth.js (GitHub Provider)
* Axios & Lucide React (Icons)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Data persistence)
* Google Generative AI SDK (`gemini-2.5-flash`)
* jsonwebtoken, crypto (Authentication & Security)

---

## 🏗️ Architecture Flow

1.  **Event Trigger:** Developer opens a Pull Request on a connected repository.
2.  **Webhook:** GitHub sends a signed payload to the Express backend.
3.  **Validation:** Backend verifies the cryptographic signature.
4.  **Context Fetching:** Backend requests the user's specific `geminiKey` and `customPrompt` from MongoDB.
5.  **AI Analysis:** The code diff and context are sent to the Gemini AI API, requesting structured JSON output.
6.  **Action:** Backend parses the AI response, posts the Markdown review to GitHub, and saves the analytics to MongoDB.
7.  **Dashboard:** User logs into the Next.js frontend to view updated real-time metrics.

---

## ⚙️ Environment Variables

You will need to set up two environment files to run this application locally.

### Backend (`.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GITHUB_WEBHOOK_SECRET=your_webhook_secret_from_github
GITHUB_APP_ID=your_github_app_id
FRONTEND_SECRET=your_custom_saas_password_123