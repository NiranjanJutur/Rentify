import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { propertyService, mealService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';

export const OwnerMealManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [counts, setCounts] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  
  const [menu, setMenu] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    breakfast_time: '08:00 AM - 10:00 AM',
    lunch_time: '01:00 PM - 03:00 PM',
    dinner_time: '08:00 PM - 10:00 PM',
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const props = await propertyService.getMyProperties();
      if (props && props.length > 0) {
        const prop = props[0];
        setProperty(prop);
        
        const dailyMenu = await mealService.getDailyMenu(prop.id, today);
        if (dailyMenu) {
          setMenu({
            breakfast: dailyMenu.breakfast || '',
            lunch: dailyMenu.lunch || '',
            dinner: dailyMenu.dinner || '',
            breakfast_time: dailyMenu.breakfast_time || '08:00 AM - 10:00 AM',
            lunch_time: dailyMenu.lunch_time || '01:00 PM - 03:00 PM',
            dinner_time: dailyMenu.dinner_time || '08:00 PM - 10:00 PM',
          });
        }

        const votes = await mealService.getTodayVotes(prop.id, today);
        const newCounts = { breakfast: 0, lunch: 0, dinner: 0 };
        votes.forEach((v: any) => {
          if (v.response === 'yes') {
            newCounts[v.meal_type as keyof typeof newCounts]++;
          }
        });
        setCounts(newCounts);
      }
    } catch (err) {
      console.log('Error fetching meal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateMeal = async (type: 'breakfast' | 'lunch' | 'dinner') => {
    if (!property) return;
    try {
      setUpdating(type);
      await mealService.updateDailyMenu({
        property_id: property.id,
        date: today,
        [type]: menu[type as keyof typeof menu],
        [`${type}_time`]: menu[`${type}_time` as keyof typeof menu],
      });
      if (typeof window !== 'undefined') window.alert(`${type.toUpperCase()} menu updated!`);
      else Alert.alert('Success', `${type} menu updated!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleSendReminder = () => {
    Alert.alert(
      'Send Reminder',
      'Notify tenants who haven\'t voted yet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => Alert.alert('Sent', 'Reminders sent!') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const MealInput = ({ type, label, icon }: { type: 'breakfast' | 'lunch' | 'dinner', label: string, icon: any }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.mealLabel}>{label}</Text>
        <TouchableOpacity 
          onPress={() => handleUpdateMeal(type)} 
          style={styles.updateBtn}
          disabled={updating === type}
        >
          <Text style={styles.updateBtnText}>{updating === type ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={menu[type]}
        onChangeText={(val) => setMenu({ ...menu, [type]: val })}
        placeholder={`What's for ${label.toLowerCase()}?`}
        multiline
      />
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={14} color="#64748b" />
        <TextInput
          style={styles.timeInput}
          value={menu[`${type}_time` as keyof typeof menu]}
          onChangeText={(val) => setMenu({ ...menu, [`${type}_time` as keyof typeof menu]: val })}
          placeholder="Set time"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Manage Food</Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
          </View>
          <TouchableOpacity onPress={handleSendReminder} style={styles.notifyBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={['#1e293b', '#334155']}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>TENANTS EATING TODAY</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{counts.breakfast}</Text>
                <Text style={styles.statLabel}>Breakfast</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{counts.lunch}</Text>
                <Text style={styles.statLabel}>Lunch</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{counts.dinner}</Text>
                <Text style={styles.statLabel}>Dinner</Text>
              </View>
            </View>
          </LinearGradient>

          <MealInput type="breakfast" label="Breakfast" icon="cafe-outline" />
          <MealInput type="lunch" label="Lunch" icon="restaurant-outline" />
          <MealInput type="dinner" label="Dinner" icon="moon-outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b' },
  content: { paddingHorizontal: 20 },
  statsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#fff', fontSize: 11, opacity: 0.8, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#fff', opacity: 0.2 },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
  updateBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  updateBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#334155',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  timeInput: { flex: 1, fontSize: 12, color: '#64748b', padding: 0 },
});
