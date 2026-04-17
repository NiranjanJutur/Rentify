export const theme = {
  colors: {
    primary: '#00236f',
    primaryContainer: '#1e3a8a',
    onPrimary: '#ffffff',
    secondary: '#006c49',
    background: '#f8f9fb',
    surface: '#f8f9fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f3f4f6',
    surfaceContainer: '#edeef0',
    surfaceContainerHigh: '#e7e8ea',
    onSurface: '#191c1e',
    onSurfaceVariant: '#444651',
    outlineVariant: '#c5c5d3',
    // Status badges
    occupiedBg: '#dce1ff', // primary_fixed
    occupiedText: '#00164e', // on_primary_fixed
    vacantBg: '#6ffbbe', // secondary_fixed
    vacantText: '#002113', // on_secondary_fixed
    pendingBg: '#ffdbcb', // tertiary_fixed
    pendingText: '#341100', // on_tertiary_fixed
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
    // Tonal Layering, no box shadows unless floating
    floating: {
      shadowColor: '#191c1e',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.06,
      shadowRadius: 32,
      elevation: 5,
    }
  }
};
