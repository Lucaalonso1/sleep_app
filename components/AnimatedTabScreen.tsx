import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { usePathname } from 'expo-router';
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');

// Orden de los tabs
const TAB_ORDER = ['/', '/history', '/insights', '/sounds'];

interface AnimatedTabScreenProps {
  children: ReactNode;
  routeName: string;
}

// Variable global para rastrear el último tab activo
let lastActiveTab = '/';

export default function AnimatedTabScreen({ children, routeName }: AnimatedTabScreenProps) {
  const pathname = usePathname();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Determinar si esta pantalla está activa
  const isActive = pathname === routeName || pathname === `/(tabs)${routeName}`;
  const prevActiveRef = useRef(isActive);

  // Función para obtener el índice del tab
  const getTabIndex = (route: string) => {
    const normalizedRoute = route.replace('/(tabs)', '');
    return TAB_ORDER.indexOf(normalizedRoute);
  };

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (isActive && !wasActive) {
      // Determinar la dirección del deslizamiento
      const currentIndex = getTabIndex(pathname);
      const previousIndex = getTabIndex(lastActiveTab);
      const isMovingRight = currentIndex < previousIndex; // Moverse a un tab anterior
      
      // Actualizar el último tab activo
      lastActiveTab = pathname;

      // Pantalla entrando: empezar desde el lado correcto
      fadeAnim.setValue(1);
      slideXAnim.setValue(isMovingRight ? -width : width); // Izquierda o derecha
      scaleAnim.setValue(1);

      // Deslizamiento suave hacia el centro
      Animated.parallel([
        Animated.timing(slideXAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isActive && wasActive) {
      // Determinar la dirección de salida
      const currentIndex = getTabIndex(routeName);
      const newIndex = getTabIndex(pathname);
      const isMovingRight = newIndex < currentIndex;

      // Pantalla saliendo: deslizar al lado opuesto
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slideXAnim, {
          toValue: isMovingRight ? width * 0.3 : -width * 0.3, // Derecha o izquierda
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideXAnim },
            { scale: scaleAnim },
          ],
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
    backgroundColor: Colors.background,
  },
});

