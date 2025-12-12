import dotenv from 'dotenv';

dotenv.config(); // load .env

export const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';

export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';
export const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || '';
export const JAVA_API_URL = process.env.JAVA_API_URL || 'http://localhost:8080';
