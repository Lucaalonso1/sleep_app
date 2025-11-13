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
      <View style={styles.centerContainer}>
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
          contentContainerStyle={{ 
            paddingTop: insets.top + 16, 
            paddingHorizontal: 20, 
            paddingBottom: 40 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View >
            <View >
              <HistoryIcon size={24} color={Colors.accent} />
              <Text >Historial</Text>
            </View>
            <Text >
              Revisa tus sesiones de sueño anteriores
            </Text>
          </View>

          {sessions.length === 0 ? (
            <View >
              <Moon size={64} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text >
                Sin sesiones de sueño aún
              </Text>
              <Text >
                Comienza a rastrear tu sueño para ver tu historial aquí
              </Text>
            </View>
          ) : (
            <View >
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent >
                    {/* Header */}
                    <View >
                      <View >
                        <Text >
                          {formatDate(session.startTime)}
                        </Text>
                        <View >
                          <Text >
                            {formatTime(session.startTime)}
                          </Text>
                          {session.endTime && (
                            <>
                              <Text >→</Text>
                              <Text >
                                {formatTime(session.endTime)}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(session.id)}
                        
                      >
                        <Trash2 size={20} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>

                    {/* Quality Badge */}
                    {session.sleepQuality !== undefined && (
                      <View >
                        <View 
                          
                          style={{ backgroundColor: getQualityColor(session.sleepQuality) }}
                        >
                          <View >
                            <Award size={20} color="#FFF" />
                            <View>
                              <Text >
                                {Math.round(session.sleepQuality)}
                              </Text>
                              <Text >Puntuación</Text>
                            </View>
                          </View>
                          <Text >
                            {getQualityLabel(session.sleepQuality)}
                          </Text>
                        </View>
                        
                        {/* Progress Bar */}
                        <View >
                          <View
                            
                            style={{ 
                              width: `${session.sleepQuality}%`,
                              backgroundColor: getQualityColor(session.sleepQuality)
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {/* Metrics */}
                    <View >
                      {session.duration && (
                        <View >
                          <Clock size={18} color={Colors.primary} />
                          <Text >
                            {formatDuration(session.duration)}
                          </Text>
                          <Text >
                            Sueño total
                          </Text>
                        </View>
                      )}
                      {session.deepSleepPercent !== undefined && (
                        <View >
                          <Brain size={18} color={Colors.accent} />
                          <Text >
                            {Math.round(session.deepSleepPercent)}%
                          </Text>
                          <Text >
                            Sueño profundo
                          </Text>
                        </View>
                      )}
                      {session.interruptions !== undefined && (
                        <View >
                          <Activity 
                            size={18} 
                            color={session.interruptions > 3 ? Colors.error : Colors.success} 
                          />
                          <Text >
                            {session.interruptions}
                          </Text>
                          <Text >
                            Interrupciones
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Dream Journal */}
                    {session.dreamJournal && (
                      <View >
                        <View >
                          <BookOpen size={16} color={Colors.accent} />
                          <Text >
                            Diario de sueños
                          </Text>
                        </View>
                        <Text >
                          {session.dreamJournal}
                        </Text>
                      </View>
                    )}

                    {/* Audio Recordings */}
                    {session.audioRecordings.length > 0 && (
                      <View >
                        <View >
                          <HistoryIcon size={16} color={Colors.accent} />
                          <Text >
                            Grabaciones ({session.audioRecordings.length})
                          </Text>
                        </View>
                        <View >
                          {session.audioRecordings.map((recording) => (
                            <Pressable
                              key={recording.id}
                              onPress={() => playAudio(recording.uri, recording.id)}
                              className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                                playingAudio === recording.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-background border-border'
                              }`}
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
                              <Text className={`text-sm font-medium ${
                                playingAudio === recording.id
                                  ? 'text-accent'
                                  : 'text-muted-foreground'
                              }`}>
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
});
