/**
 * TypeScript declarations for HyperVerge Web SDK globals
 * SDK loaded via CDN script tag — exposes HyperKycConfig and HyperKYCModule on window
 * Latest: v10.5.0
 */

export interface HyperKycResult {
  status: 'auto_approved' | 'auto_declined' | 'needs_review' | 'user_cancelled' | 'error';
  /** Numeric error/status code */
  code?: number;
  /** Human-readable message */
  message?: string;
  /** Raw details from the workflow */
  details?: Record<string, unknown>;
  transactionId?: string;
}

declare global {
  /**
   * HyperKycConfig — SDK configuration object
   *
   * Option 1: Pass token + workflowId + transactionId separately
   *   new HyperKycConfig(accessToken, workflowId, transactionId, showLandingPage?)
   *
   * Option 2 (v9.11.0+): workflowId + transactionId embedded in JWT
   *   new HyperKycConfig(jwtToken, showLandingPage?)
   *
   * Additional config methods from official sample project:
   *   setInputs(), supportDarkMode(), setCustomFontStylesheet(),
   *   setInitialLoaderColor(), setDefaultLangCode(), setUseLocation()
   */
  class HyperKycConfig {
    constructor(
      accessToken: string,
      workflowId: string,
      transactionId: string,
      showLandingPage?: boolean
    );
    constructor(jwtToken: string, showLandingPage?: boolean);
    /** Pre-fill workflow input fields */
    setInputs(inputs: Record<string, string>): void;
    /** Enable/disable dark mode for the SDK UI */
    supportDarkMode(enabled: boolean): void;
    /** Load a custom Google Fonts stylesheet for the SDK UI */
    setCustomFontStylesheet(url: string): void;
    /** Override the initial spinner/loader color (hex or CSS color) */
    setInitialLoaderColor(color: string): void;
    /** Set UI language (e.g. 'en', 'hi', 'ar') */
    setDefaultLangCode(langCode: string): void;
    /** Request browser geolocation during verification */
    setUseLocation(useLocation: boolean): void;
  }

  namespace HyperKYCModule {
    /** Launch the KYC workflow — resolves when the user completes or exits */
    function launch(
      config: HyperKycConfig,
      handler: (result: HyperKycResult) => void
    ): Promise<void>;
    /** Prefetch workflow resources for faster launch */
    function prefetch(appId: string, workflowId: string): void;
  }

  interface Window {
    HyperKycConfig: typeof HyperKycConfig;
    HyperKYCModule: typeof HyperKYCModule;
  }
}
