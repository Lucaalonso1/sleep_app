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
  }),
});

export const [SleepProvider, useSleep] = createContextHook(() => {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const startMonitoringAudio = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                duration: 0,
              };
              setCurrentSession({
                ...currentSession,
                audioRecordings: [...currentSession.audioRecordings, newRecording],
              });
            }
          };
          reader.readAsDataURL(blob);
        };

        recorder.start();
        setMediaRecorder(recorder);
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });

        setRecording(newRecording);
      }
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  };

  const stopMonitoringAudio = async () => {
    try {
      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          setMediaRecorder(null);
        }
      } else {
        if (recording) {
          await recording.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          const uri = recording.getURI();

          if (uri && currentSession) {
            const status = await recording.getStatusAsync();
            const newRecording: AudioRecording = {
              id: Date.now().toString(),
              timestamp: new Date(),
              uri,
              duration: status.isLoaded ? status.durationMillis / 1000 : 0,
            };

            setCurrentSession({
              ...currentSession,
              audioRecordings: [...currentSession.audioRecordings, newRecording],
            });
          }

          setRecording(null);
        }
      }
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
          trigger: { seconds: Math.floor(trigger / 1000) },
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
