// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getClientIP, getWhoisIP, getWhoisDomain, fetchCsrfToken } from "../lib/api";

// --- New Helper Component for cleaner display ---
function WhoisDisplay({ data }: { data: any }) {
  if (!data) return <p className="text-gray-500 italic">Loading...</p>;

  // 1. Extract the text content
  // We check if 'data.raw' exists (from our backend fix), otherwise fallback to JSON
  const content = data.raw ? data.raw : JSON.stringify(data, null, 2);

  // 2. Check if it's a short message (like the localhost warning)
  // If it's short and has no newlines, make it a nice UI alert instead of a code block
  const isSimpleMessage = typeof content === 'string' && content.length < 150 && !content.includes('\n');

  if (isSimpleMessage) {
    return (
      <div className="p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg">
        ℹ️ {content}
      </div>
    );
  }

  // 3. Otherwise, render the full WHOIS text preserving formatting
  return (
    <div className="relative group">
      <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap overflow-x-auto bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

export default function Home() {
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [ipWhois, setIpWhois] = useState<any>(null);

  const [input, setInput] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);

  // Initial setup
  useEffect(() => {
    fetchCsrfToken().catch((err) => console.error('CSRF token fetch failed:', err));
  }, []);

  // Fetch client IP and its WHOIS on load
  useEffect(() => {
    (async () => {
      try {
        const data = await getClientIP();
        setClientIP(data.ip);

        // Only fetch whois if we successfully got an IP
        if (data.ip) {
            const whoisData = await getWhoisIP(data.ip);
            setIpWhois(whoisData);
        }
      } catch (err) {
        console.error("Failed to load client IP:", err);
      }
    })();
  }, []);

  function looksLikeIP(value: string) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());
  }

  async function handleLookup() {
    if(!input) return;
    setQueryResult(null);

    try {
      const cleanInput = input.trim();
      let result;

      if (looksLikeIP(cleanInput)) {
        result = await getWhoisIP(cleanInput);
        setQueryResult({ type: "IP", value: cleanInput, data: result });
      } else {
        result = await getWhoisDomain(cleanInput);
        setQueryResult({ type: "Domain", value: cleanInput, data: result });
      }
    } catch (err) {
      setQueryResult({ error: "Lookup failed. Please check the format or try again." });
      console.error("Lookup error:", err);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto space-y-8">

        <header className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Network Tools</h1>
            <p className="text-gray-500 mt-2">IP & Domain WHOIS Lookup</p>
        </header>

        {/* SECTION 1: Your Information */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
             <h2 className="text-lg font-semibold flex items-center gap-2">
                📍 Your Connection
             </h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your IP Address</label>
                <div className="mt-1 text-2xl font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {clientIP || "Loading..."}
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">WHOIS Data</label>
                <WhoisDisplay data={ipWhois} />
            </div>
          </div>
        </section>

        {/* SECTION 2: Lookup Tool */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
             <h2 className="text-lg font-semibold flex items-center gap-2">
                🔎 Manual Lookup
             </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter IP (8.8.8.8) or Domain (github.com)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                    onClick={handleLookup}
                    disabled={!input}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Lookup
                </button>
            </div>

            {/* Results Area */}
            {queryResult && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {queryResult.error ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {queryResult.error}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">
                                    Result for {queryResult.type}: <span className="text-gray-900 dark:text-white">{queryResult.value}</span>
                                </span>
                            </div>
                            <WhoisDisplay data={queryResult.data} />
                        </div>
                    )}
                </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}