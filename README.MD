# 🤖 AI-Powered GitHub Pull Request Reviewer

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Gemini API](https://img.shields.io/badge/AI-Google_Gemini_2.5-blue?style=flat&logo=google)](https://ai.google.dev/)

Welcome to the **GitHub Pull Request Reviewer**, an enterprise-grade GitHub App and SaaS platform that automates code reviews using Google's Gemini 2.5 Flash AI. It acts as an automated Senior Software Engineer that lives directly in your repository, analyzing Pull Request diffs, identifying security vulnerabilities, and posting structured, contextual feedback back to your GitHub timeline.

---

## 📑 Table of Contents
1. [Software Requirements Specification (SRS)](#1-software-requirements-specification-srs)
   - [Product Perspective](#product-perspective)
   - [User Classes & Characteristics](#user-classes--characteristics)
   - [System Features](#system-features)
   - [Non-Functional Requirements](#non-functional-requirements)
2. [User Guide (How to Get Started)](#2-user-guide-how-to-get-started)
3. [Developer Guide (Architecture & Setup)](#3-developer-guide-architecture--setup)
   - [System Architecture](#system-architecture)
   - [Tech Stack](#tech-stack)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#environment-configuration)
   - [Running the Project Locally](#running-the-project-locally)

---

## 1. Software Requirements Specification (SRS)

### Product Perspective
This system behaves as a unified code-quality workflow integrated directly into GitHub's ecosystem. It operates in two environments:
1. **Frontend Dashboard (SaaS Platform):** A Next.js application where developers authenticate, link their repositories, manage AI behavior (Custom prompts), and monitor repository security metrics.
2. **Backend Webhook Handler:** A Node.js environment receiving events from native GitHub Webhooks, orchestrating AI analysis, and executing feedback actions via the GitHub API.

### User Classes & Characteristics
* **Repository Admins/Maintainers:** Configure SaaS settings, manage billing (if integrated), inject custom logic rules through the dashboard, and manage GitHub App permissions.
* **Contributors / Code Reviewers:** Open pull requests and receive automated feedback directly in GitHub; interact with AI suggestions without leaving the GitHub CLI or Web UI.

### System Features
**1. Automated Context-Aware Code Analysis**
* **Trigger:** GitHub `pull_request` events (`opened`, `reopened`, `synchronize`).
* **Action:** Parses PR titles, descriptions, and code diffs. Feeds the compiled context to Google Gemini to deduce intent and detect anomalies.
* **Output:** Leaves a markdown-formatted report natively as a PR Comment mapping vulnerabilities, logic bugs, and syntax issues.

**2. Custom Agent Prompting (Rule Engine)**
* Users have the ability to override or append specific instructions (e.g., "Ignore trailing spaces," "Focus heavily on React Server Components best practices") strictly stored securely on the database and attached as context to every AI review query.

**3. Analytics & Tracking Dashboard**
* Tracks key performance metrics over time on a unified dashboard grid: Total scans executed, vulnerabilities flagged, and logic bugs mitigated.

### Non-Functional Requirements
* **Security:** Cryptographic Payload Validation. All incoming traffic from GitHub to the backend is validated using an `X-Hub-Signature-256` HMAC.
* **Auth:** Standardized OAuth 2.0 implementation with GitHub. Short-lived GitHub App Installation Access Tokens generated dynamically for making API calls.
* **Scalability:** Event-driven architecture decoupled optimally allowing the Webhook handling to eventually be spun out as serverless functions.

---

## 2. User Guide (How to Get Started)

As a repository maintainer or contributor, getting started with the AI reviewer takes just a few clicks. If you are using the hosted SaaS version, you do not need to clone or run any code locally!

### Step 1: Install the GitHub App
1. Navigate to the **GitHub Pull Request Reviewer** app installation page on GitHub (link provided via our landing page).
2. Click **Install**.
3. Choose whether to install the app on **All Repositories** or **Only select repositories**.
4. You will be automatically redirected to our web dashboard.

### Step 2: Configure Your Dashboard
1. On the dashboard platform, click **Login with GitHub** to securely authenticate.
2. In the **Settings** tab, provide your **Google Gemini API Key** (you can get one for free from Google AI Studio).
3. *(Optional)* Set up your **Custom AI Rules**. For example, you can tell the AI to "Focus on catching memory leaks in React", "Ignore CSS formatting", or "Ensure strict TypeScript typing".

### Step 3: Open a Pull Request
1. Go to one of your connected GitHub repositories.
2. Create a new branch, add or modify some code, and open a Pull Request.
3. **That's it!** Within seconds, the AI app will automatically read your PR diff in the background and leave a highly detailed, contextual review directly as a PR comment on your GitHub timeline.

---

## 3. Developer Guide (Architecture & Setup)

### System Architecture
The application is decoupled into a frontend dashboard app and a backend REST API/Webhook gateway.

1. **GitHub Installation:** User installs our GitHub App. They are redirected to the Next.js SaaS Dashboard.
2. **Dashboard Config:** They authenticate, store keys, and write custom prompts. The Next.js frontend saves this via the Express API into MongoDB.
3. **PR Creation/Trigger:** A PR is opened. GitHub broadcasts an event payload to the `/webhook` Endpoint.
4. **Validation/Token Generation:** The express server verifies the payload signature to prevent spoofing, looks up the connected user in the DB, and creates an ephemeral GitHub installation JWT.
5. **AI Inference:** The diff is downloaded, wrapped with the user's custom Prompt rules, and passed to Gemini over a socket.
6. **Delivery:** The structured JSON generated is parsed into GitHub Markdown and posted to the timeline.

### Tech Stack
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, NextAuth.js (GitHub Provider), Lucide React.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB & Mongoose.
* **AI:** `@google/generative-ai` (Gemini 2.5 Flash).
* **Security/Auth:** `crypto`, `jsonwebtoken`, `helmet`, `express-rate-limit`.

### Prerequisites
* Node.js v18+
* A generic MongoDB Local Instance or Atlas Connection URI.
* [GitHub Developer Account](https://github.com/settings/apps) (To register a new GitHub App).
* [Google AI Studio Account](https://aistudio.google.com/) (For Gemini API Keys).
* Ngrok / LocalTunnel (To expose local Express server port 5000 to receive GitHub Hooks publically).

### Environment Configuration

Create the following `.env` files.

#### Backend (`/pr-review-agent/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GITHUB_WEBHOOK_SECRET=your_generated_random_webhook_secret
GITHUB_APP_ID=your_github_app_id
FRONTEND_SECRET=a_secure_internal_header_secret_to_link_front_back
```
*(Also ensure your GitHub `private-key.pem` is downloaded and saved in the root of the backend folder)*

#### Frontend (`/pr-reviewer-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_random_secure_string

# For NextAuth Github Provider
GITHUB_ID=your_oauth_github_id
GITHUB_SECRET=your_oauth_github_secret
```

### Running the Project Locally

1. **Start the Backend Webhook System**
   ```bash
   cd pr-review-agent
   npm install
   npm run dev
   ```

2. **Expose Webhook to the Internet (New Console)**
   ```bash
   ngrok http 5000
   ```
   *Take the Ngrok URL and paste it in your GitHub App Settings under "Webhook URL".*

3. **Start the Frontend Dashboard**
   ```bash
   cd pr-reviewer-frontend
   npm install
   npm run dev
   ```
   *Navigate to http://localhost:3000.*

---
*Built as a Full-Stack AI project automating modern DevSecOps lifecycle operations.*