import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, View, Text } from 'react-native';
import { OwnerLoginScreen } from '../screens/auth/OwnerLoginScreen';
import { CreateAccountScreen } from '../screens/auth/CreateAccountScreen';
import { TenantAccountScreen } from '../screens/auth/TenantAccountScreen';
import TenantJoinScreen from '../screens/auth/TenantJoinScreen';
import TenantRegistrationScreen from '../screens/auth/TenantRegistrationScreen';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { ExpenseTrackerScreen } from '../screens/owner/ExpenseTrackerScreen';
import { StaffManagementScreen } from '../screens/owner/StaffManagementScreen';
import { RegisterPropertyScreen } from '../screens/owner/RegisterPropertyScreen';
import { NoticesScreen } from '../screens/owner/NoticesScreen';
import { MaintenanceComplaintsScreen } from '../screens/owner/MaintenanceComplaintsScreen';
import { TenantManagementScreen } from '../screens/owner/TenantManagementScreen';
import { TenantDetailScreen } from '../screens/owner/TenantDetailScreen';
import { PaymentCollectionScreen } from '../screens/owner/PaymentCollectionScreen';
import { AddTenantScreen } from '../screens/owner/AddTenantScreen';
import { AddWorkerScreen } from '../screens/owner/AddWorkerScreen';
import { ReportsScreen } from '../screens/owner/ReportsScreen';
import { OwnerProfileScreen } from '../screens/owner/OwnerProfileScreen';
import { CreateNoticeScreen } from '../screens/owner/CreateNoticeScreen';
import { LogComplaintScreen } from '../screens/owner/LogComplaintScreen';
import { RoomOverviewScreen } from '../screens/owner/RoomOverviewScreen';
import TenantDashboardScreen from '../screens/tenant/TenantDashboardScreen';
import TenantMealScreen from '../screens/tenant/TenantMealScreen';
import TenantPaymentScreen from '../screens/tenant/TenantPaymentScreen';
import TenantProfileScreen from '../screens/tenant/TenantProfileScreen';
import { AUTH_REDIRECT_URL, supabase } from '../utils/supabase';
import { theme } from '../theme/theme';

const Stack = createNativeStackNavigator();

const parseUrlParams = (url: string) => {
  const queryPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
  return new URLSearchParams(queryPart);
};

export const AppNavigator = () => {
  const [session, setSession] = useState<any>(null);
  const [demoSession, setDemoSession] = useState(false);
  const [activeTenant, setActiveTenant] = useState<any>(null);
  const [portalMode, setPortalMode] = useState<'owner' | 'tenant'>('owner');
  const [authLoading, setAuthLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthUrl = async (url: string | null) => {
      try {
        if (!url || !url.startsWith(AUTH_REDIRECT_URL)) return;
        const params = parseUrlParams(url);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const authCode = params.get('code');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return;
        }

        if (authCode) {
          await supabase.auth.exchangeCodeForSession(authCode);
        }
      } catch (err: any) {
        setErrorInfo(`URL Error: ${err.message}`);
      }
    };

    const bootstrapAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        await handleAuthUrl(initialUrl);

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(data.session);
          setAuthLoading(false);
        }
      } catch (err: any) {
        setErrorInfo(`Boot Error: ${err.message}\n${err.stack || ''}`);
        setAuthLoading(false);
      }
    };

    bootstrapAuth();

    const urlSubscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
      handleAuthUrl(url);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setDemoSession(false);
      setActiveTenant(null);
      setPortalMode('owner');
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      urlSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  if (errorInfo) {
    return (
      <View style={{ flex: 1, padding: 40, justifyContent: 'center', backgroundColor: '#800' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>System Error</Text>
        <Text style={{ color: 'white', marginTop: 10 }}>{errorInfo}</Text>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session && !demoSession ? (
          <>
            <Stack.Screen name="OwnerLogin">
              {(props) => (
                <OwnerLoginScreen
                  {...props}
                  onAuthenticated={(nextSession) => {
                    setPortalMode('owner');
                    setSession(nextSession);
                  }}
                  onDemoLogin={() => {
                    setPortalMode('owner');
                    setDemoSession(true);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateAccount">
              {(props) => (
                <CreateAccountScreen
                  {...props}
                  onAuthenticated={(nextSession) => {
                    setPortalMode('owner');
                    setSession(nextSession);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="TenantAccount">
              {(props) => (
                <TenantAccountScreen
                  {...props}
                  onTenantAccess={(tenantData?: any) => {
                    setPortalMode('tenant');
                    setActiveTenant(tenantData || null);
                    setDemoSession(true);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="TenantJoin" component={TenantJoinScreen} />
            <Stack.Screen name="TenantRegistration" component={TenantRegistrationScreen} />
          </>
        ) : (
          <>
            {portalMode === 'tenant' ? (
              <Stack.Screen name="TenantDashboard">
                {(props) => <TenantDashboardScreen {...props} activeTenant={activeTenant} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
            )}
            <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
            <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
            <Stack.Screen name="RegisterProperty" component={RegisterPropertyScreen} />
            <Stack.Screen name="Notices" component={NoticesScreen} />
            <Stack.Screen name="MaintenanceComplaints" component={MaintenanceComplaintsScreen} />
            <Stack.Screen name="TenantManagement" component={TenantManagementScreen} />
            <Stack.Screen name="TenantDetail" component={TenantDetailScreen} />
            <Stack.Screen name="PaymentCollection" component={PaymentCollectionScreen} />
            <Stack.Screen name="AddTenant" component={AddTenantScreen} />
            <Stack.Screen name="AddWorker" component={AddWorkerScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
            <Stack.Screen name="CreateNotice" component={CreateNoticeScreen} />
            <Stack.Screen name="LogComplaint" component={LogComplaintScreen} />
            <Stack.Screen name="RoomOverview" component={RoomOverviewScreen} />
            {portalMode !== 'tenant' ? (
              <Stack.Screen name="TenantDashboard">
                {(props) => <TenantDashboardScreen {...props} activeTenant={activeTenant} />}
              </Stack.Screen>
            ) : null}
            <Stack.Screen name="TenantMeal">
               {(props) => <TenantMealScreen {...props} activeTenant={activeTenant} />}
            </Stack.Screen>
            <Stack.Screen name="TenantPayment">
               {(props) => <TenantPaymentScreen {...props} activeTenant={activeTenant} />}
            </Stack.Screen>
            <Stack.Screen name="TenantProfile">
               {(props) => <TenantProfileScreen {...props} activeTenant={activeTenant} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
