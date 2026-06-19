import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, healthColor } from '../../constants/colors';

interface Props {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small:  { diameter: 44, fontSize: 13, ringWidth: 3 },
  medium: { diameter: 60, fontSize: 17, ringWidth: 4 },
  large:  { diameter: 88, fontSize: 26, ringWidth: 5 },
};

export function HealthScoreBadge({ score, size = 'medium' }: Props) {
  const animated = useRef(new Animated.Value(0)).current;
  const { diameter, fontSize, ringWidth } = SIZES[size];
  const color = healthColor(score);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: score,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const displayScore = animated.interpolate({
    inputRange: [0, score],
    outputRange: ['0', String(score)],
  });

  return (
    <View
      style={[
        styles.ring,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          borderWidth: ringWidth,
          borderColor: color,
        },
      ]}
    >
      <Animated.Text style={[styles.score, { fontSize, color }]}>
        {displayScore}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cleanWhite,
  },
  score: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

// DEV preview
if (__DEV__) {
  // Mount <HealthScoreBadge score={87} /> to test
}
