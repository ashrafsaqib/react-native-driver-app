// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LoginScreen = () => {
  const { login } = useAuth();

  const [username, setUsername] = useState('usma@tadhem.com');
  const [password, setPassword] = useState('test');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      // on success AuthContext automatically navigates away
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <View style={styles.container}>
        <TextInput
          placeholder="Username / Email"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Log in" onPress={handleLogin} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 4,
  },
});