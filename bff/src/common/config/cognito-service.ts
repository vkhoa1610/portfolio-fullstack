import crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AWS_REGION, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from './env.js';

const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
});

// === Helper tính SECRET_HASH ===
export const getSecretHash = (username: string) => {
  return crypto
    .createHmac('SHA256', COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest('base64');
};

// === Đăng nhập ===
export const signIn = async (email: string, password: string) => {
  console.log('🔹 SignIn Query:', { email });

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: getSecretHash(email),
    },
  });

  const response = await cognitoClient.send(command);
  console.log('✅ SignIn Response:', {
    challengeName: response.ChallengeName,
    hasAuthResult: !!response.AuthenticationResult,
  });
  return response;
};

// === Xác thực MFA ===
export const respondToMfaChallenge = async (username: string, otp: string, session: string) => {
  console.log('🔹 MFA Challenge Query:', { username, otp: '***' });

  const command = new RespondToAuthChallengeCommand({
    ClientId: COGNITO_CLIENT_ID,
    ChallengeName: 'SOFTWARE_TOKEN_MFA',
    Session: session,
    ChallengeResponses: {
      SOFTWARE_TOKEN_MFA_CODE: otp,
      USERNAME: username,
      SECRET_HASH: getSecretHash(username),
    },
  });

  const response = await cognitoClient.send(command);
  console.log('✅ MFA Response:', {
    hasAuthResult: !!response.AuthenticationResult,
  });
  return response;
};

// === Đặt mật khẩu mới (NEW_PASSWORD_REQUIRED) ===
export const respondToNewPasswordChallenge = async (
  username: string,
  newPassword: string,
  session: string,
) => {
  console.log('🔹 New Password Challenge Query:', { username });

  const command = new RespondToAuthChallengeCommand({
    ClientId: COGNITO_CLIENT_ID,
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: session,
    ChallengeResponses: {
      NEW_PASSWORD: newPassword,
      USERNAME: username,
      SECRET_HASH: getSecretHash(username),
    },
  });

  const response = await cognitoClient.send(command);
  console.log('✅ New Password Response:', {
    hasAuthResult: !!response.AuthenticationResult,
  });
  return response;
};

// === Refresh Tokens (Silent Re-authentication) ===
export const refreshTokens = async (refreshToken: string, username: string) => {
  console.log('🔹 Refresh Token Query:', { username });

  const command = new InitiateAuthCommand({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      SECRET_HASH: getSecretHash(username),
    },
  });

  const response = await cognitoClient.send(command);
  console.log('✅ Refresh Token Response:', {
    hasAuthResult: !!response.AuthenticationResult,
  });
  return response;
};

// === Global Sign Out (Invalidate all tokens) ===
export const globalSignOut = async (accessToken: string) => {
  console.log('🔹 Global Sign Out Query');

  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  const response = await cognitoClient.send(command);
  console.log('✅ Global Sign Out Response: Success');
  return response;
};

