import React from 'react';
import { View, Text, StyleSheet, Button, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { startSmsListener } from '../services/smsReader';

export default function OnboardingScreen({ navigation }: any) {
  const requestSmsPermission = async () => {
    if (Platform.OS !== 'android') {
      await AsyncStorage.setItem('onboarded', 'true');
      navigation.replace('Biometric');
      return;
    }

    const res = await request(PERMISSIONS.ANDROID.READ_SMS);
    if (res === RESULTS.GRANTED) {
      startSmsListener();
      await AsyncStorage.setItem('onboarded', 'true');
      navigation.replace('Biometric');
    } else if (res === RESULTS.BLOCKED) {
      Alert.alert('Permission blocked', 'Open settings to allow SMS permission', [
        { text: 'Cancel' },
        { text: 'Open Settings', onPress: () => openSettings() },
      ]);
    } else {
      // denied but not blocked
      await AsyncStorage.setItem('onboarded', 'true');
      navigation.replace('Biometric');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Smart Expense Tracker</Text>
      <Text style={styles.text}>
        We will read bank SMS to auto-create expense entries. Only finance-related messages are processed.
      </Text>
      <View style={{ height: 20 }} />
      <Button title="Grant SMS Permission" onPress={requestSmsPermission} />
      <View style={{ height: 10 }} />
      <Button title="Skip for now" color="gray" onPress={async () => { await AsyncStorage.setItem('onboarded', 'true'); navigation.replace('Biometric'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  text: { color: '#444', marginTop: 8 },
});
