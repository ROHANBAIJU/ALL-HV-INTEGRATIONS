'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wifi, Plus, Trash2, ChevronDown, ChevronUp,
  Loader2, CheckCircle, AlertTriangle, Shield, Zap
} from 'lucide-react';
import { ApiConfig } from '@/lib/config/apiConfig';
import {
  generateToken,
  checkHealth,
  generateTransactionId,
  type TokenRequest,
} from '@/lib/api/apiService';
import type { HyperKycResult } from '@/types/hyperkyc';

type AppMode = 'default' | 'dynamic';
type HealthStatus = 'unknown' | 'healthy' | 'unhealthy';
interface CustomInput { id: string; key: string; value: string; }
const randomId = () => Math.random().toString(36).slice(2, 9);

export default function Home() {
  const router = useRouter();
  const [isProd, setIsProd] = useState(true); // defaults to PROD (no CORS conflict w/ local dev server)
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [mode, setMode] = useState<AppMode>('default');
  const [manualName, setManualName] = useState('');
  const [appId, setAppId] = useState('');
  const [appKey, setAppKey] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [customInputs, setCustomInputs] = useState<CustomInput[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pingHealth = useCallback(async () => {
    setCheckingHealth(true);
    setHealthStatus('unknown');
    const result = await checkHealth();
    setHealthStatus(result.ok ? 'healthy' : 'unhealthy');
    setCheckingHealth(false);
  }, []);

  const toggleEnv = () => {
    ApiConfig.toggleEnvironment();
    setIsProd(ApiConfig.isProd);
    pingHealth();
  };

  useEffect(() => { pingHealth(); }, [pingHealth]);

  const addInput = () => setCustomInputs(p => [...p, { id: randomId(), key: '', value: '' }]);
  const removeInput = (id: string) => setCustomInputs(p => p.filter(i => i.id !== id));
  const updateInput = (id: string, f: 'key' | 'value', v: string) =>
    setCustomInputs(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));

  const handleLaunch = async () => {
    setErrorMsg(''); setStatusMsg(''); setLoading(true);
    try {
      const transactionId = generateTransactionId();
      setStatusMsg('Generating session token…');

      const tokenRequest: TokenRequest = mode === 'default'
        ? { mode: 'default', transactionId }
        : { mode: 'dynamic', transactionId, appId: appId.trim(), appKey: appKey.trim(), workflowId: workflowId.trim() };

      const tokenData = await generateToken(tokenRequest);
      if (!tokenData.success || !tokenData.accessToken) {
        throw new Error(tokenData.message || tokenData.error || 'Token generation failed');
      }

      setStatusMsg('Launching KYC workflow…');

      const inputsMap: Record<string, string> = {};
      if (mode === 'default' && manualName.trim()) inputsMap['MANUALNAME'] = manualName.trim();
      else if (mode === 'dynamic') customInputs.forEach(({ key, value }) => { if (key.trim()) inputsMap[key.trim()] = value; });
      if (tokenData.inputs) Object.assign(inputsMap, tokenData.inputs);

      const config = new HyperKycConfig(tokenData.accessToken, tokenData.workflowId!, transactionId, false);
      if (Object.keys(inputsMap).length > 0) config.setInputs(inputsMap);

      await HyperKYCModule.launch(config, (result: HyperKycResult) => {
        sessionStorage.setItem('hv_session', JSON.stringify({
          transactionId, tokenResponse: tokenData, sdkResult: result, launchedAt: new Date().toISOString(),
        }));
        router.push('/results');
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally { setLoading(false); setStatusMsg(''); }
  };

  const canLaunch = !loading && (mode === 'default' || (appId.trim() && appKey.trim() && workflowId.trim()));

  return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} className="flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--accent-purple-dim)', borderRadius: 12 }} className="p-2">
              <Shield size={22} style={{ color: 'var(--accent-purple-light)' }} />
            </div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>HyperVerge KYC</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Web SDK Tester · v10.5.0</p>
            </div>
          </div>
          {/* Env toggle */}
          <button onClick={toggleEnv} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {checkingHealth
              ? <Loader2 size={10} style={{ color: 'var(--text-muted)' }} className="animate-spin" />
              : <span style={{ width: 8, height: 8, borderRadius: '50%', background: healthStatus === 'healthy' ? 'var(--green)' : healthStatus === 'unhealthy' ? 'var(--red)' : 'var(--yellow)', display: 'inline-block' }} />}
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>{isProd ? 'PROD' : 'DEV'}</span>
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ApiConfig.baseUrl}</p>
      </div>

      {/* Mode Toggle */}
      <div className="w-full max-w-lg mb-6">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4 }}>
          {(['default', 'dynamic'] as AppMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? 'var(--accent-purple)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-secondary)', borderRadius: 7, padding: '10px 0', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {m === 'default' ? <Shield size={14} /> : <Zap size={14} />}
              {m === 'default' ? 'Default Mode' : 'Dynamic Mode'}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {mode === 'default' ? 'Uses backend credentials — just enter your name' : 'Provide your own App ID, Key & Workflow ID'}
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        {mode === 'default' && (
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" placeholder="Enter your name (MANUALNAME)" value={manualName} onChange={e => setManualName(e.target.value)} style={inputStyle} />
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
              Passed as <code style={{ color: 'var(--accent-purple-light)' }}>MANUALNAME</code> to the SDK workflow
            </p>
          </div>
        )}

        {mode === 'dynamic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>App ID *</label>
              <input type="text" placeholder="e.g. c52h5j" value={appId} onChange={e => setAppId(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>App Key *</label>
              <input type="password" placeholder="HV:xxxxxxxxxxxxxxxx" value={appKey} onChange={e => setAppKey(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Workflow ID *</label>
              <input type="text" placeholder="e.g. rb_sureguard_insurance" value={workflowId} onChange={e => setWorkflowId(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <button onClick={() => setShowAdvanced(v => !v)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: showAdvanced ? 12 : 0 }}>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Workflow Inputs ({customInputs.length})
              </button>
              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customInputs.map(inp => (
                    <div key={inp.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="text" placeholder="KEY" value={inp.key} onChange={e => updateInput(inp.id, 'key', e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }} />
                      <input type="text" placeholder="value" value={inp.value} onChange={e => updateInput(inp.id, 'value', e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
                      <button onClick={() => removeInput(inp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={14} style={{ color: 'var(--red)' }} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addInput} style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Plus size={13} /> Add Input
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: 'var(--red)', marginTop: 2, flexShrink: 0 }} />
            <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{errorMsg}</p>
          </div>
        )}
        {statusMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: 'var(--accent-purple-light)', fontSize: 13 }}>
            <Loader2 size={14} className="animate-spin" /> {statusMsg}
          </div>
        )}

        <button onClick={handleLaunch} disabled={!canLaunch} style={{ marginTop: 24, width: '100%', padding: '14px 0', background: canLaunch ? 'var(--accent-purple)' : 'var(--bg-card-hover)', border: `1px solid ${canLaunch ? 'var(--accent-purple)' : 'var(--border)'}`, borderRadius: 10, color: canLaunch ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 15, cursor: canLaunch ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {loading ? (statusMsg || 'Launching…') : 'Start KYC Verification'}
        </button>
      </div>

      {/* Health footer */}
      <div className="w-full max-w-lg mt-4 flex items-center justify-between">
        <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {healthStatus === 'healthy' && '✓ Backend reachable'}
          {healthStatus === 'unhealthy' && '✗ Backend unreachable — check URL or network'}
          {healthStatus === 'unknown' && '⟳ Checking backend…'}
        </p>
        <button onClick={pingHealth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Wifi size={10} /> Ping
        </button>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

