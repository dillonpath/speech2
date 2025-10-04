import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MetricsDisplay = ({ speakingPercent, interruptions, wordsPerMinute }) => {
  return (
    <View style={styles.container}>
      <View style={styles.metric}>
        <Text style={styles.label}>Speaking %</Text>
        <Text style={styles.value}>{speakingPercent}%</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.label}>Interruptions</Text>
        <Text style={styles.value}>{interruptions}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.label}>WPM</Text>
        <Text style={styles.value}>{wordsPerMinute}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  metric: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default MetricsDisplay;
