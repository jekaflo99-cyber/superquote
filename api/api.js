require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow any origin
  credentials: true
}));

// JSON parsing para todas as rotas exceto webhook
app.use(express.json());

// Produtos/Planos Stripe com Suporte a Múltiplas Moedas
const SUBSCRIPTION_PLANS = {
  weekly: {
    name: 'SuperQuote Pro - Semanal',
    prices: {
      eur: { amount: 1.99, currency: 'eur' },
      brl: { amount: 7.90, currency: 'brl' },
      usd: { amount: 1.99, currency: 'usd' }
    },
    interval: 'week',
  },
  monthly: {
    name: 'SuperQuote Pro - Mensal',
    prices: {
      eur: { amount: 4.99, currency: 'eur' },
      brl: { amount: 19.90, currency: 'brl' },
      usd: { amount: 4.99, currency: 'usd' }
    },
    interval: 'month',
  },
  yearly: {
    name: 'SuperQuote Pro - Anual',
    prices: {
      eur: { amount: 29.99, currency: 'eur' },
      brl: { amount: 99.90, currency: 'brl' },
      usd: { amount: 29.99, currency: 'usd' }
    },
    interval: 'year',
  },
};

const handleCreateCheckoutSession = async (req, res) => {
  try {
    const { planId, email, userId, currency = 'eur' } = req.body;

    // DEBUG LOG
    console.log('Request body:', req.body);
    console.log('planId:', planId, 'email:', email, 'currency:', currency);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);

    if (!planId || !['weekly', 'monthly', 'yearly'].includes(planId)) {
      console.error('Invalid plan:', planId, 'Body:', JSON.stringify(req.body));
      return res.status(400).json({ error: 'Invalid plan', received: planId, body: req.body });
    }

    if (!email) {
      console.error('No email provided', 'Body:', JSON.stringify(req.body));
      return res.status(400).json({ error: 'Email required', received: email });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const currencyLower = currency.toLowerCase();
    const priceConfig = plan.prices[currencyLower] || plan.prices['eur'];

    // Criar ou recuperar produto Stripe
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(p => p.metadata.planId === planId);

    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        metadata: { planId },
      });
    }

    // Criar preço Stripe para a moeda específica
    const prices = await stripe.prices.list({ 
      product: product.id, 
      currency: priceConfig.currency,
      limit: 100 
    });
    
    const targetAmount = Math.round(priceConfig.amount * 100);
    // Procura um preço que coincida exatamente com o valor que queremos
    let price = prices.data.find(p => p.unit_amount === targetAmount && p.active);

    if (!price) {
      console.log(`Creating new price for ${planId} in ${priceConfig.currency}: ${priceConfig.amount}`);
      
      // Desativa preços antigos diferentes deste valor
      const oldPrices = prices.data.filter(p => p.unit_amount !== targetAmount && p.active);
      for (const oldPrice of oldPrices) {
        try {
          await stripe.prices.update(oldPrice.id, { active: false });
          console.log(`Disabled old price: ${oldPrice.id}`);
        } catch (e) {
          console.error('Error disabling old price:', e);
        }
      }

      // Cria o novo preço com o valor correto
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: targetAmount,
        currency: priceConfig.currency,
        recurring: {
          interval: plan.interval,
        },
      });
      console.log(`Created new price: ${price.id} for ${priceConfig.amount} ${priceConfig.currency}`);
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL}?canceled=true`,
      customer_email: email,
      metadata: {
        userId: userId || 'guest',
        planId: planId,
      },
      subscription_data: {
        metadata: {
          userId: userId || 'guest',
          email: email,
          planId: planId,
        },
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/create-checkout-session
 * Cria uma sessão de checkout Stripe
 */
app.post('/api/create-checkout-session', handleCreateCheckoutSession);
app.post('/create-checkout-session', handleCreateCheckoutSession);

/**
 * POST /api/webhook
 * Webhook do Stripe para confirmar pagamentos
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Processar eventos
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      await handleSubscriptionCreated(subscription);
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      await handleSubscriptionUpdated(subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await handleSubscriptionCanceled(subscription);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * POST /api/sync-to-revenuecat
 * Sincroniza subscrição Stripe com RevenueCat
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const email = subscription.metadata?.email;
    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;

    if (!email) {
      console.log('No email in subscription metadata');
      return;
    }

    console.log(`Syncing subscription for ${email} to RevenueCat`);

    // Sincronizar com RevenueCat
    await axios.post(
      `https://api.revenuecat.com/v1/apps/${process.env.REVENUECAT_APP_ID}/subscribers`,
      {
        app_user_id: email,
        entitlements: {
          'SuperQuote Pro': {
            expires_date: new Date(subscription.current_period_end * 1000).toISOString(),
          },
        },
        attributes: {
          stripe_id: subscription.id,
          plan_id: planId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
        },
      }
    );

    console.log(`✅ Subscription synced to RevenueCat for ${email}`);
  } catch (error) {
    console.error('Error syncing to RevenueCat:', error.response?.data || error.message);
  }
}

async function handleSubscriptionUpdated(subscription) {
  await handleSubscriptionCreated(subscription);
}

async function handleSubscriptionCanceled(subscription) {
  try {
    const email = subscription.metadata?.email;

    if (!email) return;

    console.log(`Canceling subscription for ${email} in RevenueCat`);

    await axios.delete(
      `https://api.revenuecat.com/v1/apps/${process.env.REVENUECAT_APP_ID}/subscribers/${email}/entitlements/SuperQuote%20Pro`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
        },
      }
    );

    console.log(`✅ Subscription canceled in RevenueCat for ${email}`);
  } catch (error) {
    console.error('Error canceling in RevenueCat:', error.response?.data || error.message);
  }
}

/**
 * GET /api/subscription-status
 * Verifica status da subscrição
 */
app.get('/api/subscription-status', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Buscar no RevenueCat
    const response = await axios.get(
      `https://api.revenuecat.com/v1/apps/${process.env.REVENUECAT_APP_ID}/subscribers/${email}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
        },
      }
    );

    const entitlements = response.data?.subscriber?.entitlements || {};
    const isPremium = 'SuperQuote Pro' in entitlements;

    res.json({
      isPremium,
      entitlements,
    });
  } catch (error) {
    console.error('Error checking subscription:', error.response?.data || error.message);
    res.json({ isPremium: false, entitlements: {} });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Stripe integration ready`);
    console.log(`✅ RevenueCat sync enabled`);
  });
}

module.exports = app;
