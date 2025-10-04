import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RealTimeFeedback = ({ currentMetrics, feedbackActive }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Metrics</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.label}>You</Text>
          <Text style={styles.value}>{currentMetrics.yourSpeakingPercent}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.label}>Them</Text>
          <Text style={styles.value}>{100 - currentMetrics.yourSpeakingPercent}%</Text>
        </View>
      </View>

      {feedbackActive && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackActive.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  feedbackBanner: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});

export default RealTimeFeedback;
