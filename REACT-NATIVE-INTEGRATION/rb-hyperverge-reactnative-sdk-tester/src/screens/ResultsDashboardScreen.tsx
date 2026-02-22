import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import ApiService, {WebhookQueryResponse} from '../api/ApiService';
import ApiConfig from '../config/ApiConfig';
import CopyableJsonCard from '../components/CopyableJsonCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  Input: undefined;
  Results: {sdkResponse: any; transactionId: string};
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type RoutePropType = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: NavigationProp;
  route: RoutePropType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#0f1117',
  card: '#1a1d2e',
  cardBorder: '#2d3151',
  accent: '#6c63ff',
  success: '#48bb78',
  error: '#fc8181',
  warning: '#f6ad55',
  info: '#63b3ed',
  textPrimary: '#f0f4ff',
  textSecondary: '#8892b0',
  tabActive: '#6c63ff',
  tabInactive: '#2d3748',
};

const STATUS_CONFIG: Record<
  string,
  {color: string; bg: string; emoji: string; label: string}
> = {
  auto_approved: {
    color: '#68d391',
    bg: '#1c3a2a',
    emoji: '✅',
    label: 'Auto Approved',
  },
  auto_declined: {
    color: '#fc8181',
    bg: '#3b1f1f',
    emoji: '❌',
    label: 'Auto Declined',
  },
  needs_review: {
    color: '#f6ad55',
    bg: '#3b2a10',
    emoji: '🔍',
    label: 'Needs Review',
  },
  user_cancelled: {
    color: '#a0aec0',
    bg: '#2d3748',
    emoji: '🚫',
    label: 'User Cancelled',
  },
  error: {
    color: '#fc8181',
    bg: '#3b1f1f',
    emoji: '⚠️',
    label: 'Error',
  },
};

const DEFAULT_STATUS = {
  color: '#a0aec0',
  bg: '#2d3748',
  emoji: '❓',
  label: 'Unknown',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ResultsDashboardScreen: React.FC<Props> = ({navigation, route}) => {
  const {sdkResponse, transactionId} = route.params;
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['SDK Response', 'Outputs API', 'Webhooks'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results Dashboard</Text>
        <View style={{width: 36}} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}>
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 0 && (
        <SdkResponseTab
          sdkResponse={sdkResponse}
          transactionId={transactionId}
        />
      )}
      {activeTab === 1 && <OutputsApiTab transactionId={transactionId} />}
      {activeTab === 2 && <WebhooksTab transactionId={transactionId} />}
    </SafeAreaView>
  );
};

// ─── Tab 0: SDK Response ──────────────────────────────────────────────────────

const SdkResponseTab: React.FC<{sdkResponse: any; transactionId: string}> = ({
  sdkResponse,
  transactionId,
}) => {
  const status =
    sdkResponse?.status || sdkResponse?.response?.status || 'unknown';
  const statusCfg = STATUS_CONFIG[status] ?? DEFAULT_STATUS;

  // Extract fields defensively
  const txnId =
    sdkResponse?.transactionId ||
    sdkResponse?.response?.transactionId ||
    transactionId ||
    '—';
  const errorCode =
    sdkResponse?.errorCode || sdkResponse?.response?.errorCode || null;
  const errorMessage =
    sdkResponse?.errorMessage ||
    sdkResponse?.response?.errorMessage ||
    sdkResponse?.message ||
    null;
  const details: Record<string, any> =
    sdkResponse?.details || sdkResponse?.response?.details || {};

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          {backgroundColor: statusCfg.bg, borderColor: statusCfg.color},
        ]}>
        <Text style={styles.statusEmoji}>{statusCfg.emoji}</Text>
        <View style={styles.statusTextBlock}>
          <Text style={[styles.statusLabel, {color: statusCfg.color}]}>
            {statusCfg.label}
          </Text>
          <Text style={styles.statusRaw}>Status: {status}</Text>
        </View>
      </View>

      {/* Transaction Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Details</Text>
        <DetailRow label="Transaction ID" value={txnId} mono />
        <DetailRow
          label="Environment"
          value={ApiConfig.getInstance().environmentLabel}
        />
        <DetailRow
          label="Backend URL"
          value={ApiConfig.getInstance().baseUrl}
          mono
        />
      </View>

      {/* Error Details (if any) */}
      {(errorCode || errorMessage) && (
        <View style={[styles.card, {borderColor: '#742a2a'}]}>
          <Text style={[styles.cardTitle, {color: COLORS.error}]}>
            Error Details
          </Text>
          {errorCode && (
            <DetailRow label="Error Code" value={String(errorCode)} />
          )}
          {errorMessage && <DetailRow label="Message" value={errorMessage} />}
        </View>
      )}

      {/* Additional Details */}
      {Object.keys(details).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SDK Output Details</Text>
          {Object.entries(details).map(([k, v]) => (
            <DetailRow key={k} label={k} value={String(v ?? '—')} />
          ))}
        </View>
      )}

      {/* Raw SDK Output */}
      <CopyableJsonCard title="Raw SDK Output" data={sdkResponse} />
    </ScrollView>
  );
};

// ─── Tab 1: Outputs API ───────────────────────────────────────────────────────

const OutputsApiTab: React.FC<{transactionId: string}> = ({transactionId}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<WebhookQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!transactionId) {
      setError('No transaction ID available');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getWebhookResults(transactionId);
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch results');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [transactionId]);

  // Auto-fetch on mount with a small delay (let SDK result settle)
  useEffect(() => {
    const timer = setTimeout(fetchResults, 800);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outputs API</Text>
        <Text style={styles.cardSubtitle}>
          GET /api/webhook/results/{transactionId || '(no tx id)'}
        </Text>
        <Text style={styles.envBadge}>{ApiConfig.getInstance().baseUrl}</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>
            Fetching results from backend...
          </Text>
        </View>
      )}

      {!loading && error && (
        <View style={[styles.card, {borderColor: '#742a2a'}]}>
          <Text style={[styles.cardTitle, {color: COLORS.error}]}>
            Fetch Failed
          </Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && result && (
        <>
          <View
            style={[
              styles.card,
              {
                borderColor: result.found ? COLORS.success : COLORS.warning,
              },
            ]}>
            <Text style={styles.cardTitle}>
              {result.found ? '✅ Results Found' : '⏳ Not Yet Available'}
            </Text>
            <DetailRow label="Success" value={String(result.success)} />
            <DetailRow label="Found" value={String(result.found)} />
            {result.message && (
              <DetailRow label="Message" value={result.message} />
            )}
            {result.data?.status && (
              <DetailRow label="Status" value={result.data.status} />
            )}
            {result.data?.workflowId && (
              <DetailRow
                label="Workflow ID"
                value={result.data.workflowId}
                mono
              />
            )}
            {result.data?.timestamp && (
              <DetailRow label="Timestamp" value={result.data.timestamp} />
            )}
          </View>

          {result.data && (
            <CopyableJsonCard title="Full Webhook Data" data={result.data} />
          )}
          <CopyableJsonCard title="Raw API Response" data={result} />
        </>
      )}

      {fetched && (
        <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

// ─── Tab 2: Webhooks ──────────────────────────────────────────────────────────

const WebhooksTab: React.FC<{transactionId: string}> = ({transactionId}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebhookQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [called, setCalled] = useState(false);

  const callResultsApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getWebhookResults(transactionId);
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to call API');
    } finally {
      setLoading(false);
      setCalled(true);
    }
  };

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}>
      {/* How it works */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔗 How Webhooks Work</Text>
        <WebhookStep
          num="1"
          text="SDK launches and user completes the verification flow"
        />
        <WebhookStep
          num="2"
          text="HyperVerge servers POST the result to your backend webhook endpoint at /api/webhook/hyperverge"
        />
        <WebhookStep
          num="3"
          text="Your backend stores the result in memory/DB keyed by transactionId"
        />
        <WebhookStep
          num="4"
          text="Call the Results API below to retrieve the stored webhook result"
        />
      </View>

      {/* Endpoint Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📡 Webhook Endpoint</Text>
        <View style={styles.endpointRow}>
          <View style={styles.methodBadge}>
            <Text style={styles.methodBadgeText}>POST</Text>
          </View>
          <Text style={styles.endpointText} numberOfLines={2}>
            {ApiConfig.getInstance().baseUrl}/api/webhook/hyperverge
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Configure this URL in your HyperVerge Dashboard as the webhook
          receiver.
        </Text>

        <View style={[styles.endpointRow, {marginTop: 10}]}>
          <View style={[styles.methodBadge, {backgroundColor: '#276749'}]}>
            <Text style={styles.methodBadgeText}>GET</Text>
          </View>
          <Text style={styles.endpointText} numberOfLines={2}>
            {ApiConfig.getInstance().baseUrl}/api/webhook/results/
            {'{transactionId}'}
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Query endpoint to retrieve a stored webhook result by transaction ID.
        </Text>
      </View>

      {/* Transaction ID */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Transaction</Text>
        <View style={styles.txnIdBox}>
          <Text style={styles.txnIdText} selectable>
            {transactionId || '(no transaction id)'}
          </Text>
        </View>
      </View>

      {/* Manual Call Button */}
      <TouchableOpacity
        style={[styles.callApiButton, loading && styles.callApiButtonDisabled]}
        onPress={callResultsApi}
        disabled={loading}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.callApiButtonText}>Calling API...</Text>
          </View>
        ) : (
          <Text style={styles.callApiButtonText}>📬 Call Results API</Text>
        )}
      </TouchableOpacity>

      {/* Result display */}
      {called && !loading && (
        <>
          {error && (
            <View style={[styles.card, {borderColor: '#742a2a'}]}>
              <Text style={[styles.cardTitle, {color: COLORS.error}]}>
                Request Failed
              </Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {result && (
            <>
              <View
                style={[
                  styles.card,
                  {borderColor: result.found ? COLORS.success : COLORS.warning},
                ]}>
                <Text style={styles.cardTitle}>
                  {result.found ? '✅ Webhook Data Found' : '⏳ No Data Yet'}
                </Text>
                <DetailRow label="Found" value={String(result.found)} />
                {result.message && (
                  <DetailRow label="Message" value={result.message} />
                )}
                {result.data?.status && (
                  <DetailRow label="Status" value={result.data.status} />
                )}
              </View>
              <CopyableJsonCard title="Webhook Result" data={result} />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

const DetailRow: React.FC<{label: string; value: string; mono?: boolean}> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, mono && styles.detailValueMono]}
      selectable
      numberOfLines={3}>
      {value}
    </Text>
  </View>
);

const WebhookStep: React.FC<{num: string; text: string}> = ({num, text}) => (
  <View style={styles.webhookStep}>
    <View style={styles.stepNum}>
      <Text style={styles.stepNumText}>{num}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

export default ResultsDashboardScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2238',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1d2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3151',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#13162a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2238',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.tabActive,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  // Tab content
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },
  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusRaw: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  envBadge: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 4,
  },
  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2238',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 2,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  detailValueMono: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },
  // Retry button
  retryButton: {
    backgroundColor: '#2d3748',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Endpoint rows
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  methodBadge: {
    backgroundColor: '#553c9a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    minWidth: 48,
    alignItems: 'center',
  },
  methodBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  endpointText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  // TxnId box
  txnIdBox: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  txnIdText: {
    color: COLORS.accent,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  // Call API button
  callApiButton: {
    backgroundColor: '#276749',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  callApiButtonDisabled: {
    backgroundColor: '#2d3748',
  },
  callApiButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Webhook steps
  webhookStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
