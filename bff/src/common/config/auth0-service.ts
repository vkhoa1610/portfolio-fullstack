import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE } from './env.js';

// ─── Role claim namespace (must match Auth0 Action config) ───────────────────
export const ROLE_CLAIM = 'https://portfolio.app/role';

// ─── Shared token endpoint helper ────────────────────────────────────────────

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      ...body,
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  return { status: res.status, data };
}

// ─── Sign in (Resource Owner Password) ───────────────────────────────────────

export interface Auth0TokenSuccess {
  access_token: string;
  id_token:     string;
  refresh_token?: string;
  expires_in:   number;
  token_type:   string;
}

export interface Auth0MfaRequired {
  error:             'mfa_required';
  mfa_token:         string;
  error_description: string;
}

export interface Auth0Error {
  error:             string;
  error_description: string;
}

export type SignInResult =
  | { type: 'success';      data: Auth0TokenSuccess }
  | { type: 'mfa_required'; mfaToken: string }
  | { type: 'error';        message: string };

export const signIn = async (email: string, password: string): Promise<SignInResult> => {
  console.log('🔹 Auth0 SignIn:', { email });

  const { status, data } = await tokenRequest({
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    realm:      'Username-Password-Authentication',
    username:   email,
    password,
    audience:   AUTH0_AUDIENCE,
    scope:      'openid profile email offline_access',
  });

  if (status === 200) {
    console.log('✅ Auth0 SignIn: success');
    return { type: 'success', data: data as Auth0TokenSuccess };
  }

  const err = data as Auth0MfaRequired | Auth0Error;

  if ((err as Auth0MfaRequired).error === 'mfa_required') {
    console.log('🔒 Auth0 SignIn: MFA required');
    return { type: 'mfa_required', mfaToken: (err as Auth0MfaRequired).mfa_token };
  }

  console.log('❌ Auth0 SignIn error:', err.error_description);
  return { type: 'error', message: (err as Auth0Error).error_description || 'Login failed' };
};

// ─── Respond to MFA (TOTP) ────────────────────────────────────────────────────

export const respondToMfaChallenge = async (
  mfaToken: string,
  otp: string,
): Promise<{ type: 'success'; data: Auth0TokenSuccess } | { type: 'error'; message: string }> => {
  console.log('🔹 Auth0 MFA verify');

  const { status, data } = await tokenRequest({
    grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
    mfa_token:  mfaToken,
    otp,
  });

  if (status === 200) {
    console.log('✅ Auth0 MFA: success');
    return { type: 'success', data: data as Auth0TokenSuccess };
  }

  const err = data as Auth0Error;
  console.log('❌ Auth0 MFA error:', err.error_description);
  return { type: 'error', message: err.error_description || 'MFA verification failed' };
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshTokens = async (
  refreshToken: string,
): Promise<{ type: 'success'; data: Auth0TokenSuccess } | { type: 'error'; message: string }> => {
  console.log('🔹 Auth0 Refresh token');

  const { status, data } = await tokenRequest({
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
  });

  if (status === 200) {
    console.log('✅ Auth0 Refresh: success');
    return { type: 'success', data: data as Auth0TokenSuccess };
  }

  const err = data as Auth0Error;
  console.log('❌ Auth0 Refresh error:', err.error_description);
  return { type: 'error', message: err.error_description || 'Token refresh failed' };
};

// ─── Revoke refresh token (logout) ───────────────────────────────────────────

export const revokeToken = async (refreshToken: string): Promise<void> => {
  console.log('🔹 Auth0 Revoke token');

  try {
    await fetch(`https://${AUTH0_DOMAIN}/oauth/revoke`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        token:         refreshToken,
      }),
    });
    console.log('✅ Auth0 Revoke: success');
  } catch (err) {
    console.warn('⚠️ Auth0 Revoke failed (non-critical):', err);
  }
};
