import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

interface RentifyButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const RentifyButton: React.FC<RentifyButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  disabled = false
}) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8} 
        disabled={disabled}
        style={[styles.container, style, disabled && { opacity: 0.6 }]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.primaryText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const isGlass = variant === 'glass';

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7} 
      disabled={disabled}
      style={[
        styles.secondaryContainer, 
        isGlass && styles.glassContainer,
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <Text style={styles.secondaryText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.onPrimary,
    fontSize: 16,
    letterSpacing: 0,
  },
  secondaryContainer: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerHigh + '66', // 40% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest + 'CC', // 80% opacity
  },
  secondaryText: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.primary,
    fontSize: 15,
    letterSpacing: 0,
  },
});
