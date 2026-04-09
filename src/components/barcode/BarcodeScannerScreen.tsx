import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodStore } from '../../stores/foodStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import type { FoodItem } from '../../types/food';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_WIDTH * 0.7;
const FRAME_TOP = SCREEN_HEIGHT * 0.3;

interface BarcodeScannerScreenProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (food: FoodItem) => void;
  onNotFound: (barcode: string) => void;
}

export function BarcodeScannerScreen({
  visible,
  onClose,
  onProductFound,
  onNotFound,
}: BarcodeScannerScreenProps) {
  const insets = useSafeAreaInsets();
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');

  const {
    scanLoading,
    scannedProduct,
    scanNotFound,
    scanError,
    lookupBarcode,
    clearScan,
  } = useFoodStore();

  // Reset state when visibility changes to false
  useEffect(() => {
    if (!visible) {
      clearScan();
      lastScannedRef.current = '';
      lastScannedTimeRef.current = 0;
      lastBarcodeRef.current = '';
    }
  }, [visible, clearScan]);

  // Handle product found
  useEffect(() => {
    if (scannedProduct) {
      onProductFound(scannedProduct);
    }
  }, [scannedProduct, onProductFound]);

  // Handle not found
  useEffect(() => {
    if (scanNotFound && lastBarcodeRef.current) {
      onNotFound(lastBarcodeRef.current);
    }
  }, [scanNotFound, onNotFound]);

  const handleBarcodeScanned = useCallback(
    (scanResult: { data: string; type: string }) => {
      const { data: barcode } = scanResult;
      const now = Date.now();

      // Throttle: ignore if same barcode scanned within 3 seconds
      if (
        barcode === lastScannedRef.current &&
        now - lastScannedTimeRef.current < 3000
      ) {
        return;
      }

      // Don't scan while a lookup is in progress
      if (useFoodStore.getState().scanLoading) {
        return;
      }

      lastScannedRef.current = barcode;
      lastScannedTimeRef.current = now;
      lastBarcodeRef.current = barcode;

      lookupBarcode(barcode);
    },
    [lookupBarcode]
  );

  const handleTryAgain = useCallback(() => {
    clearScan();
    lastScannedRef.current = '';
    lastScannedTimeRef.current = 0;
  }, [clearScan]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Semi-transparent overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top mask */}
        <View style={[styles.mask, { height: FRAME_TOP }]} />

        {/* Middle row with side masks and transparent frame */}
        <View style={styles.middleRow}>
          <View style={[styles.mask, { width: (SCREEN_WIDTH - FRAME_SIZE) / 2 }]} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={[styles.mask, { width: (SCREEN_WIDTH - FRAME_SIZE) / 2 }]} />
        </View>

        {/* Bottom mask */}
        <View style={[styles.mask, { flex: 1 }]} />
      </View>

      {/* Instruction text above the frame */}
      <View style={[styles.instructionContainer, { top: FRAME_TOP - 48 }]}>
        <Text style={styles.instructionText}>Point camera at barcode</Text>
      </View>

      {/* Close button */}
      <Pressable
        style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        onPress={onClose}
        accessibilityLabel="Close barcode scanner"
        accessibilityRole="button"
        testID="barcode-scanner-close"
      >
        <MaterialCommunityIcons name="close" size={28} color="#ffffff" />
      </Pressable>

      {/* Loading overlay */}
      {scanLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        </View>
      )}

      {/* Error overlay */}
      {scanError && (
        <View style={styles.loadingOverlay}>
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={40}
              color={colors.error}
            />
            <Text style={styles.errorText}>{scanError}</Text>
            <Pressable
              style={styles.tryAgainButton}
              onPress={handleTryAgain}
              accessibilityLabel="Try scanning again"
              accessibilityRole="button"
              testID="barcode-scanner-try-again"
            >
              <Text style={styles.tryAgainText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#ffffff',
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#ffffff',
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#ffffff',
    borderBottomRightRadius: 4,
  },
  instructionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    ...typography.titleMd,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 200,
  },
  loadingText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.error,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  tryAgainText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
