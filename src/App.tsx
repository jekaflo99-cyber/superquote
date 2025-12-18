import React, { useState, useEffect } from 'react';
import { type NavigationState, type LanguageCode } from './types';
import { PHRASES_DB } from './Data/content';
import { LanguageScreen } from './components/LanguageScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { PhrasesScreen } from './components/PhrasesScreen';
import { EditorScreen } from './components/EditorScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AdMob } from '@capacitor-community/admob';
import { admobService } from './services/admobService';
import { revenueCatService } from './services/revenueCatService';
import './index.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
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
        
        // Verifica se tem premium secreto ativado
        const hasSecretPremium = localStorage.getItem('superquote_secret_premium') === 'true';
        if (hasSecretPremium) {
            setIsPremiumUser(true);
        }
        
        setIsLoading(false);
    };

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
        // Only initialize RevenueCat on native platforms
        const isNative = Capacitor.isNativePlatform();
        if (!isNative) {
          console.log('Web platform detected, skipping RevenueCat initialization');
          return;
        }

        await revenueCatService.initialize();
        
        // Verifica se já tem subscrição ativa
        const isPremium = await revenueCatService.checkSubscriptionStatus();
        setIsPremiumUser(isPremium);
        
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
  };

  const handleUnlockPremium = async () => {
      setIsPremiumUser(true);
      
      // Re-verifica o status no RevenueCat para sincronizar (apenas em plataformas nativas)
      try {
          const isNative = Capacitor.isNativePlatform();
          if (isNative) {
              await revenueCatService.checkSubscriptionStatus();
          }
      } catch (error) {
          console.error('Error syncing premium status:', error);
      }
  };

  const handleActivateSecretPremium = () => {
      // Ativa premium permanentemente via localStorage
      localStorage.setItem('superquote_secret_premium', 'true');
      setIsPremiumUser(true);
      console.log('🔓 Secret Premium Mode Activated!');
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
      const categories = Object.keys(PHRASES_DB[nav.selectedLanguage]);
      content = (
        <CategoriesScreen 
            categories={categories} 
            onBack={goBack} 
            onSelectCategory={handleCategorySelect}
            onSurprise={handleSurprise}
            onOpenFavorites={handleGoToFavorites}
            language={currentLanguage}
            isPremium={isPremiumUser}
            onActivateSecretPremium={handleActivateSecretPremium}
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

