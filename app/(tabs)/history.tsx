import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  History as HistoryIcon, 
  Trash2, 
  Play, 
  Moon, 
  Award, 
  BookOpen, 
  Clock, 
  Activity, 
  Brain,
  Sparkles 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import AnimatedTabScreen from '../../components/AnimatedTabScreen';
import Colors from '../../constants/colors';
import { formatDate, formatTime, formatDuration } from '../../lib/utils';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, deleteSession, isLoading } = useSleep();
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return Colors.success;
    if (quality >= 60) return Colors.warning;
    return Colors.error;
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excelente';
    if (quality >= 60) return 'Bueno';
    return 'Pobre';
  };

  const getQualityVariant = (quality: number): 'success' | 'warning' | 'destructive' => {
    if (quality >= 80) return 'success';
    if (quality >= 60) return 'warning';
    return 'destructive';
  };

  const handleDelete = async (sessionId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteSession(sessionId);
  };

  const playAudio = async (uri: string, recordingId: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (playingAudio === recordingId) {
        setPlayingAudio(null);
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      }

      if (Platform.OS === 'web') {
        const audio = new window.Audio(uri);
        audio.play();
        audio.onended = () => setPlayingAudio(null);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingAudio(null);
          }
        });
      }

      setPlayingAudio(recordingId);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  if (isLoading) {
    return (
      <AnimatedTabScreen routeName="/history">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </AnimatedTabScreen>
    );
  }

  return (
    <AnimatedTabScreen routeName="/history">
      <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={{ 
            paddingTop: insets.top + 16, 
            paddingHorizontal: 20, 
            paddingBottom: 40 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <HistoryIcon size={28} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.headerTitle}>Historial</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Revisa tus sesiones de sueño anteriores
            </Text>
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Moon size={64} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>
                Sin sesiones de sueño aún
              </Text>
              <Text style={styles.emptySubtitle}>
                Comienza a rastrear tu sueño para ver tu historial aquí
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionHeaderLeft}>
                        <Text style={styles.sessionDate}>
                          {formatDate(session.startTime)}
                        </Text>
                        <View style={styles.sessionTime}>
                          <Text style={styles.timeText}>
                            {formatTime(session.startTime)}
                          </Text>
                          {session.endTime && (
                            <>
                              <Text style={styles.timeArrow}>→</Text>
                              <Text style={styles.timeText}>
                                {formatTime(session.endTime)}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(session.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={20} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>

                    {/* Quality Badge */}
                    {session.sleepQuality !== undefined && (
                      <View style={styles.qualitySection}>
                        <View 
                          style={[
                            styles.qualityBadge,
                            { backgroundColor: getQualityColor(session.sleepQuality) + '20' }
                          ]}
                        >
                          <View style={styles.qualityLeft}>
                            <Award size={22} color={getQualityColor(session.sleepQuality)} />
                            <View>
                              <Text style={[styles.qualityScore, { color: getQualityColor(session.sleepQuality) }]}>
                                {Math.round(session.sleepQuality)}
                              </Text>
                              <Text style={styles.qualityScoreLabel}>Puntuación</Text>
                            </View>
                          </View>
                          <Text style={[styles.qualityLabel, { color: getQualityColor(session.sleepQuality) }]}>
                            {getQualityLabel(session.sleepQuality)}
                          </Text>
                        </View>
                        
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              { 
                                width: `${session.sleepQuality}%`,
                                backgroundColor: getQualityColor(session.sleepQuality)
                              }
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Metrics */}
                    <View style={styles.metricsGrid}>
                      {session.duration && (
                        <View style={styles.metricItem}>
                          <View style={[styles.metricIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                            <Clock size={18} color={Colors.primary} />
                          </View>
                          <Text style={styles.metricValue}>
                            {formatDuration(session.duration)}
                          </Text>
                          <Text style={styles.metricLabel}>
                            Sueño total
                          </Text>
                        </View>
                      )}
                      {session.deepSleepPercent !== undefined && (
                        <View style={styles.metricItem}>
                          <View style={[styles.metricIconContainer, { backgroundColor: Colors.accent + '15' }]}>
                            <Brain size={18} color={Colors.accent} />
                          </View>
                          <Text style={styles.metricValue}>
                            {Math.round(session.deepSleepPercent)}%
                          </Text>
                          <Text style={styles.metricLabel}>
                            Sueño profundo
                          </Text>
                        </View>
                      )}
                      {session.interruptions !== undefined && (
                        <View style={styles.metricItem}>
                          <View style={[styles.metricIconContainer, { 
                            backgroundColor: (session.interruptions > 3 ? Colors.error : Colors.success) + '15' 
                          }]}>
                            <Activity 
                              size={18} 
                              color={session.interruptions > 3 ? Colors.error : Colors.success} 
                            />
                          </View>
                          <Text style={styles.metricValue}>
                            {session.interruptions}
                          </Text>
                          <Text style={styles.metricLabel}>
                            Interrupciones
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Dream Journal */}
                    {session.dreamJournal && (
                      <View style={styles.journalSection}>
                        <View style={styles.journalHeader}>
                          <BookOpen size={16} color={Colors.accent} />
                          <Text style={styles.journalTitle}>
                            Diario de sueños
                          </Text>
                        </View>
                        <Text style={styles.journalText}>
                          {session.dreamJournal}
                        </Text>
                      </View>
                    )}

                    {/* Audio Recordings */}
                    {session.audioRecordings.length > 0 && (
                      <View style={styles.recordingsSection}>
                        <View style={styles.recordingsHeader}>
                          <HistoryIcon size={16} color={Colors.accent} />
                          <Text style={styles.recordingsTitle}>
                            Grabaciones ({session.audioRecordings.length})
                          </Text>
                        </View>
                        <View style={styles.recordingsList}>
                          {session.audioRecordings.map((recording: any) => (
                            <Pressable
                              key={recording.id}
                              onPress={() => playAudio(recording.uri, recording.id)}
                              style={[
                                styles.recordingItem,
                                playingAudio === recording.id && styles.recordingItemActive
                              ]}
                            >
                              <Play
                                size={16}
                                color={
                                  playingAudio === recording.id
                                    ? Colors.accent
                                    : Colors.textSecondary
                                }
                                fill={
                                  playingAudio === recording.id
                                    ? Colors.accent
                                    : 'transparent'
                                }
                              />
                              <Text style={[
                                styles.recordingTime,
                                playingAudio === recording.id && styles.recordingTimeActive
                              ]}>
                                {formatTime(recording.timestamp)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
    </AnimatedTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
  },
  // Header
  header: {
    marginBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  // Session List
  sessionList: {
    gap: 16,
  },
  cardContent: {
    padding: 20,
    gap: 20,
  },
  // Session Header
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeArrow: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  deleteButton: {
    padding: 8,
    marginTop: -4,
    marginRight: -4,
  },
  // Quality Section
  qualitySection: {
    gap: 12,
  },
  qualityBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qualityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityScore: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  qualityScoreLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Journal Section
  journalSection: {
    padding: 16,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  journalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Recordings Section
  recordingsSection: {
    gap: 12,
  },
  recordingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordingsList: {
    gap: 8,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordingItemActive: {
    backgroundColor: Colors.accent + '15',
    borderColor: Colors.accent,
  },
  recordingTime: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  recordingTimeActive: {
    color: Colors.accent,
  },
});
