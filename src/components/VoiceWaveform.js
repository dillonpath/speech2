import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const VoiceWaveform = ({ isActive, amplitude = 0.5 }) => {
  const animatedValues = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isActive) {
      const animations = animatedValues.map((value, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: amplitude,
              duration: 300 + index * 100,
              useNativeDriver: false,
            }),
            Animated.timing(value, {
              toValue: 0.3,
              duration: 300 + index * 100,
              useNativeDriver: false,
            }),
          ])
        )
      );
      Animated.parallel(animations).start();
    }
  }, [isActive, amplitude]);

  return (
    <View style={styles.container}>
      {animatedValues.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: value.interpolate({
                inputRange: [0, 1],
                outputRange: ['20%', '100%'],
              }),
              opacity: isActive ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 80,
    paddingHorizontal: 20,
  },
  bar: {
    width: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
});

export default VoiceWaveform;
