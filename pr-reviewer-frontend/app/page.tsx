import Link from 'next/link';
import { Bot, GitPullRequest, ShieldCheck, ArrowRight } from 'lucide-react';

const GithubIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-neutral-800 bg-black/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Bot className="text-indigo-500" />
            GitHub Pull Request Reviewer
          </div>
          <Link 
            href="/dashboard" 
            className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-40 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-8">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Gemini 2.5 Flash Integration Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          Your AI Senior <br/> Software Engineer.
        </h1>
        
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Automate your code reviews. Our AI integrates directly into your GitHub repositories to catch bugs, patch vulnerabilities, and review Pull Requests in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="bg-white text-black font-bold text-lg px-8 py-4 rounded-2xl hover:bg-neutral-200 transition-transform hover:scale-105 flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={20} />
          </Link>
          <a 
            href="https://github.com/narayan123git/pr-agent-test" 
            target="_blank" 
            rel="noreferrer"
            className="bg-neutral-900 border border-neutral-800 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <GithubIcon size={20} /> View Source
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-neutral-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <GitPullRequest className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant PR Analysis</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              The moment a Pull Request is opened, our AI agent reads the diff, understands the context, and posts a formatted review directly to GitHub.
            </p>
          </div>

          <div className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
              <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Security First</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Detect XSS, SQL injections, and logic flaws before they reach production. Track your vulnerability block rate in the analytics dashboard.
            </p>
          </div>

          <div className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
              <Bot className="text-amber-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Custom Agent Rules</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Prompt engineer your own reviewer. Tell the AI to focus on specific frameworks, enforce naming conventions, or ignore certain file types.
            </p>
          </div>

        </div>
      </section>

      {/* Install CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your PR workflow?</h2>
        <p className="text-neutral-400 mb-10 text-lg max-w-2xl mx-auto">
          Install the GitHub App in seconds and get instant AI-powered code reviews on your next Pull Request. No complex setup required.
        </p>
        <a 
          href={process.env.GITHUB_APP_INSTALL_URL || "#"} 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-colors"
        >
          <GithubIcon size={20} /> Install GitHub App
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-12 text-center text-neutral-500 text-sm">
        <p>Built by Narayan Paul • NIT Durgapur</p>
      </footer>
    </div>
  );
}