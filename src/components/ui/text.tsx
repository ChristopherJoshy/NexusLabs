import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type Theme } from '@/theme';

type Variant = keyof Theme['type'];

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.35}
      {...rest}
      style={[
        theme.type[variant],
        { color: color ?? theme.colors.text },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
