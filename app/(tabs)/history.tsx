import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { History as HistoryIcon, Trash2, Play, Moon, Award, BookOpen, Clock, Activity, Brain } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import Colors from '../../constants/colors';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, deleteSession, isLoading } = useSleep();
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return '#4CAF50';
    if (quality >= 60) return '#FFC107';
    return '#FF5252';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    return 'Poor';
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
        >
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Moon size={64} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Sleep Sessions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your sleep to see your history here
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {sessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <LinearGradient
                    colors={[Colors.card, Colors.cardLight]}
                    style={styles.sessionGradient}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.headerLeft}>
                        <Text style={styles.sessionDate}>
                          {formatDate(session.startTime)}
                        </Text>
                        <View style={styles.sessionTimeRange}>
                          <Text style={styles.timeText}>{formatTime(session.startTime)}</Text>
                          {session.endTime && (
                            <>
                              <Text style={styles.timeSeparator}>→</Text>
                              <Text style={styles.timeText}>{formatTime(session.endTime)}</Text>
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

                    {session.sleepQuality !== undefined && (
                      <View style={styles.qualitySection}>
                        <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(session.sleepQuality) }]}>
                          <View style={styles.qualityLeft}>
                            <Award size={20} color="#FFF" />
                            <View>
                              <Text style={styles.qualityScore}>{Math.round(session.sleepQuality)}</Text>
                              <Text style={styles.qualitySubtext}>Score</Text>
                            </View>
                          </View>
                          <Text style={styles.qualityLabel}>{getQualityLabel(session.sleepQuality)}</Text>
                        </View>
                        
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${session.sleepQuality}%`,
                                backgroundColor: getQualityColor(session.sleepQuality)
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.metricsGrid}>
                      {session.duration && (
                        <View style={styles.metricCard}>
                          <Clock size={18} color={Colors.primary} />
                          <Text style={styles.metricValue}>
                            {formatDuration(session.duration)}
                          </Text>
                          <Text style={styles.metricLabel}>Total Sleep</Text>
                        </View>
                      )}
                      {session.deepSleepPercent !== undefined && (
                        <View style={styles.metricCard}>
                          <Brain size={18} color={Colors.accent} />
                          <Text style={styles.metricValue}>
                            {Math.round(session.deepSleepPercent)}%
                          </Text>
                          <Text style={styles.metricLabel}>Deep Sleep</Text>
                        </View>
                      )}
                      {session.interruptions !== undefined && (
                        <View style={styles.metricCard}>
                          <Activity size={18} color={session.interruptions > 3 ? Colors.error : Colors.success} />
                          <Text style={styles.metricValue}>
                            {session.interruptions}
                          </Text>
                          <Text style={styles.metricLabel}>Interruptions</Text>
                        </View>
                      )}
                    </View>

                    {session.dreamJournal && (
                      <View style={styles.dreamJournalSection}>
                        <View style={styles.dreamHeader}>
                          <BookOpen size={16} color={Colors.accent} />
                          <Text style={styles.dreamTitle}>Dream Journal</Text>
                        </View>
                        <Text style={styles.dreamText}>{session.dreamJournal}</Text>
                      </View>
                    )}

                    {session.audioRecordings.length > 0 && (
                      <View style={styles.audioSection}>
                        <View style={styles.audioHeader}>
                          <HistoryIcon size={16} color={Colors.accent} />
                          <Text style={styles.audioTitle}>
                            Recordings ({session.audioRecordings.length})
                          </Text>
                        </View>
                        <View style={styles.audioList}>
                          {session.audioRecordings.map((recording) => (
                            <TouchableOpacity
                              key={recording.id}
                              style={[
                                styles.audioItem,
                                playingAudio === recording.id && styles.audioItemPlaying,
                              ]}
                              onPress={() => playAudio(recording.uri, recording.id)}
                            >
                              <Play
                                size={16}
                                color={
                                  playingAudio === recording.id
                                    ? Colors.accent
                                    : Colors.primaryLight
                                }
                                fill={
                                  playingAudio === recording.id
                                    ? Colors.accent
                                    : 'transparent'
                                }
                              />
                              <Text style={[
                                styles.audioTime,
                                playingAudio === recording.id && styles.audioTimePlaying,
                              ]}>
                                {formatTime(recording.timestamp)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sessionsList: {
    gap: 16,
  },
  sessionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionGradient: {
    padding: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  sessionTimeRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  timeSeparator: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  deleteButton: {
    padding: 4,
  },
  qualitySection: {
    marginBottom: 20,
  },
  audioSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  audioList: {
    gap: 8,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioItemPlaying: {
    backgroundColor: Colors.cardLight,
    borderColor: Colors.accent,
  },
  audioTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  audioTimePlaying: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  qualityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityScore: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    lineHeight: 28,
  },
  qualitySubtext: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.85,
    marginTop: 2,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dreamJournalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dreamTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dreamText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
