// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export const NotificationsScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      console.log('Fetching notifications for user:', user.id);
      const res = await fetch(
        `https://test.lipslay.com/api/driverNotification?user_id=${user.id}`,
      );
      const json = await res.json();
      console.log('Notifications:', json);
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
      const interval = setInterval(fetchNotifications, 3000);

      // This cleanup function will run when the screen is no longer focused
      // or when the component unmounts.
      return () => clearInterval(interval);
    }
  }, [isFocused, user]);


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const formatTime = (iso) =>
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