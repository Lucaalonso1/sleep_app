import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
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
    name: 'Ocean Waves',
    icon: Waves,
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
  },
  {
    id: 'rain',
    name: 'Rain',
    icon: CloudRain,
    color: '#6366F1',
    gradient: ['#6366F1', '#4F46E5'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3',
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: Wind,
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    url: 'https://assets.mixkit.co/active_storage/sfx/2389/2389-preview.mp3',
  },
  {
    id: 'nature',
    name: 'Nature',
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
    setVolume(newVolume);
    if (sound && !isMuted) {
      await sound.setVolumeAsync(newVolume);
    }
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
            <Text style={styles.title}>Ambient Sounds</Text>
            <Text style={styles.subtitle}>
              Relax with soothing sounds to help you fall asleep
            </Text>
          </View>

          <View style={styles.soundsGrid}>
            {SOUNDS.map((soundOption) => {
              const Icon = soundOption.icon;
              const isPlaying = playingId === soundOption.id;

              return (
                <TouchableOpacity
                  key={soundOption.id}
                  style={[
                    styles.soundCard,
                    isPlaying && styles.soundCardActive,
                  ]}
                  onPress={() => playSound(soundOption)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isPlaying ? soundOption.gradient : [Colors.card, Colors.cardLight]}
                    style={styles.soundGradient}
                  >
                    <View style={[
                      styles.iconContainer,
                      isPlaying && styles.iconContainerActive,
                    ]}>
                      <Icon
                        size={32}
                        color={isPlaying ? '#FFF' : soundOption.color}
                        strokeWidth={1.5}
                      />
                    </View>
                    
                    <Text style={[
                      styles.soundName,
                      isPlaying && styles.soundNameActive,
                    ]}>
                      {soundOption.name}
                    </Text>
                    
                    <View style={styles.playButton}>
                      {isPlaying ? (
                        <Pause size={16} color={isPlaying ? '#FFF' : Colors.text} fill={isPlaying ? '#FFF' : 'transparent'} />
                      ) : (
                        <Play size={16} color={Colors.textSecondary} />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {playingId && (
            <View style={styles.controlsCard}>
              <LinearGradient
                colors={[Colors.card, Colors.cardLight]}
                style={styles.controlsGradient}
              >
                <View style={styles.controlsHeader}>
                  <Text style={styles.controlsTitle}>Playback Controls</Text>
                  <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                    {isMuted ? (
                      <VolumeX size={24} color={Colors.error} />
                    ) : (
                      <Volume2 size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.volumeControl}>
                  <Text style={styles.volumeLabel}>Volume</Text>
                  <View style={styles.volumeSliderContainer}>
                    <View style={styles.volumeTrack}>
                      <View
                        style={[
                          styles.volumeFill,
                          { width: `${volume * 100}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.volumeMarks}>
                      {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                        <TouchableOpacity
                          key={mark}
                          style={[
                            styles.volumeMark,
                            Math.abs(volume - mark) < 0.1 && styles.volumeMarkActive,
                          ]}
                          onPress={() => adjustVolume(mark)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.volumeLabels}>
                    <Text style={styles.volumeValue}>0%</Text>
                    <Text style={styles.volumeValue}>100%</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          <View style={styles.tipsCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.tipsGradient}
            >
              <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
              <Text style={styles.tipsText}>
                • Ambient sounds can help mask disruptive noises{'\n'}
                • Play sounds 20-30 minutes before bed{'\n'}
                • Lower volume creates a more subtle effect{'\n'}
                • Combine with breathing exercises for best results
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
    padding: 20,
    paddingBottom: 40,
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
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  soundCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  soundCardActive: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  soundGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
    minHeight: 160,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  soundNameActive: {
    color: '#FFF',
  },
  playButton: {
    marginTop: 4,
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  muteButton: {
    padding: 4,
  },
  volumeControl: {
    gap: 12,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  volumeSliderContainer: {
    position: 'relative',
  },
  volumeTrack: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
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
    transform: [{ scale: 1.3 }],
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeValue: {
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
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 22,
    opacity: 0.95,
  },
});
