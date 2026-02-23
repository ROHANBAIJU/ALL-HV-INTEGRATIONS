import type { NextConfig } from "next";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Content Security Policy — HyperVerge Web SDK v10.5.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CDNs used by the SDK (sourced from changelog + runtime observation):
 *
 * hv-web-sdk-cdn.hyperverge.co   — Main SDK script
 * cdnjs.cloudflare.com           — QR code lib (qrious), other third-party deps
 *                                  (v9.18.0: primary source, HV-CDN = fallback)
 * *.edge.hyperverge.co           — Lottie animations + image assets (v10.0.0+)
 *   assets.edge.hyperverge.co    — default asset path
 * config-cdn.hyperverge.co       — SDK remote config fetch per appId
 * *.hyperverge.co                — Auth API, transaction state, all HV APIs
 * *.sentry.io                    — SDK's internal error reporting (Sentry)
 * *.ingest.us.sentry.io          — Sentry US ingestion endpoint
 * *.ingest.sentry.io             — Sentry EU ingestion endpoint
 */

// Helpers for readability
const HV_CDN       = "https://hv-web-sdk-cdn.hyperverge.co";
const HV_WILDCARD  = "https://*.hyperverge.co";
const HV_EDGE      = "https://*.edge.hyperverge.co";
const HV_CONFIG    = "https://config-cdn.hyperverge.co";
const CDNJS        = "https://cdnjs.cloudflare.com";
const SENTRY       = "https://*.sentry.io https://*.ingest.us.sentry.io https://*.ingest.sentry.io";
const BACKEND_PROD = "https://unified-backend-for-all-sdks-d76nz9uok.vercel.app";
const BACKEND_DEV  = "http://192.168.0.105:3000 http://localhost:3000";

// Build per-directive strings
const scriptSrc  = `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${HV_CDN} ${CDNJS} ${HV_WILDCARD}`;
const connectSrc = `connect-src 'self' ${HV_WILDCARD} ${HV_EDGE} ${HV_CONFIG} ${CDNJS} ${SENTRY} ${BACKEND_PROD} ${BACKEND_DEV}`;
const imgSrc     = `img-src 'self' data: blob: ${HV_WILDCARD} ${HV_EDGE} ${CDNJS}`;
const frameSrc   = `frame-src 'self' ${HV_WILDCARD}`;
const mediaSrc   = "media-src 'self' blob:";
const workerSrc  = "worker-src 'self' blob:";
const styleSrc   = `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`;
const fontSrc    = "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com";
const defaultSrc = "default-src 'self'";

const csp = [defaultSrc, scriptSrc, connectSrc, imgSrc, frameSrc, mediaSrc, workerSrc, styleSrc, fontSrc].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Allow camera/mic for liveness capture & document scanning
          { key: "Permissions-Policy", value: "camera=*, microphone=*, geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
