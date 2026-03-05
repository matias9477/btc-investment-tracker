import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

/**
 * Ensures the in-app browser is dismissed if the app is re-opened
 * via a deep link while an auth session is still open (web only, no-op on native).
 */
WebBrowser.maybeCompleteAuthSession();

/**
 * The URI Supabase will redirect to after the user authenticates with Google.
 * Must match what is registered in:
 *   - Supabase dashboard → Authentication → URL Configuration → Redirect URLs
 *
 * `native` is used in production/dev builds where btc-tracker:// is registered.
 * In Expo Go the value is ignored and expo-auth-session auto-generates an
 * exp://<local-ip>:<port>/--/auth/callback URL instead.
 */
const REDIRECT_URI = makeRedirectUri({
  native: 'btc-tracker://auth/callback',
});

/**
 * Hook that drives Google OAuth sign-in via Supabase + expo-web-browser.
 *
 * Flow:
 *  1. Ask Supabase for the Google OAuth URL (PKCE, skipBrowserRedirect=true).
 *  2. Open the URL in a secure in-app browser with openAuthSessionAsync.
 *  3. Google redirects to Supabase, which redirects to btc-tracker://auth/callback?code=XXX.
 *  4. Exchange the code for a Supabase session via exchangeCodeForSession.
 *  5. onAuthStateChange in app/_layout.tsx fires and routes the user to /(tabs).
 *
 * @returns `signInWithGoogle` — async function to trigger the flow.
 * @returns `loading` — true while the browser or code exchange is in progress.
 * @throws Re-throws any error so the calling screen can show it in its UI.
 */
export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('[GoogleAuth] Redirect URI:', REDIRECT_URI);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URI,
          // Prevent the Supabase client from auto-opening the browser so we
          // can use expo-web-browser's openAuthSessionAsync instead, which
          // properly handles the deep-link redirect back to the app.
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No authentication URL received from Supabase.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

      // User cancelled or the browser closed without completing authentication
      if (result.type !== 'success') return;

      // Exchange the PKCE authorization code in the redirect URL for a session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
      if (sessionError) throw sessionError;

      // Session is now set — onAuthStateChange in app/_layout.tsx handles routing
    } catch (err) {
      throw err instanceof Error ? err : new Error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
};
