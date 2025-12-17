# RevenueCat - Guia Completo de Implementação

## 📦 SDK Instalado
✅ `@revenuecat/purchases-capacitor@11.2.17`

## 🔑 Configuração Atual

### API Keys
- **Teste (Android):** `test_vpoJprQxBWghTmmpQMsjhuEsFOp`
- **Produção (Android):** Substituir depois por `goog_...`

### Entitlement
- **Nome:** `SuperQuote Pro`
- **Identifier:** Configurar no Dashboard

### Produtos
- **Yearly:** `superquote_yearly` → Package identifier: `yearly`
- **Monthly:** `superquote_monthly` → Package identifier: `monthly`
- **Weekly:** `superquote_weekly` → Package identifier: `weekly`

---

## 🚀 Passo a Passo - Configuração no RevenueCat Dashboard

### PASSO 1: Criar Projeto
1. Acede a https://app.revenuecat.com/
2. Cria conta (se ainda não tens)
3. Clica em **+ Create Project**
4. Nome: **SuperQuote**
5. Seleciona **Android** como plataforma inicial

### PASSO 2: Configurar Google Play
1. No projeto, vai para **Settings** (engrenagem) → **Google Play**
2. Clica em **Connect to Google Play**
3. Faz upload do **Service Account JSON**
   - Obter em: Google Play Console → Setup → API Access → Service Account
4. Package Name: `com.neonstudio.superquote`
5. Clica em **Save**

### PASSO 3: Criar Entitlement
1. Menu lateral → **Entitlements**
2. Clica em **+ New Entitlement**
3. Display Name: `SuperQuote Pro`
4. Identifier: `superquote_pro` (gerado automaticamente)
5. Clica em **Create**

### PASSO 4: Adicionar Produtos
1. Menu lateral → **Products**
2. Clica em **+ Add Products**
3. Seleciona **Google Play Store**
4. Adiciona os 3 Product IDs que criaste na Google Play Console:
   - `superquote_yearly`
   - `superquote_monthly`
   - `superquote_weekly`
5. Clica em **Add Products**

### PASSO 5: Criar Offering
1. Menu lateral → **Offerings**
2. Clica em **+ Create Offering**
3. **Offering Details:**
   - Identifier: `default`
   - Display Name: `Premium Plans`
   - Description: `SuperQuote Premium Subscription Plans`

4. **Adicionar Package Yearly:**
   - Clica em **+ Add Package**
   - Identifier: `yearly`
   - Product: Seleciona `superquote_yearly`
   - Entitlements: Seleciona `SuperQuote Pro` ✅
   - Clica em **Add Package**

5. **Adicionar Package Monthly:**
   - Clica em **+ Add Package**
   - Identifier: `monthly`
   - Product: Seleciona `superquote_monthly`
   - Entitlements: Seleciona `SuperQuote Pro` ✅
   - Clica em **Add Package**

6. **Adicionar Package Weekly:**
   - Clica em **+ Add Package**
   - Identifier: `weekly`
   - Product: Seleciona `superquote_weekly`
   - Entitlements: Seleciona `SuperQuote Pro` ✅
   - Clica em **Add Package**

7. **Tornar Offering Ativa:**
   - No topo da offering, clica em **Make Current**
   - Confirma

### PASSO 6: Obter API Key de Produção
1. Menu lateral → **API Keys**
2. Copia a chave **Google** (começa com `goog_...`)
3. **GUARDA ESTA CHAVE** - vais precisar dela para produção

---

## 🧪 Como Testar

### Teste em Sandbox (Usando API Key de Teste)
Já está configurado! A app usa `test_vpoJprQxBWghTmmpQMsjhuEsFOp`.

1. Abre a app no dispositivo Android
2. Clica em "Desbloquear tudo agora"
3. Aparece o modal de subscrição
4. Seleciona um plano
5. Clica em "Continuar"
6. **Simula compra** (Google Play aceita em teste)
7. Verifica no RevenueCat Dashboard → **Customers**

### Preparar para Produção
Quando estiveres pronto para publicar:

1. **No código** (`src/services/revenueCatService.ts`):
   ```typescript
   const apiKey = Capacitor.getPlatform() === 'android' 
       ? 'goog_SUA_CHAVE_AQUI'  // ← Substitui pela chave real
       : 'appl_YOUR_IOS_API_KEY';
   ```

2. **Rebuild:**
   ```bash
   npm run build
   npx cap sync android
   ```

---

## 📊 Como Funciona o Sistema

### 1. Inicialização (App.tsx)
```typescript
// Ao abrir a app
await revenueCatService.initialize();
const isPremium = await revenueCatService.checkSubscriptionStatus();
setIsPremiumUser(isPremium);
```

### 2. Verificação de Entitlement
```typescript
// Verifica se tem acesso a "SuperQuote Pro"
const customerInfo = await Purchases.getCustomerInfo();
const proEntitlement = customerInfo.customerInfo.entitlements.active['SuperQuote Pro'];
isPremium = proEntitlement !== undefined;
```

### 3. Mostrar Preços (SubscriptionModal.tsx)
```typescript
// Carrega offerings do RevenueCat
const offerings = await revenueCatService.getOfferings();
// offerings.yearly.price = "29,99€"
// offerings.monthly.price = "4,99€"
// offerings.weekly.price = "1,99€"
```

### 4. Compra
```typescript
// User seleciona plano e clica "Continuar"
const success = await revenueCatService.purchasePackage('yearly');
if (success) {
    // Compra bem-sucedida!
    onUnlock(); // Desbloqueia features
}
```

### 5. Restaurar Compras
```typescript
// User clica "Restaurar compras"
const hasActivePurchase = await revenueCatService.restorePurchases();
if (hasActivePurchase) {
    onUnlock(); // Desbloqueia features
}
```

---

## ✅ Checklist de Implementação

### Já Implementado ✅
- [x] SDK RevenueCat instalado
- [x] `revenueCatService.ts` completo
- [x] Verificação de entitlement "SuperQuote Pro"
- [x] `SubscriptionModal.tsx` com preços dinâmicos
- [x] Integração em `App.tsx` e `EditorScreen.tsx`
- [x] Compra de packages
- [x] Restaurar compras
- [x] Error handling

### Por Fazer no RevenueCat Dashboard 📝
- [ ] Criar entitlement "SuperQuote Pro"
- [ ] Adicionar produtos (yearly, monthly, weekly)
- [ ] Criar offering "default"
- [ ] Configurar packages com identifiers corretos
- [ ] Tornar offering ativa (Make Current)
- [ ] Configurar Google Play connection

### Por Fazer na Google Play Console 📝
- [ ] Criar 3 produtos de subscrição
- [ ] Configurar preços
- [ ] Adicionar trial de 7 dias (opcional, no yearly)
- [ ] Ativar produtos

### Antes de Publicar 🚀
- [ ] Substituir API key de teste pela de produção
- [ ] Testar compra real em Internal Testing
- [ ] Verificar webhooks no Dashboard
- [ ] Testar restore purchases

---

## 🔍 Troubleshooting

### "No offerings available"
**Causa:** Offering não está configurada ou não está "Current"
**Solução:** 
1. Vai para Offerings no Dashboard
2. Clica na tua offering
3. Clica em "Make Current"

### "Package not found"
**Causa:** Package identifier não coincide
**Solução:** 
- Certifica-te que os identifiers são: `yearly`, `monthly`, `weekly`
- Verifica em Offerings → Packages

### "Product not found"
**Causa:** Produtos não sincronizados da Google Play
**Solução:**
1. Verifica se os produtos existem na Google Play Console
2. Verifica se estão **Active**
3. Aguarda 5-15 minutos para sincronização

### Preços não aparecem
**Causa:** Offerings não carregadas
**Solução:**
- Abre DevTools console
- Procura por "Error loading offerings"
- Verifica a chave API está correta

### Compra não aparece no Dashboard
**Causa:** Normal em teste, pode demorar
**Solução:**
- Sandbox: Instantâneo
- Produção: 5-15 minutos
- Verifica em **Customers** (procura pelo email de teste)

---

## 📱 Integração com Customer Center (Futuro)

Quando quiseres adicionar um Customer Center para os users gerirem as subscrições:

```typescript
import { CustomerCenter } from '@revenuecat/purchases-capacitor';

// Mostrar Customer Center
await CustomerCenter.presentCustomerCenter();
```

Adiciona um botão nas definições da app:
```tsx
<button onClick={() => CustomerCenter.presentCustomerCenter()}>
    Gerir Subscrição
</button>
```

---

## 🎯 Resumo

**O que tens agora:**
- ✅ SDK instalado e configurado
- ✅ Código completo para compras
- ✅ Modal de subscrição com 3 planos
- ✅ Sistema de entitlements

**O que falta:**
- 📝 Configurar produtos no RevenueCat Dashboard
- 📝 Criar offering e packages
- 📝 Ligar à Google Play Console

**Tempo estimado:** 30 minutos de configuração no Dashboard

Boa sorte! 🚀
