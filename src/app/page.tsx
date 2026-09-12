// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientIP, getWhoisIP, getWhoisDomain, fetchCsrfToken } from "../lib/api";
import { RefreshCcw, Wifi, Search, Copy, Check } from "lucide-react";

// --- Helper: extract country and description from raw WHOIS text ---
function parseWhois(rawText: string) {
  if (!rawText || typeof rawText !== "string") return null;

  // Regex to find 'country: XX' and 'netname: YYY'
  const countryMatch = rawText.match(/^\s*country\s*:\s*(.+)$/im);
  const netnameMatch =
    rawText.match(/^\s*netname\s*:\s*(.+)$/im) ||
    rawText.match(/^\s*(org-name|descr)\s*:\s*(.+)$/im);

  const country = countryMatch ? countryMatch[1].trim() : null;
  const netname = netnameMatch ? netnameMatch[2] ?? netnameMatch[1] : null;

  if (!country && !netname) return null;

  return `${country || "Unknown"} - ${netname || "No description"}`;
}

interface WhoisData {
  raw?: string;
  [key: string]: unknown;
}

interface QueryResult {
  type?: string;
  value?: string;
  data?: WhoisData;
  error?: string;
}

function WhoisDisplay({ data }: { data: WhoisData | null | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!data) return <p className="text-gray-500 italic">Loading...</p>;

  const content = data.raw ? data.raw : JSON.stringify(data, null, 2);
  const isSimpleMessage =
    typeof content === "string" && content.length < 150 && !content.includes("\n");

  if (isSimpleMessage) {
    return (
      <div className="p-4 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-lg">
        ℹ️ {content}
      </div>
    );
  }

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy WHOIS data:", err);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        type="button"
        title="Copy WHOIS data"
        className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-colors text-xs flex items-center gap-1 backdrop-blur-sm z-10"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>
      <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words break-all overflow-x-auto bg-slate-100 dark:bg-slate-900 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"connection" | "manual">("connection");
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [ipWhois, setIpWhois] = useState<WhoisData | null>(null);
  const [input, setInput] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [ipCopied, setIpCopied] = useState(false);

  const fetchClientConnection = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Client IP
      const data = await getClientIP();
      setClientIP(data.ip);

      // 2. Fetch WHOIS if IP is available
      if (data.ip) {
        const whoisData = await getWhoisIP(data.ip);
        setIpWhois(whoisData);
      }
    } catch (err) {
      console.error("Failed to load client connection data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCsrfToken().catch((err) => console.error("CSRF token fetch failed:", err));
  }, []);

  useEffect(() => {
    fetchClientConnection();
  }, [fetchClientConnection]);

  function looksLikeIP(value: string) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());
  }

  async function handleLookup(lookupValue?: string) {
    const target = (lookupValue || input).trim();
    if (!target) return;

    if (lookupValue) {
      setInput(lookupValue);
    }

    setIsLookingUp(true);
    setQueryResult(null);
    try {
      let result;
      if (looksLikeIP(target)) {
        result = await getWhoisIP(target);
        setQueryResult({ type: "IP", value: target, data: result });
      } else {
        result = await getWhoisDomain(target);
        setQueryResult({ type: "Domain", value: target, data: result });
      }
    } catch {
      setQueryResult({ error: "Lookup failed. Please check the format or try again." });
    } finally {
      setIsLookingUp(false);
    }
  }

  const handleCopyIP = async () => {
    if (!clientIP) return;
    try {
      await navigator.clipboard.writeText(clientIP);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy IP address:", err);
    }
  };

  const whoisSummary = ipWhois?.raw ? parseWhois(ipWhois.raw) : null;

  return (
    <main className="min-h-screen px-3 py-4 sm:p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <header className="text-center pt-2 pb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Network Tools</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-base">IP & Domain WHOIS Lookup</p>
        </header>

        {/* --- Top Navigation Tabs (Responsive & Compact on Mobile/PWA) --- */}
        <div className="flex justify-center w-full">
          <nav
            aria-label="Lookup navigation modes"
            className="grid grid-cols-2 p-1 bg-gray-200/80 dark:bg-gray-800/80 rounded-xl border border-gray-300/60 dark:border-gray-700 shadow-sm w-full max-w-xs sm:max-w-md"
          >
            <button
              type="button"
              onClick={() => setActiveTab("connection")}
              className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "connection"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Wifi size={16} className="shrink-0" />
              <span className="truncate sm:hidden">Connection</span>
              <span className="hidden sm:inline truncate">Your Connection</span>
              {clientIP && (
                <span className="hidden lg:inline-block ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-mono">
                  {clientIP}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "manual"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Search size={16} className="shrink-0" />
              <span className="truncate sm:hidden">Lookup</span>
              <span className="hidden sm:inline truncate">Manual Lookup</span>
            </button>
          </nav>
        </div>

        {/* --- View 1: Your Connection --- */}
        {activeTab === "connection" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                📍 Your Connection
              </h2>
              <button
                type="button"
                onClick={fetchClientConnection}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-wait rounded-full cursor-pointer"
                title="Refresh Connection Data"
              >
                <RefreshCcw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Your IP Address
                </label>
                <div className="mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-xl sm:text-2xl font-mono text-blue-600 dark:text-blue-400 font-semibold break-all">
                    {clientIP || (isRefreshing ? "Refreshing..." : "Loading...")}
                  </span>
                  {clientIP && (
                    <button
                      type="button"
                      onClick={handleCopyIP}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer shrink-0"
                      title="Copy IP Address"
                    >
                      {ipCopied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  )}
                </div>

                {whoisSummary && (
                  <div className="mt-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 break-words">
                    {whoisSummary}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  WHOIS Data
                </label>
                <WhoisDisplay data={ipWhois} />
              </div>
            </div>
          </section>
        )}

        {/* --- View 2: Manual Lookup --- */}
        {activeTab === "manual" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                🔎 Manual Lookup
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Query registration information for any public IP address or domain name.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Enter IP (e.g. 1.1.1.1) or Domain (e.g. github.com)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="w-full p-2.5 sm:p-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={!input || isLookingUp}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isLookingUp && <RefreshCcw size={16} className="animate-spin" />}
                  <span>{isLookingUp ? "Looking up..." : "Lookup"}</span>
                </button>
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                <span>Quick tests:</span>
                {["cloudflare.com", "google.com", "1.1.1.1", "8.8.8.8"].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleLookup(example)}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-mono transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {queryResult && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {queryResult.error ? (
                    <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900">
                      {queryResult.error}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          Result for {queryResult.type}:{" "}
                          <span className="text-gray-900 dark:text-white font-semibold font-mono">
                            {queryResult.value}
                          </span>
                        </span>
                      </div>

                      {queryResult.data?.raw && (
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {parseWhois(queryResult.data.raw)}
                        </div>
                      )}

                      <WhoisDisplay data={queryResult.data} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}