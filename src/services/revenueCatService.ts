import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type { PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
// remoteConfig and getValue removed as holiday campaign logic was deleted

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

            // Lógica antiga da Campanha (removida)

            this.isPremium = proEntitlement !== undefined;
            console.log('Premium status:', this.isPremium);
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
    }> {
        // ============================================
        // MODO WEB (PWA) - Retorna preços fixos
        // ============================================
        if (!Capacitor.isNativePlatform()) {
            return {
                yearly: {
                    identifier: 'yearly',
                    title: 'Anual',
                    price: '19,99€',
                    pricePerMonth: '1,66€',
                    trialDays: 7
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
                return { yearly: null, monthly: null, weekly: null };
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

            return {
                yearly: yearly ? {
                    identifier: yearly.identifier,
                    title: yearly.product.title,
                    price: yearly.product.priceString,
                    pricePerMonth: this.calculateMonthlyPrice(yearly.product.price, 12),
                    trialDays: yearly.product.introPrice ? 7 : undefined
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
                } : null
            };
        } catch (error) {
            console.error('Error getting offerings:', error);
            return { yearly: null, monthly: null, weekly: null };
        }
    }

    private calculateMonthlyPrice(yearlyPrice: number, months: number): string {
        const monthlyPrice = yearlyPrice / months;
        return monthlyPrice.toFixed(2) + '€';
    }

    async purchasePackage(planType: 'yearly' | 'monthly' | 'weekly'): Promise<boolean> {
        try {
            if (!Capacitor.isNativePlatform()) {
                const email = this.getWebUserEmail();
                if (!email) return false;
                const { default: StripeService } = await import('./stripeService');
                await StripeService.startCheckout(planType, email);
                return true;
            }

            if (!this.isInitialized) await this.initialize();

            if (!this.offerings?.current) return false;

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
            }

            if (!selectedPackage) return false;

            await Purchases.purchasePackage({ aPackage: selectedPackage });
            await this.checkSubscriptionStatus();
            return true;
        } catch (error: any) {
            if (error.code === '1' || error.message?.includes('cancel')) return false;
            throw error;
        }
    }

    async restorePurchases(email?: string): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            if (email) this.setWebUserEmail(email);
            return this.checkSubscriptionStatus();
        }

        try {
            if (!this.isInitialized) await this.initialize();
            const customerInfo = await Purchases.restorePurchases();
            const proEntitlement = customerInfo.customerInfo.entitlements.active['SuperQuote Pro'];
            this.isPremium = proEntitlement !== undefined;
            return this.isPremium;
        } catch (error) {
            return false;
        }
    }

    getIsPremium(): boolean {
        return this.isPremium;
    }

    async setUserId(userId: string): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            this.setWebUserEmail(userId);
            return;
        }
        try {
            if (!this.isInitialized) await this.initialize();
            await Purchases.logIn({ appUserID: userId });
        } catch (error) { }
    }

    async logout(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            localStorage.removeItem('userEmail');
            this.webUserEmail = null;
            this.isPremium = false;
            return;
        }
        try {
            if (!this.isInitialized) await this.initialize();
            await Purchases.logOut();
            this.isPremium = false;
        } catch (error) { }
    }
}

export const revenueCatService = new RevenueCatService();
