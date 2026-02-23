/**
 * API Service — matches ApiService.ts from React Native and api_service.dart from Flutter
 * Handles token generation, Output API, Logs API, and webhook result polling
 */

import { ApiConfig } from '@/lib/config/apiConfig';

// ── Request / Response types ──────────────────────────────────────────────────

export interface TokenRequest {
  mode: 'default' | 'dynamic';
  transactionId: string;
  // Dynamic mode only:
  appId?: string;
  appKey?: string;
  workflowId?: string;
}

export interface TokenResponse {
  success: boolean;
  accessToken?: string;
  workflowId?: string;
  transactionId?: string;
  mode?: string;
  expiresIn?: number;
  timestamp?: string;
  platform?: string;
  inputs?: Record<string, string>;
  // Error fields
  error?: string;
  message?: string;
  code?: string;
}

// ── Webhook — GET /api/webhook/results/:id ────────────────────────────────────
// backend sends: { success, data: { transactionId, applicationStatus, eventType,
//   eventTime, receivedAt, webhookRaw, outputApiData, logsApiData } }
// 404: { success: false, error, message, tip }

export interface WebhookData {
  transactionId: string;
  applicationStatus?: string;
  eventType?: string;
  eventTime?: string;
  receivedAt?: string;
  webhookRaw?: Record<string, unknown>;
  outputApiData?: Record<string, unknown>;
  logsApiData?: Record<string, unknown>;
}

export interface WebhookResponse {
  success: boolean;
  data?: WebhookData;
  error?: string;
  message?: string;
  tip?: string;
}

// ── Output API — POST /api/results/output ─────────────────────────────────────

export interface OutputApiRequest {
  transactionId: string;
  sendDebugInfo?: string;
  sendReviewDetails?: string;
}

export interface OutputApiResult {
  transactionId?: string;
  status?: string;
  flags?: string[];
  userDetails?: Record<string, unknown>;
  debugInfo?: Record<string, unknown>;
  reviewDetails?: Record<string, unknown>;
}

export interface OutputApiResponse {
  success: boolean;
  status?: string;
  statusCode?: number;
  result?: OutputApiResult;
  error?: string;
  message?: string;
}

// ── Logs API — POST /api/results/logs ────────────────────────────────────────

export interface LogsApiResult {
  transactionId?: string;
  applicationStatus?: string;
  results?: unknown[];
  flagsFound?: string[];
  workflowDetails?: Record<string, unknown>;
}

export interface LogsApiResponse {
  success: boolean;
  status?: string;
  statusCode?: number;
  result?: LogsApiResult;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status?: string;
  message?: string;
  ok: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique transaction ID — matches Android/RN format */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `txn_${timestamp}_${random}`;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * POST /api/token/generate
 * Default mode: sends only mode + transactionId (backend uses its own credentials)
 * Dynamic mode: sends mode + transactionId + appId + appKey + workflowId
 */
export async function generateToken(request: TokenRequest): Promise<TokenResponse> {
  const response = await fetch(ApiConfig.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-platform': 'web',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  return data as TokenResponse;
}

/**
 * GET /api/webhook/results/:transactionId
 * 404 → returns { success: false, message: 'Webhook not received yet' }
 */
export async function getWebhookResults(transactionId: string): Promise<WebhookResponse> {
  const response = await fetch(
    `${ApiConfig.webhookResultsEndpoint}/${encodeURIComponent(transactionId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-platform': 'web',
      },
    }
  );

  if (response.status === 404) {
    return { success: false, message: 'Webhook not received yet' };
  }

  const data = await response.json();
  return data as WebhookResponse;
}

/**
 * POST /api/results/output
 * Fetch Output API result for a completed verification
 */
export async function getOutputApiResults(request: OutputApiRequest): Promise<OutputApiResponse> {
  const response = await fetch(`${ApiConfig.baseUrl}/api/results/output`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-platform': 'web',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  return data as OutputApiResponse;
}

/**
 * POST /api/results/logs
 * Fetch Logs API result for a completed verification
 */
export async function getLogsApiResults(transactionId: string): Promise<LogsApiResponse> {
  const response = await fetch(`${ApiConfig.baseUrl}/api/results/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-platform': 'web',
    },
    body: JSON.stringify({ transactionId }),
  });

  const data = await response.json();
  return data as LogsApiResponse;
}

/**
 * GET /health
 * Check backend connectivity (5s timeout)
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(ApiConfig.healthEndpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return { ok: response.ok, status: response.ok ? 'healthy' : 'degraded' };
  } catch {
    return { ok: false, status: 'unreachable' };
  }
}
