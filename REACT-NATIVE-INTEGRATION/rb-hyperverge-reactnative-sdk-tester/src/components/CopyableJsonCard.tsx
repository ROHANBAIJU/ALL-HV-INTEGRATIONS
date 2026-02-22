import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Platform,
} from 'react-native';

interface CopyableJsonCardProps {
  title: string;
  data: any;
}

const CopyableJsonCard: React.FC<CopyableJsonCardProps> = ({title, data}) => {
  const [copied, setCopied] = useState(false);

  const prettyJson = (() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  })();

  const handleCopy = () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Clipboard.setString(prettyJson);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>
            {copied ? '✅ Copied' : '📋 Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.jsonScrollView}
        nestedScrollEnabled
        showsVerticalScrollIndicator>
        <Text style={styles.jsonText}>{prettyJson}</Text>
      </ScrollView>
    </View>
  );
};

export default CopyableJsonCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d5e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#a0aec0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyButton: {
    backgroundColor: '#2d3748',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  copyButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  jsonScrollView: {
    maxHeight: 240,
  },
  jsonText: {
    color: '#68d391',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },
});
