# Configuração do RevenueCat - SuperQuote

## ✅ SDK Instalado
- **Package:** `@revenuecat/purchases-capacitor@11.2.17`
- **API Key:** `test_vpoJprQxBWghTmmpQMsjhuEsFOp` (teste)
- **Entitlement:** `SuperQuote Pro`

## 🔧 Configuração no RevenueCat Dashboard

### 1. Criar Entitlement
1. Acede ao RevenueCat Dashboard
2. Vai para **Entitlements**
3. Clica em **+ New Entitlement**
4. Nome: `SuperQuote Pro`
5. Identifier: `superquote_pro` (ou deixa automático)

### 2. Criar Produtos na Google Play Console
1. Acede à Google Play Console
2. Vai para **Monetization** → **Products** → **Subscriptions**
3. Cria 3 produtos de subscrição:

   **Plano Anual:**
   - Product ID: `superquote_yearly`
   - Preço: 29,99€ / ano
   - Trial: 7 dias grátis (opcional)
   
   **Plano Mensal:**
   - Product ID: `superquote_monthly`
   - Preço: 4,99€ / mês
   
   **Plano Semanal:**
   - Product ID: `superquote_weekly`
   - Preço: 1,99€ / semana

### 3. Adicionar Produtos no RevenueCat
1. No RevenueCat Dashboard, vai para **Products**
2. Clica em **+ Add Product**
3. Seleciona **Google Play Store**
4. Adiciona os 3 produtos:
   - `superquote_yearly`
   - `superquote_monthly`
   - `superquote_weekly`

### 4. Criar Offering
1. Vai para **Offerings**
2. Clica em **+ Create Offering**
3. Nome: `default` (ou outro nome)
4. Description: "SuperQuote Premium Plans"
5. Clica em **+ Add Package** para cada plano:

   **Package Yearly:**
   - Identifier: `yearly`
   - Product: `superquote_yearly`
   - Attach to Entitlement: `SuperQuote Pro`
   
   **Package Monthly:**
   - Identifier: `monthly`
   - Product: `superquote_monthly`
   - Attach to Entitlement: `SuperQuote Pro`
   
   **Package Weekly:**
   - Identifier: `weekly`
   - Product: `superquote_weekly`
   - Attach to Entitlement: `SuperQuote Pro`

6. **IMPORTANTE:** Define esta offering como **Current** (botão no topo da offering)

### 5. Configurar Google Play
1. No RevenueCat Dashboard → **Project Settings** → **Google Play**
2. Faz upload do **Service Account JSON** da Google Play Console
3. Liga o package name: `com.neonstudio.superquote`

### 6. Testar (IMPORTANTE)
**ANTES de publicar na loja:**

1. **Adiciona testers na Google Play Console:**
   - **Release** → **Testing** → **Internal testing**
   - Adiciona os emails de teste (incluindo o teu)

2. **No RevenueCat, ativa Sandbox Testing:**
   - Dashboard → **Customer Lists** → **Debug View**
   - Adiciona o teu email de teste

3. **No código, ativa logging:**
   - Já está ativo em `revenueCatService.ts` (LOG_LEVEL.DEBUG)

4. **Testa o fluxo completo:**
   - Abre a app no dispositivo
   - Clica em "Desbloquear tudo agora"
   - Seleciona um plano
   - Confirma compra (será cobrado no cartão de teste)
   - Verifica no RevenueCat Dashboard se apareceu a transação

### 7. Verificar Integrações
**No RevenueCat Dashboard → Integrations**, podes adicionar:
- Firebase (para analytics)
- Mixpanel/Amplitude (para tracking)
- Slack (notificações de novas subscrições)

## 📝 Como Funciona

### Fluxo de Compra
1. User clica "Desbloquear tudo agora"
2. `SubscriptionModal` carrega offerings do RevenueCat
3. User seleciona plano (Anual/Mensal/Semanal)
4. `handlePurchase()` chama `revenueCatService.purchasePackage()`
5. Google Play processa o pagamento
6. RevenueCat recebe webhook e atualiza status
7. App verifica `checkSubscriptionStatus()` e desbloqueia features

### Restaurar Compras
1. User clica "Restaurar compras"
2. `handleRestorePurchases()` chama `revenueCatService.restorePurchases()`
3. RevenueCat sincroniza com Google Play
4. Se tem subscrição ativa, desbloqueia

### Verificação de Status
- Ao abrir a app: `revenueCatService.checkSubscriptionStatus()`
- Retorna `true` se tem subscrição ativa
- Atualiza `isPremiumUser` no estado da app

## 🎯 Preços Fallback
Se o RevenueCat não carregar (web ou erro), usa preços fallback definidos em `SubscriptionModal.tsx`:

```typescript
const fallbackPricing = {
    yearly: { price: '29,99€', trialDays: 7, perMonth: '2,50€' },
    monthly: { price: '4,99€' },
    weekly: { price: '1,99€' }
};
```

## 🔒 Segurança
- API keys nunca devem ser commitadas no Git
- Considera usar environment variables (`.env`)
- RevenueCat valida compras server-side (anti-pirataria)

## 📊 Analytics
O RevenueCat fornece:
- MRR (Monthly Recurring Revenue)
- Churn rate
- LTV (Lifetime Value)
- Trial conversion rates
- Tudo no Dashboard gratuitamente!

## 🚀 Publicação
Antes de publicar:
1. ✅ Testa todas as compras (anual, mensal, semanal)
2. ✅ Testa restaurar compras
3. ✅ Testa cancelamento (Google Play Console)
4. ✅ Verifica que os webhooks estão a funcionar
5. ✅ Remove `LOG_LEVEL.DEBUG` do código (opcional, para produção)

## ❓ Troubleshooting

**Erro: "Product not found"**
- Verifica se os Product IDs na Google Play coincidem com o RevenueCat
- Certifica-te que os produtos estão **Active** na Google Play Console

**Erro: "Unable to connect to RevenueCat"**
- Verifica a API key
- Certifica-te que `npx cap sync` correu sem erros
- Verifica se tens internet no dispositivo

**Compra não aparece no RevenueCat**
- Pode demorar 5-15 minutos para sincronizar em produção
- Em sandbox, é instantâneo
- Verifica **Customer Lists** no Dashboard

**Preços não aparecem no modal**
- Verifica console logs: `Error loading offerings`
- Certifica-te que a Offering "default" está configurada
- Usa os preços fallback temporariamente

## 📞 Suporte
- RevenueCat Docs: https://docs.revenuecat.com/
- RevenueCat Community: https://community.revenuecat.com/
- Slack da RevenueCat (se subscreveres plano pago)

---

**Boa sorte com as subscrições! 💰**
