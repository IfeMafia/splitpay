import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional().default('postgresql://user:password@localhost:5432/splitpay'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').optional().default('development-jwt-secret-key-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('no-reply@splitpay.local'),
  PAYSTACK_SECRET_KEY: z.string().optional().default('sk_test_placeholder'),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default('pk_test_placeholder'),
});


const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
