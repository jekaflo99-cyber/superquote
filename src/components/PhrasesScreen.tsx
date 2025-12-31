
import React, { useMemo } from 'react';
import { ArrowLeft, Copy, Edit3, Shuffle, Crown, Heart } from 'lucide-react';
import { type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';

interface Props {
    category: string;
    phrases: string[];
    onBack: () => void;
    onSelectPhrase: (phrase: string) => void;
    isPremium: boolean;
    favorites: string[];
    onToggleFavorite: (phrase: string) => void;
    language: LanguageCode;
}

const getCardStyle = () => {
    return 'bg-dark-graphite border-dark-steel';
};

export const PhrasesScreen: React.FC<Props> = ({ category, phrases, onBack, onSelectPhrase, isPremium, favorites, onToggleFavorite, language }) => {
    const t = UI_TRANSLATIONS[language];

    const processedPhrases = useMemo(() => {
        if (!phrases) return [];

        // Improved deduplication: Trim and normalize to lowercase for comparison
        const seen = new Set<string>();
        return phrases
            .map(p => p.trim())
            .filter(p => {
                if (p.length === 0) return false;
                const lower = p.toLowerCase();
                if (seen.has(lower)) return false;
                seen.add(lower);
                return true;
            });
    }, [phrases]);

    const FREE_LIMIT = 7;

    // Adiciona 1 frase grande aleatória às free (além das primeiras curtas)
    const freePhrases = useMemo(() => {
        if (isPremium) return processedPhrases;

        // Pega as primeiras FREE_LIMIT (normalmente as mais curtas)
        const shortPhrases = processedPhrases.slice(0, FREE_LIMIT);

        // Pega frases longas (após FREE_LIMIT) para escolher 1 aleatória
        const longPhrases = processedPhrases.slice(FREE_LIMIT);

        if (longPhrases.length === 0) return shortPhrases;

        // Escolhe 1 frase longa aleatória
        const randomLongPhrase = longPhrases[Math.floor(Math.random() * longPhrases.length)];

        // Retorna: curtas + 1 longa aleatória
        return [...shortPhrases, randomLongPhrase];
    }, [processedPhrases, isPremium]);

    const handleRandom = () => {
        const availablePhrases = isPremium ? processedPhrases : freePhrases;

        if (availablePhrases.length > 0) {
            const randomPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];
            onSelectPhrase(randomPhrase);
        }
    };

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="flex flex-col h-full bg-dark-carbon text-text-primary">
            {/* Dark Header with reduced Padding */}
            <header className="bg-dark-graphite p-4 shadow-md border-b border-dark-steel sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center overflow-hidden">
                    <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-white hover:bg-dark-steel rounded-full transition-colors flex-shrink-0">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="ml-2 overflow-hidden">
                        <h1 className="text-lg font-bold text-white truncate">{category}</h1>
                        <p className="text-xs text-text-dim font-medium">{processedPhrases.length} {t.results || 'phrases'}</p>
                    </div>
                </div>
                <button
                    onClick={handleRandom}
                    className="flex-shrink-0 flex items-center text-sm font-bold text-dark-carbon bg-neon-pulse hover:bg-neon-mint px-3 py-1.5 rounded-full transition-colors shadow-[0_0_15px_rgba(0,255,114,0.3)]"
                >
                    <Shuffle className="w-4 h-4 mr-1" /> {t.random}
                </button>
            </header>

            <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-dark-carbon no-scrollbar pb-20">
                {processedPhrases.map((phrase, index) => {
                    const cardStyle = getCardStyle();
                    const isLocked = !isPremium && !freePhrases.includes(phrase);
                    const isFav = favorites.includes(phrase);

                    return (
                        <div
                            key={index}
                            onClick={() => !isLocked && onSelectPhrase(phrase)}
                            className={`relative overflow-hidden ${cardStyle} p-6 rounded-3xl shadow-md border transition-all duration-300 group opacity-0 animate-fade-up ${!isLocked ? 'cursor-pointer hover:-translate-y-1 hover:border-neon-mint/50 hover:shadow-[0_0_18px_rgba(57,255,160,0.1)]' : 'cursor-default border-dark-steel'}`}
                            style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                        >
                            {/* --- CONTENT --- */}
                            <div className="relative z-0">
                                <p className={`text-lg leading-relaxed mb-4 font-sans font-medium ${isLocked ? 'blur-md opacity-20 select-none text-text-dim' : 'text-text-primary'}`}>
                                    "{phrase.replace(/<[^>]*>/g, "")}"
                                </p>

                                {!isLocked && (
                                    <div className="flex justify-between items-center border-t pt-4 border-white/5">
                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(phrase); }}
                                            className="p-2 text-text-secondary hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <Heart className={`w-6 h-6 ${isFav ? 'fill-red-500 text-red-500' : 'text-text-secondary hover:text-red-400'}`} />
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => copyToClipboard(phrase, e)}
                                                className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                            <button
                                                className="flex items-center px-4 py-2 bg-dark-carbon text-neon-pulse border border-neon-pulse/30 rounded-xl font-bold text-sm hover:bg-neon-pulse hover:text-dark-carbon transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                {t.create}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- PREMIUM OVERLAY --- */}
                            {isLocked && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-carbon/95 backdrop-blur-xl">
                                    <div className="bg-dark-graphite/50 border-2 border-neon-pulse/50 p-8 rounded-3xl shadow-[0_0_24px_rgba(0,255,114,0.1)] flex flex-col items-center gap-4 w-[90%] max-w-[280px] text-center transform group-hover:scale-105 transition-transform duration-300">
                                        <div className="bg-neon-pulse p-4 rounded-full shadow-[0_0_30px_rgba(0,255,114,0.6)] animate-pulse">
                                            <Crown className="w-8 h-8 text-dark-carbon fill-dark-carbon" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl uppercase tracking-widest text-white mb-2">
                                                {t.premiumFeature}
                                            </h3>
                                            <p className="text-xs text-neon-pulse font-bold uppercase tracking-widest border border-neon-pulse/30 px-3 py-1 rounded-full bg-neon-pulse/10">
                                                {t.lockedContent}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {processedPhrases.length === 0 && (
                    <div className="text-center py-10 text-text-dim">
                        <p>No phrases found in this category.</p>
                    </div>
                )}

                <div className="h-8"></div>
            </main>
        </div>
    );
};
