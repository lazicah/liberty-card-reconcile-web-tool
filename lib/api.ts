import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 150000,
  headers: { "Content-Type": "application/json" },
});

// Types
export interface HealthStatus {
  status: string;
  message?: string;
  google_sheets_connected: boolean;
  openai_configured: boolean;
}

export interface ChannelData {
  revenue?: number;
  settlement?: number;
  charge_back?: number;
  unsettled_claim?: number;
}

export interface Metrics {
  run_date: string;
  total_revenue: number;
  total_settlement: number;
  total_settlement_charge_back: number;
  total_settlement_unsettled_claims: number;
  total_bank_isw_unsettled_claims: number;
  total_bank_isw_charge_back: number;
  channels: Record<string, ChannelData>;
}

export interface ReconciliationResponse {
  status: string;
  message: string;
  run_date: string;
  metrics: Metrics;
  ai_summary?: string;
  metrics_file_path?: string;
}

export interface ReconciliationRequest {
  run_date: string | null;
  days_offset: number;
}

export interface ConfigData {
  spreadsheet_id?: string;
  ai_model?: string;
  merchant_ids?: Record<string, string | number>;
  sheet_names?: Record<string, string>;
  [key: string]: unknown;
}

// API functions
export async function getHealth(): Promise<HealthStatus> {
  const res = await apiClient.get<HealthStatus>("/health");
  return res.data;
}

export async function runReconciliation(
  payload: ReconciliationRequest
): Promise<ReconciliationResponse> {
  const res = await apiClient.post<ReconciliationResponse>(
    "/reconciliation/run",
    payload
  );
  return res.data;
}

export async function getMetricsByDate(date: string): Promise<Metrics> {
  const res = await apiClient.get<Metrics>(`/metrics/${date}`);
  return res.data;
}

export async function getLatestMetrics(): Promise<Metrics> {
  const res = await apiClient.get<Metrics>("/metrics/latest");
  return res.data;
}

export async function getConfig(): Promise<ConfigData> {
  const res = await apiClient.get<ConfigData>("/config");
  return res.data;
}

// Formatters
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-NG");
