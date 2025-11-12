import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB } from '../db/database';
import { startSmsListener } from '../services/smsReader';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    (async () => {
      await initDB();
      const onboarded = await AsyncStorage.getItem('onboarded');
      const biometric = await AsyncStorage.getItem('biometric_enabled');

      // If already granted SMS permission, start listener
      if (Platform.OS === 'android') {
        const res = await request(PERMISSIONS.ANDROID.READ_SMS);
        if (res === RESULTS.GRANTED) {
          startSmsListener();
        }
      }

      setTimeout(() => {
        if (!onboarded) navigation.replace('Onboarding');
        else if (biometric === 'true') navigation.replace('Biometric');
        else navigation.replace('Dashboard');
      }, 700);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12, fontWeight: '700' }}>Smart Expense Tracker</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
