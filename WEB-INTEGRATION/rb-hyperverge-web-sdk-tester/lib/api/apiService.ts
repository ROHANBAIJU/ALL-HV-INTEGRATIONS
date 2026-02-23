/**
 * API Service — matches ApiService.ts from React Native and api_service.dart from Flutter
 * Handles token generation and webhook result polling
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

export interface WebhookResult {
  transactionId: string;
  workflowId?: string;
  status?: string;
  result?: Record<string, unknown>;
  timestamp?: string;
  receivedAt?: string;
  rawData?: Record<string, unknown>;
}

export interface WebhookResponse {
  success: boolean;
  data?: WebhookResult;
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
 * Poll for webhook result after SDK completes
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

  const data = await response.json();
  return data as WebhookResponse;
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
