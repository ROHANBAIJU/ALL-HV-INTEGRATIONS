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
import ApiService, {
  WebhookQueryResponse,
  OutputApiResponse,
  LogsApiResponse,
} from '../api/ApiService';
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

  const tabs = ['SDK Response', 'Output API', 'Logs API'];

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
        <TouchableOpacity
          style={styles.newFlowBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.newFlowBtnText}>New Flow</Text>
        </TouchableOpacity>
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

// ─── Tab 1: Output API ───────────────────────────────────────────────────────

const OutputsApiTab: React.FC<{transactionId: string}> = ({transactionId}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OutputApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!transactionId) {
      setError('No transaction ID available');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getOutputApiResults({transactionId});
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch Output API');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    const timer = setTimeout(fetchResults, 800);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  const appStatus = result?.result?.status ?? 'unknown';
  const statusCfg = STATUS_CONFIG[appStatus] ?? DEFAULT_STATUS;

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Calling Output API...</Text>
        </View>
      )}

      {!loading && error && (
        <>
          <View style={[styles.card, {borderColor: '#742a2a'}]}>
            <Text style={[styles.cardTitle, {color: COLORS.error}]}>⚠️ Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </>
      )}

      {!loading && result && (
        <>
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
              <Text style={styles.statusRaw}>Output API result</Text>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            <DetailRow
              label="Transaction ID"
              value={result.result?.transactionId ?? transactionId}
              mono
            />
            <DetailRow label="Application Status" value={appStatus} />
          </View>

          {/* Debug Info */}
          {result.result?.debugInfo &&
            Object.keys(result.result.debugInfo).length > 0 && (
              <CopyableJsonCard
                title="Debug Info"
                data={result.result.debugInfo}
              />
            )}

          {/* Review Details */}
          {result.result?.reviewDetails &&
            Object.keys(result.result.reviewDetails).length > 0 && (
              <CopyableJsonCard
                title="Review Details"
                data={result.result.reviewDetails}
              />
            )}

          {/* User Details */}
          {result.result?.userDetails &&
            Object.keys(result.result.userDetails).length > 0 && (
              <CopyableJsonCard
                title="User Details"
                data={result.result.userDetails}
              />
            )}

          {/* Raw Response */}
          <CopyableJsonCard title="Raw Output API Response" data={result} />

          <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
            <Text style={styles.retryButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// ─── Tab 2: Logs API ─────────────────────────────────────────────────────────

const WebhooksTab: React.FC<{transactionId: string}> = ({transactionId}) => {
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(true);
  const [webhookResult, setWebhookResult] =
    useState<WebhookQueryResponse | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsResult, setLogsResult] = useState<LogsApiResponse | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const webhookReceived =
    webhookResult?.success === true && !!webhookResult.data;

  const checkWebhook = useCallback(async () => {
    if (!transactionId) return;
    setIsLoadingWebhook(true);
    setWebhookError(null);
    try {
      const data = await ApiService.getWebhookResults(transactionId);
      setWebhookResult(data);
    } catch (err: any) {
      setWebhookError(err.message ?? 'Network error');
    } finally {
      setIsLoadingWebhook(false);
    }
  }, [transactionId]);

  useEffect(() => {
    const timer = setTimeout(checkWebhook, 600);
    return () => clearTimeout(timer);
  }, [checkWebhook]);

  const callLogsApi = async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await ApiService.getLogsApiResults({transactionId});
      setLogsResult(data);
    } catch (err: any) {
      setLogsError(err.message ?? 'Failed to call Logs API');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const logsAppStatus =
    logsResult?.result?.applicationStatus ?? 'unknown';
  const logsStatusCfg = STATUS_CONFIG[logsAppStatus] ?? DEFAULT_STATUS;

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}>

      {/* Webhook Listener Card */}
      <View
        style={[
          styles.card,
          {
            borderColor: webhookReceived
              ? COLORS.success
              : COLORS.warning,
          },
        ]}>
        <View style={styles.webhookHeaderRow}>
          <View style={styles.webhookDotRow}>
            <View
              style={[
                styles.webhookDot,
                {
                  backgroundColor: webhookReceived
                    ? COLORS.success
                    : COLORS.warning,
                },
              ]}
            />
            <Text style={styles.cardTitle}>Webhook Listener</Text>
          </View>
          {!isLoadingWebhook && (
            <TouchableOpacity
              onPress={checkWebhook}
              style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>🔄</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoadingWebhook ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.loadingText}>
              {' '}Checking for webhook event...
            </Text>
          </View>
        ) : webhookReceived ? (
          <>
            <Text
              style={[
                styles.cardTitle,
                {color: COLORS.success, marginBottom: 8},
              ]}>
              ✅ Event received
            </Text>
            <DetailRow
              label="Transaction ID"
              value={webhookResult!.data!.transactionId}
              mono
            />
            <DetailRow
              label="Status"
              value={webhookResult!.data!.applicationStatus ?? '—'}
            />
            {webhookResult!.data!.eventTime && (
              <DetailRow
                label="Event Time"
                value={webhookResult!.data!.eventTime!}
              />
            )}
            {webhookResult!.data!.receivedAt && (
              <DetailRow
                label="Received At"
                value={webhookResult!.data!.receivedAt!}
              />
            )}
            {webhookResult!.data!.webhookRaw && (
              <CopyableJsonCard
                title="Raw Webhook Payload"
                data={webhookResult!.data!.webhookRaw}
              />
            )}
          </>
        ) : webhookError ? (
          <>
            <Text style={styles.errorText}>⚠️ {webhookError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, {marginTop: 10}]}
              onPress={checkWebhook}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.waitingText}>
              ⏳  Waiting for finish_transaction webhook...
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, {marginTop: 10}]}
              onPress={checkWebhook}>
              <Text style={styles.retryButtonText}>Check Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Call Logs API Button */}
      <TouchableOpacity
        style={[
          styles.callApiButton,
          (!webhookReceived || isLoadingLogs) &&
            styles.callApiButtonDisabled,
        ]}
        onPress={callLogsApi}
        disabled={!webhookReceived || isLoadingLogs}>
        {isLoadingLogs ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.callApiButtonText}>
              {' '}Calling Logs API...
            </Text>
          </View>
        ) : (
          <Text style={styles.callApiButtonText}>
            {webhookReceived
              ? '📋  Call Logs API'
              : '📋  Logs API (waiting for webhook)'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Logs error */}
      {logsError && (
        <View style={[styles.card, {borderColor: '#742a2a'}]}>
          <Text style={[styles.cardTitle, {color: COLORS.error}]}>
            Logs API Error
          </Text>
          <Text style={styles.errorText}>{logsError}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {marginTop: 10}]}
            onPress={callLogsApi}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logs result */}
      {logsResult?.result && (
        <>
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: logsStatusCfg.bg,
                borderColor: logsStatusCfg.color,
              },
            ]}>
            <Text style={styles.statusEmoji}>{logsStatusCfg.emoji}</Text>
            <View style={styles.statusTextBlock}>
              <Text
                style={[
                  styles.statusLabel,
                  {color: logsStatusCfg.color},
                ]}>
                {logsStatusCfg.label}
              </Text>
              <Text style={styles.statusRaw}>Logs API result</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logs API Summary</Text>
            <DetailRow
              label="Transaction ID"
              value={logsResult.result.transactionId ?? transactionId}
              mono
            />
            <DetailRow
              label="Application Status"
              value={logsResult.result.applicationStatus ?? '—'}
            />
            <DetailRow
              label="Modules"
              value={`${logsResult.result.results?.length ?? 0} module(s)`}
            />
          </View>

          {logsResult.result.results?.map((module, i) => {
            const moduleName =
              (module.moduleId as string) ??
              (module.moduleName as string) ??
              `Module ${i + 1}`;
            return (
              <CopyableJsonCard key={i} title={moduleName} data={module} />
            );
          })}

          <CopyableJsonCard
            title="Raw Logs API Response"
            data={logsResult}
          />
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
  // New Flow button
  newFlowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2d3151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  newFlowBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  // Webhook Listener
  webhookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  webhookDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webhookDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  refreshBtn: {
    padding: 4,
  },
  refreshBtnText: {
    fontSize: 18,
  },
  waitingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
});
