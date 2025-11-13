import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SleepProvider } from "../contexts/SleepContext";
import AnimatedSplash from "../components/AnimatedSplash";
import Colors from "../constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    SystemUI.setBackgroundColorAsync(Colors.background);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SleepProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
          <RootLayoutNav />
          {showSplash && (
            <AnimatedSplash onFinish={() => setShowSplash(false)} />
          )}
        </GestureHandlerRootView>
      </SleepProvider>
    </QueryClientProvider>
  );
}
