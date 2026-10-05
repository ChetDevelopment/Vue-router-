import { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { router } from 'expo-router';

export function usePushNotifications() {
  const registered = useRef(false);
  const [foregroundNotif, setForegroundNotif] = useState<any>(null);

  useEffect(() => {
    if (registered.current || Platform.OS === 'web') return;
    registered.current = true;

    (async () => {
      try {
        const ExpoNotifications = await import('expo-notifications');
        const ExpoNotif: any = ExpoNotifications;
        const { getToken, api } = await import('../api/client');

        // Foreground notification handler — show OS banner
        ExpoNotif.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Handle notification tap (app opened from closed/backgrounded state)
        const lastResponse = await ExpoNotif.getLastNotificationResponseAsync?.();
        if (lastResponse) {
          handleNotificationTap(lastResponse);
        }

        // Listen for taps while app is running
        const tapSubscription = ExpoNotif.addNotificationResponseReceivedListener?.(
          handleNotificationTap
        );

        // Listen for foreground notifications to show in-app toast
        const notifSubscription = ExpoNotif.addNotificationReceivedListener?.(
          (notification: any) => {
            setForegroundNotif(notification);
            // Auto-clear after 4 seconds
            setTimeout(() => setForegroundNotif(null), 4000);
          }
        );

        // Request permission and register push token
        const { status } = await ExpoNotif.requestPermissionsAsync();
        if (status !== 'granted') {
          if (tapSubscription?.remove) tapSubscription.remove();
          if (notifSubscription?.remove) notifSubscription.remove();
          return;
        }

        const { getValidProjectId } = await import('../utils/pushToken');
        const projectId = getValidProjectId();
        if (!projectId) return;

        const tokenData = await ExpoNotif.getExpoPushTokenAsync({ projectId });
        const pushToken = tokenData.data;

        if (pushToken && getToken()) {
          await api.push.register(pushToken, Platform.OS);
        }
      } catch (e) {
        console.warn('Push notification registration failed:', e);
      }
    })();
  }, []);

  return foregroundNotif;
}

function handleNotificationTap(response: any) {
  const data = response.notification?.request?.content?.data;
  if (!data) return;

  if (data.postId) {
    router.push(`/post/${data.postId}`);
  } else if (data.actorId) {
    router.push(`/user/${data.actorId}`);
  } else if (data.notificationId) {
    router.push('/(tabs)/notifications');
  }
}

export function useForegroundNotification() {
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: any = null;
    let mounted = true;

    import('expo-notifications').then((ExpoNotif: any) => {
      sub = ExpoNotif.addNotificationReceivedListener?.((n: any) => {
        if (mounted) {
          setNotification(n);
          setTimeout(() => { if (mounted) setNotification(null); }, 4000);
        }
      });
    }).catch(() => {});

    return () => {
      mounted = false;
      if (sub?.remove) sub.remove();
    };
  }, []);

  return notification;
}
