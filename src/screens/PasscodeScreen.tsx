import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PasscodeScreen({ navigation }: any) {
  const [saved, setSaved] = useState<string | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('passcode');
      setSaved(c);
    })();
  }, []);

  const submit = async () => {
    if (!saved) {
      if (code.length < 4) return Alert.alert('Enter a 4-digit PIN');
      await AsyncStorage.setItem('passcode', code);
      Alert.alert('Saved', 'Passcode set');
      navigation.replace('Dashboard');
    } else {
      if (code === saved) navigation.replace('Dashboard');
      else Alert.alert('Wrong passcode');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{saved ? 'Enter Passcode' : 'Set a 4-digit Passcode'}</Text>
      <TextInput value={code} onChangeText={setCode} keyboardType="numeric" maxLength={4} secureTextEntry style={styles.input} />
      <Button title="Submit" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { fontSize: 22, textAlign: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
});
