/**
 * API Configuration — matches the pattern from Android EnvironmentConfig.kt
 * and Flutter api_config.dart
 */

const DEV_BASE_URL = 'http://192.168.0.105:3000';
const PROD_BASE_URL = 'https://unified-backend-for-all-sdks-d76nz9uok.vercel.app';

class ApiConfigClass {
  // Web app defaults to PROD — DEV backend runs on same port as Next.js (3000).
  // Toggle to DEV only when running the backend on a different port (e.g. 3001).
  private isProduction = true;

  get baseUrl(): string {
    return this.isProduction ? PROD_BASE_URL : DEV_BASE_URL;
  }

  get isProd(): boolean {
    return this.isProduction;
  }

  switchToProduction(): void {
    this.isProduction = true;
  }

  switchToDevelopment(): void {
    this.isProduction = false;
  }

  toggleEnvironment(): void {
    this.isProduction = !this.isProduction;
  }

  // ── Endpoints ──────────────────────────────────────────────────────────────
  get tokenEndpoint(): string {
    return `${this.baseUrl}/api/token/generate`;
  }

  get webhookResultsEndpoint(): string {
    return `${this.baseUrl}/api/webhook/results`;
  }

  get healthEndpoint(): string {
    return `${this.baseUrl}/health`;
  }
}

// Singleton — same pattern across all platforms
export const ApiConfig = new ApiConfigClass();

// Default credentials (server-side env vars mirror these)
export const DEFAULT_CREDENTIALS = {
  appId: 'c52h5j',
  appKey: 'HV:q7aqkdhe5b39vfmeg',
  workflowId: 'rb_sureguard_insurance',
} as const;
