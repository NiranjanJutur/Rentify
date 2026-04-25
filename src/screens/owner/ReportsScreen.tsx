import React, { useState, useEffect, useCallback } from 'react';
import { Alert, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { theme } from '../../theme/theme';
import { propertyService, paymentService, expenseService, tenantService, staffService, complaintService } from '../../services/dataService';

export const ReportsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    cashflow: 0,
    collectionRate: '0%',
    vacantCount: 0,
    openComplaints: 0,
    payrollForecast: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const props = await propertyService.getMyProperties();
      const currentProp = props?.[0];
      
      if (!currentProp) {
        setLoading(false);
        return;
      }
      
      const propId = currentProp.id;
      setActivePropertyId(propId);

      const [payments, expenses, tenants, staff, complaints] = await Promise.all([
        paymentService.getAll(propId),
        expenseService.getAll(propId),
        tenantService.getAll(propId),
        staffService.getAll(propId),
        complaintService.getAll(propId)
      ]);

      // Calculate Cashflow (Collected Payments - Expenses - Staff Salaries)
      const collected = (payments || []).filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
      const totalBilled = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;
      
      const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const payrollForecast = (staff || []).reduce((sum, s) => sum + Number(s.salary || 0), 0);
      
      const cashflow = collected - totalExpenses;

      // Vacancies
      const vacantCount = (tenants || []).filter(t => t.status === 'vacant').length;

      // Maintenance
      const openComplaints = (complaints || []).filter(c => c.status === 'open' || c.status === 'pending').length;

      setMetrics({
        cashflow,
        collectionRate: `${collectionRate}%`,
        vacantCount,
        openComplaints,
        payrollForecast
      });
    } catch (e) {
      console.log('Error fetching metrics', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const reportRows = [
    { label: 'Collection Rate', value: metrics.collectionRate, tone: theme.colors.secondary },
    { label: 'Vacant Rooms', value: metrics.vacantCount.toString(), tone: theme.colors.primary },
    { label: 'Open Maintenance', value: metrics.openComplaints.toString(), tone: theme.colors.warning },
    { label: 'Payroll Forecast', value: `Rs ${metrics.payrollForecast.toLocaleString('en-IN')}`, tone: theme.colors.primary },
  ];

  const handleShareReportPack = async () => {
    try {
      await Share.share({
        message: `Rentify report summary\nCashflow: Rs ${metrics.cashflow.toLocaleString('en-IN')}\nCollection Rate: ${metrics.collectionRate}\nVacant Rooms: ${metrics.vacantCount}\nOpen Maintenance: ${metrics.openComplaints}\nPayroll Forecast: Rs ${metrics.payrollForecast.toLocaleString('en-IN')}`,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Could Not Share', error.message || 'Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>ESTATE PERFORMANCE</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            <TonalCard level="low" style={styles.heroCard} floating={false}>
              <Text style={styles.heroLabel}>MONTHLY CASHFLOW</Text>
              <Text style={styles.heroValue}>Rs {metrics.cashflow.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroText}>Projected net performance across rent, expenses, payroll, and outstanding collections.</Text>
            </TonalCard>

            <View style={styles.grid}>
              {reportRows.map((item) => (
                <TonalCard key={item.label} level="lowest" style={styles.metricCard}>
                  <Text style={[styles.metricValue, { color: item.tone }]}>{item.value}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </TonalCard>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Report Pack</Text>
            {[
              ['Financial Statement', 'Rent, expenses, deposits, and payroll'],
              ['Occupancy Sheet', 'Room-wise tenant status and vacancies'],
              ['Maintenance Log', 'Tickets, assignments, and resolution time'],
            ].map(([title, body]) => (
              <TonalCard key={title} level="lowest" style={styles.rowCard}>
                <View style={styles.rowIcon}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.rowBody}>{body}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color={theme.colors.onSurfaceVariant} />
              </TonalCard>
            ))}

            <RentifyButton title="Share Report Summary" onPress={handleShareReportPack} style={styles.submit} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 30, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  heroCard: { backgroundColor: theme.colors.primary, marginBottom: theme.spacing.lg },
  heroLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.mint, textTransform: 'uppercase' },
  heroValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 40, color: theme.colors.onPrimary, marginTop: 10 },
  heroText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, lineHeight: 22, color: theme.colors.onPrimary, opacity: 0.78, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  metricCard: { width: '48%', padding: theme.spacing.md },
  metricValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24 },
  metricLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, marginBottom: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: theme.colors.occupiedBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  rowBody: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  submit: { marginTop: theme.spacing.lg },
});
