import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import storage from '../utils/storage';

const HistoryScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const data = await storage.getAllConversations();
    setConversations(data);
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Dashboard', { conversationId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <Text style={styles.grade}>{item.grade || 'N/A'}</Text>
      </View>

      <View style={styles.cardStats}>
        <Text style={styles.stat}>
          Duration: {Math.floor(item.duration / 60)}m {item.duration % 60}s
        </Text>
        <Text style={styles.stat}>
          Your speaking: {item.speakingPercent}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation History</Text>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start your first conversation to see analytics here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  grade: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});

export default HistoryScreen;
