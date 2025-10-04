import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const DashboardScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report Card</Text>
        <Text style={styles.grade}>A-</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Speaking Time</Text>
        <Text style={styles.metric}>You: 45% | Other: 55%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Insights</Text>
        <Text style={styles.insight}>• Good balance of speaking time</Text>
        <Text style={styles.insight}>• Consider asking more questions</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  grade: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#34C759',
  },
  metric: {
    fontSize: 16,
    color: '#666',
  },
  insight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default DashboardScreen;
