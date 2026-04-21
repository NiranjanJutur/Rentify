import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Manrope_700Bold, Manrope_400Regular } from '@expo-google-fonts/manrope';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { View, Text, Platform } from 'react-native';

export default function App() {
  const [iconsLoaded, setIconsLoaded] = React.useState(false);
  
  let [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Manrope': Manrope_700Bold,
    'Manrope-Regular': Manrope_400Regular,
  });

  React.useEffect(() => {
    async function loadIcons() {
      try {
        await Font.loadAsync({
          'Ionicons': require('./assets/fonts/Ionicons.ttf'),
          'MaterialCommunityIcons': require('./assets/fonts/MaterialCommunityIcons.ttf'),
        });
      } catch (err) {
        console.warn('Icon loading failed', err);
      } finally {
        setIconsLoaded(true);
      }
    }
    loadIcons();
    
    // Explicitly inject font-face for web as a fallback
    if (Platform.OS === 'web') {
      const iconFontStyles = `
        @font-face {
          src: url(${require('./assets/fonts/Ionicons.ttf')});
          font-family: Ionicons;
        }
        @font-face {
          src: url(${require('./assets/fonts/MaterialCommunityIcons.ttf')});
          font-family: MaterialCommunityIcons;
        }
      `;
      const style = document.createElement('style');
      style.innerHTML = iconFontStyles;
      document.head.appendChild(style);
    }
  }, []);

  // Fallback if fonts take more than 5 seconds
  const [fontError, setFontError] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded || !iconsLoaded) setFontError(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, iconsLoaded]);

  if ((!fontsLoaded || !iconsLoaded) && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfcfc' }}>
        <Text style={{ marginTop: 20, color: '#666' }}>Initializing Estate Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
