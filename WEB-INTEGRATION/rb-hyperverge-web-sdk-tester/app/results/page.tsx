'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, ArrowLeft, Loader2, CheckCircle2, XCircle,
  Clock, UserX, AlertTriangle, Copy, Check
} from 'lucide-react';
import {
  getWebhookResults, getOutputApiResults, getLogsApiResults,
} from '@/lib/api/apiService';
import type { WebhookResponse, OutputApiResponse, LogsApiResponse } from '@/lib/api/apiService';
import type { HyperKycResult } from '@/types/hyperkyc';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'sdk' | 'output' | 'logs';

interface SessionData {
  transactionId: string;
  tokenResponse: Record<string, unknown>;
  sdkResult: HyperKycResult;
  launchedAt: string;
}

// ── Status config (matches all native apps) ───────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  auto_approved: { label: 'Auto Approved', color: 'var(--green)', bg: 'rgba(63,185,80,0.12)', Icon: CheckCircle2 },
  auto_declined: { label: 'Auto Declined', color: 'var(--red)', bg: 'rgba(248,81,73,0.12)', Icon: XCircle },
  needs_review:  { label: 'Needs Review', color: 'var(--yellow)', bg: 'rgba(210,153,34,0.12)', Icon: Clock },
  user_cancelled:{ label: 'User Cancelled', color: 'var(--blue)', bg: 'rgba(88,166,255,0.12)', Icon: UserX },
  error:         { label: 'Error', color: 'var(--orange)', bg: 'rgba(209,134,22,0.12)', Icon: AlertTriangle },
};

const getStatusConfig = (status?: string) =>
  STATUS_CONFIG[status ?? ''] ?? { label: status ?? 'Unknown', color: 'var(--text-muted)', bg: 'var(--bg-card)', Icon: AlertTriangle };

// ── Copy helper ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }} title="Copy">
      {copied
        ? <Check size={13} style={{ color: 'var(--green)' }} />
        : <Copy size={13} style={{ color: 'var(--text-muted)' }} />}
    </button>
  );
}

// ── JSON block ────────────────────────────────────────────────────────────────

function JsonBlock({ data, label }: { data: unknown; label?: string }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div style={{ position: 'relative' }}>
      {label && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{label}</p>}
      <div style={{ position: 'absolute', top: label ? 24 : 4, right: 8 }}>
        <CopyButton text={text} />
      </div>
      <pre style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '12px 14px',
        color: 'var(--text-primary)',
        maxHeight: 360,
        overflowY: 'auto',
        margin: 0,
      }}>
        {text}
      </pre>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResultsDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('sdk');
  // ── Output API state ──────────────────────────────────────────────────────
  const [outputResult, setOutputResult] = useState<OutputApiResponse | null>(null);
  const [outputLoading, setOutputLoading] = useState(false);
  const [outputError, setOutputError] = useState('');

  // ── Logs API / Webhook state ──────────────────────────────────────────────
  const [webhookData, setWebhookData] = useState<WebhookResponse | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState('');
  const [logsResult, setLogsResult] = useState<LogsApiResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const webhookReceived = webhookData?.success === true && !!webhookData.data;

  // Load session from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('hv_session');
    if (raw) {
      try { setSession(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-fetch Output API after session loads
  const fetchOutputApi = useCallback(async (txId: string) => {
    setOutputLoading(true);
    setOutputError('');
    try {
      const res = await getOutputApiResults({
        transactionId: txId,
        sendDebugInfo: 'yes',
        sendReviewDetails: 'yes',
      });
      setOutputResult(res);
      if (!res.success) setOutputError(res.message || res.error || 'Output API call failed');
    } catch {
      setOutputError('Failed to call Output API');
    } finally {
      setOutputLoading(false);
    }
  }, []);

  // Auto-check webhook on mount
  const fetchWebhook = useCallback(async (txId: string) => {
    setWebhookLoading(true);
    setWebhookError('');
    try {
      const res = await getWebhookResults(txId);
      setWebhookData(res);
      if (!res.success) setWebhookError(res.message || res.error || 'No webhook data yet');
    } catch {
      setWebhookError('Failed to fetch webhook results');
    } finally {
      setWebhookLoading(false);
    }
  }, []);

  // Fetch Logs API
  const fetchLogsApi = useCallback(async (txId: string) => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const res = await getLogsApiResults(txId);
      setLogsResult(res);
      if (!res.success) setLogsError(res.message || res.error || 'Logs API call failed');
    } catch {
      setLogsError('Failed to call Logs API');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    const t1 = setTimeout(() => fetchOutputApi(session.transactionId), 400);
    const t2 = setTimeout(() => fetchWebhook(session.transactionId), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [session, fetchOutputApi, fetchWebhook]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (!session) {
    return (
      <main style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={24} style={{ color: 'var(--text-muted)' }} className="animate-spin" />
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Loading session…</p>
          <button onClick={() => router.push('/')} style={ghostBtn} className="mt-4">← Back to home</button>
        </div>
      </main>
    );
  }

  const { transactionId, tokenResponse, sdkResult } = session;
  const statusCfg = getStatusConfig(sdkResult.status);
  const StatusIcon = statusCfg.Icon;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sdk', label: 'SDK Response' },
    { id: 'output', label: 'Output API' },
    { id: 'logs', label: 'Logs API' },
  ];

  return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} className="flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
            <ArrowLeft size={14} /> New Session
          </button>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>Verification Results</h1>
        </div>

        {/* Status badge */}
        <div style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.color}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusIcon size={24} style={{ color: statusCfg.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: statusCfg.color, fontWeight: 700, fontSize: 16, margin: 0 }}>{statusCfg.label}</p>
            {sdkResult.message && <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '2px 0 0' }}>{sdkResult.message}</p>}
          </div>
          {sdkResult.code !== undefined && (
            <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '2px 8px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
              Code {sdkResult.code}
            </span>
          )}
        </div>

        {/* Transaction ID */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            Transaction: <span style={{ color: 'var(--accent-purple-light)', fontFamily: 'monospace' }}>{transactionId}</span>
          </p>
          <CopyButton text={transactionId} />
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-2xl">
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '9px 0', background: activeTab === t.id ? 'var(--accent-purple)' : 'transparent', color: activeTab === t.id ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SDK Response Tab ── */}
        {activeTab === 'sdk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <JsonBlock data={sdkResult} label="SDK Callback Result" />
            <JsonBlock data={tokenResponse} label="Token Response (from backend)" />
          </div>
        )}

        {/* ── Output API Tab ── */}
        {activeTab === 'output' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {outputLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                <Loader2 size={14} className="animate-spin" /> Calling Output API…
              </div>
            )}

            {!outputLoading && outputError && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px' }}>
                <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>Output API Error</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{outputError}</p>
              </div>
            )}

            {!outputLoading && outputResult?.result && (() => {
              const r = outputResult.result;
              const statusCfgOut = getStatusConfig(r.status);
              const OutIcon = statusCfgOut.Icon;
              return (
                <>
                  {/* Status badge */}
                  <div style={{ background: statusCfgOut.bg, border: `1px solid ${statusCfgOut.color}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <OutIcon size={20} style={{ color: statusCfgOut.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: statusCfgOut.color, fontWeight: 700, fontSize: 15, margin: 0 }}>{statusCfgOut.label}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '2px 0 0', fontFamily: 'monospace' }}>{r.status}</p>
                    </div>
                  </div>

                  {/* Flags */}
                  {r.flags && r.flags.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px' }}>FLAGS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.flags.map(f => (
                          <span key={f} style={{ background: 'rgba(210,153,34,0.15)', border: '1px solid var(--yellow)', borderRadius: 6, padding: '2px 8px', color: 'var(--yellow)', fontSize: 12 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User details */}
                  {r.userDetails && Object.keys(r.userDetails).length > 0 && (
                    <JsonBlock data={r.userDetails} label="User Details" />
                  )}

                  {/* Review details */}
                  {r.reviewDetails && Object.keys(r.reviewDetails).length > 0 && (
                    <JsonBlock data={r.reviewDetails} label="Review Details" />
                  )}

                  {/* Debug info */}
                  {r.debugInfo && Object.keys(r.debugInfo).length > 0 && (
                    <JsonBlock data={r.debugInfo} label="Debug Info" />
                  )}

                  {/* Raw response */}
                  <JsonBlock data={outputResult} label="Raw Output API Response" />
                </>
              );
            })()}

            {!outputLoading && !outputError && !outputResult?.result && (
              <EmptyState icon={<CheckCircle2 size={32} style={{ color: 'var(--text-muted)' }} />} message="No result returned by Output API" />
            )}
          </div>
        )}

        {/* ── Logs API Tab ── */}
        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Webhook status row */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: webhookReceived ? 'var(--green)' : 'var(--yellow)',
                boxShadow: webhookReceived ? '0 0 6px var(--green)' : '0 0 6px var(--yellow)',
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>
                  {webhookReceived ? 'Webhook Received' : 'Waiting for Webhook'}
                </p>
                {webhookReceived && webhookData?.data && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0', fontFamily: 'monospace' }}>
                    {webhookData.data.applicationStatus}
                  </p>
                )}
                {!webhookReceived && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0' }}>
                    {webhookError || 'HyperVerge will call back your backend after verification.'}
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchWebhook(transactionId)}
                disabled={webhookLoading}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: webhookLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}
              >
                {webhookLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                Check Again
              </button>
            </div>

            {/* Call Logs API button */}
            <button
              onClick={() => fetchLogsApi(transactionId)}
              disabled={!webhookReceived || logsLoading}
              style={{
                background: webhookReceived ? 'var(--accent-purple)' : 'var(--bg-card)',
                border: `1px solid ${webhookReceived ? 'var(--accent-purple)' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 0', cursor: webhookReceived && !logsLoading ? 'pointer' : 'not-allowed',
                color: webhookReceived ? '#fff' : 'var(--text-muted)',
                fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {logsLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {logsLoading ? 'Calling Logs API…' : webhookReceived ? 'Call Logs API' : 'Call Logs API (waiting for webhook)'}
            </button>

            {/* Logs error */}
            {logsError && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px' }}>
                <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>Logs API Error</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{logsError}</p>
              </div>
            )}

            {/* Logs result */}
            {logsResult?.result && (() => {
              const lr = logsResult.result!;
              const logStatusCfg = getStatusConfig(lr.applicationStatus);
              const LogIcon = logStatusCfg.Icon;
              return (
                <>
                  <div style={{ background: logStatusCfg.bg, border: `1px solid ${logStatusCfg.color}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LogIcon size={20} style={{ color: logStatusCfg.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: logStatusCfg.color, fontWeight: 700, fontSize: 15, margin: 0 }}>{logStatusCfg.label}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '2px 0 0', fontFamily: 'monospace' }}>{lr.applicationStatus}</p>
                    </div>
                  </div>

                  {lr.flagsFound && lr.flagsFound.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px' }}>FLAGS FOUND</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lr.flagsFound.map(f => (
                          <span key={f} style={{ background: 'rgba(210,153,34,0.15)', border: '1px solid var(--yellow)', borderRadius: 6, padding: '2px 8px', color: 'var(--yellow)', fontSize: 12 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lr.results && lr.results.length > 0 && (
                    <JsonBlock data={lr.results} label="Workflow Step Results" />
                  )}

                  {lr.workflowDetails && Object.keys(lr.workflowDetails).length > 0 && (
                    <JsonBlock data={lr.workflowDetails} label="Workflow Details" />
                  )}

                  <JsonBlock data={logsResult} label="Raw Logs API Response" />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', color: 'var(--text-muted)', textAlign: 'center', gap: 12 }}>
      {icon}
      <p style={{ fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 16px',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
};
