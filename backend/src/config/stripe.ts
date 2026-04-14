import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export default stripe;
