import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

export default function BiometricSetupScreen({ navigation }: any) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const rn = new ReactNativeBiometrics();
      const { available } = await rn.isSensorAvailable();
      setSupported(available);
    })();
  }, []);

  const enableBiometric = async () => {
    try {
      const rn = new ReactNativeBiometrics();
      const res = await rn.simplePrompt({ promptMessage: 'Authenticate to enable lock' });
      if (res.success) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
        Alert.alert('Enabled', 'Biometric lock is enabled');
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Cancelled');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not enable biometric');
    }
  };

  const usePasscode = async () => {
    await AsyncStorage.setItem('biometric_enabled', 'false');
    navigation.replace('Passcode');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure your app</Text>
      <Text style={{ marginVertical: 12 }}>{supported ? 'Enable fingerprint/Face ID to protect your data.' : 'Biometric not available on this device — use passcode instead.'}</Text>
      {supported ? <Button title="Enable Biometric" onPress={enableBiometric} /> : null}
      <View style={{ height: 8 }} />
      <Button title="Use Passcode" onPress={usePasscode} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20, justifyContent: 'center' }, title: { fontSize: 22, fontWeight: '700' } });
