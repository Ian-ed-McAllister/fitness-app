import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatabase } from '../src/hooks/useDatabase';
import { Colors } from '../src/constants/colors';

export default function RootLayout() {
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to initialise database.</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>FitTrack</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'default',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="nutrition/add-food"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="nutrition/barcode-scan"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen name="nutrition/food-search" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/food-detail" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/manual-entry" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/saved-meals" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/create-meal" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/create-template" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/template-detail" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/exercise-search" options={{ headerShown: false }} />
          <Stack.Screen
            name="workouts/active-session"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen name="workouts/session-history" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/exercise-progress" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/settings" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="profile/body-goals" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.danger,
  },
  errorDetail: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
