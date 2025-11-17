# 🌙 Sleep Tracker App

A beautiful and intelligent sleep tracking application built with React Native and Expo. Track your sleep patterns, monitor sleep quality, and wake up at optimal times based on your sleep cycles.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg)
![Expo](https://img.shields.io/badge/Expo-54.0-000020.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎯 Core Functionality
- **Sleep Tracking**: Start and stop sleep sessions with a single tap
- **🎙️ Automatic Noise Detection**: Real-time audio monitoring that automatically detects and records noise during sleep
- **Voice Notes**: When noise is detected, the app automatically records 15-second audio clips as "voice notes"
- **Noise Level Analysis**: Each recording includes the noise level in decibels (dB) for better understanding
- **Smart Wake Times**: Calculate optimal wake-up times based on 90-minute sleep cycles
- **Sleep Quality Analysis**: Get detailed insights into your sleep quality, affected by noise interruptions
- **Sleep History**: View and analyze your past sleep sessions with all recorded noise events
- **Audio Playback**: Replay all recorded noise events directly from the history screen
- **Intelligent Alarms**: Schedule alarms for optimal wake times to feel more refreshed
- **Automatic Wake-Up**: The app automatically stops tracking and wakes you up when your alarm time is reached
- **Multi-Sensory Alerts**: Alarm includes visual modal, sound alerts, and haptic vibrations for reliable wake-up

### 🎨 User Experience
- **Beautiful UI**: Modern, gradient-based design with smooth animations
- **Dark Theme**: Eye-friendly interface optimized for nighttime use
- **Haptic Feedback**: Tactile responses for better user interaction
- **Cross-Platform**: Works seamlessly on iOS, Android, and Web

### 📊 Analytics & Insights
- Deep sleep percentage estimation (affected by noise interruptions)
- **Automatic interruption tracking** based on detected noise events
- Sleep duration analysis
- Quality scoring based on multiple factors including noise frequency
- Historical trends and patterns
- **Noise level visualization** with color-coded indicators (green/yellow/red)
- Real-time noise monitoring indicator during sleep tracking

## 📱 Screenshots

[Add your app screenshots here]

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Bun or npm/yarn
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Expo Go app (for testing on physical devices)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sleep-app.git
cd sleep-app
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Start the development server**
```bash
bun start
# or
npm start
```

4. **Run on specific platforms**
```bash
# iOS
bun run ios

# Android
bun run android

# Web
bun run start-web
```

## 🛠️ Tech Stack

### Core Technologies
- **[React Native](https://reactnative.dev/)** - Cross-platform mobile framework
- **[Expo](https://expo.dev/)** - Development platform and tools
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based navigation

### UI & Styling
- **[NativeWind](https://www.nativewind.dev/)** - Tailwind CSS for React Native
- **[Lucide React Native](https://lucide.dev/)** - Beautiful icon library
- **[Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)** - Gradient components

### State Management & Data
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[React Query](https://tanstack.com/query/latest)** - Server state management
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Local data persistence

### Native Features
- **[Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)** - Audio recording and playback
- **[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push notifications and alarms
- **[Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)** - Tactile feedback
- **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** - Touch interactions

## ⏰ Automatic Alarm System

### Smart Wake-Up Features

The app includes an **intelligent alarm system** that ensures you wake up at the right time:

#### How It Works
1. **Real-Time Monitoring**: The app continuously checks if the current time has reached your set alarm time
2. **Automatic Stop**: When the alarm time is reached, sleep tracking automatically stops
3. **Multi-Sensory Alert**: 
   - **Visual**: Beautiful modal with wake-up animation
   - **Audio**: Continuous beep pattern (800 Hz tone)
   - **Haptic**: Vibration patterns every 2 seconds
4. **Sleep Summary**: Displays total sleep time and detected noise events
5. **Easy Dismissal**: Single tap to dismiss alarm and view full session details

#### Technical Implementation

**For Web**:
- Uses Web Audio API to generate alarm tones
- Creates oscillator nodes for beep patterns
- Repeats every second until dismissed

**For Mobile (iOS/Android)**:
- Leverages native haptic feedback via Expo Haptics
- System notification sounds for alerts
- Continuous vibration patterns for reliable wake-up

#### Features
- ⏱️ **Precise Timing**: Checks every second to ensure accuracy
- 🔄 **Persistent Alert**: Sound and vibration continue until dismissed
- 📊 **Instant Feedback**: Shows sleep duration and quality metrics
- 🎨 **Beautiful UI**: Modern, animated wake-up screen
- 🛡️ **Fail-Safe**: Multiple sensory alerts ensure you wake up

## 🎙️ Noise Detection System

### How It Works

The app features an advanced **automatic noise detection system** that monitors audio in real-time during sleep tracking:

#### Detection Process
1. **Continuous Monitoring**: The app analyzes audio levels every 100ms
2. **Threshold Detection**: When audio exceeds -45 dB, noise is detected
3. **Automatic Recording**: A 15-second audio clip is captured
4. **Smart Storage**: The recording is saved with timestamp and noise level
5. **Resume Monitoring**: After recording, monitoring continues automatically

#### Technical Implementation

**For Mobile (iOS/Android)**:
- Uses `expo-av` for audio recording
- Leverages native audio metering capabilities
- Records in high-quality AAC format (.m4a)
- Optimized for battery efficiency

**For Web**:
- Uses Web Audio API with AudioContext
- Real-time frequency analysis with AnalyserNode
- Saves recordings as WebM format
- Non-intrusive background monitoring

#### Customization

You can adjust detection sensitivity by modifying these constants in `contexts/SleepContext.tsx`:

```typescript
const NOISE_THRESHOLD = -45;      // dB level to trigger recording
const RECORDING_DURATION = 15000;  // Duration in milliseconds
const MONITORING_INTERVAL = 100;   // Check frequency in milliseconds
```

#### Privacy & Permissions

- **Microphone Permission**: Required for noise detection
- **Local Storage**: All recordings are stored locally on your device
- **No Cloud Upload**: Audio data never leaves your device
- **User Control**: You can delete any session and its recordings at any time

### Viewing Noise Events

In the **History** tab, each sleep session shows:
- Total number of noise events detected
- Time of each noise occurrence
- Noise level in decibels (color-coded)
- Playback controls for each recording
- Impact on sleep quality score

## 📂 Project Structure

```
├── app/                      # App screens (Expo Router)
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── _layout.tsx      # Tab layout configuration
│   │   ├── index.tsx        # Home/Sleep tracking screen
│   │   ├── history.tsx      # Sleep history screen
│   │   ├── insights.tsx     # Analytics and insights
│   │   └── sounds.tsx       # Sound settings
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx       # 404 screen
├── components/              # Reusable components
│   ├── ui/                  # UI components (Button, Card, Badge)
│   ├── AnimatedSplash.tsx   # Splash screen animation
│   ├── AnimatedTabScreen.tsx # Tab screen transitions
│   └── WheelTimePicker.tsx  # Custom time picker
├── contexts/                # React contexts
│   └── SleepContext.tsx     # Sleep tracking state management
├── types/                   # TypeScript type definitions
│   └── sleep.ts            # Sleep-related types
├── constants/              # App constants
│   └── colors.ts           # Color palette
├── lib/                    # Utility functions
│   └── utils.ts           # Helper functions
├── assets/                 # Static assets
│   └── images/            # App images and icons
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🔑 Key Features Explained

### Sleep Cycle Calculation

The app uses the scientifically-backed 90-minute sleep cycle theory. It calculates optimal wake times by:

1. Adding 14 minutes (average time to fall asleep)
2. Computing wake times for 4-6 complete sleep cycles
3. Recommending the best times to feel refreshed

### Sleep Quality Scoring

Sleep quality is calculated based on:
- **Duration**: Optimal range is 7-9 hours (max +20 points)
- **Interruptions**: Fewer audio recordings indicate better sleep (up to +10 points)
- **Timing**: Going to bed between 9 PM - 1 AM is optimal (+5 points)
- Base score starts at 70, with adjustments based on the above factors

### Audio Monitoring

- Records ambient sound during sleep
- Detects interruptions (snoring, movements, noises)
- Uses device microphone with privacy-first approach (all data stored locally)
- Works differently on each platform (native vs web APIs)

## 🔐 Permissions

The app requires the following permissions:

### iOS
- Microphone access (for sleep sound recording)
- Notifications (for alarms)
- Background audio (to record while sleeping)

### Android
- `RECORD_AUDIO` - Record sleep sounds
- `RECEIVE_BOOT_COMPLETED` - Restart alarms after device reboot
- `SCHEDULE_EXACT_ALARM` - Schedule precise wake-up alarms
- `VIBRATE` - Haptic feedback

### Web
- Microphone access (browser permission)

## 📱 Testing

### On Physical Device

1. Download **Expo Go** from App Store or Google Play
2. Run `bun start` in your terminal
3. Scan the QR code with your device

### On Simulator/Emulator

```bash
# iOS Simulator
bun run ios

# Android Emulator
bun run android
```

### On Web Browser

```bash
bun run start-web
```

## 🚢 Deployment

### Build for Production

```bash
# Install EAS CLI
bun add -g @expo/eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Submit to App Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Sleep cycle research and methodology
- Expo team for the amazing development platform
- React Native community for incredible tools and libraries

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/sleep-app](https://github.com/yourusername/sleep-app)

---

<div align="center">
  <p>Made with ❤️ and ☕</p>
  <p>If this project helped you, please ⭐️ star the repository!</p>
</div>
