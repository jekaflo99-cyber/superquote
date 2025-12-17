# 📦 Ícones PWA

Coloque os seguintes arquivos de ícones na pasta `public/icons/`:

## ✅ Ícones obrigatórios:

1. **icon-192x192.png** (192x192px)
2. **icon-512x512.png** (512x512px)

## 📱 Ícones para iOS (recomendado):

3. **apple-touch-icon-180x180.png** (180x180px)

## 🎭 Ícones maskable (adaptáveis):

4. **icon-maskable-192x192.png** (192x192px)
5. **icon-maskable-512x512.png** (512x512px)

## 📸 Screenshots (opcional, mas recomendado):

6. **screenshot-1.png** (540x720px) - Mobile
7. **screenshot-2.png** (1280x720px) - Desktop/Tablet

---

## 🛠️ Como gerar ícones rápido:

### Opção 1: Usar PWA Asset Generator (Recomendado)
```bash
npm install -g @PWA/asset-generator
pwa-asset-generator seu-logo.png ./public/icons -i ./public/icons/index.html -m ./public/manifest.json
```

### Opção 2: Usar ferramentas online:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://icons8.com/lunacy (designer gratuito)

### Opção 3: Usar ImageMagick (em linha de comando):
```bash
# A partir de uma imagem source.png
convert source.png -resize 192x192 public/icons/icon-192x192.png
convert source.png -resize 512x512 public/icons/icon-512x512.png
convert source.png -resize 180x180 public/icons/apple-touch-icon-180x180.png
```

---

## ✨ Dica final:

Depois de adicionar os ícones, execute:
```bash
npm run build
```

E verifique no DevTools (Chrome/Firefox) se a PWA está registrada corretamente!
