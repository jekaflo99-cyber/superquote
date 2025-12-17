import React from 'react';
import { X, PlayCircle, Crown, Clock } from 'lucide-react';
import { type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  type: 'template' | 'preset';
  language: LanguageCode;
}

export const RewardedAdModal: React.FC<Props> = ({ isOpen, onClose, onWatchAd, type, language }) => {
  if (!isOpen) return null;

  const t = UI_TRANSLATIONS[language];
  const description = type === 'template' ? t.watchAdTemplate : t.watchAdPreset;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-dark-graphite border-2 border-dark-steel rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-dark-carbon to-dark-graphite p-6 border-b border-dark-steel">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-dark-steel/50 rounded-full hover:bg-dark-steel transition-colors"
          >
            <X className="w-4 h-4 text-text-dim" />
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-neon-pulse/20 flex items-center justify-center border-2 border-neon-pulse/30">
              <PlayCircle className="w-8 h-8 text-neon-pulse" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neon-pulse drop-shadow-[0_0_10px_rgba(0,255,114,0.5)]">
                {t.watchAdTitle}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-text-secondary" />
                <span className="text-xs text-text-secondary">30 segundos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-text-secondary text-sm leading-relaxed">
            {description}
          </p>

          {/* Benefits */}
          <div className="bg-dark-carbon/50 rounded-xl p-4 border border-dark-steel/50">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-neon-pulse mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-semibold text-sm mb-1">Acesso Temporário PRO</h4>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>✓ Usa o {type === 'template' ? 'template' : 'estilo'} até meia-noite</li>
                  <li>✓ Sem limite de exportações</li>
                  <li>✓ 1 {type === 'template' ? 'template' : 'estilo'} grátis por dia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={onWatchAd}
            className="w-full bg-neon-pulse text-dark-carbon font-bold py-4 rounded-xl hover:bg-neon-mint transition-all shadow-lg shadow-neon-pulse/20 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            {t.watchAdButton}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-dark-steel text-text-secondary font-medium py-3 rounded-xl hover:bg-dark-steel/80 transition-colors"
          >
            {t.cancelButton}
          </button>
        </div>
      </div>
    </div>
  );
};
