require('dotenv').config();

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://n-nu-tan.vercel.app',
];

const envOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch (error) {
    return false;
  }
};

const origin = (requestOrigin, callback) => {
  if (isAllowedOrigin(requestOrigin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${requestOrigin} is not allowed by CORS`));
};

const corsOptions = {
  origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
  isAllowedOrigin,
};
