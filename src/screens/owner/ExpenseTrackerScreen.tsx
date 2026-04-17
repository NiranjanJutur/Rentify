import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';

export const ExpenseTrackerScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Expense Tracker</Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Financial Overview Hero */}
        <TonalCard level="lowest" style={styles.heroCard}>
          <View>
            <Text style={styles.overviewLabel}>FINANCIAL OVERVIEW • OCT 2026</Text>
            <Text style={styles.heroAmount}>₹1,14,240.00</Text>
            <View style={styles.profitBadge}>
              <Ionicons name="trending-up" size={14} color={theme.colors.secondary} />
              <Text style={styles.profitText}>Net Profit this month</Text>
            </View>
          </View>

          <View style={styles.heroStatsGrid}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>TOTAL INCOME</Text>
              <Text style={styles.statValue}>₹1,48,500</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>TOTAL EXPENSES</Text>
              <Text style={[styles.statValue, { color: '#ba1a1a' }]}>₹34,260</Text>
            </View>
          </View>
        </TonalCard>

        {/* Quick Petty Cash */}
        <TonalCard level="low" style={styles.pettyCashCard} floating={false}>
          <Text style={styles.cardTitle}>Quick Petty Cash</Text>
          <Text style={styles.cardSubtitle}>Log immediate minor expenses</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <Text style={styles.inputValue}>Cleaning Supplies</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>AMOUNT (INR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <RentifyButton title="Record Expense" onPress={() => { }} style={styles.recordBtn} />
        </TonalCard>

        {/* Recurring Bills */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recurring Bills</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.billsList}>
          <TonalCard level="lowest" style={styles.billItem}>
            <View style={styles.billIconContainer}>
              <Ionicons name="flash" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.billInfo}>
              <Text style={styles.billName}>Electricity Bill - Tower A</Text>
              <Text style={styles.billDue}>Due in 4 days • Oct 15, 2026</Text>
            </View>
            <View style={styles.billAction}>
              <Text style={styles.billAmount}>₹8,420</Text>
              <StatusBadge status="pending" label="Pending" />
            </View>
          </TonalCard>

          <TonalCard level="lowest" style={styles.billItem}>
            <View style={[styles.billIconContainer, { backgroundColor: theme.colors.vacantBg }]}>
              <Ionicons name="water" size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.billInfo}>
              <Text style={styles.billName}>Water Supply - Municipal</Text>
              <Text style={styles.billDue}>Paid on Oct 02, 2026</Text>
            </View>
            <View style={styles.billAction}>
              <Text style={styles.billAmount}>₹1,200</Text>
              <StatusBadge status="vacant" label="Verified" />
            </View>
          </TonalCard>
        </View>

        {/* Recent Ledger */}
        <Text style={styles.sectionTitle}>Recent Ledger</Text>
        <TonalCard level="lowest" style={styles.ledgerCard}>
          {[
            { id: '#TXN-89210', date: '11 Oct', entity: 'Acme Elevators Ltd.', cat: 'Maintenance', amount: '-₹4,500', isLoss: true },
            { id: '#TXN-89209', date: '11 Oct', entity: 'Rent Payment - 402', cat: 'Income', amount: '+₹12,500', isLoss: false },
          ].map((item, index) => (
            <View key={index} style={[styles.ledgerItem, index !== 0 && styles.ledgerBorder]}>
              <View style={styles.ledgerInfo}>
                <Text style={styles.ledgerEntity}>{item.entity}</Text>
                <Text style={styles.ledgerSubText}>{item.id} • {item.date}</Text>
              </View>
              <View style={styles.ledgerAction}>
                <Text style={[styles.ledgerAmount, { color: item.isLoss ? '#ba1a1a' : theme.colors.secondary }]}>
                  {item.amount}
                </Text>
                <Text style={styles.ledgerCat}>{item.cat}</Text>
              </View>
            </View>
          ))}
        </TonalCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 28,
    color: theme.colors.onSurface,
  },
  notificationBtn: {
    padding: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
  },
  heroCard: {
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  overviewLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 42,
    color: theme.colors.primary,
    marginTop: 8,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profitText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    marginTop: 32,
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  pettyCashCard: {
    backgroundColor: theme.colors.primaryContainer,
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onPrimary,
  },
  cardSubtitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onPrimary,
    opacity: 0.7,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 12,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  inputLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    color: theme.colors.onPrimary,
    opacity: 0.6,
  },
  inputValue: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onPrimary,
    marginTop: 2,
  },
  textInput: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onPrimary,
    marginTop: 2,
    padding: 0,
  },
  recordBtn: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 22,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.primary,
  },
  billsList: {
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  billIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff', // Use primary fixed variant or similar?
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  billDue: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  billAction: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 18,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  ledgerCard: {
    padding: 0,
    overflow: 'hidden',
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  ledgerBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant + '40',
  },
  ledgerEntity: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  ledgerSubText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  ledgerAction: {
    alignItems: 'flex-end',
  },
  ledgerAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 16,
  },
  ledgerCat: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    textTransform: 'uppercase',
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
});
