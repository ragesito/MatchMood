import 'dotenv/config';
import { z } from 'zod';

// Validated at import time so a missing critical variable fails the boot
// loudly, instead of the server starting "healthy" and then throwing on every
// request (jwt.sign with an undefined secret, Prisma with no URL, ...).
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  PORT: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  BACKEND_URL: z.string().url().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  JUDGE0_API_HOST: z.string().optional(),
  JUDGE0_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  console.error('Invalid environment configuration:\n' + issues.join('\n'));
  process.exit(1);
}

export const env = parsed.data;

if (env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET is shorter than 32 characters — use a stronger secret in production.');
}

// Warn (don't crash) when an integration's keys are absent: that feature is
// simply disabled, which is fine for local dev.
const integrations: Record<string, (keyof typeof env)[]> = {
  'GitHub OAuth': ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
  'OpenAI challenge generation': ['OPENAI_API_KEY'],
  'Judge0 code execution': ['JUDGE0_API_HOST', 'JUDGE0_API_KEY'],
  'Stripe billing': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
};
for (const [name, keys] of Object.entries(integrations)) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    console.warn(`Warning: ${name} disabled — missing ${missing.join(', ')}`);
  }
}
