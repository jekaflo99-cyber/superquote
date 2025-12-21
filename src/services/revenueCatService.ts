import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type { PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { remoteConfig } from './firebase';
// @ts-ignore
import { getValue } from 'firebase/remote-config';

export interface SubscriptionPlan {
    identifier: string;
    title: string;
    price: string;
    pricePerMonth?: string;
    trialDays?: number;
}

class RevenueCatService {
    private isInitialized = false;
    private isPremium = false;
    private offerings: PurchasesOfferings | null = null;
    private webUserEmail: string | null = null; // Guardar email na Web

    // Setter para guardar o email na Web
    setWebUserEmail(email: string) {
        this.webUserEmail = email;
        if (!Capacitor.isNativePlatform()) {
            localStorage.setItem('userEmail', email);
        }
    }

    // Getter para obter o email na Web
    getWebUserEmail(): string | null {
        if (!Capacitor.isNativePlatform()) {
            return localStorage.getItem('userEmail') || this.webUserEmail;
        }
        return this.webUserEmail;
    }

    async initialize(): Promise<void> {
        // ============================================
        // MODO WEB (PWA) - Não usa SDK, usa API Backend
        // ============================================
        if (!Capacitor.isNativePlatform()) {
            this.webUserEmail = localStorage.getItem('userEmail');
            this.isInitialized = true;
            console.log('RevenueCat: Web mode initialized with email:', this.webUserEmail);
            await this.checkSubscriptionStatus();
            return;
        }

        // ============================================
        // MODO NATIVO (iOS / Android)
        // ============================================
        if (this.isInitialized) return;

        try {
            const apiKey = Capacitor.getPlatform() === 'android' 
                ? 'goog_MTmdWVjxUKLTWulVBpGxkYcZKZJ'
                : 'appl_YOUR_IOS_API_KEY';

            await Purchases.setLogLevel({ level: LOG_LEVEL.INFO });
            await Purchases.configure({ apiKey });

            this.isInitialized = true;
            console.log('RevenueCat initialized successfully (Native)');

            await this.checkSubscriptionStatus();
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
        }
    }

    async checkSubscriptionStatus(): Promise<boolean> {
        try {
            // ============================================
            // MODO WEB (PWA) - Usa a Backend API
            // ============================================
            if (!Capacitor.isNativePlatform()) {
                const email = this.getWebUserEmail();
                if (!email) {
                    console.log('Web: No email set, cannot check subscription');
                    this.isPremium = false;
                    return false;
                }

                try {
                    const res = await fetch(`/api/subscription-status?email=${encodeURIComponent(email)}`);
                    const data = await res.json();
                    
                    this.isPremium = data.isPremium === true;
                    console.log('Web Premium Status for', email, ':', this.isPremium);
                    return this.isPremium;
                } catch (e) {
                    console.error("Error checking web subscription status:", e);
                    return false;
                }
            }

            // ============================================
            // MODO NATIVO (iOS / Android)
            // ============================================
            if (!this.isInitialized) {
                await this.initialize();
            }

            const customerInfo = await Purchases.getCustomerInfo();
            
            const entitlements = customerInfo.customerInfo.entitlements;
            const proEntitlement = entitlements.active['SuperQuote Pro'];
            
            // Lógica da Campanha de Natal com Remote Config
            const activeSubscriptions = customerInfo.customerInfo.activeSubscriptions;
            const CAMPAIGN_PRODUCT_ID = 'prode72d24dd2d';

            if (activeSubscriptions.includes(CAMPAIGN_PRODUCT_ID)) {
                try {
                    const isCampaignActive = getValue(remoteConfig, 'is_holiday_campaign_active').asBoolean();
                    
                    if (!isCampaignActive) {
                        console.log('Holiday Campaign expired (Remote Config says FALSE)');
                    } else {
                        console.log('Holiday Campaign Active & User has Pass');
                        this.isPremium = true;
                        return true;
                    }
                } catch (rcError) {
                    console.warn('RemoteConfig error:', rcError);
                }
            }
            
            this.isPremium = proEntitlement !== undefined;

            console.log('Premium status:', this.isPremium);
            console.log('Active entitlements:', Object.keys(entitlements.active));

            return this.isPremium;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    async getOfferings(): Promise<{
        yearly: SubscriptionPlan | null;
        monthly: SubscriptionPlan | null;
        weekly: SubscriptionPlan | null;
        holidayPass: SubscriptionPlan | null;
    }> {
        // ============================================
        // MODO WEB (PWA) - Retorna preços fixos
        // ============================================
        if (!Capacitor.isNativePlatform()) {
            // Na Web, retornamos valores fixos (preços do Stripe)
            // Estes valores são apenas para exibição, o preço real vem do Stripe
            return {
                yearly: { 
                    identifier: 'yearly', 
                    title: 'Anual', 
                    price: '29,99€', 
                    pricePerMonth: '2,50€', 
                    trialDays: 0 
                },
                monthly: { 
                    identifier: 'monthly', 
                    title: 'Mensal', 
                    price: '4,99€' 
                },
                weekly: { 
                    identifier: 'weekly', 
                    title: 'Semanal', 
                    price: '1,99€' 
                },
                holidayPass: { 
                    identifier: 'holidayPass', 
                    title: 'Passe Festas', 
                    price: '1,99€' 
                }
            };
        }

        // ============================================
        // MODO NATIVO (iOS / Android)
        // ============================================
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const offerings = await Purchases.getOfferings();
            this.offerings = offerings;

            const currentOffering = offerings.current;
            if (!currentOffering) {
                console.log('No offerings available');
                return { yearly: null, monthly: null, weekly: null, holidayPass: null };
            }

            const packages = currentOffering.availablePackages;
            
            const yearly = packages.find((pkg: PurchasesPackage) => 
                pkg.identifier === 'yearly' || pkg.packageType === 'ANNUAL'
            );
            const monthly = packages.find((pkg: PurchasesPackage) => 
                pkg.identifier === 'monthly' || pkg.packageType === 'MONTHLY'
            );
            const weekly = packages.find((pkg: PurchasesPackage) => 
                pkg.identifier === 'weekly' || pkg.packageType === 'WEEKLY'
            );
            const holidayPass = packages.find((pkg: PurchasesPackage) => 
                pkg.identifier === 'holiday_pass_2025'
            );

            return {
                yearly: yearly ? {
                    identifier: yearly.identifier,
                    title: yearly.product.title,
                    price: yearly.product.priceString,
                    pricePerMonth: this.calculateMonthlyPrice(yearly.product.price, 12),
                    trialDays: yearly.product.introPrice?.period === 'P1W' ? 7 : undefined
                } : null,
                monthly: monthly ? {
                    identifier: monthly.identifier,
                    title: monthly.product.title,
                    price: monthly.product.priceString
                } : null,
                weekly: weekly ? {
                    identifier: weekly.identifier,
                    title: weekly.product.title,
                    price: weekly.product.priceString
                } : null,
                holidayPass: holidayPass ? {
                    identifier: holidayPass.identifier,
                    title: holidayPass.product.title,
                    price: holidayPass.product.priceString
                } : null
            };
        } catch (error) {
            console.error('Error getting offerings:', error);
            return { yearly: null, monthly: null, weekly: null, holidayPass: null };
        }
    }

    private calculateMonthlyPrice(yearlyPrice: number, months: number): string {
        const monthlyPrice = yearlyPrice / months;
        return monthlyPrice.toFixed(2) + '€';
    }

    async purchasePackage(planType: 'yearly' | 'monthly' | 'weekly' | 'holidayPass'): Promise<boolean> {
        try {
            // ============================================
            // MODO WEB (PWA) - Redireciona para Stripe
            // ============================================
            if (!Capacitor.isNativePlatform()) {
                const email = this.getWebUserEmail();
                if (!email) {
                    console.error("Web: No email set, cannot purchase");
                    return false;
                }

                // Importa e usa o StripeService diretamente
                const { default: StripeService } = await import('./stripeService');
                await StripeService.startCheckout(planType, email);
                return true; // O redirect vai acontecer
            }

            // ============================================
            // MODO NATIVO (iOS / Android)
            // ============================================
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (!this.offerings?.current) {
                console.error('No offerings available');
                return false;
            }

            const packages = this.offerings.current.availablePackages;
            let selectedPackage: PurchasesPackage | undefined;

            if (planType === 'yearly') {
                selectedPackage = packages.find((pkg: PurchasesPackage) => 
                    pkg.identifier === 'yearly' || pkg.packageType === 'ANNUAL'
                );
            } else if (planType === 'monthly') {
                selectedPackage = packages.find((pkg: PurchasesPackage) => 
                    pkg.identifier === 'monthly' || pkg.packageType === 'MONTHLY'
                );
            } else if (planType === 'weekly') {
                selectedPackage = packages.find((pkg: PurchasesPackage) => 
                    pkg.identifier === 'weekly' || pkg.packageType === 'WEEKLY'
                );
            } else if (planType === 'holidayPass') {
                selectedPackage = packages.find((pkg: PurchasesPackage) => 
                    pkg.identifier === 'holiday_pass_2025'
                );
            }

            if (!selectedPackage) {
                console.error('Package not found for plan:', planType);
                return false;
            }

            console.log('Purchasing package:', selectedPackage.identifier);

            const purchaseResult = await Purchases.purchasePackage({
                aPackage: selectedPackage
            });

            console.log('Purchase successful:', purchaseResult);

            await this.checkSubscriptionStatus();

            return true;
        } catch (error: any) {
            console.error('Error purchasing package:', error);
            
            if (error.code === '1' || error.message?.includes('cancel')) {
                console.log('User cancelled purchase');
                return false;
            }

            throw error;
        }
    }

    async restorePurchases(email?: string): Promise<boolean> {
        // ============================================
        // MODO WEB (PWA) - Verifica status via API
        // ============================================
        if (!Capacitor.isNativePlatform()) {
            if (email) {
                this.setWebUserEmail(email);
            }
            return this.checkSubscriptionStatus();
        }

        // ============================================
        // MODO NATIVO (iOS / Android)
        // ============================================
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('Restoring purchases...');
            const customerInfo = await Purchases.restorePurchases();

            const entitlements = customerInfo.customerInfo.entitlements;
            const proEntitlement = entitlements.active['SuperQuote Pro'];
            this.isPremium = proEntitlement !== undefined;

            console.log('Purchases restored. Premium:', this.isPremium);

            return this.isPremium;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            return false;
        }
    }

    getIsPremium(): boolean {
        return this.isPremium;
    }

    async setUserId(userId: string): Promise<void> {
        // Na Web, o userId é o email
        if (!Capacitor.isNativePlatform()) {
            this.setWebUserEmail(userId);
            return;
        }

        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await Purchases.logIn({ appUserID: userId });
            console.log('User ID set:', userId);
        } catch (error) {
            console.error('Error setting user ID:', error);
        }
    }

    async logout(): Promise<void> {
        // Na Web, limpa o email
        if (!Capacitor.isNativePlatform()) {
            localStorage.removeItem('userEmail');
            this.webUserEmail = null;
            this.isPremium = false;
            return;
        }

        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await Purchases.logOut();
            this.isPremium = false;
            console.log('User logged out');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
}

export const revenueCatService = new RevenueCatService();
