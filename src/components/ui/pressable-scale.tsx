import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

/** Pressable with a subtle press-down state used across cards and buttons. */
export function PressableScale({ style, disabled, ...props }: PressableScaleProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    />
  );
}
