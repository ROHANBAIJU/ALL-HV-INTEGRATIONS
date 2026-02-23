import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

// HyperVerge Web SDK v10.5.0 (latest as of Feb 2026)
const HV_SDK_VERSION = "10.5.0";
const HV_SDK_URL = `https://hv-web-sdk-cdn.hyperverge.co/hyperverge-web-sdk@${HV_SDK_VERSION}/src/sdk.min.js`;

export const metadata: Metadata = {
  title: "RB HyperVerge Web SDK Tester",
  description: "HyperVerge KYC Web SDK integration tester — Default & Dynamic modes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Load HyperVerge Web SDK — makes HyperKycConfig + HyperKYCModule available globally */}
        <Script src={HV_SDK_URL} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
