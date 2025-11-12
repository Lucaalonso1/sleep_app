import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Clock, Bell, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import Colors from '../../constants/colors';

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
            toValue: 1.1,
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary, Colors.background]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isTracking ? 'Sleeping...' : 'Ready to Sleep?'}
            </Text>
            <Text style={styles.subtitle}>
              {isTracking 
                ? 'Recording your sleep sounds' 
                : 'Track your sleep and wake up refreshed'}
            </Text>
          </View>

          <View style={styles.mainCard}>
            <LinearGradient
              colors={[Colors.card, Colors.cardLight]}
              style={styles.cardGradient}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                {isTracking ? (
                  <Moon size={80} color={Colors.primaryLight} strokeWidth={1.5} />
                ) : (
                  <Sun size={80} color={Colors.accent} strokeWidth={1.5} />
                )}
              </Animated.View>

              {isTracking && currentSession && (
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>Time Asleep</Text>
                  <Text style={styles.trackingTime}>{getElapsedTime()}</Text>
                  <Text style={styles.trackingSubtext}>
                    Started at {formatTime(currentSession.startTime)}
                  </Text>
                  {currentSession.alarmTime && (
                    <View style={styles.alarmInfo}>
                      <Bell size={16} color={Colors.warning} />
                      <Text style={styles.alarmText}>
                        Alarm set for {formatTime(currentSession.alarmTime)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.mainButton,
                  isTracking && styles.mainButtonActive,
                ]}
                onPress={handleStartStop}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isTracking
                      ? [Colors.error, '#DC2626']
                      : [Colors.primary, Colors.secondary]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isTracking ? 'Stop Tracking' : 'Start Sleep Tracking'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {!isTracking && (
            <View style={styles.wakeTimes}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color={Colors.primaryLight} />
                <Text style={styles.sectionTitle}>Recommended Wake Times</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Based on 90-minute sleep cycles
              </Text>

              <View style={styles.wakeTimeGrid}>
                {wakeTimeOptions.map((option, index) => {
                  const isSelected = !isCustomTime && selectedWakeTime?.getTime() === option.time.getTime();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.wakeTimeCard,
                        isSelected && styles.wakeTimeCardSelected,
                      ]}
                      onPress={() => handlePresetTimeSelect(option.time)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          isSelected
                            ? [Colors.primary, Colors.secondary]
                            : [Colors.card, Colors.cardLight]
                        }
                        style={styles.wakeTimeGradient}
                      >
                        <Text style={[
                          styles.wakeTimeLabel,
                          isSelected && styles.wakeTimeLabelSelected,
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={[
                          styles.wakeTime,
                          isSelected && styles.wakeTimeSelected,
                        ]}>
                          {formatTime(option.time)}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.wakeTimeCard,
                    isCustomTime && styles.wakeTimeCardSelected,
                  ]}
                  onPress={handleShowTimePicker}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      isCustomTime
                        ? [Colors.primary, Colors.secondary]
                        : [Colors.card, Colors.cardLight]
                    }
                    style={styles.wakeTimeGradient}
                  >
                    {isCustomTime ? (
                      <>
                        <Text style={[styles.wakeTimeLabel, styles.wakeTimeLabelSelected]}>
                          Custom
                        </Text>
                        <Text style={[styles.wakeTime, styles.wakeTimeSelected]}>
                          {formatTime(selectedWakeTime!)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.customTimeContent}>
                          <Plus size={20} color={Colors.primaryLight} />
                          <Text style={styles.customTimeText}>Choose Your Time</Text>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

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
                <Text style={styles.modalTitle}>Choose Wake Time</Text>
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
                style={styles.timePicker}
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
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
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
                <Text style={styles.modalTitle}>Choose Wake Time</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomTimePicker(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.webTimePickerContainer}>
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
                    border: `1px solid ${Colors.cardLight}`,
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
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
    padding: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mainCard: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  trackingTime: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  trackingSubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  alarmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.cardLight,
    borderRadius: 12,
  },
  alarmText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
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
  mainButtonActive: {
    shadowColor: Colors.error,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wakeTimes: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  wakeTimeGrid: {
    gap: 12,
  },
  wakeTimeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  wakeTimeCardSelected: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  wakeTimeGradient: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wakeTimeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  wakeTimeLabelSelected: {
    color: Colors.text,
  },
  wakeTime: {
    fontSize: 24,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    color: Colors.primaryLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  timePicker: {
    width: '100%',
    marginBottom: 24,
  },
  webTimePickerContainer: {
    marginBottom: 24,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
