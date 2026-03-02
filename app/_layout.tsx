import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../components/ToastProvider';

/**
 * Root layout component that handles auth state and navigation
 */
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Race getSession against a 6-second timeout so a hung network request
    // (e.g. stale token refresh failing) never leaves the app on a blank screen.
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 6000),
    );

    Promise.race([
      supabase.auth.getSession().then(({ data: { session } }) => session),
      timeout,
    ])
      .then((session) => {
        setSession(session);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and on auth screen
      router.replace('/(tabs)');
    }
  }, [session, segments, loading]);

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Slot />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
