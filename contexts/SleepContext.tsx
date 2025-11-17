import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SleepSession, AudioRecording, WakeTimeOption } from '../types/sleep';

const STORAGE_KEY = 'sleep_sessions';
const SLEEP_CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configuración de detección de ruido
const NOISE_THRESHOLD = -45; // dB - ajustable según necesidad
const RECORDING_DURATION = 15000; // 15 segundos de grabación por ruido
const MONITORING_INTERVAL = 100; // Verificar cada 100ms

export const [SleepProvider, useSleep] = createContextHook(() => {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isRecordingNoise, setIsRecordingNoise] = useState(false);
  const monitoringIntervalRef = useState<NodeJS.Timeout | null>(null)[0];

  useEffect(() => {
    loadSessions();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      await Audio.requestPermissionsAsync();
      await Notifications.requestPermissionsAsync();
    }
  };

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sessions = parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
          alarmTime: s.alarmTime ? new Date(s.alarmTime) : undefined,
          audioRecordings: s.audioRecordings.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          })),
        }));
        setSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = async (newSessions: SleepSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  };

  const calculateWakeTimes = useCallback((bedTime: Date): WakeTimeOption[] => {
    const options: WakeTimeOption[] = [];
    const fallAsleepTime = new Date(bedTime.getTime() + FALL_ASLEEP_MINUTES * 60000);

    for (let cycles = 4; cycles <= 6; cycles++) {
      const wakeTime = new Date(
        fallAsleepTime.getTime() + cycles * SLEEP_CYCLE_MINUTES * 60000
      );
      options.push({
        time: wakeTime,
        cycles,
        label: `${cycles} cycles (${cycles * 1.5}h)`,
      });
    }

    return options;
  }, []);

  // Función para detectar ruido y grabar (Web)
  const monitorNoiseWeb = async (stream: MediaStream, context: AudioContext) => {
    const analyser = context.createAnalyser();
    const microphone = context.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);

    const checkNoise = () => {
      if (!isTracking) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const noiseLevel = 20 * Math.log10(average / 255); // Convertir a dB

      if (noiseLevel > NOISE_THRESHOLD && !isRecordingNoise) {
        console.log('Ruido detectado:', noiseLevel, 'dB');
        startNoiseRecording(stream, noiseLevel);
      }
    };

    const interval = setInterval(checkNoise, MONITORING_INTERVAL);
    return interval;
  };

  // Grabar fragmento de ruido (Web)
  const startNoiseRecording = async (stream: MediaStream, noiseLevel: number) => {
    if (isRecordingNoise || !currentSession) return;
    
    setIsRecordingNoise(true);
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (currentSession) {
          const newRecording: AudioRecording = {
            id: Date.now().toString(),
            timestamp: new Date(),
            uri: base64,
            duration: RECORDING_DURATION / 1000,
            noiseLevel,
          };
          
          // Actualizar la sesión con la nueva grabación
          setCurrentSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              audioRecordings: [...prev.audioRecordings, newRecording],
            };
          });
        }
        setIsRecordingNoise(false);
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    
    // Detener después del tiempo definido
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, RECORDING_DURATION);
  };

  // Detectar y grabar ruido en móvil
  const monitorNoiseMobile = async () => {
    if (!isTracking) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          web: {},
        },
        undefined,
        MONITORING_INTERVAL
      );

      setRecording(newRecording);

      // Monitorear el nivel de audio
      const interval = setInterval(async () => {
        if (!isTracking || isRecordingNoise) return;

        try {
          const status = await newRecording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            const noiseLevel = status.metering;
            
            // Si detecta ruido, guardar fragmento
            if (noiseLevel > NOISE_THRESHOLD) {
              console.log('Ruido detectado:', noiseLevel, 'dB');
              await captureNoiseFragmentMobile(noiseLevel);
            }
          }
        } catch (error) {
          console.error('Error monitoring noise:', error);
        }
      }, MONITORING_INTERVAL);

      return interval;
    } catch (error) {
      console.error('Failed to start noise monitoring:', error);
    }
  };

  // Capturar fragmento de ruido en móvil
  const captureNoiseFragmentMobile = async (noiseLevel: number) => {
    if (isRecordingNoise || !currentSession) return;

    setIsRecordingNoise(true);

    try {
      // Crear una nueva grabación específica para este ruido
      const { recording: noiseRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {},
      });

      // Grabar durante el tiempo definido
      setTimeout(async () => {
        try {
          await noiseRecording.stopAndUnloadAsync();
          const uri = noiseRecording.getURI();
          const status = await noiseRecording.getStatusAsync();

          if (uri && currentSession) {
            const newRecording: AudioRecording = {
              id: Date.now().toString(),
              timestamp: new Date(),
              uri,
              duration: (status as any).durationMillis ? (status as any).durationMillis / 1000 : 0,
              noiseLevel,
            };

            setCurrentSession((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                audioRecordings: [...prev.audioRecordings, newRecording],
              };
            });
          }
        } catch (error) {
          console.error('Error saving noise fragment:', error);
        } finally {
          setIsRecordingNoise(false);
        }
      }, RECORDING_DURATION);
    } catch (error) {
      console.error('Error capturing noise fragment:', error);
      setIsRecordingNoise(false);
    }
  };

  const startMonitoringAudio = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: false, // Queremos detectar ruido
            autoGainControl: false,
          } 
        });
        
        const context = new AudioContext();
        setAudioStream(stream);
        setAudioContext(context);

        const interval = await monitorNoiseWeb(stream, context);
        if (interval) {
          (monitoringIntervalRef as any) = interval;
        }
      } else {
        const interval = await monitorNoiseMobile();
        if (interval) {
          (monitoringIntervalRef as any) = interval;
        }
      }
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  };

  const stopMonitoringAudio = async () => {
    try {
      // Limpiar intervalo de monitoreo
      if ((monitoringIntervalRef as any)) {
        clearInterval((monitoringIntervalRef as any));
        (monitoringIntervalRef as any) = null;
      }

      if (Platform.OS === 'web') {
        // Detener stream de audio
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
        }
        
        // Cerrar contexto de audio
        if (audioContext) {
          await audioContext.close();
          setAudioContext(null);
        }

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setMediaRecorder(null);
        }
      } else {
        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          } catch (error) {
            console.error('Error stopping recording:', error);
          }
          setRecording(null);
        }
      }

      setIsRecordingNoise(false);
    } catch (error) {
      console.error('Failed to stop audio monitoring:', error);
    }
  };

  const scheduleAlarm = async (alarmTime: Date) => {
    try {
      const trigger = alarmTime.getTime() - Date.now();
      if (trigger > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Wake Up!',
            body: 'Time to wake up at your optimal sleep cycle',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(trigger / 1000),
          },
        });
      }
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
    }
  };

  const startMonitoringAudioMemo = useCallback(startMonitoringAudio, [currentSession]);

  const startTracking = useCallback(async (alarmTime?: Date) => {
    const newSession: SleepSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      audioRecordings: [],
      alarmTime,
    };

    setCurrentSession(newSession);
    setIsTracking(true);

    if (alarmTime && Platform.OS !== 'web') {
      await scheduleAlarm(alarmTime);
    }

    await startMonitoringAudioMemo();
  }, [startMonitoringAudioMemo]);

  const stopMonitoringAudioMemo = useCallback(stopMonitoringAudio, [recording, mediaRecorder, currentSession]);

  const calculateSleepQuality = (session: SleepSession, duration: number): number => {
    let quality = 70;

    const durationHours = duration / 3600;
    if (durationHours >= 7 && durationHours <= 9) {
      quality += 20;
    } else if (durationHours >= 6 && durationHours <= 10) {
      quality += 10;
    } else {
      quality -= 10;
    }

    const recordingCount = session.audioRecordings.length;
    if (recordingCount === 0) {
      quality += 10;
    } else if (recordingCount <= 2) {
      quality += 5;
    } else if (recordingCount > 5) {
      quality -= 15;
    } else {
      quality -= 5;
    }

    const sleepHour = session.startTime.getHours();
    if (sleepHour >= 21 || sleepHour <= 1) {
      quality += 5;
    } else if (sleepHour >= 2 && sleepHour <= 5) {
      quality -= 5;
    }

    return Math.max(0, Math.min(100, quality));
  };

  const stopTracking = useCallback(async () => {
    if (!currentSession) return;

    await stopMonitoringAudioMemo();

    const endTime = new Date();
    const duration = (endTime.getTime() - currentSession.startTime.getTime()) / 1000;

    const sleepQuality = calculateSleepQuality(currentSession, duration);
    const interruptions = currentSession.audioRecordings.length;
    const deepSleepPercent = Math.max(20, Math.min(45, 35 - interruptions * 3));

    const completedSession: SleepSession = {
      ...currentSession,
      endTime,
      duration,
      sleepQuality,
      interruptions,
      deepSleepPercent,
    };

    const newSessions = [completedSession, ...sessions];
    setSessions(newSessions);
    await saveSessions(newSessions);

    setCurrentSession(null);
    setIsTracking(false);

    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [currentSession, sessions, stopMonitoringAudioMemo]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    await saveSessions(newSessions);
  }, [sessions]);

  return useMemo(() => ({
    sessions,
    currentSession,
    isTracking,
    isLoading,
    startTracking,
    stopTracking,
    deleteSession,
    calculateWakeTimes,
  }), [sessions, currentSession, isTracking, isLoading, startTracking, stopTracking, deleteSession, calculateWakeTimes]);
});
