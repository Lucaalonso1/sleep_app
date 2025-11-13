import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sparkles } from 'lucide-react-native';
import Colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Fade in y scale del icono principal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Rotación suave
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Efecto de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
    ]).start();

    // Animación de sparkles
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade out después de 3 segundos
    const timer = setTimeout(() => {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOutAnim }]}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary, Colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Círculos de fondo animados */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle1,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
              transform: [
                { scale: scaleAnim },
                { rotate: rotate },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            styles.circle2,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.15],
              }),
              transform: [
                { scale: scaleAnim },
                { rotate: rotate },
              ],
            },
          ]}
        />

        {/* Contenedor principal */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Icono principal */}
          <View style={styles.iconContainer}>
            <Moon size={80} color={Colors.primaryLight} strokeWidth={1.5} />
          </View>

          {/* Sparkles decorativos */}
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle1,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Sparkles size={24} color={Colors.accent} strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle2,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Sparkles size={20} color={Colors.secondary} strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle3,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Sparkles size={18} color={Colors.primary} strokeWidth={2} />
          </Animated.View>
        </Animated.View>

        {/* Texto animado */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Sleep App
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Tu descanso, nuestra prioridad
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Círculos de fondo
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: Colors.primary,
    top: -width * 0.7,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: Colors.accent,
    bottom: -width * 0.5,
    left: -width * 0.4,
  },
  // Logo container
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Glow effect
  glowCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  // Sparkles
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: -20,
    right: -10,
  },
  sparkle2: {
    bottom: 10,
    left: -20,
  },
  sparkle3: {
    top: 20,
    left: -30,
  },
  // Texto
  appName: {
    marginTop: 40,
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});

