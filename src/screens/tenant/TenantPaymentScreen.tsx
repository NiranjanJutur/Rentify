import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { paymentService } from '../../services/dataService';

type TenantPaymentScreenProps = {
  activeTenant?: any;
};

export default function TenantPaymentScreen({ activeTenant }: TenantPaymentScreenProps) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amountDue, setAmountDue] = useState(0);
  const [activeDuePayment, setActiveDuePayment] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const allPayments = await paymentService.getAll();
      const myPayments = (allPayments || []).filter(p => p.tenant_id === activeTenant.id);
      myPayments.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      setTransactions(myPayments);

      const due = myPayments.find(p => p.status === 'pending');
      if (due) {
        setAmountDue(due.amount);
        setActiveDuePayment(due);
      } else {
        setAmountDue(0);
        setActiveDuePayment(null);
      }
    } catch (e) {
      console.log('Error fetching tenant payments', e);
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handlePay = async () => {
    if (!activeDuePayment) return;
    
    Alert.alert(
      'Process Payment', 
      `Confirm payment of Rs ${amountDue.toLocaleString('en-IN')} for ${activeDuePayment.month || 'rent'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            try {
               await paymentService.markPaid(activeDuePayment.id, 'UPI');
               Alert.alert('Success', 'Payment processed successfully.');
               fetchData();
            } catch (e) {
               Alert.alert('Error', 'Payment failed.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>RENT AND DEPOSIT TRACKER</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginVertical: 30 }} />
      ) : (
        <>
          <TonalCard level="lowest" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Amount Due</Text>
            <Text style={styles.balanceValue}>Rs {amountDue.toLocaleString('en-IN')}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{amountDue > 0 ? `Due for ${activeDuePayment?.month || 'Current'}` : 'All dues cleared'}</Text>
              <StatusBadge status={amountDue > 0 ? 'pending' : 'occupied'} label={amountDue > 0 ? 'Pending' : 'Cleared'} />
            </View>

            {amountDue > 0 && (
              <RentifyButton title="Pay Now" onPress={handlePay} style={styles.payBtn} />
            )}
          </TonalCard>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.list}>
            {transactions.length === 0 ? (
              <Text style={{color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: 10}}>No transactions found.</Text>
            ) : (
              transactions.map((tx) => (
                <TonalCard key={tx.id} level="lowest" style={styles.txCard}>
                  <View style={styles.txTopRow}>
                    <View>
                      <Text style={styles.txTitle}>{tx.month ? `${tx.month} Rent` : 'Payment'}</Text>
                      <Text style={styles.txMeta}>{tx.id.substring(0,8)} - {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : ''}</Text>
                    </View>
                    <Text style={styles.txAmount}>Rs {Number(tx.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.txBottomRow}>
                    <Text style={styles.txMethod}>{tx.status === 'paid' ? 'UPI' : 'Not paid'}</Text>
                    <StatusBadge status={tx.status === 'paid' ? 'occupied' : 'pending'} label={tx.status === 'paid' ? 'Paid' : 'Pending'} />
                  </View>
                </TonalCard>
              ))
            )}
          </View>
        </>
      )}

      <TonalCard level="low" style={styles.tipCard} floating={false}>
        <View style={styles.tipRow}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.tipTitle}>Payment reminder</Text>
        </View>
        <Text style={styles.tipBody}>Pay before the due date to avoid late fees and keep your account in good standing.</Text>
      </TonalCard>
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
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 1.6,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  balanceCard: {
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: theme.colors.onSurfaceVariant,
  },
  balanceValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 44,
    color: theme.colors.primary,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  payBtn: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  list: {
    marginBottom: theme.spacing.xl,
  },
  txCard: {
    marginBottom: 10,
    padding: theme.spacing.md,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 15,
    color: theme.colors.onSurface,
    maxWidth: 210,
  },
  txMeta: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 3,
  },
  txAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 16,
    color: theme.colors.secondary,
    marginLeft: 8,
  },
  txBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txMethod: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  tipCard: {
    padding: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  tipBody: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});
