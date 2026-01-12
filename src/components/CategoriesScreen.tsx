
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Dices, Tag, Heart, MousePointer2 } from 'lucide-react';
import { type LanguageCode, type TutorialStep } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations.ts';
import { admobService } from '../services/admobService';

interface Props {
  categories: string[];
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
  onSurprise: () => void;
  onOpenFavorites: () => void;
  language: LanguageCode;
  isPremium: boolean;
  onUnlockPremium: () => void;
  tutorialStep: TutorialStep;
  setTutorialStep: (step: TutorialStep) => void;
}

// Helper function to map category keywords to emojis
const getCategoryEmoji = (category: string): string => {
  const normalized = category.toLowerCase().trim();

  if (normalized.includes('parabens pai') || normalized.includes('parabéns pai')) return '🦸‍♂️';
  if (normalized.includes('parabens mae') || normalized.includes('parabéns mãe') || normalized.includes('parabéns mamãe')) return '🎁';
  if (normalized.includes('dia da mae') || normalized.includes('dia da mãe')) return '🌹';
  if (normalized.includes('dia do pai')) return '👔';
  if (normalized.includes('dia dos namorados') || normalized.includes('valentín')) return '💘';
  if (normalized.includes('amizade verdadeira')) return '🤞';
  if (normalized.includes('aniversário de namoro') || normalized.includes('aniversário de relacionamento')) return '💑';
  if (normalized.includes('aniversário de casamento')) return '💍';
  if (normalized.includes('frases para fotos')) return '📸';
  if (normalized.includes('frases para status')) return '💬';
  if (normalized.includes('frases curtas')) return '⚡';
  if (normalized.includes('frases de sabedoria')) return '🦉';
  if (normalized.includes('lições de vida')) return '🎓';
  if (normalized.includes('boas festas')) return '🎄';
  if (normalized.includes('2026')) return '🎆';
  if (normalized.includes('ano novo') || normalized.includes('new year')) return '🎆';
  if (normalized.includes('motivação fitness') || normalized.includes('treino')) return '💪';
  if (normalized.includes('ansiedade') || normalized.includes('calma')) return '🧘';
  if (normalized.includes('autoestima') || normalized.includes('amor propio')) return '👑';
  if (normalized.includes('declarações de amor')) return '💌';
  if (normalized.includes('humor no trabalho')) return '☕';
  if (normalized.includes('bom dia')) return '☀️';
  if (normalized.includes('boa noite')) return '🌙';
  if (normalized.includes('frases evangélicas')) return '🕯️';
  if (normalized.includes('frases para whatsapp')) return '✏️';
  if (normalized.includes('natal') || normalized.includes('christmas')) return '🎄';
  if (normalized.includes('páscoa') || normalized.includes('easter')) return '🐰';
  if (normalized.includes('mãe') || normalized.includes('mae') || normalized.includes('mother')) return '❤️';
  if (normalized.includes('pai') || normalized.includes('father')) return '💙';
  if (normalized.includes('amor') || normalized.includes('love')) return '💖';
  if (normalized.includes('aniversário') || normalized.includes('birthday') || normalized.includes('parabéns')) return '🎂';
  if (normalized.includes('trabalho') || normalized.includes('work')) return '💼';
  if (normalized.includes('estudos') || normalized.includes('exames') || normalized.includes('provas')) return '📚';
  if (normalized.includes('saudade')) return '🍂';
  if (normalized.includes('fé') || normalized.includes('deus') || normalized.includes('evangélica')) return '🙏';
  if (normalized.includes('humor') || normalized.includes('engraçado')) return '😂';
  if (normalized.includes('gratidão') || normalized.includes('agradecer')) return '🙌';
  if (normalized.includes('superação')) return '🚀';
  if (normalized.includes('recomeços') || normalized.includes('recomeço')) return '🌱';
  if (normalized.includes('família')) return '🏡';
  if (normalized.includes('filhos')) return '🧸';
  if (normalized.includes('condolências') || normalized.includes('luto')) return '🕊️';
  if (normalized.includes('vibes') || normalized.includes('positiva')) return '✨';
  if (normalized.includes('tumblr')) return '👽';
  if (normalized.includes('metas')) return '🎯';
  if (normalized.includes('reflexão')) return '🤔';
  if (normalized.includes('calendário')) return '📅';
  if (normalized.includes('término') || normalized.includes('ex')) return '💔';
  if (normalized.includes('felicitações') || normalized.includes('ex')) return '🤝';
  if (normalized.includes('motivação') || normalized.includes('ex')) return '🔥';

  return '✨';
};

const getCategoryColor = (category: string, index: number): string => {
  const normalized = category.toLowerCase();
  if (normalized.includes('amor') || normalized.includes('love') || normalized.includes('namorado') || normalized.includes('valentín')) return 'bg-pink-600';
  if (normalized.includes('natal') || normalized.includes('christmas')) return 'bg-red-700';
  if (normalized.includes('2026')) return 'bg-amber-600';
  if (normalized.includes('ano novo') || normalized.includes('new year')) return 'bg-amber-600';
  if (normalized.includes('fitness') || normalized.includes('treino') || normalized.includes('motivação')) return 'bg-emerald-600';
  if (normalized.includes('trabalho') || normalized.includes('work')) return 'bg-blue-700';
  if (normalized.includes('estudo') || normalized.includes('study')) return 'bg-orange-600';
  if (normalized.includes('fé') || normalized.includes('god') || normalized.includes('deus')) return 'bg-cyan-600';
  if (normalized.includes('humor') || normalized.includes('funny')) return 'bg-yellow-600';
  if (normalized.includes('família') || normalized.includes('family')) return 'bg-purple-600';
  if (normalized.includes('amizade') || normalized.includes('friend')) return 'bg-green-600';
  if (normalized.includes('reflexão') || normalized.includes('sabedoria')) return 'bg-teal-700';
  if (normalized.includes('bom dia') || normalized.includes('morning')) return 'bg-orange-500';
  if (normalized.includes('boa noite') || normalized.includes('night')) return 'bg-indigo-800';
  if (normalized.includes('saudade') || normalized.includes('luto') || normalized.includes('condolências')) return 'bg-slate-700';
  if (normalized.includes('mãe') || normalized.includes('mother')) return 'bg-rose-500';
  if (normalized.includes('pai') || normalized.includes('father')) return 'bg-sky-700';
  if (normalized.includes('status') || normalized.includes('foto')) return 'bg-fuchsia-700';

  const colors = [
    'bg-purple-600',
    'bg-blue-600',
    'bg-red-600',
    'bg-green-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-orange-600',
    'bg-teal-600',
  ];
  return colors[index % colors.length];
};

export const CategoriesScreen: React.FC<Props> = ({
  categories, onBack, onSelectCategory, onSurprise, onOpenFavorites,
  language, isPremium, tutorialStep, setTutorialStep, onUnlockPremium
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [secretCounter, setSecretCounter] = useState(0);
  const t = UI_TRANSLATIONS[language];

  // Mostra banner quando entra na tela (apenas se não for premium)
  useEffect(() => {
    if (!isPremium) {
      admobService.showBanner();
    }

    // Remove banner quando sai da tela
    return () => {
      admobService.removeBanner();
    };
  }, [isPremium]);

  const suggestions = useMemo(() => {
    // Always show Christmas/Natal, New Year variants, and Reflection as suggestions
    // Support multiple languages: pt-PT, pt-BR, en, es, etc.

    // Find the priority categories from the list, matching by keywords
    const found = {
      cat2026: null as string | null,
      natal: null as string | null,
      newYear: null as string | null,
      reflection: null as string | null,
    };

    categories.forEach(cat => {
      const lower = cat.toLowerCase();

      // Match 2026
      if (!found.cat2026 && lower.includes('2026')) {
        found.cat2026 = cat;
      }

      // Match Natal
      if (!found.natal && (lower.includes('natal') || lower.includes('christmas') || lower.includes('navidad'))) {
        found.natal = cat;
      }

      // Match New Year variants
      if (!found.newYear && (lower.includes('ano novo') || lower.includes('passagem de ano') ||
        lower.includes('new year') || lower.includes('año nuevo'))) {
        found.newYear = cat;
      }

      // Match Reflection variants
      if (!found.reflection && (lower.includes('reflexão') || lower.includes('reflection') ||
        lower.includes('reflexion'))) {
        found.reflection = cat;
      }
    });

    // Return the priority categories in order: 2026, Natal, Ano Novo, Reflexão
    return [found.cat2026, found.natal, found.newYear, found.reflection].filter(cat => cat !== null) as string[];
  }, [categories]);

  const filteredCategories = categories.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSearching = searchTerm.length > 0;

  const bottomCategories = isSearching
    ? filteredCategories
    : categories.filter(c => !suggestions.includes(c));

  // Function to render text with neon highlight between asterisks
  const renderHighlightedText = (text: string) => {
    const parts = text.split('*');
    return parts.map((part, index) => {
      // Odd indexes are the ones between asterisks
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-neon-pulse drop-shadow-[0_0_8px_rgba(0,255,114,0.8)] animate-pulse">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-dark-carbon relative overflow-hidden">

      {/* AdMob Banner Space - Reserved at top */}
      <div id="admob-banner-container" className="w-full h-[50px] bg-dark-graphite/30 flex items-center justify-center border-b border-dark-steel/30">
        <span className="text-xs text-text-dim opacity-50">Advertisement</span>
      </div>

      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-screen" style={{ backgroundColor: '#00FF72', opacity: 0.15 }}></div>
      <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-screen" style={{ backgroundColor: '#39FFA0', opacity: 0.15 }}></div>

      {/* Header & Search - Increased top padding for StatusBar effect */}
      <div className="bg-dark-carbon/80 backdrop-blur-md px-5 pt-12 pb-4 sticky top-0 z-20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-b-3xl border-b border-dark-steel/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-white hover:bg-dark-graphite rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenFavorites}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-dark-graphite rounded-full transition-colors flex items-center gap-1"
            >
              <Heart className="w-6 h-6 fill-current text-red-500" />
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6 leading-tight cursor-default">
          {renderHighlightedText(t.searchPlaceholder)}
        </h1>

        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00FF41AA] w-5 h-5 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              textShadow: '0 0 5px #00FF41'
            }}
            className="w-full bg-transparent border-2 border-[#00FF41] rounded-xl pl-4 pr-11 py-4 text-white placeholder-[#00FF41AA] focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all font-medium"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-5 pb-32 no-scrollbar z-10">

        {!isSearching && (
          <div className="mb-8">
            <div
              className="flex items-center gap-2 mb-4 px-1 cursor-default select-none"
              onClick={() => {
                if (isPremium) return;
                const newCount = secretCounter + 1;
                if (newCount >= 15) {
                  onUnlockPremium();
                  setSecretCounter(0);
                  alert("Premium Ativado! 🎉");
                } else {
                  setSecretCounter(newCount);
                  // Optional: console.log(newCount) for debugging if needed
                }
              }}
            >
              <Sparkles className="w-5 h-5 text-neon-pulse fill-neon-pulse animate-pulse pointer-events-none" />
              <h2 className="font-bold text-text-primary text-lg tracking-tight pointer-events-none">{t.suggestions}</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-5 px-5 snap-x snap-mandatory no-scrollbar">
              {suggestions.map((cat, i) => {
                const emoji = getCategoryEmoji(cat);
                const bgClass = getCategoryColor(cat, i + 10);

                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className={`flex-shrink-0 w-56 h-32 rounded-lg p-4 text-left ${bgClass} shadow-lg relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-95 snap-center hover:ring-2 hover:ring-neon-mint opacity-0 animate-fade-up`}
                  >
                    {/* Glow Pulse Effect on Hover/Active */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>

                    <span className="font-bold text-lg text-white block max-w-[85%] leading-tight drop-shadow-sm relative z-10 text-left line-clamp-3">
                      {cat}
                    </span>

                    <div className="absolute -bottom-3 -right-3 w-20 h-20 flex items-center justify-center transform rotate-[25deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-transform duration-300 z-0 opacity-90">
                      <span className="text-6xl drop-shadow-md filter saturate-150">{emoji}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 px-1">
          <h2 className="font-bold text-text-primary text-lg tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-text-dim" />
            {isSearching ? t.results : t.explore}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {bottomCategories.map((cat, index) => {
            const emoji = getCategoryEmoji(cat);
            const bgStyle = getCategoryColor(cat, index);

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`${bgStyle} rounded-lg p-4 min-h-[7rem] relative overflow-hidden shadow-lg hover:shadow-xl hover:shadow-[#00FF41]/20 transition-all duration-300 group hover:ring-2 hover:ring-neon-mint hover:scale-[1.02] active:scale-95 opacity-0 animate-fade-up`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="font-bold text-lg text-white block max-w-[85%] leading-tight drop-shadow-sm relative z-10 text-left line-clamp-3">
                  {cat}
                </span>

                <div className="absolute -bottom-3 -right-3 w-20 h-20 flex items-center justify-center transform rotate-[25deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-transform duration-300 z-0 opacity-90">
                  <span className="text-6xl drop-shadow-md filter saturate-150">{emoji}</span>
                </div>
              </button>
            );
          })}

          {bottomCategories.length === 0 && (
            <div className="col-span-2 py-12 flex flex-col items-center text-center text-text-dim">
              <div className="bg-dark-graphite p-4 rounded-full mb-4 ring-1 ring-dark-steel">
                <Search className="w-8 h-8 opacity-40 text-text-dim" />
              </div>
              <p className="text-lg font-medium text-text-secondary">{t.noResults}</p>
              <p className="text-sm opacity-50">{t.tryAnother} "{searchTerm}"</p>
            </div>
          )}
        </div>

      </main>

      {/* Tutorial Overlay and Messages */}
      {tutorialStep === 'WELCOME_SURPRISE' && (
        <>
          <div className="tutorial-overlay" />
          <div className="tutorial-message-container">
            <div className="flex justify-center mb-2">
              <div className="bg-neon-pulse p-3 rounded-full shadow-[0_0_20px_rgba(0,255,114,0.5)]">
                <Sparkles className="w-6 h-6 text-dark-carbon animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t.tutWelcomeTitle}</h3>
            <p className="text-text-dim text-sm font-medium leading-relaxed">
              {t.tutWelcomeDesc.split('\n\n').map((para, i) => (
                <React.Fragment key={i}>
                  {para}
                  {i === 0 && <><br /><br /></>}
                </React.Fragment>
              ))}
            </p>
          </div>
        </>
      )}

      <div className={`absolute bottom-8 left-0 right-0 px-6 flex justify-center ${tutorialStep === 'WELCOME_SURPRISE' ? 'z-[100]' : 'z-30'} pointer-events-none`}>
        {tutorialStep === 'WELCOME_SURPRISE' && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[tutorial-tap_1s_infinite]">
            <span className="bg-neon-pulse text-dark-carbon text-[10px] font-black px-2 py-0.5 rounded-full mb-1 uppercase tracking-wider shadow-lg">{t.tutTouchHere}</span>
            <MousePointer2 className="w-8 h-8 text-neon-pulse fill-neon-pulse drop-shadow-[0_0_10px_rgba(0,255,114,0.8)] rotate-[-20deg]" />
          </div>
        )}
        <button
          id="tutorial-surprise-btn"
          onClick={() => {
            if (tutorialStep === 'WELCOME_SURPRISE') {
              setTutorialStep('OPEN_TEMPLATES');
            }
            onSurprise();
          }}
          className={`pointer-events-auto flex items-center gap-3 ${tutorialStep === 'WELCOME_SURPRISE'
            ? 'pulse-neon bg-neon-pulse text-dark-carbon tutorial-highlight-area'
            : 'bg-neon-pulse text-dark-carbon border-neon-mint shadow-[0_0_25px_rgba(0,255,114,0.4)] hover:shadow-[0_0_35px_rgba(0,255,114,0.6)]'
            } pl-6 pr-8 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all font-bold text-lg tracking-wide border relative overflow-hidden group`}
        >
          <Dices className="w-6 h-6 animate-spin-slow" />
          <span>{t.surpriseMe}</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-carbon via-dark-carbon/80 to-transparent pointer-events-none z-20" />
    </div>
  );
};