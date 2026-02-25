"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getHealth, getLatestMetrics, formatCurrency, formatDate, HealthStatus, ReconciliationMetrics } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ReconciliationMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth(data);
      setHealthError(null);
    } catch {
      setHealthError("Unable to reach the API. Check your connection.");
      setHealth(null);
    }
    setLastRefresh(new Date());
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getLatestMetrics();
      setMetrics(data);
      setMetricsError(null);
    } catch {
      setMetricsError("No metrics available yet.");
      setMetrics(null);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchMetrics]);

  const serviceStatus = health
    ? health.status === "healthy" || health.status === "ok"
      ? "green"
      : "yellow"
    : "red";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Liberty Card Reconciliation System Overview
        </p>
      </div>

      {/* Service Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">Service Status</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchHealth}
              className="text-xs text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {healthError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {healthError}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">API Service</span>
              <StatusBadge
                status={serviceStatus}
                label={health ? health.status : "Unavailable"}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Google Sheets</span>
              <StatusBadge
                status={health?.google_sheets_connected ? "green" : "red"}
                label={health?.google_sheets_connected ? "Connected" : "Disconnected"}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">OpenAI</span>
              <StatusBadge
                status={health?.openai_configured ? "green" : "yellow"}
                label={health?.openai_configured ? "Configured" : "Not Configured"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Latest Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-lg">Latest Metrics</h2>
          {metrics && (
            <span className="text-sm text-gray-500">
              As of {formatDate(metrics.date)}
            </span>
          )}
        </div>

        {metricsError ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            {metricsError}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Revenue" value={formatCurrency(metrics.total_revenue)} />
            <MetricCard title="Total Settlement" value={formatCurrency(metrics.total_settlement)} />
            <MetricCard title="Chargebacks" value={formatCurrency(metrics.chargebacks)} />
            <MetricCard title="Unsettled Claims" value={formatCurrency(metrics.unsettled_claims)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-7 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/reconciliation"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <span>▶</span> Run Reconciliation
          </Link>
          <Link
            href="/metrics"
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <span>📊</span> View Reports
          </Link>
          <Link
            href="/config"
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <span>⚙️</span> System Configuration
          </Link>
        </div>
      </div>
    </div>
  );
}
