import React, { useState, useEffect } from 'react';
import { X, Crown, Check } from 'lucide-react';
import { type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';
import { revenueCatService, type SubscriptionPlan } from '../services/revenueCatService';
import { Capacitor } from '@capacitor/core';


interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (plan: 'yearly' | 'monthly' | 'weekly', email?: string) => void;
    onRestore?: () => void;
    language: LanguageCode;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    isOpen,
    onClose,
    onPurchase,
    onRestore,
    language
}) => {
    const t = UI_TRANSLATIONS[language];
    const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
    const [plans, setPlans] = useState<{
        yearly: SubscriptionPlan | null;
        monthly: SubscriptionPlan | null;
        weekly: SubscriptionPlan | null;
    }>({
        yearly: null,
        monthly: null,
        weekly: null
    });
    const [currency, setCurrency] = useState<'eur' | 'brl' | 'usd'>('eur');

    // Preços por moeda - Tabela Mágica de Preços
    const CURRENCY_PRICES = {
        eur: {
            yearly: { price: '19,99€', perMonth: '1,66€' },
            monthly: { price: '4,99€' },
            weekly: { price: '1,99€' }
        },
        brl: {
            yearly: { price: 'R$ 99,90', perMonth: 'R$ 8,32' },
            monthly: { price: 'R$ 19,90' },
            weekly: { price: 'R$ 7,90' }
        },
        usd: {
            yearly: { price: '$19.99', perMonth: '$1.66' },
            monthly: { price: '$4.99' },
            weekly: { price: '$1.99' }
        }
    };

    // Preços fallback (caso o RevenueCat não carregue)
    const fallbackPricing = CURRENCY_PRICES[currency];


    useEffect(() => {
        if (isOpen) {
            detectPlatform();
        }
    }, [isOpen, language]);

    const detectPlatform = async () => {
        try {
            // Se não é plataforma nativa, é web (PWA)
            const isNative = await (await import('@capacitor/core')).Capacitor.isNativePlatform();

            // Recuperar email removed

            // Detetar moeda do utilizador (passando a língua selecionada na app)
            const detectedCurrency = detectCurrency(language);
            setCurrency(detectedCurrency);

            // Apenas tenta carregar ofertas do RevenueCat se for nativo
            if (isNative) {
                loadOfferings();
            }
        } catch (error) {
            console.error('Error detecting platform:', error);
            // Se der erro, assume que é web
            // setIsNativeApp removed
        }
    };

    /**
     * Deteta a moeda baseado na localização do utilizador ou língua da app
     */
    const detectCurrency = (appLanguage?: LanguageCode): 'eur' | 'brl' | 'usd' => {
        // 1. Prioridade para a língua selecionada na App
        if (appLanguage === 'pt-BR') {
            console.log('Moeda: BRL (App Language: pt-BR)');
            return 'brl';
        }
        if (appLanguage === 'pt-PT' || appLanguage === 'es') {
            console.log('Moeda: EUR (App Language)');
            return 'eur';
        }
        if (appLanguage === 'en') {
            console.log('Moeda: USD (App Language: en)');
            return 'usd';
        }

        // 2. Fallback para o navegador
        if (typeof navigator === 'undefined') return 'eur';

        try {
            const locale = (navigator.language || 'en-US').toLowerCase();
            console.log('Detected browser locale:', locale);

            if (locale.includes('pt-br') || locale.includes('pt_br') || locale.includes('br')) {
                return 'brl';
            }
            if (locale.startsWith('pt') || locale.startsWith('es')) {
                return 'eur';
            }
            if (locale.startsWith('en')) {
                return 'usd';
            }
            return 'eur';
        } catch (e) {
            return 'eur';
        }
    };

    const loadOfferings = async () => {
        try {
            const offerings = await revenueCatService.getOfferings();
            setPlans(offerings);
        } catch (error) {
            console.error('Error loading offerings:', error);
        }
    };


    const getPricing = (planType: 'yearly' | 'monthly' | 'weekly'): { price: string; trialDays?: number; perMonth?: string } => {
        // @ts-ignore
        const plan = plans[planType];
        if (plan) {
            return {
                price: plan.price,
                trialDays: plan.trialDays,
                perMonth: plan.pricePerMonth
            };
        }
        // @ts-ignore
        return fallbackPricing[planType];
    };

    const yearlyPrice = getPricing('yearly');
    const monthlyPrice = getPricing('monthly');
    const weeklyPrice = getPricing('weekly');

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-dark-graphite sm:rounded-3xl rounded-t-3xl p-6 relative shadow-2xl border border-dark-steel/50 overflow-y-auto max-h-[90vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-dark-steel/50 hover:bg-dark-steel rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5 text-text-secondary" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-neon-pulse/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative p-5 rounded-3xl bg-gradient-to-br from-dark-steel/50 to-dark-graphite border border-neon-pulse/30 shadow-[0_0_40px_rgba(0,255,114,0.15)] mt-4">
                            <Crown className="w-12 h-12 text-neon-pulse drop-shadow-[0_0_10px_rgba(0,255,114,0.5)]" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight bg-gradient-to-b from-white to-text-secondary bg-clip-text text-transparent">
                        {t.premiumTitle.replace(' 🔒', '')}
                    </h2>
                    <p className="text-text-secondary text-base leading-relaxed font-medium px-4">
                        {t.premiumDesc}
                    </p>
                </div>

                {/* Plans */}
                <div className="space-y-3 mb-6">
                    {/* Plano Anual - DESTACADO */}
                    <div className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${selectedPlan === 'yearly'
                        ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_30px_rgba(0,255,114,0.25)]'
                        : 'border-dark-steel/50 bg-dark-steel/20 hover:border-dark-steel hover:bg-dark-steel/30'
                        }`}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        {/* Animated Background Shine for Selected */}
                        {selectedPlan === 'yearly' && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-shine" />
                        )}

                        {/* Badge */}
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-neon-pulse to-neon-mint px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,255,114,0.4)] z-10">
                            <span className="text-[10px] font-black text-dark-carbon uppercase tracking-widest">
                                {t.bestValue}
                            </span>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="text-xl font-black text-white">{t.yearlyPlan}</h3>
                                    <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">7 Dias Grátis</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-2xl font-black text-white">{yearlyPrice.price}</span>
                                    <span className="text-sm text-text-dim font-medium">{t.perYear}</span>
                                </div>
                                {yearlyPrice.perMonth && (
                                    <p className="text-xs text-neon-pulse/80 font-bold mb-3">
                                        {t.equivalentTo} {yearlyPrice.perMonth} {t.monthlyEquivalent}
                                    </p>
                                )}
                                <div className="space-y-1.5">
                                    {(t.yearlyBenefit || '').split(',').map((benefit: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                                            <div className="w-1 h-1 rounded-full bg-neon-pulse" />
                                            {benefit.trim()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedPlan === 'yearly'
                                ? 'border-neon-pulse bg-neon-pulse scale-110'
                                : 'border-dark-steel bg-dark-carbon/50'
                                }`}>
                                {selectedPlan === 'yearly' && <Check className="w-4 h-4 text-dark-carbon" strokeWidth={4} />}
                            </div>
                        </div>
                    </div>

                    {/* Plano Mensal */}
                    <div
                        onClick={() => setSelectedPlan('monthly')}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left relative cursor-pointer ${selectedPlan === 'monthly'
                            ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_20px_rgba(0,255,114,0.15)]'
                            : 'border-dark-steel/50 bg-dark-steel/20 hover:border-dark-steel/80'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-white mb-0.5">{t.monthlyPlan}</h3>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-white">{monthlyPrice.price}</span>
                                    <span className="text-xs text-text-dim font-medium">{t.perMonth}</span>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedPlan === 'monthly'
                                ? 'border-neon-pulse bg-neon-pulse'
                                : 'border-dark-steel bg-dark-carbon/50'
                                }`}>
                                {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 text-dark-carbon" strokeWidth={4} />}
                            </div>
                        </div>
                    </div>

                    {/* Plano Semanal */}
                    <div
                        onClick={() => setSelectedPlan('weekly')}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left relative cursor-pointer ${selectedPlan === 'weekly'
                            ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_20px_rgba(0,255,114,0.15)]'
                            : 'border-dark-steel/50 bg-dark-steel/20 hover:border-dark-steel/80'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-white mb-0.5">{t.weeklyPlan}</h3>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-white">{weeklyPrice.price}</span>
                                    <span className="text-xs text-text-dim font-medium">{t.perWeek}</span>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedPlan === 'weekly'
                                ? 'border-neon-pulse bg-neon-pulse'
                                : 'border-dark-steel bg-dark-carbon/50'
                                }`}>
                                {selectedPlan === 'weekly' && <Check className="w-3.5 h-3.5 text-dark-carbon" strokeWidth={4} />}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Web Email Input (Stripe) */}
                {!Capacitor.isNativePlatform() && (
                    <div className="mb-6 animate-in slide-in-from-top-2 duration-400">
                        <label className="block text-xs font-bold text-neon-pulse uppercase tracking-wider mb-2 ml-1">
                            Email para ativação
                        </label>
                        <input
                            type="email"
                            placeholder="teu@email.com"
                            id="stripe-email"
                            className="w-full bg-dark-carbon/50 border-2 border-dark-steel/50 rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-pulse/50 transition-all font-medium"
                        />
                        <p className="text-[10px] text-text-dim mt-2 ml-1">
                            Usaremos este email para sincronizar o teu Premium entre dispositivos.
                        </p>
                    </div>
                )}

                {/* Continue Button */}
                <div className="mt-8 mb-6">
                    <button
                        onClick={() => {
                            const email = (document.getElementById('stripe-email') as HTMLInputElement)?.value;
                            onPurchase(selectedPlan, email);
                        }}
                        className="w-full relative group"
                    >
                        <div className="absolute inset-0 bg-neon-pulse blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative bg-neon-pulse hover:bg-neon-mint text-dark-carbon font-black text-xl py-4 rounded-2xl shadow-xl transition-all duration-300 transform group-hover:scale-[1.02] group-active:scale-[0.98] uppercase tracking-[2px] flex items-center justify-center gap-3">
                            {t.continueButton}
                            <Crown className="w-6 h-6" />
                        </div>
                    </button>
                </div>

                {/* Legal Text */}
                <div className="space-y-2 mb-4">
                    <p className="text-[10px] text-text-dim leading-relaxed text-center opacity-80">{t.legalText1}</p>
                    <p className="text-[10px] text-text-dim leading-relaxed text-center opacity-80">{t.legalText2}</p>
                    <p className="text-[10px] text-text-dim leading-relaxed text-center opacity-80">{t.legalText3}</p>
                </div>

                {/* Footer Links */}
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-dark-steel/50">
                    <button
                        onClick={() => onRestore && onRestore()}
                        className="text-sm text-text-secondary hover:text-neon-pulse transition-colors font-medium"
                    >
                        {t.restorePurchases}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-text-dim">
                        <button className="hover:text-text-secondary transition-colors">{t.termsOfUse}</button>
                        <span>·</span>
                        <button className="hover:text-text-secondary transition-colors">{t.privacyPolicy}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
