export function getDb(): Promise<never> {
  return Promise.reject(new Error('expo-sqlite is not available on web'));
}
