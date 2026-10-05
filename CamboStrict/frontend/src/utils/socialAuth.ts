import { Platform } from 'react-native';
import { api, setToken } from '../api/client';

export async function loginWithGoogle(): Promise<{ token: string; refreshToken: string; user: any }> {
  const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env');
  }

  const { makeRedirectUri, AuthRequest } = await import('expo-auth-session');
  const { maybeCompleteAuthSession } = await import('expo-web-browser');
  maybeCompleteAuthSession();

  const redirectUri = makeRedirectUri();
  const authRequest = new AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  const result = await authRequest.promptAsync({
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  } as any);

  if (result.type !== 'success') {
    throw new Error('Google login was cancelled');
  }

  const idToken = result.params?.id_token;
  if (!idToken) throw new Error('No ID token received from Google');

  const res = await api.auth.socialLogin({ provider: 'google', token: idToken });
  setToken(res.token, res.refreshToken);
  return res;
}

export async function loginWithFacebook(): Promise<{ token: string; refreshToken: string; user: any }> {
  const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
  if (!FACEBOOK_APP_ID) {
    throw new Error('Facebook App ID not configured. Set EXPO_PUBLIC_FACEBOOK_APP_ID in .env');
  }

  const { makeRedirectUri, AuthRequest } = await import('expo-auth-session');
  const { maybeCompleteAuthSession } = await import('expo-web-browser');
  maybeCompleteAuthSession();

  const redirectUri = makeRedirectUri();
  const authRequest = new AuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
    redirectUri,
    extraParams: { display: 'popup' },
  });

  const result = await authRequest.promptAsync({
    authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
  } as any);

  if (result.type !== 'success') {
    throw new Error('Facebook login was cancelled');
  }

  const accessToken = result.params?.access_token;
  if (!accessToken) throw new Error('No access token received from Facebook');

  const res = await api.auth.socialLogin({ provider: 'facebook', token: accessToken });
  setToken(res.token, res.refreshToken);
  return res;
}

export async function loginWithApple(): Promise<{ token: string; refreshToken: string; user: any }> {
  if (Platform.OS === 'android') {
    throw new Error('Apple Sign In is not available on Android');
  }

  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const idToken = credential.identityToken;
    if (!idToken) throw new Error('No identity token received from Apple');

    const res = await api.auth.socialLogin({
      provider: 'apple',
      token: idToken,
      email: credential.email || undefined,
      displayName: credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
        : undefined,
    });
    setToken(res.token, res.refreshToken);
    return res;
  } catch (e: any) {
    if (e.code === 'ERR_CANCELED') {
      throw new Error('Apple login was cancelled');
    }
    throw new Error('Apple Sign In is not available on this device. Make sure you have a valid Apple Developer account and the app is signed.');
  }
}
