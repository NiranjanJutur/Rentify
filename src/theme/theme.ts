export const theme = {
  colors: {
    primary: '#08256f',
    primaryContainer: '#12378f',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#eef3ff',
    
    secondary: '#0f8f62',
    secondaryContainer: '#dff7ee',
    onSecondaryContainer: '#0a4f38',

    background: '#f7f8fb',
    surface: '#f7f8fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f0f2f6',
    surfaceContainer: '#e8ebf1',
    surfaceContainerHigh: '#dfe4ec',
    onSurface: '#161a23',
    onSurfaceVariant: '#59606d',
    outlineVariant: '#d9dee8',
    
    danger: '#b42318',
    warning: '#b56a00',
    mint: '#35e6a3',

    // Status / Sentiment colors
    occupiedBg: '#e8eeff',
    occupiedText: '#08256f',
    vacantBg: '#dffbea',
    vacantText: '#075b3d',
    pendingBg: '#fff0d6',
    pendingText: '#8a4b00',
    
    // Explicitly adding containers for UI clarity
    errorContainer: '#fee4e2',
    successContainer: '#dff7ee',
  },
  typography: {
    headline: { fontFamily: 'Manrope' },
    body: { fontFamily: 'Inter' },
    label: { fontFamily: 'Inter-SemiBold' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  elevation: {
    floating: {
      shadowColor: '#16213a',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 24,
      elevation: 4,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    },
    high: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    }
  }
} as const;

export type AppTheme = typeof theme;
