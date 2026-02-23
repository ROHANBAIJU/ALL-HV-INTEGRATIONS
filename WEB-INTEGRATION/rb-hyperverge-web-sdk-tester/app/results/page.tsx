'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, ArrowLeft, Loader2, CheckCircle2, XCircle,
  Clock, UserX, AlertTriangle, Copy, Check
} from 'lucide-react';
import { getWebhookResults } from '@/lib/api/apiService';
import type { HyperKycResult } from '@/types/hyperkyc';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'sdk' | 'outputs' | 'webhook';

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
  const [webhookData, setWebhookData] = useState<Record<string, unknown> | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState('');

  // Load session from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('hv_session');
    if (raw) {
      try { setSession(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-fetch webhook results 800ms after mount (gives HyperVerge time to call back)
  const fetchWebhook = useCallback(async (txId: string) => {
    setWebhookLoading(true);
    setWebhookError('');
    try {
      const res = await getWebhookResults(txId);
      if (res.success && res.data) {
        setWebhookData(res.data as unknown as Record<string, unknown>);
      } else {
        setWebhookError(res.message || res.error || 'No webhook data yet');
      }
    } catch {
      setWebhookError('Failed to fetch webhook results');
    } finally {
      setWebhookLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => fetchWebhook(session.transactionId), 800);
    return () => clearTimeout(timer);
  }, [session, fetchWebhook]);

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
    { id: 'outputs', label: 'Outputs API' },
    { id: 'webhook', label: 'Webhooks' },
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

        {/* ── Outputs API Tab ── */}
        {activeTab === 'outputs' && (
          <div>
            {sdkResult.details && Object.keys(sdkResult.details).length > 0 ? (
              <JsonBlock data={sdkResult.details} label="Workflow Outputs" />
            ) : (
              <EmptyState icon={<CheckCircle2 size={32} style={{ color: 'var(--text-muted)' }} />} message="No output fields returned by this workflow" />
            )}
          </div>
        )}

        {/* ── Webhooks Tab ── */}
        {activeTab === 'webhook' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                HyperVerge sends a webhook to your backend after verification completes.
              </p>
              <button
                onClick={() => fetchWebhook(transactionId)}
                disabled={webhookLoading}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: webhookLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}
              >
                {webhookLoading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <RefreshCw size={12} />}
                Refresh
              </button>
            </div>

            {webhookLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                <Loader2 size={14} className="animate-spin" /> Polling backend…
              </div>
            )}

            {!webhookLoading && webhookError && (
              <div style={{ background: 'rgba(210,153,34,0.1)', border: '1px solid var(--yellow)', borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ color: 'var(--yellow)', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Webhook Pending</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{webhookError}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '8px 0 0' }}>
                  HyperVerge may not have sent the callback yet. Hit Refresh in a few seconds.
                </p>
              </div>
            )}

            {!webhookLoading && webhookData && (
              <JsonBlock data={webhookData} label="Webhook Payload (from backend storage)" />
            )}
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
