import type { CapacitorConfig } from '@capacitor/cli';

/// <reference types="@capacitor/assets" />
const config: CapacitorConfig & { assets: any } = {
  appId: 'com.neonstudio.superquote',
  appName: 'superquote',
  webDir: 'dist',
  assets: {
    android: {
      icon: {
        image: 'src/assets/icons/icon.png', // <--- Confirma o nome do ficheiro aqui!
        backgroundColor: '#2B2B2E;', // Cor de fundo se o ícone não for quadrado
      },
      splash: {
        image: 'src/assets/icons/splash.png', // Podes usar a mesma imagem para o splash
        backgroundColor: '#2B2B2E;',
      }
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,    // Tenta ser o mais rápido possível
      launchAutoHide: true,
      backgroundColor: "#2B2B2E;", // Garante que a cor bate certo aqui também
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    }
  }
};


export default config;
