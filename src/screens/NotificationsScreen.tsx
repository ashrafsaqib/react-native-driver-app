// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { driverApi } from '../api/driverApi';

export const NotificationsScreen = () => {
  type Notification = {
    id: number;
    title: string;
    body: string;
    created_at: string;
  };
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const json = await driverApi.getNotifications(user.id);
      setData(json.notifications ?? []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run the effect if the screen is focused and we have a user
    if (isFocused && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);

      // This cleanup function will run when the screen is no longer focused
      // or when the component unmounts.
      return () => clearInterval(interval);
    }
  }, [isFocused, user]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Logout" color="#e74c3c" onPress={logout} />
      ),
      headerTitle: 'Notifications',
    });
  }, [navigation, logout]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{formatTime(item.created_at)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications</Text>
        }
        contentContainerStyle={{ padding: 12 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: { fontWeight: 'bold', fontSize: 15 },
  body: { marginVertical: 4 },
  time: { fontSize: 12, color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
});