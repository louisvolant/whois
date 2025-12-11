// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getClientIP, getWhoisIP, getWhoisDomain } from "../lib/api";
import { fetchCsrfToken } from "../lib/api";

export default function Home() {
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [ipWhois, setIpWhois] = useState<any>(null);

  const [input, setInput] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
        fetchCsrfToken().catch((err) => console.error('CSRF token fetch failed:', err));
  }, []);

    // Fetch the client IP on load

    useEffect(() => {
        (async () => {
        try {
            const data = await getClientIP();
            setClientIP(data.ip);
            const whoisData = await getWhoisIP(data.ip);
            setIpWhois(whoisData);
        } catch (err) {
            console.error("Failed to load client IP:", err);
                         }
        })();
    }, []);



  // Simple detection: is it an IP ?
  function looksLikeIP(value: string) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());
  }

  async function handleLookup() {
    setQueryResult(null);

    try {
      if (looksLikeIP(input)) {
        const result = await getWhoisIP(input.trim());
        setQueryResult({ type: "ip", value: input.trim(), data: result });
      } else {
        const result = await getWhoisDomain(input.trim());
        setQueryResult({ type: "domain", value: input.trim(), data: result });
      }
    } catch (err) {
      setQueryResult({ error: "Lookup failed" });
      console.error("Lookup error:", err);
    }
  }


  return (
    <main className="min-h-screen p-6 text-gray-900 dark:text-white">
      <div className="max-w-xl mx-auto space-y-10">

        {/* Client IP */}
        <section className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Your IP</h2>

          {clientIP ? (
            <p className="text-lg font-mono">{clientIP}</p>
          ) : (
            <p>Loading…</p>
          )}
        </section>

        {/* Whois of the client IP */}
        <section className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Whois (your IP)</h2>

          {!ipWhois && <p>Loading…</p>}

          {ipWhois && (
            <pre className="text-sm overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded">
              {JSON.stringify(ipWhois, null, 2)}
            </pre>
          )}
        </section>

        {/* Manual lookup */}
        <section className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Lookup another IP or domain</h2>

          <input
            type="text"
            placeholder="8.8.8.8 or github.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 rounded bg-gray-100 dark:bg-gray-900 outline-none"
          />

          <button
            onClick={handleLookup}
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Lookup
          </button>

          {queryResult && (
            <div className="mt-4">
              {queryResult.error ? (
                <p className="text-red-500">{queryResult.error}</p>
              ) : (
                <>
                  <p className="font-semibold mb-2">
                    Result for {queryResult.value} ({queryResult.type})
                  </p>
                  <pre className="text-sm overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded">
                    {JSON.stringify(queryResult.data, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}