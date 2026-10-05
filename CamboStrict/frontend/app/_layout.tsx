import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { useAuthStore } from '../src/stores/authStore';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { colors, fontSize } from '../src/constants/theme';

function useDeepLinks() {
  const isReady = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isReady) return;

    function handleUrl(url: string) {
      const { path, queryParams } = Linking.parse(url);
      if (!path) return;

      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const [type, id] = segments;
        if (type === 'post' && id) {
          Linking.openURL(Linking.createURL(`/post/${id}`));
        } else if (type === 'user' && id) {
          Linking.openURL(Linking.createURL(`/user/${id}`));
        } else if (type === 'hashtag' && id) {
          Linking.openURL(Linking.createURL(`/hashtag/${id}`));
        } else if (type === 'messages' && id) {
          Linking.openURL(Linking.createURL(`/messages/${id}`));
        }
      }
    }

    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });

    return () => sub.remove();
  }, [isReady]);
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useDeepLinks();

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          {!isOnline && (
            <View style={{ backgroundColor: '#E24B4A', paddingVertical: 6, paddingHorizontal: 16, alignItems: 'center', zIndex: 999 }}>
              <Text style={{ color: '#fff', fontSize: fontSize.xs, fontWeight: '700' }}>No internet connection</Text>
            </View>
          )}
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="followers/[id]" />
            <Stack.Screen name="following/[id]" />
            <Stack.Screen name="hashtag/[tag]" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="inbox" />
            <Stack.Screen name="collections/index" />
            <Stack.Screen name="collections/[id]" />
            <Stack.Screen name="leaderboard" />
          </Stack>
        </ErrorBoundary>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
