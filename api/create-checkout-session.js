require('dotenv').config({ path: 'C:/instaquote/api/.env' });
const Stripe = require('stripe');

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
    // No interval means one-time payment
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Parse body if needed (Vercel sometimes passes string)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { planId, email, userId, currency = 'eur', priceId: directPriceId } = body;

    console.log("Request Body:", body);

    // If a direct priceId is provided, use it (legacy support)
    if (directPriceId) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: directPriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cancel`,
        customer_email: email,
        metadata: { userId, planId }
      });
      return res.status(200).json({ id: session.id, sessionId: session.id });
    }

    // Validate planId
    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid or missing planId' });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const currencyLower = currency.toLowerCase();
    const priceConfig = plan.prices[currencyLower] || plan.prices['eur'];

    // 1. Find or Create Product
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(p => p.metadata.planId === planId);

    if (!product) {
      console.log(`Creating product for ${planId}`);
      product = await stripe.products.create({
        name: plan.name,
        metadata: { planId },
      });
    }

    // 2. Find or Create Price
    const prices = await stripe.prices.list({ 
      product: product.id, 
      currency: priceConfig.currency,
      limit: 100 
    });
    
    const targetAmount = Math.round(priceConfig.amount * 100);
    let price = prices.data.find(p => p.unit_amount === targetAmount && p.active);

    if (!price) {
      console.log(`Creating new price for ${planId} in ${priceConfig.currency}: ${priceConfig.amount}`);
      
      // Disable old prices for this currency/product to avoid duplicates
      const oldPrices = prices.data.filter(p => p.unit_amount !== targetAmount && p.active);
      for (const oldPrice of oldPrices) {
        await stripe.prices.update(oldPrice.id, { active: false });
      }

      const priceData = {
        product: product.id,
        unit_amount: targetAmount,
        currency: priceConfig.currency,
      };

      if (plan.interval) {
        priceData.recurring = {
          interval: plan.interval,
        };
      }

      price = await stripe.prices.create(priceData);
    }

    console.log(`Using Price ID: ${price.id}`);

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: plan.interval ? 'subscription' : 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      customer_email: email,
      metadata: {
        userId: userId || 'guest',
        planId: planId
      }
    });

    // Return session ID (support both id and sessionId formats)
    res.status(200).json({ id: session.id, sessionId: session.id });

  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
};