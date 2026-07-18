import 'dotenv/config';
import { z } from 'zod';

// Validated at import time so a missing critical variable fails the boot
// loudly, instead of the server starting "healthy" and then throwing on every
// request (jwt.sign with an undefined secret, Prisma with no URL, ...).
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  PORT: z.string().optional(),
  // Not .url() — a missing scheme shouldn't crash-loop the whole API. These are
  // format-warned below instead (they only affect OAuth callbacks / CORS).
  FRONTEND_URL: z.string().optional(),
  BACKEND_URL: z.string().optional(),

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

// Warn (don't crash) if a URL var is set but has no http(s) scheme — OAuth
// callbacks and CORS need the full origin, but a bad value here shouldn't take
// the whole API down.
for (const key of ['FRONTEND_URL', 'BACKEND_URL'] as const) {
  const value = env[key];
  if (value && !/^https?:\/\//.test(value)) {
    console.warn(`Warning: ${key} ("${value}") is not a full URL — it should start with https://`);
  }
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
