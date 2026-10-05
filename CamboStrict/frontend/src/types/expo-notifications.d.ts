declare module 'expo-notifications' {
  export function setNotificationHandler(handler: any): void;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getExpoPushTokenAsync(): Promise<{ data: string }>;
  export function scheduleNotificationAsync(options: any): Promise<string>;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
  export function setBadgeCountAsync(count: number): Promise<void>;
  export function getBadgeCountAsync(): Promise<number>;
  export const AndroidImportance: any;
}
