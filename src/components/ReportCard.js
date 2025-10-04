import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportCard = ({ grade, score, insights = [] }) => {
  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#34C759';
    if (grade.startsWith('B')) return '#5AC8FA';
    if (grade.startsWith('C')) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation Report Card</Text>

      <View style={styles.gradeContainer}>
        <Text style={[styles.grade, { color: getGradeColor(grade) }]}>
          {grade}
        </Text>
        <Text style={styles.score}>{score}/100</Text>
      </View>

      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Key Takeaways</Text>
          {insights.map((insight, index) => (
            <Text key={index} style={styles.insight}>
              • {insight}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  grade: {
    fontSize: 72,
    fontWeight: 'bold',
    marginRight: 10,
  },
  score: {
    fontSize: 24,
    color: '#666',
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  insight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ReportCard;
