declare global {
  interface Window {
    Stripe: any;
  }
}

// Em produção Vercel: usa /api (mesma domain)
// Em desenvolvimento: usa localhost:3001
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001'
  }
  // Em produção, usa a mesma domain
  return window.location.origin
}

const API_BASE = getApiUrl();

// Carrega Stripe dinamicamente
const loadStripeJs = async () => {
  return new Promise<any>((resolve) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve(window.Stripe);
    document.body.appendChild(script);
  });
};

export interface SubscriptionPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: number;
  billingPeriod: string;
  savings?: string;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 4.99,
    billingPeriod: '/mês',
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 39.99,
    billingPeriod: '/ano',
    savings: 'Poupa 33%',
  },
];

export class StripeService {
  /**
   * Inicia o checkout Stripe
   */
  static async startCheckout(planId: 'monthly' | 'yearly', email: string, userId?: string) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      // Chamar backend para criar sessão de checkout
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          email,
          userId: userId || 'guest',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Carregar Stripe
      const stripe = await loadStripeJs();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirecionar para checkout usando sessionId
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result?.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      throw error;
    }
  }

  /**
   * Verifica o status da subscrição
   */
  static async checkSubscriptionStatus(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE}/api/subscription-status?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const { isPremium } = await response.json();
      return isPremium;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }
}

export default StripeService;
