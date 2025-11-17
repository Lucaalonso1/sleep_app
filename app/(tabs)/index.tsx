import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Animated, Platform, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Clock, Bell, Plus, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
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
  const [pulseDotAnim] = useState(new Animated.Value(1));
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmAnim] = useState(new Animated.Value(0));
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Pulse animation for monitoring dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseDotAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseDotAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseDotAnim.setValue(1);
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

  // Define alarm functions before using them in useEffect
  const playAlarmSound = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Create alarm tone using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        // Play beep pattern
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 300);
        
        // Repeat every second
        soundIntervalRef.current = setInterval(() => {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.value = 0.3;
          osc.start();
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 300);
        }, 1000);
      } else {
        // Use device notification sound for mobile
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }, []);

  const triggerAlarm = useCallback(async () => {
    setShowAlarmModal(true);
    
    // Play alarm sound
    await playAlarmSound();
    
    // Vibration pattern for alarm
    if (Platform.OS !== 'web') {
      // Initial strong vibration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Continue vibrating every 2 seconds until dismissed
      vibrateIntervalRef.current = setInterval(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 2000);
    }
  }, [playAlarmSound]);

  // Check alarm time and stop tracking when reached
  useEffect(() => {
    if (!isTracking || !currentSession?.alarmTime) return;

    const checkAlarm = setInterval(() => {
      const now = new Date();
      const alarmTime = currentSession.alarmTime;
      
      if (alarmTime && now >= alarmTime) {
        // Trigger alarm
        triggerAlarm();
        clearInterval(checkAlarm);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkAlarm);
  }, [isTracking, currentSession?.alarmTime, triggerAlarm]);

  // Alarm animation
  useEffect(() => {
    if (showAlarmModal) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alarmAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(alarmAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      alarmAnim.setValue(0);
    }
  }, [showAlarmModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals on unmount
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
      }
    };
  }, []);

  const handleDismissAlarm = async () => {
    // Clear sound interval
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    
    // Clear vibration interval
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    
    // Stop alarm sound if playing
    if (alarmSoundRef.current) {
      try {
        await alarmSoundRef.current.stopAsync();
        await alarmSoundRef.current.unloadAsync();
        alarmSoundRef.current = null;
      } catch (error) {
        console.error('Error stopping alarm sound:', error);
      }
    }
    
    setShowAlarmModal(false);
    await stopTracking();
    setWakeTimeOptions([]);
    setSelectedWakeTime(null);
  };

  const handleStartStop = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isTracking) {
      await stopTracking();
      setWakeTimeOptions([]);
      setSelectedWakeTime(null);
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
                      
                      {/* Noise monitoring indicator */}
                      <View style={styles.noiseMonitoringSection}>
                        <View style={styles.noiseMonitoringIndicator}>
                          <Animated.View 
                            style={[
                              styles.pulsingDot,
                              { 
                                transform: [{ scale: pulseDotAnim }],
                                opacity: pulseDotAnim.interpolate({
                                  inputRange: [1, 1.5],
                                  outputRange: [1, 0.6]
                                })
                              }
                            ]} 
                          />
                          <Text style={styles.noiseMonitoringText}>
                            Monitoreando ruidos
                          </Text>
                        </View>
                        {currentSession.audioRecordings.length > 0 && (
                          <View style={styles.noiseCountBadge}>
                            <Sparkles size={14} color={Colors.warning} />
                            <Text style={styles.noiseCountText}>
                              {currentSession.audioRecordings.length} {currentSession.audioRecordings.length === 1 ? 'ruido detectado' : 'ruidos detectados'}
                            </Text>
                          </View>
                        )}
                      </View>

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

      {/* Alarm Modal */}
      <Modal
        visible={showAlarmModal}
        transparent
        animationType="fade"
        onRequestClose={handleDismissAlarm}
      >
        <View style={styles.alarmModalOverlay}>
          <View style={styles.alarmModalContent}>
            <LinearGradient
              colors={[Colors.background, Colors.backgroundSecondary]}
              style={styles.alarmGradient}
            >
              <Animated.View style={[styles.alarmIconContainer, {
                transform: [{
                  scale: alarmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15]
                  })
                }]
              }]}>
                <Sun size={80} color={Colors.accentLight} strokeWidth={2} />
              </Animated.View>
              
              <Text style={styles.alarmTitle}>¡Es hora de despertar!</Text>
              <Text style={styles.alarmSubtitle}>
                {currentSession?.alarmTime ? `Tu alarma de las ${formatTime(currentSession.alarmTime)}` : 'Tu alarma está sonando'}
              </Text>
              
              {currentSession && (
                <View style={styles.alarmStats}>
                  <View style={styles.alarmStatCard}>
                    <Text style={styles.alarmStatLabel}>Tiempo dormido</Text>
                    <Text style={styles.alarmStatValue}>{getElapsedTime()}</Text>
                  </View>
                  {currentSession.audioRecordings.length > 0 && (
                    <View style={styles.alarmStatCard}>
                      <Text style={styles.alarmStatLabel}>Ruidos detectados</Text>
                      <Text style={styles.alarmStatValue}>{currentSession.audioRecordings.length}</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.dismissAlarmButton}
                onPress={handleDismissAlarm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dismissButtonGradient}
                >
                  <Sun size={24} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.dismissButtonText}>
                    Buenos días
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  noiseMonitoringSection: {
    marginTop: 20,
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  noiseMonitoringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.success + '15',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  noiseMonitoringText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  noiseCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  noiseCountText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
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
  alarmModalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alarmModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  alarmGradient: {
    padding: 32,
    alignItems: 'center',
  },
  alarmIconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: Colors.accent + '20',
    borderRadius: 100,
  },
  alarmTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  alarmSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  alarmStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  alarmStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alarmStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  alarmStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  dismissAlarmButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  dismissButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  dismissButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
