import { AdMob, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import type { BannerAdOptions, AdMobError } from '@capacitor-community/admob';

// IDs reais do AdMob - SuperQuote
const BANNER_AD_ID = 'ca-app-pub-4067467129853775/4235695181'; // Banner da página categorias
const INTERSTITIAL_AD_ID = 'ca-app-pub-4067467129853775/6670286831'; // Interstitial no export
const REWARDED_AD_ID = 'ca-app-pub-4067467129853775/5357205160'; // Rewarded (unlock diário)

class AdMobService {
  private interstitialLoaded = false;
  private rewardedLoaded = false;
  private exportCount = 0;

  constructor() {
    // Carrega contador do localStorage
    const saved = localStorage.getItem('superquote_export_count');
    this.exportCount = saved ? parseInt(saved, 10) : 0;
  }

  // Mostra banner no topo
  async showBanner() {
    try {
      console.log('Attempting to show banner with ID:', BANNER_AD_ID);
      const options: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
      };
      await AdMob.showBanner(options);
      console.log('Banner shown successfully');
    } catch (error) {
      console.error('Error showing banner:', error);
      console.error('Banner error details:', JSON.stringify(error));
    }
  }

  // Esconde banner
  async hideBanner() {
    try {
      await AdMob.hideBanner();
      console.log('Banner hidden');
    } catch (error) {
      console.error('Error hiding banner:', error);
    }
  }

  // Remove banner
  async removeBanner() {
    try {
      await AdMob.removeBanner();
      console.log('Banner removed');
    } catch (error) {
      console.error('Error removing banner:', error);
    }
  }

  // Prepara interstitial
  async prepareInterstitial() {
    try {
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_ID,
      });
      this.interstitialLoaded = true;
      console.log('Interstitial prepared');
    } catch (error) {
      console.error('Error preparing interstitial:', error);
      this.interstitialLoaded = false;
    }
  }

  // Mostra interstitial com lógica de controle
  async showInterstitialOnExport() {
    this.exportCount++;
    
    // Guarda no localStorage
    localStorage.setItem('superquote_export_count', this.exportCount.toString());

    console.log(`[INTERSTITIAL] Export #${this.exportCount}, Loaded: ${this.interstitialLoaded}`);

    // Regras:
    // 1. Mostra na 1ª exportação (exportCount = 1)
    // 2. Depois alterna: mostra vez sim, vez não (ímpares: 1, 3, 5, 7...)
    const shouldShow = (this.exportCount % 2 !== 0); // Números ímpares

    console.log(`[INTERSTITIAL] Should show: ${shouldShow} (count % 2 = ${this.exportCount % 2})`);

    if (shouldShow && this.interstitialLoaded) {
      try {
        await AdMob.showInterstitial();
        console.log('Interstitial shown');
        
        // Prepara o próximo interstitial
        this.prepareInterstitial();
      } catch (error) {
        console.error('Error showing interstitial:', error);
        // Tenta preparar novamente
        this.prepareInterstitial();
      }
    } else if (!this.interstitialLoaded) {
      // Se não está carregado, prepara agora
      console.log('[INTERSTITIAL] Not loaded yet, preparing now...');
      this.prepareInterstitial();
    } else {
      console.log('[INTERSTITIAL] Skipping (even number)');
    }
  }

  // Reseta contador (útil para testes)
  resetExportCount() {
    this.exportCount = 0;
    localStorage.setItem('superquote_export_count', '0');
  }

  // Prepara rewarded ad
  async prepareRewarded() {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_ID,
      });
      this.rewardedLoaded = true;
      console.log('Rewarded ad prepared');
    } catch (error) {
      console.error('Error preparing rewarded ad:', error);
      this.rewardedLoaded = false;
    }
  }

  // Mostra rewarded ad e retorna Promise<boolean> (true se completou)
  async showRewardedAd(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.rewardedLoaded) {
        console.log('Rewarded ad not loaded, preparing...');
        await this.prepareRewarded();
        resolve(false);
        return;
      }

      let rewarded = false;

      // Listener para recompensa
      const earnedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        console.log('Reward earned!', reward);
        rewarded = true;
      });

      // Listener para fechamento
      const dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        console.log('Rewarded ad dismissed');
        await earnedListener.remove();
        await dismissedListener.remove();
        // Prepara o próximo
        this.prepareRewarded();
        resolve(rewarded);
      });

      try {
        await AdMob.showRewardVideoAd();
        console.log('Rewarded ad shown');
        this.rewardedLoaded = false;
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        await earnedListener.remove();
        await dismissedListener.remove();
        this.prepareRewarded();
        resolve(false);
      }
    });
  }

  // Listeners para eventos do interstitial
  addInterstitialListeners() {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      console.log('Interstitial loaded');
      this.interstitialLoaded = true;
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
      console.error('Interstitial failed to load:', error);
      this.interstitialLoaded = false;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log('Interstitial showed');
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('Interstitial dismissed');
      // Prepara o próximo
      this.prepareInterstitial();
    });
  }
}

export const admobService = new AdMobService();
