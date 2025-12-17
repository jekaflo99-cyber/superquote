import React from 'react';
import { type LanguageCode } from '../types';
import languageIcon from '../assets/icons/icon.png';

interface Props {
  onSelectLanguage: (lang: LanguageCode) => void;
}

const languages: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
  { code: 'pt-PT', label: 'Português (PT)', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export const LanguageScreen: React.FC<Props> = ({ onSelectLanguage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-dark-carbon text-text-primary relative overflow-hidden">
      
      {/* Background Decor (Matching Splash) */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[50%] bg-neon-pulse/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-neon-mint/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-12 text-center relative z-10">
        <div className="bg-dark-graphite rounded-3xl inline-block mb-6 shadow-[0_0_24px_rgba(0,255,114,0.1)] ring-1 ring-dark-steel overflow-hidden w-32 h-32 motion-safe:animate-bounce">
            <img src={languageIcon} alt="language" className="w-full h-full object-cover animate-pulse" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">
          Insta<span className="text-neon-pulse">Quote</span>
        </h1>
        <p className="text-text-secondary mt-3 text-lg font-medium">Select your language</p>
      </div>

      <div className="w-full max-w-sm space-y-4 relative z-10">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelectLanguage(lang.code)}
            className="w-full flex items-center p-4 bg-dark-graphite hover:bg-dark-steel border border-dark-steel hover:border-neon-mint/50 rounded-2xl transition-all duration-300 group shadow-lg hover:shadow-[0_0_18px_rgba(57,255,160,0.1)]"
          >
            <span className="text-3xl mr-5 drop-shadow-sm">{lang.flag}</span>
            <span className="text-lg font-bold text-gray-200 group-hover:text-neon-pulse transition-colors">
              {lang.label}
            </span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 text-neon-pulse transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                →
            </div>
          </button>
        ))}
      </div>
      
      <div className="absolute bottom-8 text-center">
        <p className="text-text-dim text-xs font-medium uppercase tracking-widest opacity-50 mb-2">
          Create • Inspire • Share
        </p>
        <a 
          href="https://sites.google.com/view/privacypolicy-superquote" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-text-secondary hover:text-neon-pulse text-xs underline transition-colors"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
};