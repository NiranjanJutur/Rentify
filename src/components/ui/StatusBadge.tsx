import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export type StatusType = 'occupied' | 'vacant' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getStyles = () => {
    switch (status) {
      case 'occupied':
        return { bg: theme.colors.occupiedBg, text: theme.colors.occupiedText, defaultLabel: 'Occupied' };
      case 'vacant':
        return { bg: theme.colors.vacantBg, text: theme.colors.vacantText, defaultLabel: 'Vacant' };
      case 'pending':
        return { bg: theme.colors.pendingBg, text: theme.colors.pendingText, defaultLabel: 'Pending' };
      default:
        return { bg: theme.colors.surfaceContainerLow, text: theme.colors.onSurfaceVariant, defaultLabel: 'Unknown' };
    }
  };

  const config = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
