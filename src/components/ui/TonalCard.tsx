import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme/theme';

interface TonalCardProps {
  children: React.ReactNode;
  level?: 'lowest' | 'low' | 'medium';
  style?: StyleProp<ViewStyle>;
  floating?: boolean;
}

export const TonalCard: React.FC<TonalCardProps> = ({ 
  children, 
  level = 'lowest', 
  style, 
  floating = true 
}) => {
  const getBackgroundColor = () => {
    switch (level) {
      case 'lowest': return theme.colors.surfaceContainerLowest;
      case 'low': return theme.colors.surfaceContainerLow;
      case 'medium': return theme.colors.surfaceContainer;
      default: return theme.colors.surfaceContainerLowest;
    }
  };

  return (
    <View style={[
      styles.card, 
      { backgroundColor: getBackgroundColor() },
      floating && theme.elevation.floating,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: theme.spacing.lg,
  },
});
