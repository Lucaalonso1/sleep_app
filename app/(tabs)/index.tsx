import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Animated, Platform, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Clock, Bell, Plus, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import AnimatedTabScreen from '../../components/AnimatedTabScreen';
import Colors from '../../constants/colors';
import { formatTime, formatDuration } from '../../lib/utils';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isTracking, currentSession, startTracking, stopTracking, calculateWakeTimes } = useSleep();
  const [selectedWakeTime, setSelectedWakeTime] = useState<Date | null>(null);
  const [bedTime, setBedTime] = useState<Date>(new Date());
  const [wakeTimeOptions, setWakeTimeOptions] = useState<any[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [glowAnim] = useState(new Animated.Value(0));

  // Update bed time to current time every minute when not tracking
  useEffect(() => {
    if (!isTracking) {
      setBedTime(new Date());
      const interval = setInterval(() => {
        setBedTime(new Date());
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate wake time options when tracking starts
  useEffect(() => {
    if (isTracking && currentSession) {
      const options = calculateWakeTimes(currentSession.startTime);
      setWakeTimeOptions(options);
    }
  }, [isTracking, currentSession, calculateWakeTimes]);

  // Pulse animation for moon icon when tracking
  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTracking]);

  // Glow animation for time cards when not tracking
  useEffect(() => {
    if (!isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isTracking]);

  const handleStartStop = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isTracking) {
      await stopTracking();
      setWakeTimeOptions([]);
    } else {
      await startTracking(selectedWakeTime || undefined);
    }
  };

  const handleBedTimeSelect = (time: Date) => {
    setBedTime(time);
    setShowBedTimePicker(false);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleWakeTimeSelect = (time: Date) => {
    setSelectedWakeTime(time);
    setShowWakeTimePicker(false);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleRecommendedTimeSelect = async (time: Date) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setSelectedWakeTime(time);
    // Update the alarm time for current session
    if (currentSession) {
      currentSession.alarmTime = time;
    }
  };

  const getElapsedTime = () => {
    if (!currentSession) return '0h 0m';
    const elapsed = (Date.now() - currentSession.startTime.getTime()) / 1000;
    return formatDuration(elapsed);
  };

  const getSleepDuration = () => {
    if (!selectedWakeTime || !bedTime) return '8h 0m';
    const duration = (selectedWakeTime.getTime() - bedTime.getTime()) / 1000;
    return formatDuration(Math.abs(duration));
  };

  return (
    <AnimatedTabScreen routeName="/">
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundSecondary, Colors.backgroundTertiary]}
          style={styles.gradient}
        >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Sparkles size={24} color={Colors.accent} />
              <Text style={styles.title}>
                {isTracking ? 'Durmiendo...' : '¿Listo para dormir?'}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {isTracking 
                ? 'Registrando tus sonidos del sueño' 
                : 'Configura tu horario de sueño'}
            </Text>
          </View>

          {/* Time Selection Cards - Before Tracking */}
          {!isTracking && (
            <View style={styles.timeSelectionContainer}>
              {/* Bed Time Card */}
              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => setShowBedTimePicker(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary + '20', Colors.secondary + '10']}
                  style={styles.timeCardGradient}
                >
                  <Animated.View style={[styles.timeCardContent, { 
                    shadowColor: Colors.primary,
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.1, 0.4]
                    })
                  }]}>
                    <Moon size={32} color={Colors.primaryLight} strokeWidth={2} />
                    <Text style={styles.timeCardLabel}>Me voy a dormir</Text>
                    <Text style={styles.timeCardTime}>{formatTime(bedTime)}</Text>
                    <Text style={styles.timeCardHint}>Toca para cambiar</Text>
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Wake Time Card */}
              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => setShowWakeTimePicker(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.accent + '20', Colors.warning + '10']}
                  style={styles.timeCardGradient}
                >
                  <Animated.View style={[styles.timeCardContent, {
                    shadowColor: Colors.accent,
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.1, 0.4]
                    })
                  }]}>
                    <Sun size={32} color={Colors.accentLight} strokeWidth={2} />
                    <Text style={styles.timeCardLabel}>Me despierto</Text>
                    <Text style={styles.timeCardTime}>
                      {selectedWakeTime ? formatTime(selectedWakeTime) : '--:--'}
                    </Text>
                    <Text style={styles.timeCardHint}>Toca para configurar</Text>
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Duration Badge */}
              {selectedWakeTime && (
                <View style={styles.durationBadge}>
                  <Clock size={20} color={Colors.primaryLight} />
                  <Text style={styles.durationText}>
                    Dormirás aproximadamente {getSleepDuration()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Main Card */}
          <View style={styles.mainCard}>
            <LinearGradient
              colors={[Colors.card, Colors.cardLight]}
              style={styles.cardGradient}
            >
              {!isTracking ? (
                <>
                  <Animated.View style={[styles.iconContainer, { 
                    transform: [{ 
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1]
                      })
                    }]
                  }]}>
                    <Moon size={96} color={Colors.primaryLight} strokeWidth={1.5} />
                  </Animated.View>
                  <Text style={styles.readyText}>Todo listo para rastrear tu sueño</Text>
                </>
              ) : (
                <>
                  <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Moon size={96} color={Colors.primaryLight} strokeWidth={1.5} />
                  </Animated.View>
                  {currentSession && (
                    <View style={styles.trackingInfo}>
                      <Text style={styles.trackingLabel}>Tiempo dormido</Text>
                      <Text style={styles.trackingTime}>{getElapsedTime()}</Text>
                      <Text style={styles.trackingSubtext}>
                        Comenzó a las {formatTime(currentSession.startTime)}
                      </Text>
                      {currentSession.alarmTime && (
                        <View style={styles.alarmBadge}>
                          <Bell size={16} color={Colors.warning} />
                          <Text style={styles.alarmText}>
                            Alarma a las {formatTime(currentSession.alarmTime)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.mainButton}
                onPress={handleStartStop}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isTracking ? [Colors.error, Colors.errorDark] : [Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isTracking ? 'Detener seguimiento' : 'Comenzar seguimiento'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Recommended Wake Times - After Tracking Starts */}
          {isTracking && wakeTimeOptions.length > 0 && (
            <View style={styles.wakeTimes}>
              <View style={styles.wakeTimesHeader}>
                <Clock size={20} color={Colors.primaryLight} />
                <Text style={styles.wakeTimesTitle}>
                  Horarios óptimos para despertar
                </Text>
              </View>
              <Text style={styles.wakeTimesSubtitle}>
                Basado en ciclos de sueño de 90 minutos
              </Text>

              <View style={styles.wakeTimesList}>
                {wakeTimeOptions.map((option, index) => {
                  const isSelected = selectedWakeTime?.getTime() === option.time.getTime();
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleRecommendedTimeSelect(option.time)}
                      style={[styles.wakeTimeCard, isSelected && styles.wakeTimeCardSelected]}
                    >
                      <LinearGradient
                        colors={isSelected ? [Colors.primary, Colors.secondary] : [Colors.card, Colors.cardLight]}
                        style={styles.wakeTimeGradient}
                      >
                        <View style={styles.wakeTimeLeft}>
                          {isSelected && <View style={styles.selectedDot} />}
                          <Text style={[styles.wakeTimeLabel, isSelected && styles.wakeTimeLabelSelected]}>
                            {option.label}
                          </Text>
                        </View>
                        <Text style={[styles.wakeTime, isSelected && styles.wakeTimeSelected]}>
                          {formatTime(option.time)}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Bed Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showBedTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBedTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hora de dormir</Text>
                <TouchableOpacity
                  onPress={() => setShowBedTimePicker(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={bedTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (date) handleBedTimeSelect(date);
                }}
                textColor={Colors.text}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowBedTimePicker(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Wake Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showWakeTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWakeTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hora de despertar</Text>
                <TouchableOpacity
                  onPress={() => setShowWakeTimePicker(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedWakeTime || new Date(bedTime.getTime() + 8 * 60 * 60 * 1000)}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (date) handleWakeTimeSelect(date);
                }}
                textColor={Colors.text}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowWakeTimePicker(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showBedTimePicker && (
        <DateTimePicker
          value={bedTime}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowBedTimePicker(false);
            if (date && event.type === 'set') {
              handleBedTimeSelect(date);
            }
          }}
        />
      )}

      {Platform.OS === 'android' && showWakeTimePicker && (
        <DateTimePicker
          value={selectedWakeTime || new Date(bedTime.getTime() + 8 * 60 * 60 * 1000)}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowWakeTimePicker(false);
            if (date && event.type === 'set') {
              handleWakeTimeSelect(date);
            }
          }}
        />
      )}

      {Platform.OS === 'web' && (
        <>
          <Modal
            visible={showBedTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowBedTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hora de dormir</Text>
                  <TouchableOpacity
                    onPress={() => setShowBedTimePicker(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginBottom: 24 }}>
                  <input
                    type="time"
                    value={bedTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newTime = new Date();
                      newTime.setHours(hours, minutes);
                      handleBedTimeSelect(newTime);
                    }}
                    style={{
                      fontSize: 18,
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${Colors.border}`,
                      backgroundColor: Colors.card,
                      color: Colors.text,
                      width: '100%',
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => setShowBedTimePicker(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Confirmar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showWakeTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowWakeTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hora de despertar</Text>
                  <TouchableOpacity
                    onPress={() => setShowWakeTimePicker(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginBottom: 24 }}>
                  <input
                    type="time"
                    value={(selectedWakeTime || new Date()).toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newTime = new Date();
                      newTime.setHours(hours, minutes);
                      handleWakeTimeSelect(newTime);
                    }}
                    style={{
                      fontSize: 18,
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${Colors.border}`,
                      backgroundColor: Colors.card,
                      color: Colors.text,
                      width: '100%',
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => setShowWakeTimePicker(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Confirmar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
    </AnimatedTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  timeSelectionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  timeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  timeCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  timeCardContent: {
    alignItems: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  timeCardLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  timeCardTime: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  timeCardHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  durationText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  mainCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  readyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  trackingInfo: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  trackingLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackingTime: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  trackingSubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  alarmText: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
  },
  mainButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wakeTimes: {
    marginBottom: 20,
  },
  wakeTimesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  wakeTimesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  wakeTimesSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  wakeTimesList: {
    gap: 12,
  },
  wakeTimeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  wakeTimeCardSelected: {
    borderColor: Colors.primary,
  },
  wakeTimeGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wakeTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  wakeTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  wakeTimeLabelSelected: {
    color: '#FFFFFF',
  },
  wakeTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  wakeTimeSelected: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
    backgroundColor: Colors.card,
    borderRadius: 20,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
