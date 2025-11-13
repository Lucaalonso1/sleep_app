import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import {
  Waves,
  CloudRain,
  Wind,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';

const { width } = Dimensions.get('window');

interface SoundOption {
  id: string;
  name: string;
  icon: typeof Waves;
  color: string;
  gradient: string[];
  url: string;
}

const SOUNDS: SoundOption[] = [
  {
    id: 'ocean',
    name: 'Olas del océano',
    icon: Waves,
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
  },
  {
    id: 'rain',
    name: 'Lluvia',
    icon: CloudRain,
    color: '#6366F1',
    gradient: ['#6366F1', '#4F46E5'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3',
  },
  {
    id: 'wind',
    name: 'Viento',
    icon: Wind,
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2389/2389-preview.mp3',
  },
  {
    id: 'nature',
    name: 'Naturaleza',
    icon: Music,
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2391/2391-preview.mp3',
  },
];

export default function SoundsScreen() {
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async (soundOption: SoundOption) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (playingId === soundOption.id) {
        setPlayingId(null);
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      }

      if (Platform.OS === 'web') {
        const audio = new window.Audio(soundOption.url);
        audio.loop = true;
        audio.volume = isMuted ? 0 : volume;
        audio.play();
        
        audio.onended = () => setPlayingId(null);
        
        setPlayingId(soundOption.id);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: soundOption.url },
          { 
            shouldPlay: true,
            isLooping: true,
            volume: isMuted ? 0 : volume,
          }
        );
        
        setSound(newSound);
        setPlayingId(soundOption.id);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const toggleMute = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (sound) {
      await sound.setVolumeAsync(newMutedState ? 0 : volume);
    }
  };

  const adjustVolume = async (newVolume: number) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setVolume(newVolume);
    if (sound && !isMuted) {
      await sound.setVolumeAsync(newVolume);
    }
  };

  return (
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
              <Text style={styles.title}>Sonidos ambientales</Text>
            </View>
            <Text style={styles.subtitle}>
              Relájate con sonidos relajantes para ayudarte a dormir
            </Text>
          </View>

          {/* Sounds Grid */}
          <View style={styles.soundsGrid}>
            {SOUNDS.map((soundOption) => {
              const Icon = soundOption.icon;
              const isPlaying = playingId === soundOption.id;

              return (
                <Pressable
                  key={soundOption.id}
                  onPress={() => playSound(soundOption)}
                  style={[
                    styles.soundCard,
                    { width: (width - 52) / 2 },
                    isPlaying && styles.soundCardPlaying
                  ]}
                >
                  <LinearGradient
                    colors={isPlaying ? soundOption.gradient as any : [Colors.card, Colors.cardLight]}
                    style={styles.soundCardGradient}
                  >
                    <View style={[styles.soundIcon, isPlaying && styles.soundIconPlaying]}>
                      <Icon
                        size={36}
                        color={isPlaying ? '#FFF' : soundOption.color}
                        strokeWidth={1.5}
                      />
                    </View>
                    
                    <Text style={[styles.soundName, isPlaying && styles.soundNamePlaying]}>
                      {soundOption.name}
                    </Text>
                    
                    <View style={styles.soundStatus}>
                      {isPlaying ? (
                        <>
                          <Pause size={14} color="#FFF" fill="#FFF" />
                          <Text style={styles.soundStatusTextPlaying}>Reproduciendo</Text>
                        </>
                      ) : (
                        <>
                          <Play size={14} color={Colors.textSecondary} />
                          <Text style={styles.soundStatusText}>Reproducir</Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          {/* Playback Controls */}
          {playingId && (
            <View style={styles.controlsCard}>
              <LinearGradient
                colors={[Colors.card, Colors.cardLight]}
                style={styles.controlsGradient}
              >
                <View style={styles.controlsHeader}>
                  <Text style={styles.controlsTitle}>Controles de reproducción</Text>
                  <TouchableOpacity 
                    onPress={toggleMute} 
                    style={styles.muteButton}
                  >
                    {isMuted ? (
                      <VolumeX size={24} color={Colors.error} />
                    ) : (
                      <Volume2 size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.volumeSection}>
                  <Text style={styles.volumeLabel}>Volumen</Text>
                  
                  {/* Volume Bar */}
                  <View style={styles.volumeBar}>
                    <View
                      style={[styles.volumeFill, { width: `${volume * 100}%` }]}
                    />
                  </View>

                  {/* Volume Marks */}
                  <View style={styles.volumeMarks}>
                    {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                      <TouchableOpacity
                        key={mark}
                        onPress={() => adjustVolume(mark)}
                        style={[
                          styles.volumeMark,
                          Math.abs(volume - mark) < 0.1 && styles.volumeMarkActive
                        ]}
                      />
                    ))}
                  </View>
                  
                  <View style={styles.volumeLabels}>
                    <Text style={styles.volumeLabelText}>0%</Text>
                    <Text style={styles.volumeLabelText}>100%</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
              style={styles.tipsGradient}
            >
              <View style={styles.tipsHeader}>
                <Sparkles size={20} color="#FFF" />
                <Text style={styles.tipsTitle}>Consejos Pro</Text>
              </View>
              <Text style={styles.tipsText}>
                • Los sonidos ambientales ayudan a enmascarar ruidos molestos{'\n'}
                • Reproduce sonidos 20-30 minutos antes de dormir{'\n'}
                • Un volumen más bajo crea un efecto más sutil{'\n'}
                • Combínalos con ejercicios de respiración para mejores resultados
              </Text>
            </LinearGradient>
          </View>
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
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  soundCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  soundCardPlaying: {
    borderColor: Colors.primary,
  },
  soundCardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  soundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: Colors.card,
  },
  soundIconPlaying: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  soundName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  soundNamePlaying: {
    color: '#FFFFFF',
  },
  soundStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soundStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  soundStatusTextPlaying: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controlsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlsGradient: {
    padding: 20,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  muteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
  },
  volumeSection: {
    gap: 12,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  volumeBar: {
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  volumeMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  volumeMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  volumeMarkActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.25 }],
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeLabelText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  tipsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsGradient: {
    padding: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  tipsText: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 24,
    opacity: 0.95,
  },
});
