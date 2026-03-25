"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
    ShieldCheck, Zap, Key, Save, Loader2, LogOut,
    GitPullRequest, ShieldAlert, Bug, Activity
} from 'lucide-react';
import axios from 'axios';

// ⚠️ Make sure your Express server is running on port 5000
const BACKEND_URL = "http://localhost:5000";

function DashboardContent() {
    const searchParams = useSearchParams();
    const urlInstallationId = searchParams.get('installation_id');

    // 1. NextAuth Session Hook
    const { data: session, status } = useSession();

    // 2. State Management
    const [installationId, setInstallationId] = useState(urlInstallationId || '');
    const [geminiKey, setGeminiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    
    // Cold start state
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [showColdStartMessage, setShowColdStartMessage] = useState(false);

    // 3. Auto-fetch data ONLY if logged in
    useEffect(() => {
        // @ts-ignore - Username was attached in nextauth route
        const username = session?.user?.username;
        // console.log('username', username);

        if (status === "authenticated" && username) {
            let timeoutId: NodeJS.Timeout;

            const fetchData = async () => {
                setIsDataLoading(true);
                setShowColdStartMessage(false);

                // Start 5-second timer to detect cold starts
                timeoutId = setTimeout(() => {
                    setShowColdStartMessage(true);
                }, 5000);

                try {
                    // Fetch Settings
                    const profileRes = await axios.get(`${BACKEND_URL}/api/settings/${username}`, {
                        headers: { 'x-saas-secret': process.env.NEXT_PUBLIC_FRONTEND_SECRET }
                    }).catch(err => {
                        if (err.response?.status !== 404) console.error("Error fetching profile:", err);
                        return { data: null };
                    });
                    
                    if (profileRes?.data) {
                        if (!urlInstallationId) setInstallationId(profileRes.data.installationId || '');
                        setGeminiKey(profileRes.data.geminiKey || '');
                        setCustomPrompt(profileRes.data.customPrompt || '');
                    }

                    // Fetch Reviews
                    const reviewsRes = await axios.get(`${BACKEND_URL}/api/reviews/${username}`, {
                        headers: { 'x-saas-secret': process.env.NEXT_PUBLIC_FRONTEND_SECRET }
                    }).catch(err => {
                        console.error("Error fetching reviews. Ensure backend is running.");
                        return { data: [] };
                    });
                    
                    setReviews(reviewsRes?.data || []);
                } finally {
                    clearTimeout(timeoutId);
                    setIsDataLoading(false);
                }
            };

            fetchData();
        } else if (status === "unauthenticated") {
            setIsDataLoading(false);
        }
    }, [session, status, urlInstallationId]);

    // 4. Save Logic
    const handleSave = async () => {
        if (!installationId || !geminiKey) {
            return alert("Please provide both an Installation ID and a Gemini Key.");
        }

        setLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/api/settings`, {
                // @ts-ignore
                githubUsername: session?.user?.username,
                installationId,
                geminiKey,
                customPrompt
            }, {
                headers: { 'x-saas-secret': process.env.NEXT_PUBLIC_FRONTEND_SECRET }
            });
            alert("✅ Secured settings saved! Your AI Reviewer is active.");
        } catch (error) {
            console.error(error);
            alert("❌ Error saving settings. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    // 🎯 Dynamically calculate stats from the reviews array
    const totalVulnerabilities = reviews.reduce((acc, rev) => acc + (rev.metrics?.vulnerabilityCount || 0), 0);
    const totalBugs = reviews.reduce((acc, rev) => acc + (rev.metrics?.bugsFound || 0), 0);

    // --- STATE A: Loading Auth & Data ---
    if (status === "loading" || (status === "authenticated" && isDataLoading)) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                <p className="text-neutral-400">
                    {status === "loading" 
                        ? "Authenticating..." 
                        : showColdStartMessage 
                            ? "Waking up secure server... this may take up to 50 seconds." 
                            : "Loading dashboard data..."}
                </p>
            </div>
        );
    }

    // --- STATE B: User is NOT logged in ---
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center max-w-md w-full shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                        <Zap size={32} className="text-indigo-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 tracking-tight">AI Agent Console</h1>
                    <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
                        Please verify your identity with GitHub to configure your repository's AI reviewer.
                    </p>
                    <button
                        onClick={() => signIn('github')}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all"
                    >
                        Continue with GitHub
                    </button>
                </div>
            </div>
        );
    }

    // --- STATE C: Logged In Dashboard ---
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30 pb-20">
            <div className="max-w-5xl mx-auto">

                {/* Secure Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        <img src={session?.user?.image || ''} alt="Profile" className="w-12 h-12 rounded-xl border border-neutral-800" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Welcome, {session?.user?.name || 'Developer'}</h1>
                            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                <ShieldCheck size={14} /> Verified as @{(session?.user as any)?.username}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-neutral-500 hover:text-white flex gap-2 text-sm items-center transition-colors bg-neutral-900/50 px-4 py-2 rounded-lg border border-neutral-800"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

                    {/* --- LEFT COLUMN: Configuration Form --- */}
                    <div className="lg:col-span-1 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 backdrop-blur-sm shadow-2xl h-fit">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                <Key className="text-indigo-400" size={18} /> Agent Config
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Installation ID</label>
                                <input
                                    type="text"
                                    value={installationId}
                                    onChange={(e) => setInstallationId(e.target.value)}
                                    placeholder="Enter id"
                                    className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 px-3 text-xs text-indigo-400 font-mono focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    placeholder=""
                                    className="w-full bg-black border border-neutral-800 rounded-xl py-3 px-3 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="mt-4">
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                                    Custom Agent Rules (Optional)
                                </label>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g., 'Focus strictly on Node.js security vulnerabilities. Ignore CSS changes.'"
                                    className="w-full bg-black border border-neutral-800 rounded-xl py-3 px-3 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all resize-none h-24 text-neutral-300"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 mt-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {loading ? "Syncing..." : "Save Agent"}
                            </button>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: Analytics Metrics --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="text-indigo-400" size={20} /> Code Health Analytics
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
                                <GitPullRequest className="text-neutral-500 mb-3" size={24} />
                                <p className="text-3xl font-bold text-white">{reviews.length}</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Total Scans</p>
                            </div>
                            <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5">
                                <ShieldAlert className="text-rose-500 mb-3" size={24} />
                                <p className="text-3xl font-bold text-rose-400">{totalVulnerabilities}</p>
                                <p className="text-[10px] text-rose-500/70 uppercase tracking-wider mt-1">Vulns Blocked</p>
                            </div>
                            <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-5 col-span-2 md:col-span-1">
                                <Bug className="text-amber-500 mb-3" size={24} />
                                <p className="text-3xl font-bold text-amber-400">{totalBugs}</p>
                                <p className="text-[10px] text-amber-500/70 uppercase tracking-wider mt-1">Bugs Found</p>
                            </div>
                        </div>

                        {/* Detailed Review History */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 mt-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <h3 className="text-lg font-bold mb-4">Recent Security Logs</h3>
                            {reviews.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-neutral-800 rounded-2xl bg-black/20">
                                    <p className="text-neutral-500 text-sm">Awaiting first PR analysis.</p>
                                    <p className="text-neutral-600 text-xs mt-2">Open a pull request on your connected repo to see data.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {reviews.map((rev: any) => (
                                        <div key={rev._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 rounded-2xl border border-neutral-800 gap-4 hover:bg-neutral-900/80 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                        {rev.repoName}
                                                    </span>
                                                    <a href={rev.prUrl} target="_blank" rel="noreferrer" className="text-sm font-bold hover:underline">
                                                        #{rev.prNumber} {rev.prTitle || 'Pull Request'}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] px-3 py-1 rounded-full border ${rev.securityStatus === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                        rev.securityStatus === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    }`}>
                                                    {rev.securityStatus || 'Clean'}
                                                </span>

                                                <div className="flex items-center gap-2 text-xs font-mono bg-black rounded-lg px-2 py-1 border border-neutral-800">
                                                    <span className="text-rose-400" title="Vulnerabilities">V:{rev.metrics?.vulnerabilityCount || 0}</span>
                                                    <span className="text-neutral-700">|</span>
                                                    <span className="text-amber-400" title="Bugs">B:{rev.metrics?.bugsFound || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-indigo-500" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}