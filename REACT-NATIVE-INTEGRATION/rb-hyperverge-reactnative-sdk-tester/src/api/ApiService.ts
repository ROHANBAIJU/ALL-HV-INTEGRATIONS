import ApiConfig from '../config/ApiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  success: boolean;
  accessToken?: string;
  transactionId?: string;
  workflowId?: string;
  mode?: string;
  error?: string;
  message?: string;
  code?: string;
}

export interface TokenRequest {
  mode: 'default' | 'dynamic';
  transactionId: string;
  appId?: string;
  appKey?: string;
  workflowId?: string;
}

export interface WebhookResult {
  transactionId: string;
  workflowId: string;
  status: string;
  timestamp: string;
  receivedAt: string;
  result?: Record<string, any>;
  rawData?: Record<string, any>;
}

export interface WebhookQueryResponse {
  success: boolean;
  found: boolean;
  message?: string;
  data?: WebhookResult;
}

// ─── API Service ──────────────────────────────────────────────────────────────

const ApiService = {
  /**
   * Calls POST /api/token/generate on the unified backend.
   *
   * Default mode  → { mode: 'default', transactionId } — backend uses its own env credentials
   * Dynamic mode  → { mode: 'dynamic', transactionId, appId, appKey, workflowId }
   *
   * Backend returns { accessToken, workflowId, transactionId, ... }
   */
  generateToken: async (request: TokenRequest): Promise<TokenResponse> => {
    const url = `${ApiConfig.getInstance().baseUrl}/api/token/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-platform': 'react-native',
      },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    return data as TokenResponse;
  },

  /**
   * Calls GET /api/webhook/results/:transactionId on the unified backend.
   */
  getWebhookResults: async (
    transactionId: string,
  ): Promise<WebhookQueryResponse> => {
    const url = `${
      ApiConfig.getInstance().baseUrl
    }/api/webhook/results/${transactionId}`;
    const response = await fetch(url, {method: 'GET'});
    const data = await response.json();
    return data as WebhookQueryResponse;
  },

  /**
   * Health-check: calls GET /health on the backend.
   * Returns true if reachable.
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const url = `${ApiConfig.getInstance().baseUrl}/health`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default ApiService;
