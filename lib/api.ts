import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Types
export interface HealthStatus {
  status: string;
  google_sheets_connected: boolean;
  openai_configured: boolean;
  timestamp?: string;
}

export interface ChannelMetrics {
  channel: string;
  total_revenue: number;
  total_settlement: number;
  chargebacks: number;
  unsettled_claims: number;
  transaction_count?: number;
}

export interface ReconciliationMetrics {
  date: string;
  total_revenue: number;
  total_settlement: number;
  chargebacks: number;
  unsettled_claims: number;
  channel_breakdown: ChannelMetrics[];
  ai_summary?: string;
}

export interface ReconciliationRequest {
  run_date: string | null;
  days_offset: number;
}

export interface ConfigData {
  spreadsheet_id?: string;
  ai_model?: string;
  merchant_ids?: string[];
  sheet_names?: string[];
  [key: string]: unknown;
}

// API functions
export async function getHealth(): Promise<HealthStatus> {
  const res = await apiClient.get<HealthStatus>("/health");
  return res.data;
}

export async function runReconciliation(
  payload: ReconciliationRequest
): Promise<ReconciliationMetrics> {
  const res = await apiClient.post<ReconciliationMetrics>(
    "/reconciliation/run",
    payload
  );
  return res.data;
}

export async function getMetricsByDate(
  date: string
): Promise<ReconciliationMetrics> {
  const res = await apiClient.get<ReconciliationMetrics>(`/metrics/${date}`);
  return res.data;
}

export async function getLatestMetrics(): Promise<ReconciliationMetrics> {
  const res = await apiClient.get<ReconciliationMetrics>("/metrics/latest");
  return res.data;
}

export async function getConfig(): Promise<ConfigData> {
  const res = await apiClient.get<ConfigData>("/config");
  return res.data;
}

// Formatters
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-NG");
