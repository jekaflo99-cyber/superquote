import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../services/firebase';

/**
 * Hook para usar Firebase Analytics
 * Exemplo de uso:
 * const { trackEvent } = useAnalytics();
 * trackEvent('button_click', { button_name: 'submit' });
 */
export const useAnalytics = () => {
  const analytics = getAnalytics(app);

  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    try {
      logEvent(analytics, eventName, eventData);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return { trackEvent };
};
