import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface InviteCardProps {
  inviteCode: string;
  onCopy: () => void;
  onShare: () => void;
}

export function InviteCard({ inviteCode, onCopy, onShare }: InviteCardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Invite Code</Text>
      <Text style={styles.code}>{inviteCode}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>
            {copied ? 'Copied!' : 'Copy Link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0dcf0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1a1a2e',
    letterSpacing: 4,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a90d9',
  },
  shareButtonText: {
    color: '#4a90d9',
    fontSize: 16,
    fontWeight: '600',
  },
});
