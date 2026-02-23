// Environment configuration — mirrors EnvironmentConfig.kt in the Android tester
const DEV_BASE_URL = 'http://192.168.0.105:3000';
const PROD_BASE_URL =
  'https://unified-backend-for-all-sdks-p1bb4tasc.vercel.app';

class ApiConfig {
  private static instance: ApiConfig;
  private _isProduction: boolean = true;

  private constructor() {}

  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }

  get isProduction(): boolean {
    return this._isProduction;
  }

  get baseUrl(): string {
    return this._isProduction ? PROD_BASE_URL : DEV_BASE_URL;
  }

  get environmentLabel(): string {
    return this._isProduction ? 'Production' : 'Development';
  }

  switchToProduction(): void {
    this._isProduction = true;
  }

  switchToDevelopment(): void {
    this._isProduction = false;
  }

  toggleEnvironment(): void {
    this._isProduction = !this._isProduction;
  }
}

export default ApiConfig;
export {DEV_BASE_URL, PROD_BASE_URL};
