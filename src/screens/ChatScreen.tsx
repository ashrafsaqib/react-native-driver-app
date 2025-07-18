import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, TextInput, Button, StyleSheet, SafeAreaView, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { driverApi } from '../api/driverApi';
import { useAuth } from '../context/AuthContext';

export const ChatScreen = ({ route }) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [chats, setChats] = useState([]);
  const flatListRef = useRef<FlatList<any>>(null);

  const load = async () => {
    const msgs = await driverApi.getChat(orderId);
    setChats(msgs ?? []);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [orderId]);

  const send = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !user) return;

    // Check if the text content is a location coordinate
    const isLocation = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(trimmedText);

    try {
      const response = await driverApi.sendChat(orderId, {
        user_id: String(user.id),
        text: trimmedText,
        type: isLocation ? 'Location' : '',
      });
      if (response.success) {
        setText('');
        load(); // Refresh chat on success
      } else {
        Alert.alert('Error', 'Failed to send message.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'An unexpected error occurred while sending the message.');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isSelf = item.user === 'self';

    return (
      <View style={isSelf ? styles.myMessageContainer : styles.otherMessageContainer}>
        <View style={[styles.messageBubble, isSelf ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {!isSelf && <Text style={styles.userName}>{item.user}</Text>}
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={chats}
          keyExtractor={(item, index) => `${item.created_at}-${index}`}
          renderItem={renderMessage}
          style={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputContainer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type message"
            style={styles.input}
          />
          <Button title="Send" onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  list: { flex: 1, backgroundColor: '#f0f2f5', paddingHorizontal: 10 },
  myMessageContainer: { alignItems: 'flex-end', marginVertical: 5 },
  otherMessageContainer: { alignItems: 'flex-start', marginVertical: 5 },
  messageBubble: { padding: 12, borderRadius: 15, maxWidth: '80%' },
  myMessageBubble: { backgroundColor: '#dcf8c6', borderBottomRightRadius: 3 },
  otherMessageBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 3 },
  userName: { fontWeight: 'bold', color: '#3498db', marginBottom: 4 },
  messageText: { fontSize: 16 },
  dateText: { fontSize: 11, color: '#888', marginTop: 5, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, backgroundColor: '#fff' },
});