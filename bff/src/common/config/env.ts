import dotenv from 'dotenv';

dotenv.config(); // load .env

export const AUTH0_DOMAIN         = process.env.AUTH0_DOMAIN || '';
export const AUTH0_CLIENT_ID      = process.env.AUTH0_CLIENT_ID || '';
export const AUTH0_CLIENT_SECRET  = process.env.AUTH0_CLIENT_SECRET || '';
export const AUTH0_AUDIENCE       = process.env.AUTH0_AUDIENCE || '';
export const JAVA_API_URL         = process.env.JAVA_API_URL || 'http://localhost:8080';
