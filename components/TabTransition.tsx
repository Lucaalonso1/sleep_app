import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface TabTransitionProps {
  children: ReactNode;
  isActive: boolean;
  direction?: 'left' | 'right';
}

export default function TabTransition({ 
  children, 
  isActive,
  direction = 'right' 
}: TabTransitionProps) {
  const slideAnim = useRef(new Animated.Value(isActive ? 0 : width)).current;
  const fadeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    if (isActive) {
      // Animación de entrada
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Preparar para la próxima entrada
      slideAnim.setValue(direction === 'left' ? -width : width);
      fadeAnim.setValue(0);
    }
  }, [isActive, direction]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

