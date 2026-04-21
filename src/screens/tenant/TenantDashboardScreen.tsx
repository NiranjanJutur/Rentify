import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { paymentService, noticeService } from '../../services/dataService';

type TenantDashboardScreenProps = {
  activeTenant?: any;
};

export default function TenantDashboardScreen({ activeTenant }: TenantDashboardScreenProps) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [dueMonth, setDueMonth] = useState('N/A');
  const [latestNotice, setLatestNotice] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [payments, notices] = await Promise.all([
        paymentService.getAll(),
        noticeService.getAll()
      ]);

      const myPayments = (payments || []).filter(p => p.tenant_id === activeTenant.id);
      const pendingPayment = myPayments.find(p => p.status === 'pending') || null;

      if (pendingPayment) {
        setBalance(pendingPayment.amount);
        setDueMonth(pendingPayment.month || 'Current');
      } else {
        setBalance(0);
        setDueMonth('No current dues');
      }

      setLatestNotice((notices || [])[0] || null);

    } catch (e) {
      console.log('Error fetching tenant dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const tenantName = activeTenant?.name || 'Resident';
  const tenantInitials = tenantName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const quickAccess = [
    {
      title: 'Meals',
      subtitle: 'Daily schedule',
      icon: 'restaurant-outline' as const,
      route: 'TenantMeal',
      tint: theme.colors.primary,
    },
    {
      title: 'Payments',
      subtitle: balance > 0 ? '1 due this month' : 'All clear',
      icon: 'wallet-outline' as const,
      route: 'TenantPayment',
      tint: theme.colors.secondary,
    },
    {
      title: 'Support',
      subtitle: 'Raise issues',
      icon: 'construct-outline' as const,
      route: 'TenantProfile',
      tint: '#ba1a1a',
    },
    {
      title: 'Profile',
      subtitle: `Room: ${activeTenant?.room || 'N/A'}`,
      icon: 'person-outline' as const,
      route: 'TenantProfile',
      tint: theme.colors.primaryContainer,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{tenantName}</Text>
          <Text style={styles.subline}>{activeTenant?.room || ''} {activeTenant?.block ? `- ${activeTenant.block}` : ''}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tenantInitials}</Text>
        </View>
      </View>

      <TonalCard level="lowest" style={styles.balanceCard}>
        {loading ? (
           <ActivityIndicator size="small" color={theme.colors.primary} style={{marginVertical: 20}} />
        ) : (
          <>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>Rs {balance.toLocaleString('en-IN')}</Text>

            <View style={styles.balanceMetaRow}>
              <Text style={styles.dueText}>{balance > 0 ? `Due for ${dueMonth}` : 'No upcoming dues'}</Text>
              <StatusBadge status={balance > 0 ? 'pending' : 'occupied'} label={balance > 0 ? 'Pending' : 'Cleared'} />
            </View>

            <RentifyButton 
              title={balance > 0 ? "Settle Balance" : "View Payment History"} 
              onPress={() => navigation.navigate('TenantPayment')} 
              style={styles.balanceBtn} 
              variant={balance > 0 ? 'primary' : 'secondary'}
            />
          </>
        )}
      </TonalCard>

      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.grid}>
        {quickAccess.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.tint + '1A' }]}>
              <Ionicons name={item.icon} size={20} color={item.tint} />
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
            <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {latestNotice && (
        <TonalCard level="low" style={styles.noticeCard} floating={false}>
          <View style={styles.noticeRow}>
            <Ionicons name={latestNotice.pinned ? "megaphone" : "notifications-outline"} size={18} color={theme.colors.primary} />
            <Text style={styles.noticeTitle}>{latestNotice.title}</Text>
          </View>
          <Text style={styles.noticeBody} numberOfLines={2}>{latestNotice.body}</Text>
        </TonalCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  name: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.primary,
    marginTop: 2,
  },
  subline: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  avatarText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  balanceCard: {
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 46,
    color: theme.colors.primary,
    marginTop: 6,
  },
  balanceMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  balanceBtn: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 21,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  gridSubtitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  noticeCard: {
    padding: theme.spacing.lg,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  noticeBody: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});
