import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../middleware/auth';
import stripe from '../config/stripe';
import prisma from '../config/prisma';

const router = Router();

// Stripe price IDs — create these in your Stripe dashboard or via API
// For now we read them from env, set them after running the seed script
const PRICES = {
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM!,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE!,
};

// Create a Stripe Checkout session for a subscription
router.post('/create-checkout', requireAuth, async (req: Request, res: Response) => {
  const { tier } = req.body as { tier: 'PREMIUM' | 'ENTERPRISE' };
  const payload = req.user as JwtPayload;

  const priceId = PRICES[tier];
  if (!priceId) {
    res.status(400).json({ error: 'Invalid tier' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id, username: user.username },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    metadata: { userId: user.id, tier },
  });

  res.json({ url: session.url });
});

// Stripe webhook — receives events from Stripe
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (userId && tier) {
        await prisma.user.update({
          where: { id: userId },
          data: { tier },
        });
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            tier,
            stripeSubscriptionId: session.subscription,
            status: 'active',
          },
          update: {
            tier,
            stripeSubscriptionId: session.subscription,
            status: 'active',
          },
        });
        console.log(`User ${userId} upgraded to ${tier}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' },
      });
      // Downgrade user to FREE
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (sub) {
        await prisma.user.update({
          where: { id: sub.userId },
          data: { tier: 'FREE' },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      console.log('Payment failed:', event.data.object);
      break;
    }
  }

  res.json({ received: true });
});

// Get current subscription status
router.get('/subscription', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const subscription = await prisma.subscription.findUnique({
    where: { userId: payload.userId },
  });
  res.json(subscription ?? { status: 'none' });
});

export default router;
