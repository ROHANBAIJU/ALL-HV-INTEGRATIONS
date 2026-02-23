import ApiConfig from '../config/ApiConfig';

// ─── Token Types ──────────────────────────────────────────────────────────────

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

// ─── Webhook Types ────────────────────────────────────────────────────────────
// Matches actual GET /api/webhook/results/:id backend shape

export interface WebhookData {
  transactionId: string;
  applicationStatus?: string;
  eventType?: string;
  eventTime?: string;
  receivedAt?: string;
  enrichedAt?: string | null;
  webhookRaw?: Record<string, any>;
  outputApiData?: Record<string, any> | null;
  logsApiData?: Record<string, any> | null;
}

export interface WebhookQueryResponse {
  success: boolean;
  data?: WebhookData;
  error?: string;
  message?: string;
  tip?: string;
}

// ─── Output API Types ─────────────────────────────────────────────────────────
// POST /api/results/output

export interface OutputApiRequest {
  transactionId: string;
  sendDebugInfo?: string;
  sendReviewDetails?: string;
}

export interface OutputApiResult {
  transactionId?: string;
  status?: string; // applicationStatus from backend result
  flags?: any[];
  userDetails?: Record<string, any>;
  debugInfo?: Record<string, any>;
  reviewDetails?: Record<string, any>;
}

export interface OutputApiResponse {
  success: boolean;
  status?: string;
  statusCode?: number;
  result?: OutputApiResult;
  message?: string;
  error?: string;
}

// ─── Logs API Types ───────────────────────────────────────────────────────────
// POST /api/results/logs

export interface LogsApiRequest {
  transactionId: string;
}

export interface LogsApiResult {
  transactionId?: string;
  applicationStatus?: string;
  results?: Record<string, any>[];
  flagsFound?: any[];
  workflowDetails?: Record<string, any>;
}

export interface LogsApiResponse {
  success: boolean;
  status?: string;
  statusCode?: number;
  result?: LogsApiResult;
  message?: string;
  error?: string;
}

// ─── API Service ──────────────────────────────────────────────────────────────

const ApiService = {
  /** POST /api/token/generate */
  generateToken: async (request: TokenRequest): Promise<TokenResponse> => {
    const url = `${ApiConfig.getInstance().baseUrl}/api/token/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-platform': 'react-native'},
      body: JSON.stringify(request),
    });
    return (await response.json()) as TokenResponse;
  },

  /**
   * GET /api/webhook/results/:transactionId
   * Backend returns 404 when no webhook received yet — handled as {success: false}
   */
  getWebhookResults: async (transactionId: string): Promise<WebhookQueryResponse> => {
    const url = `${ApiConfig.getInstance().baseUrl}/api/webhook/results/${transactionId}`;
    const response = await fetch(url, {method: 'GET'});
    if (response.status === 404) {
      return {success: false, message: 'No webhook received yet'};
    }
    return (await response.json()) as WebhookQueryResponse;
  },

  /** POST /api/results/output */
  getOutputApiResults: async (request: OutputApiRequest): Promise<OutputApiResponse> => {
    const url = `${ApiConfig.getInstance().baseUrl}/api/results/output`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        transactionId: request.transactionId,
        sendDebugInfo: request.sendDebugInfo ?? 'yes',
        sendReviewDetails: request.sendReviewDetails ?? 'yes',
      }),
    });
    return (await response.json()) as OutputApiResponse;
  },

  /** POST /api/results/logs */
  getLogsApiResults: async (request: LogsApiRequest): Promise<LogsApiResponse> => {
    const url = `${ApiConfig.getInstance().baseUrl}/api/results/logs`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({transactionId: request.transactionId}),
    });
    return (await response.json()) as LogsApiResponse;
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const url = `${ApiConfig.getInstance().baseUrl}/health`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {method: 'GET', signal: controller.signal});
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default ApiService;
