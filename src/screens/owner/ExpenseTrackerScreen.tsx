import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { expenseService } from '../../services/dataService';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';

const expenseCategories = ['Electricity', 'Water', 'Maintenance', 'Cleaning', 'Supplies', 'Salary'];
const expenseTypes = ['one_time', 'recurring', 'petty_cash'] as const;

type ExpenseRecord = {
  id: string;
  category: string;
  description?: string;
  amount: number;
  expense_type?: string;
  status?: string;
  due_date?: string;
  created_at?: string;
};

export const ExpenseTrackerScreen = () => {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('Electricity');
  const [expenseType, setExpenseType] = useState<(typeof expenseTypes)[number]>('petty_cash');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await expenseService.getAll();
      setExpenses(data || []);
    } catch (err: any) {
      setMessage(err.message || 'Could not load expense records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const summary = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const recurring = expenses.filter(item => item.expense_type === 'recurring').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const petty = expenses.filter(item => item.expense_type === 'petty_cash').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { totalExpenses, recurring, petty };
  }, [expenses]);

  const handleRecordExpense = async () => {
    if (!amount.trim()) {
      setMessage('Please enter the expense amount.');
      return;
    }

    try {
      const propertyId = await requirePrimaryPropertyId();
      await expenseService.create({
        property_id: propertyId,
        category,
        description: description.trim() || category,
        amount: Number(amount) || 0,
        expense_type: expenseType,
        due_date: new Date().toISOString().split('T')[0],
      });
      setAmount('');
      setDescription('');
      setMessage('Expense recorded successfully.');
      fetchExpenses();
    } catch (err: any) {
      setMessage(err.message || 'Could not record the expense.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Financial Command</Text>
            <Text style={styles.title}>Expense Tracker</Text>
          </View>
        </View>

        <TonalCard level="lowest" style={styles.heroCard}>
          <Text style={styles.overviewLabel}>TOTAL EXPENSES</Text>
          <Text style={styles.heroAmount}>Rs {summary.totalExpenses.toLocaleString('en-IN')}</Text>
          <View style={styles.heroStatsGrid}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Recurring</Text>
              <Text style={styles.statValue}>Rs {summary.recurring.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Petty Cash</Text>
              <Text style={styles.statValue}>Rs {summary.petty.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </TonalCard>

        <TonalCard level="lowest" style={styles.formCard}>
          <Text style={styles.sectionTitle}>Record New Expense</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {expenseCategories.map(option => (
              <TouchableOpacity key={option} onPress={() => setCategory(option)} style={[styles.chip, category === option && styles.chipActive]}>
                <Text style={[styles.chipText, category === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Expense Type</Text>
          <View style={styles.chipRow}>
            {expenseTypes.map(option => (
              <TouchableOpacity key={option} onPress={() => setExpenseType(option)} style={[styles.chip, expenseType === option && styles.chipActive]}>
                <Text style={[styles.chipText, expenseType === option && styles.chipTextActive]}>{option.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} placeholder="What is this expense for?" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={description} onChangeText={setDescription} />

          <Text style={styles.label}>Amount</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="numeric" value={amount} onChangeText={setAmount} />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <RentifyButton title="Record Expense" onPress={handleRecordExpense} />
        </TonalCard>

        <Text style={styles.sectionTitle}>Expense Ledger</Text>
        <TonalCard level="lowest" style={styles.ledgerCard}>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          ) : (
            expenses.map((item, index) => (
              <View key={item.id} style={[styles.ledgerItem, index !== 0 && styles.ledgerBorder]}>
                <View style={styles.ledgerInfo}>
                  <Text style={styles.ledgerEntity}>{item.description || item.category}</Text>
                  <Text style={styles.ledgerSubText}>
                    {item.category} / {item.expense_type || 'one_time'} / {new Date(item.created_at || item.due_date || new Date()).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.ledgerAction}>
                  <Text style={styles.ledgerAmount}>Rs {Math.abs(Number(item.amount || 0)).toLocaleString('en-IN')}</Text>
                  <Text style={styles.ledgerCat}>{item.status || 'pending'}</Text>
                </View>
              </View>
            ))
          )}
        </TonalCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.secondary, textTransform: 'uppercase' },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 30, color: theme.colors.onSurface },
  heroCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.lg },
  overviewLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  heroAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 42, color: theme.colors.primary, marginTop: 8 },
  heroStatsGrid: { flexDirection: 'row', marginTop: 30, gap: 12 },
  statBlock: { flex: 1, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, padding: theme.spacing.md },
  statLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  statValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface, marginTop: 4 },
  formCard: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  label: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surfaceContainerLow },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  chipTextActive: { color: theme.colors.onPrimary },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, paddingVertical: 14, marginBottom: theme.spacing.lg, fontFamily: theme.typography.body.fontFamily, color: theme.colors.onSurface },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
  ledgerCard: { padding: 0, overflow: 'hidden', marginTop: theme.spacing.md },
  ledgerItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18 },
  ledgerBorder: { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '55' },
  ledgerInfo: { flex: 1, paddingRight: theme.spacing.md },
  ledgerEntity: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  ledgerSubText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  ledgerAction: { alignItems: 'flex-end' },
  ledgerAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 15, color: theme.colors.danger },
  ledgerCat: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, textTransform: 'uppercase', color: theme.colors.onSurfaceVariant, marginTop: 4 },
  emptyText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, padding: theme.spacing.lg },
});
