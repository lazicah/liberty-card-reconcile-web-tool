"use client";

import { useState } from "react";
import { runReconciliation, formatCurrency, ReconciliationMetrics } from "@/lib/api";

export default function ReconciliationPage() {
  const [runDate, setRunDate] = useState("");
  const [daysOffset, setDaysOffset] = useState(18);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runReconciliation({
        run_date: runDate || null,
        days_offset: daysOffset,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Run Reconciliation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Trigger a reconciliation run and view the results.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Run Date{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={runDate}
              onChange={(e) => setRunDate(e.target.value)}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YYYY-MM-DD"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to use the current date.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Offset
            </label>
            <input
              type="number"
              value={daysOffset}
              min={1}
              max={365}
              onChange={(e) => setDaysOffset(Number(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Number of days to look back (1–365).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {loading ? "Processing…" : "Run Reconciliation"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">Results</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Revenue", value: formatCurrency(result.total_revenue) },
              { title: "Total Settlement", value: formatCurrency(result.total_settlement) },
              { title: "Chargebacks", value: formatCurrency(result.chargebacks) },
              { title: "Unsettled Claims", value: formatCurrency(result.unsettled_claims) },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {result.channel_breakdown && result.channel_breakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-x-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Channel Breakdown</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 font-semibold text-gray-700">Channel</th>
                    <th className="pb-2 font-semibold text-gray-700">Revenue</th>
                    <th className="pb-2 font-semibold text-gray-700">Settlement</th>
                    <th className="pb-2 font-semibold text-gray-700">Chargebacks</th>
                    <th className="pb-2 font-semibold text-gray-700">Unsettled</th>
                  </tr>
                </thead>
                <tbody>
                  {result.channel_breakdown.map((ch) => (
                    <tr key={ch.channel} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{ch.channel}</td>
                      <td className="py-3 text-gray-700">{formatCurrency(ch.total_revenue)}</td>
                      <td className="py-3 text-gray-700">{formatCurrency(ch.total_settlement)}</td>
                      <td className="py-3 text-gray-700">{formatCurrency(ch.chargebacks)}</td>
                      <td className="py-3 text-gray-700">{formatCurrency(ch.unsettled_claims)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.ai_summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {result.ai_summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
