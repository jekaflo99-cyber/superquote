require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Stripe safely
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing in environment variables');
}

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow any origin
  credentials: true
}));

/**
 * POST /api/webhook
 * Webhook do Stripe para confirmar pagamentos
 * IMPORTANTE: Deve vir ANTES de express.json() para receber o raw body
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

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
  holidayPass: {
    name: 'Acesso Total Festas',
    prices: {
      eur: { amount: 1.99, currency: 'eur' },
      brl: { amount: 7.50, currency: 'brl' },
      usd: { amount: 1.99, currency: 'usd' }
    },
    // Sem intervalo = Pagamento Único
  },
};

const handleCreateCheckoutSession = async (req, res) => {
  // Force JSON parsing if body is string (Vercel fix)
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  try {
    if (!stripe) {
      console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Server configuration error: Stripe key missing' });
    }

    const { planId, email, userId, currency = 'eur' } = req.body;

    // DEBUG LOG
    console.log('Request body:', req.body);
    console.log('planId:', planId, 'email:', email, 'currency:', currency);

    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      console.error('Invalid plan:', planId);
      return res.status(400).json({ error: 'Invalid plan', received: planId });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const currencyLower = currency.toLowerCase();
    const priceConfig = plan.prices[currencyLower] || plan.prices['eur'];
    const isSubscription = !!plan.interval; // Se tem intervalo, é assinatura

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
        } catch (e) {
          console.error('Error disabling old price:', e);
        }
      }

      // Configuração do preço
      const priceData = {
        product: product.id,
        unit_amount: targetAmount,
        currency: priceConfig.currency,
      };

      // Só adiciona recurring se for assinatura
      if (isSubscription) {
        priceData.recurring = { interval: plan.interval };
      }

      price = await stripe.prices.create(priceData);
      console.log(`Created new price: ${price.id}`);
    }

    // Configurar Sessão
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: isSubscription ? 'subscription' : 'payment', // Dinâmico
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
        email: email // Redundância importante
      },
    };

    // subscription_data só pode ser enviado se mode='subscription'
    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId || 'guest',
          email: email,
          planId: planId,
        },
      };
    } else {
      // Para pagamento único, usamos payment_intent_data para persistir metadata
      sessionConfig.payment_intent_data = {
        metadata: {
          userId: userId || 'guest',
          email: email,
          planId: planId,
        },
      };
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

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

    // 1. Grant Entitlement (Promotional)
    // Docs: https://www.revenuecat.com/docs/api-v1#tag/entitlements/operation/grant-entitlement
    await axios.post(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/entitlements/SuperQuote%20Pro/promotional`,
      {
        expiration_time_ms: subscription.current_period_end * 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Platform': 'stripe' // Optional metadata
        },
      }
    );

    // 2. Update Attributes (Optional but good for tracking)
    try {
      await axios.post(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/attributes`,
        {
          attributes: {
            $email: { value: email },
            stripe_subscription_id: { value: subscription.id },
            plan_id: { value: planId }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
            'Content-Type': 'application/json'
          },
        }
      );
    } catch (attrError) {
      console.warn('Failed to update attributes in RevenueCat (non-fatal):', attrError.message);
    }

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

    // Revoke Entitlement
    // Docs: https://www.revenuecat.com/docs/api-v1#tag/entitlements/operation/revoke-entitlement
    await axios.post(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/entitlements/SuperQuote%20Pro/revoke_promotional`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json'
        },
      }
    );

    console.log(`✅ Subscription canceled in RevenueCat for ${email}`);
  } catch (error) {
    console.error('Error canceling in RevenueCat:', error.response?.data || error.message);
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    const email = session.metadata?.email || session.customer_details?.email;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!email) {
      console.log('No email in session metadata');
      return;
    }

    console.log(`Checkout completed for ${email}. Syncing to RevenueCat...`);

    let expirationTimeMs;
    
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        expirationTimeMs = subscription.current_period_end * 1000;
      } catch (e) {
        console.error("Error fetching subscription", e);
        return; 
      }
    } else {
      // Lógica para pagamentos únicos (sem assinatura)
      if (planId === 'holidayPass') {
        // Campanha de Natal: Válido até 3 de Janeiro do próximo ano (ou deste, se estivermos em Janeiro)
        const now = new Date();
        let targetYear = now.getFullYear();
        
        // Se não estamos em Janeiro, o próximo dia 3 de Jan é no ano seguinte
        if (now.getMonth() !== 0) {
          targetYear += 1;
        }
        
        // Define expiração para 3 de Janeiro às 23:59:59
        const expirationDate = new Date(targetYear, 0, 3, 23, 59, 59);
        expirationTimeMs = expirationDate.getTime();
        console.log(`Holiday Pass purchased. Expires on: ${expirationDate.toISOString()}`);
      } else {
        // Outros pagamentos únicos: Padrão de 1 ano
        expirationTimeMs = Date.now() + (365 * 24 * 60 * 60 * 1000);
      }
    }

    // Grant Entitlement (Promotional)
    await axios.post(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/entitlements/SuperQuote%20Pro/promotional`,
      {
        expiration_time_ms: expirationTimeMs,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // Update Attributes (Optional)
    try {
      await axios.post(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/attributes`,
        {
          attributes: {
            $email: { value: email },
            stripe_session_id: { value: session.id },
            plan_id: { value: planId }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
            'Content-Type': 'application/json'
          },
        }
      );
    } catch (attrError) {
      console.warn('Failed to update attributes (non-fatal):', attrError.message);
    }

    console.log(`✅ Checkout synced to RevenueCat for ${email}`);
  } catch (error) {
    console.error('Error handling checkout session:', error.response?.data || error.message);
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
    // Docs: https://www.revenuecat.com/docs/api-v1#tag/customers/operation/get-customer
    const response = await axios.get(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json'
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
