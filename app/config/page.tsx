"use client";

import { useEffect, useState } from "react";
import { getConfig, getHealth, ConfigData, HealthStatus } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setConfigError("Failed to load configuration."));

    getHealth()
      .then(setHealth)
      .catch(() => setHealthError("Failed to load health status."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">
          View current system configuration and connection status.
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Connection Status</h2>
        {healthError ? (
          <p className="text-red-600 text-sm">{healthError}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Google Sheets</p>
                <p className="text-xs text-gray-500 mt-0.5">Spreadsheet integration</p>
              </div>
              <StatusBadge
                status={health?.google_sheets_connected ? "green" : "red"}
                label={health?.google_sheets_connected ? "Connected" : "Disconnected"}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">OpenAI</p>
                <p className="text-xs text-gray-500 mt-0.5">AI summary generation</p>
              </div>
              <StatusBadge
                status={health?.openai_configured ? "green" : "yellow"}
                label={health?.openai_configured ? "Configured" : "Not Configured"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Config Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Configuration Details</h2>
        {configError ? (
          <p className="text-red-600 text-sm">{configError}</p>
        ) : config ? (
          <div className="space-y-4">
            {config.spreadsheet_id && (
              <ConfigRow label="Spreadsheet ID" value={String(config.spreadsheet_id)} />
            )}
            {config.ai_model && (
              <ConfigRow label="AI Model" value={String(config.ai_model)} />
            )}

            {/* Merchant IDs as a nested table */}
            {config.merchant_ids && typeof config.merchant_ids === "object" && !Array.isArray(config.merchant_ids) && (
              <div className="py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Merchant IDs</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {Object.entries(config.merchant_ids).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-gray-500 capitalize w-48 shrink-0">{k.replace(/_/g, " ")}</span>
                      <span className="font-mono text-gray-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sheet Names as a nested table */}
            {config.sheet_names && typeof config.sheet_names === "object" && !Array.isArray(config.sheet_names) && (
              <div className="py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Sheet Names</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {Object.entries(config.sheet_names).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-gray-500 capitalize w-48 shrink-0">{k.replace(/_/g, " ")}</span>
                      <span className="font-mono text-gray-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Any remaining top-level keys */}
            {Object.entries(config)
              .filter(([key]) => !["spreadsheet_id", "ai_model", "merchant_ids", "sheet_names"].includes(key))
              .map(([key, val]) => (
                <ConfigRow
                  key={key}
                  label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                />
              ))}
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600 sm:w-48 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-mono break-all whitespace-pre-wrap">{value}</span>
    </div>
  );
}
