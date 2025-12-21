# 📦 Stripe + RevenueCat Integration Summary

## ✅ Arquivos Criados

### Backend (`/api`)
```
/api/
├── package.json          - Dependências Node.js
├── index.js              - Servidor Express com endpoints Stripe
├── .env.example          - Template de variáveis
└── (deploy em Vercel)
```

### Frontend
```
src/
├── services/
│   └── stripeService.ts  - Cliente Stripe (carregamento de biblioteca)
└── components/
    └── SubscriptionModal.tsx (já existia - pode ser estendido)
```

### Configuração
```
├── vercel.json           - Config de deploy em Vercel
├── .env.local            - Variáveis locais
└── STRIPE_SETUP_GUIDE.md - Guia completo de setup
```

---

## 🔗 Endpoints da API

### 1. **POST** `/api/create-checkout-session`
Cria sessão de checkout Stripe

**Request:**
```json
{
  "planId": "monthly|yearly",
  "email": "user@example.com",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "sessionId": "cs_live_..."
}
```

### 2. **GET** `/api/subscription-status`
Verifica status de subscrição no RevenueCat

**Request:** `?email=user@example.com`

**Response:**
```json
{
  "isPremium": true,
  "entitlements": { "SuperQuote Pro": {...} }
}
```

### 3. **POST** `/api/webhook`
Recebe webhooks do Stripe (configurar em Stripe Dashboard)

**Eventos processados:**
- `customer.subscription.created` → Cria em RevenueCat
- `customer.subscription.updated` → Atualiza em RevenueCat
- `customer.subscription.deleted` → Remove em RevenueCat

### 4. **GET** `/api/health`
Health check

---

## 🛠️ Próximas Etapas

### Imediato (hoje)
- [ ] Testar localmente (backend + frontend)
- [ ] Testar checkout com cartão de teste
- [ ] Deploy em Vercel

### Curto Prazo (esta semana)
- [ ] Configurar webhook Stripe em produção
- [ ] Testar sincronização RevenueCat
- [ ] Testar instalação da app nativa com conta sincronizada

### Médio Prazo
- [ ] Analytics/Dashboard
- [ ] Email confirmação após subscrição
- [ ] Página de gerenciamento de subscrição
- [ ] Suporte a múltiplas moedas

---

## 📊 Fluxo Técnico

```
PWA (Frontend)
    ↓
SubscriptionModal → StripeService.startCheckout()
    ↓
Backend API → POST /api/create-checkout-session
    ↓
Stripe API → Retorna sessionId
    ↓
Frontend → Redireciona para Stripe.redirectToCheckout()
    ↓
Utilizador paga ✅
    ↓
Stripe Webhook → POST /api/webhook
    ↓
Backend → Sincroniza com RevenueCat API
    ↓
RevenueCat atualiza entitlement "SuperQuote Pro"
    ↓
App Nativa (Android/iOS) → Log in com mesmo email
    ↓
RevenueCat retorna subscrição ✅
```

---

## 💾 Variáveis de Ambiente

### `.env.local` (Frontend - Local)
```
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### `.env` (Backend - Local)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
REVENUECAT_API_KEY=sk_...
REVENUECAT_APP_ID=goog_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:4173
```

### Vercel Environment Variables
Mesmo que acima, mas com URLs de produção

---

## 🔐 Segurança Notes

1. **Chaves Secretas**: Nunca expor `sk_live_*` no frontend
2. **Webhook Signing**: Validar assinatura no backend
3. **CORS**: Apenas frontend URL autorizado
4. **API Keys RevenueCat**: Apenas no backend
5. **Rate Limiting**: Considerado no futuro

---

## 📞 Contato Stripe Support
- Dashboard: https://dashboard.stripe.com
- API Reference: https://stripe.com/docs/api
- Test Mode: Use chaves `pk_test_*` e `sk_test_*`

---

Generated: 17 Dezembro 2025
