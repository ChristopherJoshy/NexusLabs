import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Shimmer } from './motion';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const [measuredWidth, setMeasuredWidth] = useState(typeof width === 'number' ? width : 0);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next > 0 && next !== measuredWidth) setMeasuredWidth(next);
      }}
      style={[{ width, height, borderRadius: radius, overflow: 'hidden' }, style]}>
      {measuredWidth > 0 ? (
        <Shimmer
          baseColor={theme.colors.skeleton}
          height={height}
          highlightColor={theme.colors.skeletonHighlight}
          radius={radius}
          width={measuredWidth}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius,
            backgroundColor: theme.colors.skeleton,
          }}
        />
      )}
    </View>
  );
}
