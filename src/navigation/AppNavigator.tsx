import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerLoginScreen } from '../screens/auth/OwnerLoginScreen';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { ExpenseTrackerScreen } from '../screens/owner/ExpenseTrackerScreen';
import { StaffManagementScreen } from '../screens/owner/StaffManagementScreen';
import { RegisterPropertyScreen } from '../screens/owner/RegisterPropertyScreen';
import { NoticesScreen } from '../screens/owner/NoticesScreen';
import { MaintenanceComplaintsScreen } from '../screens/owner/MaintenanceComplaintsScreen';
import { TenantManagementScreen } from '../screens/owner/TenantManagementScreen';
import { PaymentCollectionScreen } from '../screens/owner/PaymentCollectionScreen';
import TenantDashboardScreen from '../screens/tenant/TenantDashboardScreen';
import TenantMealScreen from '../screens/tenant/TenantMealScreen';
import TenantPaymentScreen from '../screens/tenant/TenantPaymentScreen';
import TenantProfileScreen from '../screens/tenant/TenantProfileScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="OwnerLogin"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
        <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
        <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
        <Stack.Screen name="RegisterProperty" component={RegisterPropertyScreen} />
        <Stack.Screen name="Notices" component={NoticesScreen} />
        <Stack.Screen name="MaintenanceComplaints" component={MaintenanceComplaintsScreen} />
        <Stack.Screen name="TenantManagement" component={TenantManagementScreen} />
        <Stack.Screen name="PaymentCollection" component={PaymentCollectionScreen} />
        <Stack.Screen name="TenantDashboard" component={TenantDashboardScreen} />
        <Stack.Screen name="TenantMeal" component={TenantMealScreen} />
        <Stack.Screen name="TenantPayment" component={TenantPaymentScreen} />
        <Stack.Screen name="TenantProfile" component={TenantProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
