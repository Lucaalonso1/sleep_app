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
  const [wakeTimeOptions, setWakeTimeOptions] = useState<any[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(new Date());
  const [isCustomTime, setIsCustomTime] = useState(false);

  useEffect(() => {
    if (!isTracking) {
      const now = new Date();
      const options = calculateWakeTimes(now);
      setWakeTimeOptions(options);
      if (options.length > 0 && !isCustomTime) {
        setSelectedWakeTime(options[1].time);
      }
    }
  }, [isTracking, calculateWakeTimes]);

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

  const handleStartStop = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isTracking) {
      await stopTracking();
    } else {
      await startTracking(selectedWakeTime || undefined);
    }
  };

  const handleCustomTimeSelect = () => {
    setSelectedWakeTime(customTime);
    setIsCustomTime(true);
    setShowCustomTimePicker(false);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handlePresetTimeSelect = async (time: Date) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setSelectedWakeTime(time);
    setIsCustomTime(false);
  };

  const handleShowTimePicker = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 8);
    setCustomTime(defaultTime);
    setShowCustomTimePicker(true);
  };

  const getElapsedTime = () => {
    if (!currentSession) return '0h 0m';
    const elapsed = (Date.now() - currentSession.startTime.getTime()) / 1000;
    return formatDuration(elapsed);
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
                : 'Rastrea tu sueño y despierta renovado'}
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.mainCard}>
            <LinearGradient
              colors={[Colors.card, Colors.cardLight]}
              style={styles.cardGradient}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                {isTracking ? (
                  <Moon size={96} color={Colors.primaryLight} strokeWidth={1.5} />
                ) : (
                  <Sun size={96} color={Colors.accentLight} strokeWidth={1.5} />
                )}
              </Animated.View>

              {isTracking && currentSession && (
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

          {/* Wake Times */}
          {!isTracking && (
            <View style={styles.wakeTimes}>
              <View style={styles.wakeTimesHeader}>
                <Clock size={20} color={Colors.primaryLight} />
                <Text style={styles.wakeTimesTitle}>
                  Horarios de despertar recomendados
                </Text>
              </View>
              <Text style={styles.wakeTimesSubtitle}>
                Basado en ciclos de sueño de 90 minutos
              </Text>

              <View style={styles.wakeTimesList}>
                {wakeTimeOptions.map((option, index) => {
                  const isSelected = !isCustomTime && selectedWakeTime?.getTime() === option.time.getTime();
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handlePresetTimeSelect(option.time)}
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

                {/* Custom Time */}
                <Pressable
                  onPress={handleShowTimePicker}
                  style={[styles.wakeTimeCard, isCustomTime && styles.wakeTimeCardSelected]}
                >
                  <LinearGradient
                    colors={isCustomTime ? [Colors.primary, Colors.secondary] : [Colors.card, Colors.cardLight]}
                    style={styles.wakeTimeGradient}
                  >
                    {isCustomTime ? (
                      <>
                        <View style={styles.wakeTimeLeft}>
                          <View style={styles.selectedDot} />
                          <Text style={[styles.wakeTimeLabel, styles.wakeTimeLabelSelected]}>
                            Personalizado
                          </Text>
                        </View>
                        <Text style={[styles.wakeTime, styles.wakeTimeSelected]}>
                          {formatTime(selectedWakeTime!)}
                        </Text>
                      </>
                    ) : (
                      <View style={styles.customTimeContent}>
                        <Plus size={20} color={Colors.primaryLight} />
                        <Text style={styles.customTimeText}>Elegir tu horario</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showCustomTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCustomTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Elegir hora</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomTimePicker(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={customTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setCustomTime(date);
                }}
                textColor={Colors.text}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCustomTimeSelect}
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

      {Platform.OS === 'android' && showCustomTimePicker && (
        <DateTimePicker
          value={customTime}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowCustomTimePicker(false);
            if (date && event.type === 'set') {
              setCustomTime(date);
              setSelectedWakeTime(date);
              setIsCustomTime(true);
            }
          }}
        />
      )}

      {Platform.OS === 'web' && (
        <Modal
          visible={showCustomTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCustomTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Elegir hora</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomTimePicker(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ marginBottom: 24 }}>
                <input
                  type="time"
                  value={customTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newTime = new Date();
                    newTime.setHours(hours, minutes);
                    setCustomTime(newTime);
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
                onPress={handleCustomTimeSelect}
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
  customTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  customTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryLight,
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
