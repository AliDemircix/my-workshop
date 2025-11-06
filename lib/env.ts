/**
 * Environment variable validation and configuration
 * Validates required environment variables at startup
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  // SMTP is optional
  SMTP_HOST?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
}

/**
 * Validates and returns environment configuration
 * Throws error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL', 
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}\nPlease check your .env file.`);
  }

  // Validate admin credentials are not using defaults
  if (process.env.ADMIN_USERNAME === 'admin' && process.env.ADMIN_PASSWORD === 'admin') {
    console.warn('⚠️  WARNING: Using default admin credentials! Change ADMIN_USERNAME and ADMIN_PASSWORD in production.');
  }

  // Validate Stripe keys format
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must start with "sk_"');
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME!,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
  };
}

// Validate environment on module load (server-side only)
let envConfig: EnvConfig;
if (typeof window === 'undefined') {
  try {
    envConfig = validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error);
    process.exit(1);
  }
}

export { envConfig };