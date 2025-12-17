# 🚀 Guia de Deploy - SuperQuote PWA + Stripe + RevenueCat

## 📋 Resumo do que foi configurado

### ✅ Feito
1. **PWA** - Progressive Web App completa
2. **Stripe** - Pagamentos web via checkout
3. **RevenueCat** - Sincronização de subscrições
4. **Backend** - API Node.js/Express em `/api`

---

## 🔧 Setup Local (Testes)

### 1. Backend
```bash
cd api
npm install
cp .env.example .env
# Edita .env com as chaves
npm run dev
# Vai correr em http://localhost:3001
```

### 2. Frontend
```bash
npm run dev
# Vai correr em http://localhost:5173
# Acede via http://localhost:5173 no browser
```

### 3. Testar Stripe
```
Email: any@example.com
Número: 4242 4242 4242 4242 (teste)
Data: 12/25
CVC: 123
```

---

## 🚀 Deploy em Produção (Vercel)

### 1. Preparar o projeto
```bash
git add .
git commit -m "Add Stripe integration and PWA"
git push
```

### 2. Deploy Vercel
```bash
npm i -g vercel
vercel
```

**Siga as opções:**
- Conecte o GitHub
- Framework: Vite
- Build command: `npm run build`
- Output: `dist`

### 3. Adicionar variáveis de ambiente em Vercel
Dashboard → Settings → Environment Variables

```
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
REVENUECAT_API_KEY=YOUR_KEY_HERE
REVENUECAT_APP_ID=YOUR_APP_ID
FRONTEND_URL=https://seu-dominio.vercel.app
```

**Nota:** NUNCA adicione as keys diretamente no código ou ficheiros. Use Vercel Environment Variables.

### 4. Configurar webhook Stripe
- Ir em Stripe Dashboard → Developers → Webhooks
- Adicionar endpoint: `https://seu-dominio.vercel.app/api/webhook`
- Selecionar eventos:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copiar **Signing Secret** → adicionar como `STRIPE_WEBHOOK_SECRET` em Vercel

---

## 📱 Fluxo de Subscrição

### PWA (Stripe)
```
Utilizador → Clica "Subscrever" 
  ↓
→ SubscriptionModal aparece
  ↓
→ Escolhe plano (Mensal/Anual)
  ↓
→ Clica "Continuar"
  ↓
→ Redireciona para Stripe Checkout
  ↓
→ Paga com cartão
  ↓
→ Webhook confirma → Sincroniza com RevenueCat
  ↓
→ ✅ Utilizador pode fazer login na app nativa com mesma subscrição
```

### App Nativa (RevenueCat)
```
Utilizador instala app → Log in com email usado na PWA
  ↓
→ RevenueCat detecta subscrição Stripe
  ↓
→ ✅ Aceso Premium liberado
```

---

## 🔐 Segurança

- ✅ Chaves secretas apenas no backend
- ✅ Webhooks validados
- ✅ Stripe é PCI compliant
- ✅ RevenueCat sincronização bidireccional

---

## 🐛 Troubleshooting

### "Erro ao criar sessão checkout"
1. Verifica se a API está rodando
2. Verifica CORS em `api/index.js`
3. Testa em DevTools → Network

### "Webhook não sincroniza"
1. Confirma `STRIPE_WEBHOOK_SECRET` em Vercel
2. Ver logs em Stripe → Webhooks
3. Verifica endpoint `https://seu-dominio.vercel.app/api/webhook`

### "RevenueCat não reconhece subscrição"
1. Usa o **mesmo email** na PWA e app nativa
2. Verifica API key do RevenueCat
3. Aguarda 5-10 min para sincronização

---

## 📞 Suporte

**Documentação:**
- [Stripe Docs](https://stripe.com/docs)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [Vercel Docs](https://vercel.com/docs)

**Status:** 🟢 Pronto para produção

---

*Última atualização: 17 Dezembro 2025*
