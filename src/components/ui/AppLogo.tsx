import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';

interface AppLogoProps {
  size?: number;
}

export function AppLogo({ size = 80 }: AppLogoProps) {
  const iconSize = Math.round(size * 0.6);
  const innerSize = size - 6;

  return (
    <View
      style={[
        styles.outerCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <View
        style={[
          styles.innerCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={iconSize}
          color={colors.onPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCircle: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
