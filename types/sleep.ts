export interface SleepRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality?: number;
  notes?: string;
}

export interface SleepStats {
  averageDuration: number;
  averageQuality: number;
  totalNights: number;
  bestSleep?: SleepRecord;
  worstSleep?: SleepRecord;
}

export interface SleepGoal {
  targetHours: number;
  bedtime: string;
  wakeTime: string;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  selectedSound?: string;
}

export interface AudioRecording {
  id: string;
  timestamp: Date;
  uri: string;
  duration: number;
  noiseLevel?: number;
}

export interface SleepSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  audioRecordings: AudioRecording[];
  alarmTime?: Date;
  sleepQuality?: number;
  interruptions?: number;
  deepSleepPercent?: number;
  dreamJournal?: string;
}

export interface WakeTimeOption {
  time: Date;
  cycles: number;
  label: string;
}
