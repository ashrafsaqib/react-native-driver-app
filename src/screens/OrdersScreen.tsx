// src/screens/OrdersScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { driverApi } from '../api/driverApi';
import { useAuth } from '../context/AuthContext';

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);

  const driverStatusActions = {
    "Pick me": "Accepted",
    "Accepted": "Coming",
    "Coming": "Arrived for pick",
    "Arrived for pick": "Traveling",
    "Traveling": "Dropped",
  };

  const loadOrders = async () => {
    if (!user) return;
    try {
      const { orders: o } = await driverApi.getOrders(user.id);
      setOrders(o ?? []);
    } catch {
      Alert.alert('Error', 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (orderId: number, status: string) => {
    if (!user) return;
    setUpdatingOrderId(orderId);
    try {
      await driverApi.updateStatus(orderId, status, user.id);
      await loadOrders();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch {
      Alert.alert('Error', 'Status update failed');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openWhatsApp = (num: string) => {
    const phone = num?.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Make sure WhatsApp is installed'),
    );
  };

  const openPhone = (num: string) => {
    const url = `tel:${num}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Phone app not available'),
    );
  };

  const openMaps = (item: any) => {
    const address = [
      item.city,
      item.district,
      item.buildingName,
      item.flatVilla,
      item.street,
    ]
      .filter(Boolean)
      .join(', ');

    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });

    Linking.openURL(url ?? '').catch(() =>
      Alert.alert('Error', 'Maps app not available'),
    );
  };

  const badgeColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#f39c12';
      case 'Coming':
        return '#3498db';
      case 'Arrived':
        return '#2ecc71';
      case 'Completed':
        return '#9b59b6';
      default:
        return '#bdc3c7';
    }
  };

  useEffect(() => {
    if (isFocused && user) {
      loadOrders();
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isFocused, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>#{item.id}</Text>
        <Text style={styles.amount}>
          {item.currency_symbol}
          {item.total_amount}
        </Text>
      </View>

      <Text style={styles.subTitle}>{item.customer_name}</Text>
      <Text style={styles.infoLine}>
        🕓 {item.date} • {item.time_slot_value}
      </Text>

      <View style={styles.statusRow}>
        <Text
          style={[styles.badge, { backgroundColor: badgeColor(item.driver_status) }]}
        >
          {item.driver_status}
        </Text>
        {driverStatusActions[item.driver_status] &&
          (updatingOrderId === item.id ? (
            <ActivityIndicator size="small" />
          ) : (
            <Button
              title={`Mark as ${driverStatusActions[item.driver_status]}`}
              onPress={() =>
                changeStatus(item.id, driverStatusActions[item.driver_status])
              }
            />
          ))}
      </View>

      <View style={styles.actionRow}>
        <Icon.Button
          name="logo-whatsapp"
          backgroundColor="#25D366"
          onPress={() => openWhatsApp(item.whatsapp)}
        />
        <Icon.Button
          name="call"
          backgroundColor="#007AFF"
          onPress={() => openPhone(item.number)}
        />
        <Icon.Button
          name="location"
          backgroundColor="#34B7F1"
          onPress={() => openMaps(item)}
        />
        <Icon.Button
          name="chatbubble-ellipses-outline"
          backgroundColor="#5856D6"
          onPress={() => navigation.navigate('Chat', { orderId: item.id })}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Driver Dashboard</Text>
        <Button title="Logout" color="#e74c3c" onPress={logout} />
      </View>

      <FlatList
        ref={flatListRef}
        data={orders}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  screenTitle: { fontWeight: 'bold', fontSize: 18 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontWeight: 'bold', color: '#2ecc71' },
  subTitle: { fontSize: 14, color: '#333', marginBottom: 2 },
  infoLine: { fontSize: 12, color: '#666' },
  statusRow: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
});