import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: string[];
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  snapPoints = ['50%'],
  children,
}: BottomSheetProps) {
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <GorhomBottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      style={styles.sheet}
    >
      <BottomSheetView style={styles.content}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  background: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  handle: {
    backgroundColor: colors.outlineVariant,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
