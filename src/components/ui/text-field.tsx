import { useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: LucideIcon;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  hint,
  error,
  icon: Icon,
  containerStyle,
  secureTextEntry,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.accent
      : theme.colors.controlBorder;

  return (
    <View style={[{ gap: theme.spacing.sm }, containerStyle]}>
      {label ? (
        <AppText variant="label" color={theme.colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          height: 58,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radii.md,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: theme.colors.surface,
        }}>
        {Icon ? (
          <Icon
            color={focused ? theme.colors.accent : theme.colors.textMuted}
            size={19}
            strokeWidth={1.9}
          />
        ) : null}
        <TextInput
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secureTextEntry && !revealed}
          selectionColor={theme.colors.accent}
          underlineColorAndroid="transparent"
          style={[
            {
              flex: 1,
              height: '100%',
              paddingVertical: 0,
              fontFamily: theme.fonts.regular,
              fontSize: 15.5,
              color: theme.colors.text,
            },
            style,
          ]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setRevealed((value) => !value)}>
            {revealed ? (
              <EyeOff color={theme.colors.textMuted} size={19} strokeWidth={1.9} />
            ) : (
              <Eye color={theme.colors.textMuted} size={19} strokeWidth={1.9} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={theme.colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
