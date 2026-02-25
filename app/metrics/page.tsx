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
  Metrics,
} from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MetricsPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fn: () => Promise<Metrics>) => {
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
    a.download = `metrics-${metrics.run_date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!metrics || !metrics.channels) return;
    const headers = ["Channel", "Revenue", "Settlement", "Charge Back", "Unsettled Claim"];
    const rows = Object.entries(metrics.channels).map(([name, ch]) => [
      name,
      ch.revenue ?? "",
      ch.settlement ?? "",
      ch.charge_back ?? "",
      ch.unsettled_claim ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${metrics.run_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const channelEntries = metrics?.channels ? Object.entries(metrics.channels) : [];

  const chartData = channelEntries.length > 0
    ? {
        labels: channelEntries.map(([name]) => name),
        datasets: [
          {
            label: "Revenue (₦)",
            data: channelEntries.map(([, ch]) => ch.revenue ?? 0),
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
          {
            label: "Settlement (₦)",
            data: channelEntries.map(([, ch]) => ch.settlement ?? 0),
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Report for {formatDate(metrics.run_date)}
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
              { title: "Chargebacks", value: formatCurrency(metrics.total_settlement_charge_back) },
              { title: "Unsettled Claims", value: formatCurrency(metrics.total_settlement_unsettled_claims) },
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

          {/* Bank ISW Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Bank ISW Unsettled Claims</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(metrics.total_bank_isw_unsettled_claims)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Bank ISW Chargebacks</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(metrics.total_bank_isw_charge_back)}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue & Settlement by Channel
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
          {channelEntries.length > 0 && (
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
                  {channelEntries.map(([name, ch]) => (
                    <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{name}</td>
                      <td className="py-3 text-gray-700">{ch.revenue !== undefined ? formatCurrency(ch.revenue) : "—"}</td>
                      <td className="py-3 text-gray-700">{ch.settlement !== undefined ? formatCurrency(ch.settlement) : "—"}</td>
                      <td className="py-3 text-gray-700">{ch.charge_back !== undefined ? formatCurrency(ch.charge_back) : "—"}</td>
                      <td className="py-3 text-gray-700">{ch.unsettled_claim !== undefined ? formatCurrency(ch.unsettled_claim) : "—"}</td>
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
