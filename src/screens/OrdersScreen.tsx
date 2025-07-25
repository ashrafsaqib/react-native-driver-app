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

const driverStatusActions = {
  "Pick me": "Accepted",
  "Accepted": "Coming",
  "Coming": "Arrived for pick",
  "Arrived for pick": "Traveling",
  "Traveling": "Dropped",
} as const;

type Order = {
  id: number;
  driver_status: string;
  staff_name: string;
  time_slot_value: string;
  latitude: string;
  longitude: string;
  address: string;
  staff_phone: string;
  staff_whatsapp: string;
};

export const OrdersScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);

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
      await driverApi.updateStatus(orderId, status);
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

  const cardBackgroundColor = (status: string) => {
    switch (status) {
      case 'Pick me':
        return '#9cfe8dff';
      case 'Accepted':
        return '#E8F8F5';
      case 'Coming':
        return '#E6F7FF';
      case 'Arrived for pick':
        return '#F9EBEA';
      case 'Traveling':
        return '#FDF2E9';
      case 'Dropped':
        return '#F4ECF7';
      default:
        return '#F5F5F5';
    }
  };

  useEffect(() => {
    if (isFocused && user) {
      loadOrders();
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isFocused, user]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Logout" color="#e74c3c" onPress={logout} />
      ),
      headerTitle: 'Driver Dashboard',
    });
  }, [navigation, logout]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.card, { backgroundColor: cardBackgroundColor(item.driver_status) }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>#{item.id}</Text>
      </View>

      <Text style={styles.address}>{item.address}</Text>
      <Text style={styles.subTitle}>{item.staff_name}</Text>
      <Text style={styles.infoLine}>🕓 {item.time_slot_value}</Text>

      <View style={styles.statusRow}>
        <Text
          style={[
            styles.badge,
            { backgroundColor: badgeColor(item.driver_status) },
          ]}
        >
          {String(item.driver_status)}
        </Text>
        {driverStatusActions[item.driver_status] &&
          (updatingOrderId === item.id ? (
            <ActivityIndicator size="small" />
          ) : (
            <Button
              title={`Mark as ${driverStatusActions[item.driver_status]}`}
              onPress={() =>
                changeStatus(
                  item.id,
                  driverStatusActions[item.driver_status],
                )
              }
            />
          ))}
      </View>

      <View style={styles.actionRow}>
        <Icon
          size={36}
          name="logo-whatsapp"
          color="#25D366"
          onPress={() => openWhatsApp(item.staff_whatsapp)}
        />
        <Icon
          size={36}
          name="call"
          color="#007AFF"
          onPress={() => openPhone(item.staff_phone)}
        />
        <Icon
          size={36}
          name="location"
          color="#34B7F1"
          onPress={() => openMaps(item)}
        />
        <Icon
          size={36}
          name="chatbubble-ellipses-outline"
          color="#5856D6"
          onPress={() =>
            navigation.navigate('Chat', { orderId: item.id })
          }
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
  address: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
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