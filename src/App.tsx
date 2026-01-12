import React, { useState, useEffect } from 'react';
import { type NavigationState, type LanguageCode, type TutorialStep } from './types';
import { PHRASES_DB } from './Data/content';
import { LanguageScreen } from './components/LanguageScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { PhrasesScreen } from './components/PhrasesScreen';
import { EditorScreen } from './components/EditorScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { admobService } from './services/admobService';
import { revenueCatService } from './services/revenueCatService';
import { StripeService } from './services/stripeService';

import './index.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('NONE');
  const [favoritePhrases, setFavoritePhrases] = useState<string[]>([]);
  const [nav, setNav] = useState<NavigationState>({
    currentScreen: 'language',
    selectedLanguage: null,
    selectedCategory: null,
    selectedPhrase: null
  });

  // Splash Screen & Onboarding Logic
  useEffect(() => {
    const checkOnboarding = () => {
      const hasSeen = localStorage.getItem('superquote_onboarding_seen');
      if (!hasSeen) {
        setShowOnboarding(true);
      }

      // Check tutorial status
      const tutSeen = localStorage.getItem('superquote_tutorial_done');
      if (!tutSeen && hasSeen) {
        setTutorialStep('WELCOME_SURPRISE');
      }

      setIsLoading(false);
    };

    // Check secret premium activation
    const secretPremium = localStorage.getItem('superquote_secret_premium');
    if (secretPremium === 'true') {
      setIsPremiumUser(true);
    }

    const timer = setTimeout(checkOnboarding, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Initialize AdMob
  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false, // Produção - ads reais
        });
        console.log('AdMob initialized successfully');

        // Adiciona listeners para interstitials
        admobService.addInterstitialListeners();

        // Prepara o primeiro interstitial
        admobService.prepareInterstitial();

        // Prepara o primeiro rewarded ad
        admobService.prepareRewarded();
      } catch (error) {
        console.error('Error initializing AdMob:', error);
      }
    };

    initializeAdMob();
  }, []);



  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        const isNative = Capacitor.isNativePlatform();

        // ============================================
        // MODO WEB (STRIPE)
        // ============================================
        if (!isNative) {
          console.log('Web platform detected, checking Stripe status...');

          // 1. Verificar se acabou de voltar de um pagamento (session_id na URL)
          const params = new URLSearchParams(window.location.search);
          const sessionId = params.get('session_id');

          if (sessionId) {
            console.log('Detected session_id, verifying...');
            const email = await StripeService.verifySession(sessionId);
            if (email) {
              localStorage.setItem('superquote_user_email', email);
              // Limpar a URL para não ficar com o session_id lá
              window.history.replaceState({}, document.title, "/");
            }
          }

          // 2. Verificar se temos email guardado para ver status Premium
          const email = localStorage.getItem('superquote_user_email');
          if (email) {
            const isPremium = await StripeService.checkSubscriptionStatus(email);
            const secretPremium = localStorage.getItem('superquote_secret_premium');
            setIsPremiumUser(isPremium || secretPremium === 'true');
            console.log('Web Premium check for', email, ':', isPremium);
          }
          return;
        }

        // ============================================
        // MODO NATIVO (REVENUECAT)
        // ============================================
        await revenueCatService.initialize();

        // Verifica se já tem subscrição ativa
        const isPremium = await revenueCatService.checkSubscriptionStatus();
        const secretPremium = localStorage.getItem('superquote_secret_premium');
        setIsPremiumUser(isPremium || secretPremium === 'true');

        console.log('RevenueCat initialized. Premium:', isPremium);
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      }
    };

    initializeRevenueCat();
  }, []);

  // Load Favorites from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('superquote_favorites');
    if (saved) {
      try {
        setFavoritePhrases(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Toggle Favorite Handler
  const handleToggleFavorite = (phrase: string) => {
    let newFavorites;
    if (favoritePhrases.includes(phrase)) {
      newFavorites = favoritePhrases.filter(p => p !== phrase);
    } else {
      newFavorites = [...favoritePhrases, phrase];
    }
    setFavoritePhrases(newFavorites);
    localStorage.setItem('superquote_favorites', JSON.stringify(newFavorites));
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem('superquote_onboarding_seen', 'true');
    setShowOnboarding(false);

    // Inicia o tutorial imediatamente se não tiver sido visto
    const tutSeen = localStorage.getItem('superquote_tutorial_done');
    if (!tutSeen) {
      setTutorialStep('WELCOME_SURPRISE');
    }
  };

  const handleUnlockPremium = async () => {
    // This will be called by RevenueCat upon successful purchase
    // OR by the secret activation
    setIsPremiumUser(true);
    localStorage.setItem('superquote_secret_premium', 'true');

    try {
      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        await revenueCatService.checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error syncing premium status:', error);
    }
  };

  const handleLanguageSelect = (lang: LanguageCode) => {
    setNav({ ...nav, selectedLanguage: lang, currentScreen: 'categories' });
  };

  const handleCategorySelect = (cat: string) => {
    setNav({ ...nav, selectedCategory: cat, currentScreen: 'phrases' });
  };

  const handlePhraseSelect = (phrase: string) => {
    setNav({ ...nav, selectedPhrase: phrase, currentScreen: 'editor' });
  };

  const handleGoToFavorites = () => {
    setNav({ ...nav, currentScreen: 'favorites' });
  };

  const handleSurprise = () => {
    if (!nav.selectedLanguage) return;

    // 1. Pick a random category
    const cats = PHRASES_DB[nav.selectedLanguage];
    const catKeys = Object.keys(cats);
    if (catKeys.length === 0) return;

    const randomCatKey = catKeys[Math.floor(Math.random() * catKeys.length)];

    // 2. Pick a random phrase from that category
    const phrases = cats[randomCatKey];
    if (!phrases || phrases.length === 0) return;

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    // 3. Go straight to editor
    setNav({
      ...nav,
      selectedCategory: randomCatKey,
      selectedPhrase: randomPhrase,
      currentScreen: 'editor'
    });
  };

  const goBack = () => {
    if (nav.currentScreen === 'editor') {
      setNav({ ...nav, currentScreen: 'phrases', selectedPhrase: null });
    } else if (nav.currentScreen === 'phrases') {
      setNav({ ...nav, currentScreen: 'categories', selectedCategory: null });
    } else if (nav.currentScreen === 'favorites') {
      setNav({ ...nav, currentScreen: 'categories' });
    } else if (nav.currentScreen === 'categories') {
      setNav({ ...nav, currentScreen: 'language', selectedLanguage: null });
    }
  };

  // Render Logic
  if (isLoading) {
    return (
      <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden">
        <SplashScreen />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden">
        <OnboardingScreen onFinish={handleFinishOnboarding} />
      </div>
    );
  }

  // Default to pt-PT if no language selected yet (though logic prevents reaching screens without it)
  const currentLanguage = nav.selectedLanguage || 'pt-PT';

  let content;
  switch (nav.currentScreen) {
    case 'language':
      content = <LanguageScreen onSelectLanguage={handleLanguageSelect} />;
      break;

    case 'categories':
      if (!nav.selectedLanguage) break;
      content = (
        <CategoriesScreen
          categories={Object.keys(PHRASES_DB[nav.selectedLanguage])}
          onBack={goBack}
          onSelectCategory={handleCategorySelect}
          onSurprise={handleSurprise}
          onOpenFavorites={handleGoToFavorites}
          language={nav.selectedLanguage}
          isPremium={isPremiumUser}
          onUnlockPremium={handleUnlockPremium}
          tutorialStep={tutorialStep}
          setTutorialStep={setTutorialStep}
        />
      );
      break;

    case 'phrases':
      if (!nav.selectedLanguage || !nav.selectedCategory) break;
      const phrases = PHRASES_DB[nav.selectedLanguage][nav.selectedCategory];
      content = (
        <PhrasesScreen
          category={nav.selectedCategory}
          phrases={phrases}
          onBack={goBack}
          onSelectPhrase={handlePhraseSelect}
          isPremium={isPremiumUser}
          favorites={favoritePhrases}
          onToggleFavorite={handleToggleFavorite}
          language={currentLanguage}
        />
      );
      break;

    case 'favorites':
      content = (
        <FavoritesScreen
          favorites={favoritePhrases}
          onBack={goBack}
          onSelectPhrase={handlePhraseSelect}
          onToggleFavorite={handleToggleFavorite}
          language={currentLanguage}
        />
      );
      break;

    case 'editor':
      if (!nav.selectedPhrase) break;
      content = (
        <EditorScreen
          initialPhrase={nav.selectedPhrase}
          onBack={goBack}
          isPremium={isPremiumUser}
          onUnlock={handleUnlockPremium}
          language={currentLanguage}
          tutorialStep={tutorialStep}
          setTutorialStep={setTutorialStep}
        />
      );
      break;

    default:
      content = <div>Error: Unknown screen</div>;
  }

  return (
    <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-y-auto overflow-x-hidden">
      {content}
    </div>
  );
};

export default App;

