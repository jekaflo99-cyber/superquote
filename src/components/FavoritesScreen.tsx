
import React from 'react';
import { ArrowLeft, Copy, Edit3, Heart } from 'lucide-react';
import { type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';

interface Props {
    favorites: string[];
    onBack: () => void;
    onSelectPhrase: (phrase: string) => void;
    onToggleFavorite: (phrase: string) => void;
    language: LanguageCode;
}

export const FavoritesScreen: React.FC<Props> = ({ favorites, onBack, onSelectPhrase, onToggleFavorite, language }) => {
    const t = UI_TRANSLATIONS[language];

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col h-full bg-dark-carbon text-text-primary">
            {/* Header */}
            <header className="bg-dark-graphite px-4 pb-4 pt-12 shadow-md border-b border-dark-steel sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-white hover:bg-dark-steel rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="ml-2 text-lg font-bold text-white flex items-center gap-2">
                        {t.myQuotes} <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </h1>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-dark-carbon no-scrollbar pb-20">

                {favorites.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 opacity-60 animate-fade-up">
                        <div className="bg-dark-steel p-6 rounded-full mb-4">
                            <Heart className="w-12 h-12 text-text-dim" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.noFavorites}</h3>
                        <p className="text-text-secondary text-sm">
                            {t.addFavoritesHint}
                        </p>
                    </div>
                )}

                {favorites.slice().reverse().map((phrase, index) => (
                    <div
                        key={index}
                        onClick={() => onSelectPhrase(phrase)}
                        className="relative overflow-hidden bg-dark-graphite border-dark-steel p-6 rounded-3xl shadow-md border transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:border-neon-mint/50 hover:shadow-[0_0_18px_rgba(57,255,160,0.1)] opacity-0 animate-fade-up"
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="relative z-0">
                            <p className="text-lg leading-relaxed mb-4 font-sans font-medium text-text-primary">
                                "{phrase.replace(/<[^>]*>/g, "")}"
                            </p>

                            <div className="flex justify-between items-center border-t pt-4 border-white/5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(phrase); }}
                                    className="p-2 text-red-500 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Heart className="w-6 h-6 fill-red-500" />
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
                        </div>
                    </div>
                ))}

                <div className="h-8"></div>
            </main>
        </div>
    );
};