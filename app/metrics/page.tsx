"use client";

import { useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  getMetricsByDate,
  getLatestMetrics,
  formatCurrency,
  formatDate,
  ReconciliationMetrics,
} from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MetricsPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [metrics, setMetrics] = useState<ReconciliationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fn: () => Promise<ReconciliationMetrics>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fn();
      setMetrics(data);
    } catch {
      setError("Failed to load metrics. Please try again.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadByDate = () => {
    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }
    load(() => getMetricsByDate(selectedDate));
  };

  const handleLoadLatest = () => load(getLatestMetrics);

  const downloadJSON = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${metrics.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!metrics || !metrics.channel_breakdown) return;
    const headers = ["Channel", "Revenue", "Settlement", "Chargebacks", "Unsettled Claims"];
    const rows = metrics.channel_breakdown.map((ch) => [
      ch.channel,
      ch.total_revenue,
      ch.total_settlement,
      ch.chargebacks,
      ch.unsettled_claims,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${metrics.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = metrics?.channel_breakdown
    ? {
        labels: metrics.channel_breakdown.map((ch) => ch.channel),
        datasets: [
          {
            label: "Revenue (₦)",
            data: metrics.channel_breakdown.map((ch) => ch.total_revenue),
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
          {
            label: "Settlement (₦)",
            data: metrics.channel_breakdown.map((ch) => ch.total_settlement),
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metrics & Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          View reconciliation metrics and export reports.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleLoadByDate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            Load by Date
          </button>
          <button
            onClick={handleLoadLatest}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Load Latest
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
      )}

      {metrics && !loading && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Report for {formatDate(metrics.date)}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={downloadJSON}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                ⬇ JSON
              </button>
              <button
                onClick={downloadCSV}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                ⬇ CSV
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Revenue", value: formatCurrency(metrics.total_revenue) },
              { title: "Total Settlement", value: formatCurrency(metrics.total_settlement) },
              { title: "Chargebacks", value: formatCurrency(metrics.chargebacks) },
              { title: "Unsettled Claims", value: formatCurrency(metrics.unsettled_claims) },
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

          {/* Chart */}
          {chartData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue by Channel
              </h3>
              <div className="h-64">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (v) =>
                            "₦" + Number(v).toLocaleString("en-NG"),
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Channel Table */}
          {metrics.channel_breakdown && metrics.channel_breakdown.length > 0 && (
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
                  {metrics.channel_breakdown.map((ch) => (
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
        </>
      )}
    </div>
  );
}
