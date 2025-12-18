import React, { useState, useEffect } from 'react';
import { X, Crown, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';
import { revenueCatService, type SubscriptionPlan } from '../services/revenueCatService';
import StripeService from '../services/stripeService';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (plan: 'yearly' | 'monthly' | 'weekly') => void;
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
    const [isNativeApp, setIsNativeApp] = useState(true);
    const [isLoadingStripe, setIsLoadingStripe] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [currency, setCurrency] = useState<'eur' | 'brl' | 'usd'>('eur');

    // Preços por moeda - Tabela Mágica de Preços
    const CURRENCY_PRICES = {
        eur: {
            yearly: { price: '29,99€', perMonth: '2,50€' },
            monthly: { price: '4,99€' },
            weekly: { price: '1,99€' }
        },
        brl: {
            yearly: { price: 'R$ 99,90', perMonth: 'R$ 8,32' },
            monthly: { price: 'R$ 19,90' },
            weekly: { price: 'R$ 7,90' }
        },
        usd: {
            yearly: { price: '$29.99', perMonth: '$2.50' },
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
            const isNative = await Capacitor.isNativePlatform();
            setIsNativeApp(isNative);
            
            // Recuperar email do localStorage
            const savedEmail = localStorage.getItem('userEmail') || '';
            setUserEmail(savedEmail);

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
            setIsNativeApp(false);
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

    const handleStripeCheckout = async () => {
        if (!userEmail || !userEmail.includes('@')) {
            setStripeError('Por favor insira um email válido');
            return;
        }

        setIsLoadingStripe(true);
        setStripeError(null);

        try {
            // Guardar email para futuro
            localStorage.setItem('userEmail', userEmail);
            await StripeService.startCheckout(selectedPlan, userEmail, currency);
        } catch (error) {
            setStripeError(error instanceof Error ? error.message : 'Erro ao iniciar pagamento');
            setIsLoadingStripe(false);
        }
    };

    const getPricing = (planType: 'yearly' | 'monthly' | 'weekly') => {
        const plan = plans[planType];
        if (plan) {
            return {
                price: plan.price,
                trialDays: plan.trialDays,
                perMonth: plan.pricePerMonth
            };
        }
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
                <div className="text-center mb-6">
                    <div className="inline-block p-4 rounded-full bg-neon-pulse/10 mb-4 shadow-[0_0_30px_rgba(0,255,114,0.2)]">
                        <Crown className="w-10 h-10 text-neon-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                        {t.premiumTitle.replace(' 🔒', '')}
                    </h2>
                    <p className="text-text-secondary text-sm leading-relaxed font-medium">
                        {t.premiumDesc}
                    </p>
                </div>

                {/* Plans */}
                <div className="space-y-3 mb-6">
                    {/* Plano Anual - DESTACADO */}
                    <button
                        onClick={() => setSelectedPlan('yearly')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                            selectedPlan === 'yearly'
                                ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_20px_rgba(0,255,114,0.3)]'
                                : 'border-dark-steel bg-dark-steel/30 hover:border-dark-steel/80'
                        }`}
                    >
                        {/* Badge */}
                        <div className="absolute -top-3 left-4 bg-gradient-to-r from-neon-pulse to-neon-mint px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,255,114,0.6)]">
                            <span className="text-xs font-black text-dark-carbon uppercase tracking-wider">
                                {t.bestValue}
                            </span>
                        </div>

                        <div className="flex items-start justify-between mt-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{t.yearlyPlan}</h3>
                                <p className="text-sm text-text-secondary mb-2">
                                    {yearlyPrice.trialDays && (
                                        <>
                                            <span className="text-neon-pulse font-bold">{yearlyPrice.trialDays}</span> {t.trialThen}
                                            {' '}
                                        </>
                                    )}
                                    <span className="text-white font-bold">{yearlyPrice.price}</span> {t.perYear}
                                </p>
                                {yearlyPrice.perMonth && (
                                    <p className="text-xs text-text-dim">
                                        {t.equivalentTo} <span className="text-neon-pulse font-semibold">{yearlyPrice.perMonth}</span> {t.monthlyEquivalent}
                                    </p>
                                )}
                                <p className="text-xs text-text-secondary mt-2 leading-snug">
                                    {t.yearlyBenefit}
                                </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedPlan === 'yearly' 
                                    ? 'border-neon-pulse bg-neon-pulse' 
                                    : 'border-dark-steel'
                            }`}>
                                {selectedPlan === 'yearly' && <Check className="w-4 h-4 text-dark-carbon" strokeWidth={3} />}
                            </div>
                        </div>
                    </button>

                    {/* Plano Mensal */}
                    <button
                        onClick={() => setSelectedPlan('monthly')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                            selectedPlan === 'monthly'
                                ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_20px_rgba(0,255,114,0.3)]'
                                : 'border-dark-steel bg-dark-steel/30 hover:border-dark-steel/80'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{t.monthlyPlan}</h3>
                                <p className="text-sm text-text-secondary mb-2">
                                    <span className="text-white font-bold">{monthlyPrice.price}</span> {t.perMonth}
                                </p>
                                <p className="text-xs text-text-secondary mt-2 leading-snug">
                                    {t.monthlyBenefit}
                                </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedPlan === 'monthly' 
                                    ? 'border-neon-pulse bg-neon-pulse' 
                                    : 'border-dark-steel'
                            }`}>
                                {selectedPlan === 'monthly' && <Check className="w-4 h-4 text-dark-carbon" strokeWidth={3} />}
                            </div>
                        </div>
                    </button>

                    {/* Plano Semanal */}
                    <button
                        onClick={() => setSelectedPlan('weekly')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                            selectedPlan === 'weekly'
                                ? 'border-neon-pulse bg-neon-pulse/10 shadow-[0_0_20px_rgba(0,255,114,0.3)]'
                                : 'border-dark-steel bg-dark-steel/30 hover:border-dark-steel/80'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{t.weeklyPlan}</h3>
                                <p className="text-sm text-text-secondary mb-2">
                                    <span className="text-white font-bold">{weeklyPrice.price}</span> {t.perWeek}
                                </p>
                                <p className="text-xs text-text-secondary mt-2 leading-snug">
                                    {t.weeklyBenefit}
                                </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedPlan === 'weekly' 
                                    ? 'border-neon-pulse bg-neon-pulse' 
                                    : 'border-dark-steel'
                            }`}>
                                {selectedPlan === 'weekly' && <Check className="w-4 h-4 text-dark-carbon" strokeWidth={3} />}
                            </div>
                        </div>
                    </button>
                </div>

                {/* Email Input - PWA Only */}
                {!isNativeApp && (
                    <div className="mb-6">
                        <label className="text-sm text-text-secondary mb-2 block">Email para pagamento</label>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full bg-dark-steel/50 border border-dark-steel rounded-lg px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-pulse transition"
                        />
                    </div>
                )}

                {/* Continue Button - Diferente consoante plataforma */}
                {isNativeApp ? (
                    // App Nativa - RevenueCat
                    <button 
                        onClick={() => onPurchase(selectedPlan)}
                        className="w-full bg-neon-pulse hover:bg-neon-mint text-dark-carbon font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(0,255,114,0.4)] transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wide mb-6"
                    >
                        {t.continueButton}
                    </button>
                ) : (
                    // PWA - Stripe
                    <>
                        <button 
                            onClick={handleStripeCheckout}
                            disabled={isLoadingStripe}
                            className="w-full bg-neon-pulse hover:bg-neon-mint disabled:bg-gray-600 text-dark-carbon font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(0,255,114,0.4)] transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wide mb-6"
                        >
                            {isLoadingStripe ? 'A processar...' : t.continueButton}
                        </button>
                        {stripeError && (
                            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3 mb-4 text-red-300 text-sm">
                                {stripeError}
                            </div>
                        )}
                    </>
                )}

                {/* Legal Text */}
                <div className="space-y-2 mb-4">
                    <p className="text-xs text-text-dim leading-relaxed text-center">{t.legalText1}</p>
                    <p className="text-xs text-text-dim leading-relaxed text-center">{t.legalText2}</p>
                    <p className="text-xs text-text-dim leading-relaxed text-center">{t.legalText3}</p>
                </div>

                {/* Footer Links */}
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-dark-steel/50">
                    <button 
                        onClick={onRestore}
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
