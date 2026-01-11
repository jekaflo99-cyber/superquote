declare global {
  interface Window {
    Stripe: any;
  }
}

// Em produção Vercel: usa /api (mesma domain)
// Em desenvolvimento: usa localhost:3001
const getApiUrl = () => {
  // Se houver uma variável de ambiente definida (ex: Render, Netlify), usa-a
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000'
  }
  // Fallback: usa a mesma domain (para Vercel/Rewrites)
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

/**
 * Deteta a moeda baseado na localização do utilizador
 */
const detectCurrency = (): 'eur' | 'brl' | 'usd' => {
  if (typeof navigator === 'undefined') return 'eur';

  try {
    const locale = navigator.language || 'en-US';
    // Se locale é pt-BR ou começa com 'pt' e não é PT, é Brasil
    if (locale.includes('pt-BR') || locale.startsWith('pt_BR')) {
      return 'brl';
    }
    // Se locale é pt-PT ou começa com 'pt' (sem BR), é Portugal/Europa
    if (locale.startsWith('pt')) {
      return 'eur';
    }
    // Se locale contém BR é Brasil
    if (locale.includes('BR')) {
      return 'brl';
    }
    // Se locale é ES é Espanha (EUR)
    if (locale.startsWith('es')) {
      return 'eur';
    }
    // Se locale é en-US ou começa com en_ é USD
    if (locale.startsWith('en-US') || locale.startsWith('en_US')) {
      return 'usd';
    }
    // Padrão: EUR
    return 'eur';
  } catch {
    return 'eur';
  }
};

export interface SubscriptionPlan {
  id: 'weekly' | 'monthly' | 'yearly';
  name: string;
  price: number;
  billingPeriod: string;
  savings?: string;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    name: 'Semanal',
    price: 1.99,
    billingPeriod: '/semana',
  },
  {
    id: 'monthly',
    name: 'Mensal',
    price: 4.99,
    billingPeriod: '/mês',
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 19.99,
    billingPeriod: '/ano',
    savings: 'Poupa 60%',
  },
];

export class StripeService {
  /**
   * Inicia o checkout Stripe
   */
  static async startCheckout(planId: 'weekly' | 'monthly' | 'yearly', email: string, currencyOverride?: 'eur' | 'brl' | 'usd', userId?: string) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      // Detetar moeda do utilizador (usa override se fornecido, senão deteta)
      const currency = currencyOverride || detectCurrency();

      // Chamar backend para criar sessão de checkout
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          email,
          currency,
          userId: userId || 'guest',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout error details:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Carregar Stripe
      const Stripe = await loadStripeJs();
      if (!Stripe) {
        throw new Error('Stripe failed to load');
      }

      // Inicializar Stripe com a chave pública
      const stripe = Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
