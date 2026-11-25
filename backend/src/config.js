import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'aarogya-care-demo-secret-change-in-production',
  dbPath: process.env.DB_PATH
    ? path.resolve(backendRoot, process.env.DB_PATH)
    : path.join(backendRoot, 'data', 'aarogya.db'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '02:00 PM',
  '03:00 PM',
  '04:30 PM',
  '05:30 PM',
];

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
