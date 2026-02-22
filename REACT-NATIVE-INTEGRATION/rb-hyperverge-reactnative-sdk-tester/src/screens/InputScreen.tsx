import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  NativeModules,
  Platform,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchImageLibrary} from 'react-native-image-picker';
import {removeAllEventListeners} from 'react-native-hyperkyc-sdk';
import ApiConfig from '../config/ApiConfig';
import ApiService from '../api/ApiService';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  Input: undefined;
  Results: {sdkResponse: any; transactionId: string};
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;

interface WorkflowInput {
  id: string;
  key: string;
  value: string;
  isFileInput: boolean;
  fileName?: string;
}

interface Props {
  navigation: NavigationProp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9);

const COLORS = {
  background: '#0f1117',
  card: '#1a1d2e',
  cardBorder: '#2d3151',
  accent: '#6c63ff',
  accentDark: '#4d44cc',
  success: '#48bb78',
  error: '#fc8181',
  warning: '#f6ad55',
  textPrimary: '#f0f4ff',
  textSecondary: '#8892b0',
  inputBg: '#0d1117',
  inputBorder: '#2d3748',
  devColor: '#63b3ed',
  prodColor: '#68d391',
};

// ─── Component ────────────────────────────────────────────────────────────────

const InputScreen: React.FC<Props> = ({navigation}) => {
  // Environment
  const [isProduction, setIsProduction] = useState(true);
  const [isCheckingEnv, setIsCheckingEnv] = useState(false);
  const [envStatus, setEnvStatus] = useState<'online' | 'offline' | 'unknown'>(
    'unknown',
  );

  // Core config (used in dynamic mode; kept in state so they persist)
  const [appId, setAppId] = useState('');
  const [appKey, setAppKey] = useState('');
  const [workflowId, setWorkflowId] = useState('');

  // Manual name (default/simple mode only)
  const [manualName, setManualName] = useState('');

  // Mode
  const [isDynamicMode, setIsDynamicMode] = useState(false);

  // Workflow inputs (dynamic mode)
  const [workflowInputs, setWorkflowInputs] = useState<WorkflowInput[]>([
    {id: generateId(), key: '', value: '', isFileInput: false},
  ]);

  // Loading states
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // ── Environment ──────────────────────────────────────────────────────────

  const handleEnvironmentToggle = useCallback(async (toProd: boolean) => {
    const config = ApiConfig.getInstance();
    if (toProd) {
      config.switchToProduction();
    } else {
      config.switchToDevelopment();
    }
    setIsProduction(toProd);
    setIsCheckingEnv(true);
    setEnvStatus('unknown');

    const healthy = await ApiService.checkHealth();
    setEnvStatus(healthy ? 'online' : 'offline');
    setIsCheckingEnv(false);

    if (!healthy) {
      Alert.alert(
        'Backend Unreachable',
        `Cannot reach the ${
          toProd ? 'Production' : 'Development'
        } backend.\nURL: ${config.baseUrl}`,
        [{text: 'OK'}],
      );
    }
  }, []);

  // ── Workflow Inputs ───────────────────────────────────────────────────────

  const addWorkflowInput = () => {
    setWorkflowInputs(prev => [
      ...prev,
      {id: generateId(), key: '', value: '', isFileInput: false},
    ]);
  };

  const removeWorkflowInput = (id: string) => {
    setWorkflowInputs(prev => prev.filter(w => w.id !== id));
  };

  const updateInputKey = (id: string, key: string) => {
    setWorkflowInputs(prev => prev.map(w => (w.id === id ? {...w, key} : w)));
  };

  const updateInputValue = (id: string, value: string) => {
    setWorkflowInputs(prev => prev.map(w => (w.id === id ? {...w, value} : w)));
  };

  const toggleFileMode = (id: string) => {
    setWorkflowInputs(prev =>
      prev.map(w =>
        w.id === id
          ? {...w, isFileInput: !w.isFileInput, value: '', fileName: undefined}
          : w,
      ),
    );
  };

  const pickImage = async (id: string) => {
    launchImageLibrary({mediaType: 'mixed', quality: 1}, response => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setWorkflowInputs(prev =>
          prev.map(w =>
            w.id === id
              ? {
                  ...w,
                  value: asset.uri ?? '',
                  fileName: asset.fileName ?? 'image',
                }
              : w,
          ),
        );
      }
    });
  };

  // ── SDK Launch ────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    // Validate Dynamic mode credentials
    if (isDynamicMode) {
      if (!appId.trim()) {
        Alert.alert('Missing Config', 'Please enter your App ID');
        return;
      }
      if (!appKey.trim()) {
        Alert.alert('Missing Config', 'Please enter your App Key');
        return;
      }
      if (!workflowId.trim()) {
        Alert.alert('Missing Config', 'Please enter your Workflow ID');
        return;
      }
    }

    // Generate transaction ID — format matches Android: txn_<timestamp>_<random8>
    const txnTimestamp = Date.now();
    const txnRandom = Math.random().toString(36).substr(2, 8);
    const generatedTransactionId = `txn_${txnTimestamp}_${txnRandom}`;

    // Step 1: Fetch access token
    setIsFetchingToken(true);
    let tokenData;
    try {
      tokenData = await ApiService.generateToken(
        isDynamicMode
          ? {
              mode: 'dynamic',
              transactionId: generatedTransactionId,
              appId: appId.trim(),
              appKey: appKey.trim(),
              workflowId: workflowId.trim(),
            }
          : {
              mode: 'default',
              transactionId: generatedTransactionId,
            },
      );
    } catch (err: any) {
      setIsFetchingToken(false);
      Alert.alert('Token Error', `Failed to generate token:\n${err.message}`);
      return;
    }
    setIsFetchingToken(false);

    if (!tokenData.success || !tokenData.accessToken) {
      Alert.alert(
        'Token Error',
        tokenData.error ||
          tokenData.message ||
          'Could not get access token from backend',
      );
      return;
    }

    // Use values returned by the backend (workflowId may differ from input)
    const accessToken = tokenData.accessToken;
    const finalTransactionId = tokenData.transactionId ?? generatedTransactionId;
    const finalWorkflowId = tokenData.workflowId ?? (isDynamicMode ? workflowId.trim() : '');

    // Step 2: Build SDK config dictionary
    const configDictionary: Record<string, any> = {
      accessToken,
      workflowId: finalWorkflowId,
      transactionId: finalTransactionId,
      defaultLangCode: 'en',
    };

    // Step 3: Build inputs
    // Default mode → MANUALNAME (mirrors Android exactly)
    // Dynamic mode → custom key-value pairs from UI
    const inputsObj: Record<string, string> = {};

    if (!isDynamicMode && manualName.trim()) {
      inputsObj.MANUALNAME = manualName.trim();
    }

    if (isDynamicMode) {
      workflowInputs.forEach(w => {
        if (w.key.trim() && w.value.trim()) {
          inputsObj[w.key.trim()] = w.value.trim();
        }
      });
    }

    if (Object.keys(inputsObj).length > 0) {
      configDictionary.inputs = inputsObj;
    }

    // Step 3: Launch SDK
    const {Hyperkyc} = NativeModules;
    if (!Hyperkyc) {
      Alert.alert(
        'SDK Not Found',
        'react-native-hyperkyc-sdk native module not found. Make sure you have run a native build.',
      );
      return;
    }

    setIsLaunching(true);
    try {
      Hyperkyc.launch(configDictionary, (response: any) => {
        setIsLaunching(false);
        // Clean up event listeners (matches sample project pattern)
        removeAllEventListeners();
        // Navigate to results dashboard
        navigation.navigate('Results', {
          sdkResponse: response,
          transactionId: finalTransactionId,
        });
      });
    } catch (err: any) {
      setIsLaunching(false);
      Alert.alert('Launch Error', `Failed to launch SDK:\n${err.message}`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isLoading = isFetchingToken || isLaunching;
  const envColor = isProduction ? COLORS.prodColor : COLORS.devColor;

  const loadingLabel = isFetchingToken
    ? 'Getting Access Token...'
    : isLaunching
    ? 'Launching SDK...'
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ─ Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🔐</Text>
          <Text style={styles.headerTitle}>
            RB-HYPERVERGE{'\n'}RN-SDK-TESTER
          </Text>
          <Text style={styles.headerSubtitle}>React Native Integration</Text>
        </View>

        {/* ─ Environment Toggle ────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ENVIRONMENT</Text>
          <View style={styles.envRow}>
            <View style={styles.envInfo}>
              <Text style={[styles.envName, {color: envColor}]}>
                {isProduction ? '🌐 Production' : '🛠  Development'}
              </Text>
              <Text style={styles.envUrl} numberOfLines={1}>
                {ApiConfig.getInstance().baseUrl}
              </Text>
            </View>
            <View style={styles.envControls}>
              {isCheckingEnv ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.accent}
                  style={{marginRight: 8}}
                />
              ) : (
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        envStatus === 'online'
                          ? COLORS.success
                          : envStatus === 'offline'
                          ? COLORS.error
                          : '#718096',
                    },
                  ]}
                />
              )}
              <Switch
                value={isProduction}
                onValueChange={handleEnvironmentToggle}
                trackColor={{false: COLORS.devColor, true: COLORS.prodColor}}
                thumbColor="#fff"
              />
            </View>
          </View>
          <Text style={styles.envHint}>
            {isProduction
              ? 'Vercel Prod Backend'
              : 'Local Backend (192.168.0.105:3000)'}
          </Text>
        </View>

        {/* ─ Mode Toggle ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LAUNCH MODE</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                !isDynamicMode && styles.modeButtonActive,
              ]}
              onPress={() => setIsDynamicMode(false)}>
              <Text
                style={[
                  styles.modeButtonText,
                  !isDynamicMode && styles.modeButtonTextActive,
                ]}>
                Simple
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                isDynamicMode && styles.modeButtonActive,
              ]}
              onPress={() => setIsDynamicMode(true)}>
              <Text
                style={[
                  styles.modeButtonText,
                  isDynamicMode && styles.modeButtonTextActive,
                ]}>
                Dynamic
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modeHint}>
            {isDynamicMode
              ? 'Dynamic: supply your own App ID, App Key & Workflow ID'
              : 'Default: uses server credentials — just enter your name and launch'}
          </Text>
        </View>

        {/* ─ Manual Name (Simple / Default mode) ──────────── */}
        {!isDynamicMode && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MANUAL NAME</Text>
            <TextInput
              style={styles.input}
              value={manualName}
              onChangeText={setManualName}
              placeholder="Enter your name (passed as workflow input)"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Text style={styles.envHint}>
              Credentials are handled by the backend automatically
            </Text>
          </View>
        )}

        {/* ─ App ID / App Key / Workflow ID (Dynamic mode) ─── */}
        {isDynamicMode && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>APP ID</Text>
              <TextInput
                style={styles.input}
                value={appId}
                onChangeText={setAppId}
                placeholder="Enter your HyperVerge App ID"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>APP KEY</Text>
              <TextInput
                style={styles.input}
                value={appKey}
                onChangeText={setAppKey}
                placeholder="Enter your HyperVerge App Key (optional)"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={true}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>WORKFLOW ID</Text>
              <TextInput
                style={styles.input}
                value={workflowId}
                onChangeText={setWorkflowId}
                placeholder="Enter workflow ID from HV Dashboard"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </>
        )}

        {/* ─ Workflow Inputs (Dynamic mode) ────────────────── */}
        {isDynamicMode && (
          <View style={styles.card}>
            <View style={styles.dynamicHeader}>
              <Text style={styles.cardLabel}>WORKFLOW INPUTS</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addWorkflowInput}>
                <Text style={styles.addButtonText}>+ Add Input</Text>
              </TouchableOpacity>
            </View>

            {workflowInputs.map((input, index) => (
              <View key={input.id} style={styles.inputRow}>
                {/* Row header */}
                <View style={styles.inputRowHeader}>
                  <Text style={styles.inputRowLabel}>Input #{index + 1}</Text>
                  <View style={styles.inputRowActions}>
                    <TouchableOpacity
                      style={styles.toggleFileBtn}
                      onPress={() => toggleFileMode(input.id)}>
                      <Text style={styles.toggleFileBtnText}>
                        {input.isFileInput ? '⌨️ Text' : '📎 File'}
                      </Text>
                    </TouchableOpacity>
                    {workflowInputs.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeWorkflowInput(input.id)}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Key field */}
                <TextInput
                  style={styles.input}
                  value={input.key}
                  onChangeText={v => updateInputKey(input.id, v)}
                  placeholder="Key"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {/* Value: text or file picker */}
                {input.isFileInput ? (
                  <View style={styles.filePickerRow}>
                    {input.fileName ? (
                      <View style={styles.fileChip}>
                        <Text style={styles.fileChipText} numberOfLines={1}>
                          📄 {input.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noFileText}>No file selected</Text>
                    )}
                    <View style={styles.fileButtons}>
                      <TouchableOpacity
                        style={[styles.fileBtn, styles.fileBtnImage]}
                        onPress={() => pickImage(input.id)}>
                        <Text style={styles.fileBtnText}>📷 Pick Image / File</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={input.value}
                    onChangeText={v => updateInputValue(input.id, v)}
                    placeholder="Value"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─ Launch Button ─────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.launchButton,
            isLoading && styles.launchButtonDisabled,
          ]}
          onPress={handleLaunch}
          disabled={isLoading}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.launchButtonTextLoading}>{loadingLabel}</Text>
            </View>
          ) : (
            <Text style={styles.launchButtonText}>
              🚀 Launch HyperVerge SDK
            </Text>
          )}
        </TouchableOpacity>

        {/* ─ Info card ─────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {
              'ℹ️  Token is generated from the backend automatically.\nResults will appear in the 3-tab dashboard after SDK completes.'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InputScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  // Environment card
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envInfo: {
    flex: 1,
    marginRight: 12,
  },
  envName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  envUrl: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  envControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  envHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  // Inputs
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  // Mode toggle
  modeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.accent,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  modeHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  // Dynamic inputs
  dynamicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  inputRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inputRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleFileBtn: {
    backgroundColor: '#2d3748',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleFileBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  removeBtn: {
    backgroundColor: '#742a2a',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fc8181',
    fontSize: 13,
    fontWeight: '700',
  },
  filePickerRow: {
    flexDirection: 'column',
    gap: 8,
  },
  fileChip: {
    backgroundColor: '#2d3748',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  fileChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  noFileText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    paddingVertical: 6,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fileBtn: {
    flex: 1,
    backgroundColor: '#2c5282',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  fileBtnImage: {
    backgroundColor: '#276749',
  },
  fileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Launch button
  launchButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 8,
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  launchButtonDisabled: {
    backgroundColor: '#4a5568',
    shadowOpacity: 0,
    elevation: 0,
  },
  launchButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  launchButtonTextLoading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Info card
  infoCard: {
    backgroundColor: '#1a2942',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#2c4a72',
  },
  infoText: {
    color: '#90cdf4',
    fontSize: 12,
    lineHeight: 18,
  },
  credWarning: {
    color: COLORS.warning,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
});
