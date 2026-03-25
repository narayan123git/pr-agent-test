# 🤖 LearnLoop: AI-Powered Pull Request Reviewer SaaS

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Gemini API](https://img.shields.io/badge/AI-Google_Gemini_2.5-blue?style=flat&logo=google)](https://ai.google.dev/)

**LearnLoop** is an enterprise-grade GitHub App and SaaS platform that automates code reviews using Google's Gemini 2.5 Flash AI. It acts as a Senior Software Engineer that lives in your repository, automatically analyzing Pull Request diffs, identifying security vulnerabilities, and posting structured, contextual feedback directly to your GitHub timeline.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Prerequisites](#-prerequisites)
5. [Environment Configuration](#-environment-configuration)
6. [Local Installation](#-local-installation)
7. [GitHub App Configuration](#-github-app-configuration)
8. [Usage Guide](#-usage-guide)

---

## ✨ Core Features

### 🧠 Intelligent Code Analysis
* **Automated Webhooks:** Listens to `pull_request` events (opened, reopened, synchronized) and triggers reviews instantly in the background.
* **Context-Aware AI:** Feeds the PR Title, Description, and Code Diff to Gemini to ensure feedback is relevant to the developer's intent.
* **Structured Output Extraction:** Forces the AI to return strict JSON to populate the database with quantitative metrics (Vulnerability Count, Bug Count, Security Status).

### 🛠️ Developer Analytics Dashboard
* **OAuth 2.0 Authentication:** Secure login via GitHub using NextAuth.
* **SaaS Settings Management:** Users can securely link their GitHub Installation ID and personal Gemini API keys.
* **Custom Prompt Engineering:** Users can define specific repository rules (e.g., "Focus strictly on React performance," or "Ignore formatting") via the UI, which are dynamically injected into the AI's prompt.
* **Code Health Metrics:** A real-time grid displaying total scans, vulnerabilities blocked, and logic bugs found across all PRs.

### 🔒 Enterprise Security
* **Cryptographic Verification:** Validates every incoming GitHub webhook using `x-hub-signature-256` and HMAC to prevent spoofing attacks.
* **Dynamic JWT Authentication:** Generates temporary, repository-specific GitHub access tokens rather than relying on static Personal Access Tokens (PATs).
* **Rate Limiting & Helmet:** Backend is secured against DDoS and common HTTP header vulnerabilities.
* **Internal SaaS Secrets:** Frontend-to-Backend communication is protected via custom header secrets (`x-saas-secret`).

---

## 🏗️ System Architecture

The application is split into a Next.js Frontend (Dashboard) and an Express.js Backend (Webhook & API Gateway).

1. **Installation:** User installs the GitHub App. GitHub redirects them to the Next.js Dashboard.
2. **Configuration:** User links their Gemini Key and Custom Prompts. Next.js securely saves this to MongoDB via the Express API.
3. **Trigger:** A developer opens a PR. GitHub sends a payload to the `/webhook` endpoint.
4. **Validation & Auth:** Express verifies the signature, looks up the user's database record, and generates a dynamic GitHub Installation Token.
5. **AI Processing:** Express fetches the PR diff from GitHub, applies the user's custom prompt rules, and sends the payload to Google Gemini.
6. **Action:** Express receives the JSON response, posts the Markdown review back to the GitHub PR, and saves the analytics to MongoDB.

---

## 💻 Tech Stack

**Frontend (Client)**
* Framework: [Next.js (App Router)](https://nextjs.org/)
* Styling: [Tailwind CSS](https://tailwindcss.com/)
* Auth: [NextAuth.js](https://next-auth.js.org/) (GitHub Provider)
* Icons & HTTP: Lucide React, Axios

**Backend (Server)**
* Runtime: [Node.js](https://nodejs.org/) & Express.js
* Database: [MongoDB](https://www.mongodb.com/) & Mongoose
* AI SDK: `@google/generative-ai`
* Security: `crypto`, `jsonwebtoken`, `helmet`, `express-rate-limit`

---

## 📋 Prerequisites

Before running this project, ensure you have:
* Node.js (v18+ recommended)
* A MongoDB Atlas Database (or local MongoDB instance)
* A GitHub Account (to create the GitHub App)
* A Google AI Studio API Key (for Gemini)
* A local tunneling tool like `ngrok` or `localtunnel` (for receiving GitHub webhooks locally).

---

## 🔐 Environment Configuration

Create the following `.env` files in their respective directories.

### Backend (`/backend/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GITHUB_WEBHOOK_SECRET=a_random_string_you_create_for_github
GITHUB_APP_ID=your_github_app_id
FRONTEND_SECRET=a_secure_password_to_link_front_and_back
# NOTE: Ensure your GitHub private-key.pem is saved in the root of the backend folder.