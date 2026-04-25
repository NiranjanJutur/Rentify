import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { mealService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';

export default function TenantMealScreen({ activeTenant }: any) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, 'yes' | 'no'>>({});
  
  const [menu, setMenu] = useState({
    breakfast: 'Wait for owner...',
    lunch: 'Wait for owner...',
    dinner: 'Wait for owner...',
    breakfast_time: '08:00 AM - 10:00 AM',
    lunch_time: '01:00 PM - 03:00 PM',
    dinner_time: '08:00 PM - 10:00 PM',
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (!activeTenant?.property_id) return;
    try {
      setLoading(true);
      const [dailyMenu, userVotes] = await Promise.all([
        mealService.getDailyMenu(activeTenant.property_id, today),
        mealService.getTenantVotesForDate(activeTenant.id, today)
      ]);
      
      if (dailyMenu) {
        setMenu({
          breakfast: dailyMenu.breakfast || 'Not served today',
          lunch: dailyMenu.lunch || 'Not served today',
          dinner: dailyMenu.dinner || 'Not served today',
          breakfast_time: dailyMenu.breakfast_time || '08:00 AM - 10:00 AM',
          lunch_time: dailyMenu.lunch_time || '01:00 PM - 03:00 PM',
          dinner_time: dailyMenu.dinner_time || '08:00 PM - 10:00 PM',
        });
      }

      const voteMap: Record<string, 'yes' | 'no'> = {};
      (userVotes || []).forEach((v: any) => {
        voteMap[v.meal_type] = v.response;
      });
      setResponses(voteMap);
      
    } catch (err) {
      console.log('Error fetching meal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTenant]);

  const handleVote = async (mealType: 'breakfast' | 'lunch' | 'dinner', response: 'yes' | 'no') => {
    if (!activeTenant) return;
    try {
      setVoting(mealType);
      await mealService.submitVote({
        tenant_id: activeTenant.id,
        property_id: activeTenant.property_id,
        meal_type: mealType,
        response,
        date: today,
      });
      setResponses(prev => ({ ...prev, [mealType]: response }));
    } catch (err: any) {
      Alert.alert('Voting Error', err.message || 'Could not save your response.');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const MealItem = ({ type, name, time, label, icon }: { type: 'breakfast' | 'lunch' | 'dinner', name: string, time: string, label: string, icon: any }) => {
    const currentResponse = responses[type];
    const isVoting = voting === type;
    const isNotUpdated = name.includes('Wait for owner');

    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mealLabel}>{label}</Text>
            <Text style={styles.mealTime}>{time}</Text>
          </View>
          {currentResponse && (
            <View style={[styles.statusTag, currentResponse === 'yes' ? styles.tagYes : styles.tagNo]}>
              <Text style={[styles.tagText, { color: currentResponse === 'yes' ? '#22c55e' : '#ef4444' }]}>
                {currentResponse === 'yes' ? 'EATING' : 'SKIPPING'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.mealName, isNotUpdated && styles.mutedText]}>{name}</Text>

        <View style={styles.voteContainer}>
          <TouchableOpacity 
            style={[styles.voteButton, currentResponse === 'yes' && styles.activeYes]}
            onPress={() => handleVote(type, 'yes')}
            disabled={!!isVoting || isNotUpdated}
          >
            <Ionicons name="checkmark-circle" size={18} color={currentResponse === 'yes' ? '#fff' : '#64748b'} />
            <Text style={[styles.voteText, currentResponse === 'yes' && { color: '#fff' }]}>I'll be there</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.voteButton, currentResponse === 'no' && styles.activeNo]}
            onPress={() => handleVote(type, 'no')}
            disabled={!!isVoting || isNotUpdated}
          >
            <Ionicons name="close-circle" size={18} color={currentResponse === 'no' ? '#fff' : '#64748b'} />
            <Text style={[styles.voteText, currentResponse === 'no' && { color: '#fff' }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Food & Mess</Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <MealItem type="breakfast" name={menu.breakfast} time={menu.breakfast_time} label="Breakfast" icon="cafe-outline" />
          <MealItem type="lunch" name={menu.lunch} time={menu.lunch_time} label="Lunch" icon="restaurant-outline" />
          <MealItem type="dinner" name={menu.dinner} time={menu.dinner_time} label="Dinner" icon="moon-outline" />

          <LinearGradient
            colors={[theme.colors.primary, '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipCard}
          >
            <Ionicons name="information-circle" size={24} color="#fff" />
            <Text style={styles.tipText}>
              Voting helps us cook the right amount and reduce food waste. Thanks for being responsible!
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: theme.typography.headline.fontFamily,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontFamily: theme.typography.body.fontFamily,
  },
  content: {
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  mealTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagYes: {
    backgroundColor: '#f0fdf4',
  },
  tagNo: {
    backgroundColor: '#fef2f2',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 26,
    marginBottom: 20,
  },
  mutedText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  activeYes: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  activeNo: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  voteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginTop: 10,
    gap: 16,
  },
  tipText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    opacity: 0.9,
  }
});
