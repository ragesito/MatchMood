import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

async function seedStripe() {
  console.log('Creating Stripe products and prices...');

  const premium = await stripe.products.create({
    name: 'Matchmood Premium',
    description: 'Badge verificado, estadísticas detalladas, historial completo, ranking destacado',
  });

  const premiumPrice = await stripe.prices.create({
    product: premium.id,
    unit_amount: 900, // $9.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  const enterprise = await stripe.products.create({
    name: 'Matchmood Enterprise',
    description: 'Acceso al ranking, contactar devs, challenges propios para reclutar',
  });

  const enterprisePrice = await stripe.prices.create({
    product: enterprise.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('\n✅ Done! Add these to your .env:\n');
  console.log(`STRIPE_PRICE_PREMIUM=${premiumPrice.id}`);
  console.log(`STRIPE_PRICE_ENTERPRISE=${enterprisePrice.id}`);
}

seedStripe().catch(console.error);
