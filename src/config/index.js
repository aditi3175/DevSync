import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env in development (only if .env exists)
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function maskSecret(value) {
  if (!value) return '';
  const s = String(value);
  if (s.length <= 6) return '***';
  return `${s.slice(0, 3)}...${s.slice(-3)}`;
}4

const raw = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI: process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL,
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
};

const defaults = {
  PORT: 4000,
  NODE_ENV: 'development',
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
};

const config = {
  server: {
    port: Number(raw.PORT || defaults.PORT),
    env: raw.NODE_ENV || defaults.NODE_ENV,
  },
  db: {
    mongoUri: raw.MONGO_URI,
  },
  redis: {
    url: raw.REDIS_URL || null,
  },
  jwt: {
    accessSecret: raw.JWT_ACCESS_TOKEN_SECRET,
    refreshSecret: raw.JWT_REFRESH_TOKEN_SECRET,
    accessExpiry: raw.ACCESS_TOKEN_EXPIRES_IN || defaults.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiry: raw.REFRESH_TOKEN_EXPIRES_IN || defaults.REFRESH_TOKEN_EXPIRES_IN,
  },
  frontend: {
    url: raw.FRONTEND_URL || null,
  },
  email: {
    host: raw.SMTP_HOST || null,
    port: raw.SMTP_PORT ? Number(raw.SMTP_PORT) : null,
    user: raw.SMTP_USER || null,
    pass: raw.SMTP_PASS || null,
    from: process.env.EMAIL_FROM || null,
  },
  stripe: {
    secretKey: raw.STRIPE_SECRET_KEY || null,
  },
};

const missing = [];
if (!config.db.mongoUri) missing.push('MONGO_URI');
if (!config.jwt.accessSecret) missing.push('JWT_ACCESS_TOKEN_SECRET');
if (!config.jwt.refreshSecret) missing.push('JWT_REFRESH_TOKEN_SECRET');

if (missing.length > 0) {
  console.error('FATAL: Missing required environment variables:', missing.join(', '));
  console.error('Please add them to your .env or environment and restart the app.');
  process.exit(1);
}

function getSafeSummary() {
  return {
    server: {
      port: config.server.port,
      env: config.server.env,
    },
    db: {
      mongoUri: config.db.mongoUri ? maskSecret(config.db.mongoUri) : null,
    },
    redis: {
      url: config.redis.url ? maskSecret(config.redis.url) : null,
    },
    jwt: {
      accessSecret: config.jwt.accessSecret ? maskSecret(config.jwt.accessSecret) : null,
      refreshSecret: config.jwt.refreshSecret ? maskSecret(config.jwt.refreshSecret) : null,
      accessExpiry: config.jwt.accessExpiry,
      refreshExpiry: config.jwt.refreshExpiry,
    },
    frontendUrl: config.frontend.url || null,
    email: {
      host: config.email.host || null,
      port: config.email.port || null,
      user: config.email.user ? maskSecret(config.email.user) : null,
    },
    stripe: {
      secretKey: config.stripe.secretKey ? maskSecret(config.stripe.secretKey) : null,
    },
  };
}

console.info('Config loaded:', JSON.stringify(getSafeSummary(), null, 2));

export default config;
