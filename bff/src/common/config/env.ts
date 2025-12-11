import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config(); // load .env

export const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
export const AWS_ENDPOINT = process.env.AWS_ENDPOINT || undefined;

// Attempt to read from auto-generated localstack secrets if not provided in env
let localSecrets: any = {};
try {
  const secretPath = path.resolve(process.cwd(), 'localstack', 'cognito-secrets.json');
  if (fs.existsSync(secretPath)) {
    console.log('🔹 Loading secrets from:', secretPath);
    localSecrets = JSON.parse(fs.readFileSync(secretPath, 'utf-8'));
  }
} catch (error) {
  console.warn('⚠️ Could not read localstack secrets file:', error);
}

export const COGNITO_CLIENT_ID =
  process.env.COGNITO_CLIENT_ID || localSecrets.COGNITO_CLIENT_ID || '';
export const COGNITO_CLIENT_SECRET =
  process.env.COGNITO_CLIENT_SECRET || localSecrets.COGNITO_CLIENT_SECRET || '';
