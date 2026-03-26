# 🤖 AI-Powered GitHub Pull Request Reviewer

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Gemini API](https://img.shields.io/badge/AI-Google_Gemini_2.5-blue?style=flat&logo=google)](https://ai.google.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> An enterprise-grade GitHub App and SaaS platform that automates code reviews using **Google Gemini 2.5 Flash AI**. It acts as an automated Senior Software Engineer living directly in your repository — analyzing Pull Request diffs, identifying security vulnerabilities, and posting structured, contextual feedback back to your GitHub timeline in seconds.

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Demo](#-demo)
4. [Project Structure](#-project-structure)
5. [Software Requirements Specification (SRS)](#-software-requirements-specification-srs)
   - [Product Perspective](#product-perspective)
   - [User Classes & Characteristics](#user-classes--characteristics)
   - [System Features](#system-features)
   - [Non-Functional Requirements](#non-functional-requirements)
6. [User Guide — Getting Started](#-user-guide--getting-started)
7. [Developer Guide — Architecture & Setup](#-developer-guide--architecture--setup)
   - [System Architecture](#system-architecture)
   - [Tech Stack](#tech-stack)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#environment-configuration)
   - [Running the Project Locally](#running-the-project-locally)
8. [API Reference](#-api-reference)
9. [Security](#-security)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)
11. [Roadmap](#-roadmap)
12. [Contributing](#-contributing)
13. [License](#-license)
14. [Acknowledgements](#-acknowledgements)

---

## 🌟 Overview

The **AI-Powered GitHub Pull Request Reviewer** removes the bottleneck of manual code reviews in modern software teams. Once installed as a GitHub App, it automatically listens for Pull Request events and delivers in-depth AI-generated feedback — covering logic bugs, security vulnerabilities, performance anti-patterns, and style conventions — directly as a comment on the PR timeline.

**Who is this for?**
- **Development Teams** who want faster, consistent code reviews without reviewer burnout.
- **Solo Developers** who want a senior-engineer second opinion on every change.
- **Open Source Maintainers** who need to scale code quality enforcement across many contributors.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Automated Code Analysis** | Triggered on every `opened`, `reopened`, and `synchronize` PR event. |
| 🧠 **AI-Powered Reviews** | Google Gemini 2.5 Flash analyzes diffs, PR titles, and descriptions for holistic context. |
| 📝 **Structured Markdown Reports** | Review is posted as a formatted PR comment covering security, logic, and style issues. |
| ⚙️ **Custom Rule Engine** | Define your own prompt instructions per repository (e.g., "Enforce strict TypeScript"). |
| 📊 **Analytics Dashboard** | Track total scans, vulnerabilities flagged, and bugs caught over time. |
| 🔒 **HMAC Payload Validation** | Every incoming webhook is cryptographically verified using `X-Hub-Signature-256`. |
| 🔑 **Short-lived Auth Tokens** | GitHub Installation Access Tokens are generated on-demand and never persisted. |
| 🚦 **Rate Limiting** | Express rate-limiter protects all API and webhook endpoints from abuse. |

---

## 🎬 Demo

> **Hosted SaaS:** [https://pr-agent-test.vercel.app](https://pr-agent-test.vercel.app)

**How it works in 3 steps:**
1. Install the GitHub App on your repository.
2. Paste your Gemini API Key into the dashboard.
3. Open any Pull Request — the AI review appears automatically within seconds.

**Example AI Review Output (posted as a PR comment):**
```
## 🤖 AI Code Review

### 🔴 Security Issues
- Line 42 (`auth.js`): Hardcoded JWT secret detected. Move to environment variable.

### 🟡 Logic Bugs
- Line 78 (`user.service.js`): `findOne` result not null-checked before property access.

### 🟢 Suggestions
- Consider memoizing the `calculateMetrics` function to avoid redundant computation.

### ✅ Summary
Overall quality: Good. 2 issues require attention before merging.
```

---

## 📁 Project Structure

```
pr-agent-test/
├── pr-review-agent/              # Backend — Node.js / Express
│   ├── controllers/
│   │   ├── webhook.controller.js # Handles incoming GitHub webhook events
│   │   └── settings.controller.js# User settings and review retrieval
│   ├── models/
│   │   ├── Account.js            # Mongoose model for user accounts & API keys
│   │   └── Review.js             # Mongoose model for storing AI review history
│   ├── services/                 # Business logic (AI inference, GitHub API calls)
│   ├── server.js                 # Express app entry point
│   ├── private-key.pem           # GitHub App private key (NOT committed — add to .gitignore)
│   └── .env                      # Backend environment variables (see configuration)
│
├── pr-reviewer-frontend/         # Frontend — Next.js 16 (App Router)
│   ├── app/                      # Next.js App Router pages and layouts
│   ├── public/                   # Static assets
│   ├── next.config.ts
│   └── .env.local                # Frontend environment variables (see configuration)
│
├── test.js                       # Integration / smoke tests
└── README.MD                     # This file
```

---

## 📋 Software Requirements Specification (SRS)

### Product Perspective
This system provides a unified code-quality workflow integrated directly into GitHub's ecosystem. It operates across two environments:

1. **Frontend Dashboard (SaaS Platform):** A Next.js application where developers authenticate, link their repositories, manage AI behavior via custom prompts, and monitor repository security metrics.
2. **Backend Webhook Handler:** A Node.js service that receives events from GitHub Webhooks, orchestrates AI analysis, and delivers feedback via the GitHub API.

### User Classes & Characteristics

| User Type | Description |
|---|---|
| **Repository Admins / Maintainers** | Configure SaaS settings, provide Gemini API keys, write custom review rules, and manage GitHub App permissions. |
| **Contributors / Code Authors** | Open pull requests and receive automated feedback directly in GitHub without any additional tooling. |
| **Developers (Self-Hosted)** | Clone the repo, configure environment variables, and run both services locally with their own credentials. |

### System Features

**1. Automated Context-Aware Code Analysis**
- **Trigger:** GitHub `pull_request` events (`opened`, `reopened`, `synchronize`).
- **Action:** Parses PR titles, descriptions, and code diffs. Feeds the compiled context to Google Gemini to deduce intent and detect anomalies.
- **Output:** A markdown-formatted report posted as a PR comment, mapping vulnerabilities, logic bugs, and style issues.

**2. Custom Agent Prompting (Rule Engine)**
- Users can append or override specific AI instructions (e.g., `"Ignore trailing spaces"`, `"Focus on React Server Components best practices"`). Rules are stored securely in MongoDB and attached to every AI review query.

**3. Analytics & Tracking Dashboard**
- Tracks key metrics over time: total scans executed, vulnerabilities flagged, and logic bugs identified — visible on a unified dashboard.

**4. Secure Settings Management**
- User Gemini API keys and custom rules are stored per GitHub username in MongoDB and never logged or exposed in API responses.

### Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | All webhook payloads validated using `X-Hub-Signature-256` HMAC before processing. |
| **Authentication** | OAuth 2.0 via GitHub (NextAuth). Short-lived GitHub App Installation Access Tokens generated per request. |
| **Scalability** | Event-driven architecture allows the webhook handler to be extracted as a serverless function. |
| **Performance** | AI review delivery target: under 30 seconds from PR event to posted comment. |
| **Reliability** | MongoDB Atlas for persistent storage; Express process managed by `nodemon` in development. |

---

## 👤 User Guide — Getting Started

> **No code required!** If you are using the hosted SaaS version at [pr-agent-test.vercel.app](https://pr-agent-test.vercel.app), follow Steps 1–3 only.

### Step 1: Install the GitHub App

1. Navigate to the **GitHub Pull Request Reviewer** GitHub App installation page (linked from the dashboard landing page).
2. Click **Install**.
3. Select **All Repositories** or **Only select repositories** depending on your preference.
4. You will be automatically redirected to the web dashboard.

### Step 2: Configure Your Dashboard

1. On the dashboard, click **Login with GitHub** to authenticate securely via OAuth.
2. Go to the **Settings** tab and enter your **Google Gemini API Key**.
   - Get a free key at [Google AI Studio](https://aistudio.google.com/).
3. *(Optional)* Define **Custom AI Rules** to tailor the review style:
   - `"Focus on catching memory leaks in React"`
   - `"Ignore CSS formatting issues"`
   - `"Ensure all async functions have proper error handling"`

### Step 3: Open a Pull Request

1. Navigate to any connected GitHub repository.
2. Create a new branch, make code changes, and open a Pull Request.
3. **Done!** The AI reviewer will post a detailed review comment on your PR within seconds.

---

## 🛠 Developer Guide — Architecture & Setup

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     GitHub Platform                      │
│  User installs GitHub App → PR opened → Webhook fired   │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /webhook
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express / Node.js)                 │
│  1. Validate HMAC signature (X-Hub-Signature-256)        │
│  2. Look up user settings in MongoDB                     │
│  3. Generate GitHub Installation Access Token (JWT)      │
│  4. Fetch PR diff via GitHub REST API                    │
│  5. Build prompt (diff + custom rules) → Gemini API      │
│  6. Parse AI response → Post markdown comment via API    │
└───────────────────────┬─────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
┌─────────────────┐       ┌─────────────────────────┐
│    MongoDB      │       │  Google Gemini 2.5 Flash │
│  (User settings │       │  (AI inference engine)   │
│   & reviews)    │       └─────────────────────────┘
└─────────────────┘

┌─────────────────────────────────────────────────────────┐
│           Frontend Dashboard (Next.js 16)                │
│  - GitHub OAuth login (NextAuth)                         │
│  - Gemini API key input & custom rule editor             │
│  - Analytics dashboard (scans, bugs, vulnerabilities)    │
└─────────────────────────────────────────────────────────┘
```

**End-to-end flow:**

1. **GitHub Installation:** User installs the GitHub App and is redirected to the Next.js SaaS Dashboard.
2. **Dashboard Configuration:** User authenticates, stores their Gemini API key, and writes custom prompt rules. The Next.js frontend persists this via the Express API into MongoDB.
3. **PR Trigger:** A PR is opened. GitHub sends an event payload to the `/webhook` endpoint.
4. **Validation & Token Generation:** The Express server verifies the payload HMAC, retrieves user settings from MongoDB, and generates a short-lived GitHub Installation JWT.
5. **AI Inference:** The PR diff is fetched, combined with the user's custom rules, and sent to Gemini.
6. **Delivery:** The AI-generated response is formatted as GitHub Markdown and posted as a PR comment.

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, NextAuth.js (GitHub OAuth), Lucide React |
| **Backend** | Node.js, Express.js v5 |
| **Database** | MongoDB (Mongoose ODM) |
| **AI** | `@google/generative-ai` — Gemini 2.5 Flash |
| **Security** | `crypto` (HMAC), `jsonwebtoken`, `helmet`, `express-rate-limit`, `cors` |
| **Dev Tools** | `nodemon`, `dotenv` |

### Prerequisites

Before setting up the project locally, ensure you have:

- **Node.js v18+** — [Download](https://nodejs.org/)
- **MongoDB** — Local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **GitHub Developer Account** — [Register a new GitHub App](https://github.com/settings/apps)
- **Google AI Studio Account** — [Get a Gemini API Key](https://aistudio.google.com/)
- **Ngrok** (or LocalTunnel) — To expose your local server publicly for webhook delivery: [Download Ngrok](https://ngrok.com/)

### Environment Configuration

#### Backend — `/pr-review-agent/.env`

Create this file and populate all values:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pr-reviewer

# GitHub App Credentials
GITHUB_WEBHOOK_SECRET=a_random_secret_you_define_in_github_app_settings
GITHUB_APP_ID=123456

# Internal security — shared between frontend and backend
FRONTEND_SECRET=a_long_random_secure_string
```

> ⚠️ **Important:** Download your **GitHub App's private key** (`.pem` file) from the GitHub App settings page and save it as `private-key.pem` in the `/pr-review-agent/` directory. This file must **never** be committed to version control.

#### Frontend — `/pr-reviewer-frontend/.env.local`

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=another_long_random_secure_string

# GitHub OAuth App credentials (from github.com/settings/developers)
GITHUB_ID=your_oauth_app_client_id
GITHUB_SECRET=your_oauth_app_client_secret
```

> 💡 **Tip:** Use `openssl rand -base64 32` to generate strong random secrets for `NEXTAUTH_SECRET` and `FRONTEND_SECRET`.

### Running the Project Locally

**Step 1 — Start the Backend**

```bash
cd pr-review-agent
npm install
npm run dev
```

The backend starts on `http://localhost:5000`.

**Step 2 — Expose Webhook Endpoint to the Internet**

Open a new terminal window and run:

```bash
ngrok http 5000
```

Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`) and paste it into your **GitHub App Settings → Webhook URL** as:

```
https://abc123.ngrok.io/webhook
```

**Step 3 — Start the Frontend Dashboard**

Open another terminal window and run:

```bash
cd pr-reviewer-frontend
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 📡 API Reference

The backend exposes the following REST endpoints:

### `POST /webhook`
Receives and processes GitHub pull request events.

| Property | Value |
|---|---|
| **Auth** | `X-Hub-Signature-256` HMAC (auto-validated) |
| **Rate Limit** | 10 requests / 10 minutes per IP |
| **Payload** | GitHub webhook event JSON |

---

### `POST /api/settings`
Save or update user settings (Gemini API key and custom rules).

| Property | Value |
|---|---|
| **Auth** | `x-frontend-secret` header required |
| **Rate Limit** | 10 requests / 10 minutes per IP |

**Request Body:**
```json
{
  "username": "github-username",
  "geminiApiKey": "AIza...",
  "customRules": "Focus on security vulnerabilities and memory leaks."
}
```

---

### `GET /api/settings/:username`
Retrieve settings for a specific GitHub user.

| Property | Value |
|---|---|
| **Auth** | `x-frontend-secret` header required |
| **Rate Limit** | 10 requests / 10 minutes per IP |

**Response:**
```json
{
  "username": "github-username",
  "customRules": "Focus on security vulnerabilities and memory leaks."
}
```
> Note: The Gemini API key is never returned in API responses.

---

### `GET /api/reviews/:username`
Retrieve all AI review records for a specific GitHub user (used by the analytics dashboard).

| Property | Value |
|---|---|
| **Auth** | `x-frontend-secret` header required |
| **Rate Limit** | 10 requests / 10 minutes per IP |

**Response:**
```json
[
  {
    "repo": "my-org/my-repo",
    "prNumber": 42,
    "prTitle": "Add user authentication",
    "reviewPostedAt": "2025-01-15T10:30:00Z",
    "vulnerabilitiesFound": 1,
    "bugsFound": 2
  }
]
```

---

## 🔒 Security

This project implements multiple security layers:

- **Webhook HMAC Verification:** All incoming GitHub webhook payloads are verified using `X-Hub-Signature-256` with the `crypto` module. Requests with invalid or missing signatures are rejected with `401 Unauthorized`.
- **Short-lived GitHub Tokens:** GitHub Installation Access Tokens are generated per-request using a signed JWT and are never stored in the database.
- **HTTP Security Headers:** `helmet` is applied to set secure HTTP headers (CSP, HSTS, etc.) on all responses.
- **Rate Limiting:** `express-rate-limit` restricts all `/webhook` and `/api/*` endpoints to **10 requests per 10 minutes per IP** to prevent abuse.
- **Strict CORS:** The backend only accepts requests from the configured frontend origin.
- **Secret Isolation:** Gemini API keys are stored in MongoDB per user and are never returned in any API response.

**To report a security vulnerability**, please open a private security advisory in the GitHub repository rather than a public issue.

---

## 🔧 Troubleshooting & FAQ

### The AI review is not appearing on my PR

1. **Check the backend logs** — Ensure the Express server started without errors.
2. **Verify the webhook URL** — Confirm the Ngrok/public URL in your GitHub App settings matches your running backend.
3. **Check webhook deliveries** — Go to **GitHub App Settings → Advanced → Recent Deliveries** to inspect payload status and response codes.
4. **Validate your Gemini API Key** — Ensure the key is saved in the dashboard Settings tab and has not expired.

### I get a `401 Unauthorized` error on the webhook

This means the `GITHUB_WEBHOOK_SECRET` in your `.env` does not match the secret set in your GitHub App settings. Ensure both are identical.

### MongoDB connection fails on startup

The backend performs a startup check for all required environment variables. Confirm your `MONGODB_URI` is correct and your IP is whitelisted in MongoDB Atlas (or use `0.0.0.0/0` for development).

### The frontend cannot connect to the backend

Verify `NEXT_PUBLIC_API_URL` in `/pr-reviewer-frontend/.env.local` points to the correct backend URL (default: `http://localhost:5000`).

### How do I get a Google Gemini API Key?

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with a Google account.
3. Click **Get API Key → Create API Key**.
4. Copy the key and paste it into the dashboard Settings page.

### Can I use this with private repositories?

Yes. When you install the GitHub App, you can grant it access to private repositories. The app uses GitHub Installation Access Tokens scoped to only the repositories you select.

---

## 🗺 Roadmap

- [ ] **Inline Review Comments** — Post suggestions directly on specific diff lines instead of a single PR comment.
- [ ] **Multi-model Support** — Allow users to choose between Gemini, OpenAI GPT-4o, and Anthropic Claude.
- [ ] **Review History Filtering** — Filter analytics dashboard by repository, date range, or severity.
- [ ] **Slack / Teams Notifications** — Notify teams when a review identifies high-severity issues.
- [ ] **GitHub Actions Integration** — Offer the reviewer as a reusable GitHub Actions workflow step.
- [ ] **Webhook Queue** — Add a message queue (Redis/BullMQ) for reliable at-least-once webhook delivery.
- [ ] **Self-hosted Docker Image** — Provide a `docker-compose.yml` for one-command self-hosted deployment.

---

## 🤝 Contributing

Contributions are warmly welcome! Please follow these steps:

1. **Fork** the repository.
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes** with a descriptive message:
   ```bash
   git commit -m "feat: add inline review comments support"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch with a clear description of your change.

**Guidelines:**
- Follow the existing code style.
- Keep pull requests focused on a single change.
- Write or update tests where applicable.
- Ensure all environment variable changes are reflected in this README.

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Google Gemini](https://ai.google.dev/) for the powerful and accessible generative AI API.
- [GitHub](https://docs.github.com/en/apps) for the GitHub Apps platform and REST API.
- [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/) for the frontend framework and hosting.
- [MongoDB Atlas](https://www.mongodb.com/atlas) for the managed database service.
- [NextAuth.js](https://next-auth.js.org/) for the seamless OAuth integration.

---

*Built as a Full-Stack AI project automating modern DevSecOps lifecycle operations.*