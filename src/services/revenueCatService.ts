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

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            if (!Capacitor.isNativePlatform()) {
                console.log('RevenueCat: Running in web - skipping initialization');
                return;
            }

            const apiKey = Capacitor.getPlatform() === 'android' 
                ? 'goog_MTmdWVjxUKLTWulVBpGxkYcZKZJ'
                : 'appl_YOUR_IOS_API_KEY';

            await Purchases.setLogLevel({ level: LOG_LEVEL.INFO });  // Produção - menos logs
            await Purchases.configure({ apiKey });

            this.isInitialized = true;
            console.log('RevenueCat initialized successfully');

            // Verifica o status de subscrição atual
            await this.checkSubscriptionStatus();
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
        }
    }

    async checkSubscriptionStatus(): Promise<boolean> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const customerInfo = await Purchases.getCustomerInfo();
            
            // Verifica o entitlement "SuperQuote Pro"
            const entitlements = customerInfo.customerInfo.entitlements;
            const proEntitlement = entitlements.active['SuperQuote Pro'];
            
            // Lógica da Campanha de Natal com Remote Config
            const activeSubscriptions = customerInfo.customerInfo.activeSubscriptions;
            const CAMPAIGN_PRODUCT_ID = 'prode72d24dd2d'; // ID do produto na loja (Store Product ID)

            if (activeSubscriptions.includes(CAMPAIGN_PRODUCT_ID)) {
                // Verifica no Firebase Remote Config se a campanha ainda está ativa
                // A variável 'is_holiday_campaign_active' deve ser criada no Firebase Console
                const isCampaignActive = getValue(remoteConfig, 'is_holiday_campaign_active').asBoolean();
                
                if (!isCampaignActive) {
                    console.log('Holiday Campaign expired (Remote Config says FALSE)');
                    // Continua para verificar se existe outra subscrição válida
                } else {
                    console.log('Holiday Campaign Active & User has Pass');
                    this.isPremium = true;
                    return true;
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

            // Mapeia os packages pelos identifiers configurados no RevenueCat
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

            // Atualiza o status premium
            await this.checkSubscriptionStatus();

            return true;
        } catch (error: any) {
            console.error('Error purchasing package:', error);
            
            // Verifica se o usuário cancelou
            if (error.code === '1' || error.message?.includes('cancel')) {
                console.log('User cancelled purchase');
                return false;
            }

            throw error;
        }
    }

    async restorePurchases(): Promise<boolean> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('Restoring purchases...');
            const customerInfo = await Purchases.restorePurchases();

            // Verifica o entitlement "SuperQuote Pro"
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
