import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getRemoteConfig, fetchAndActivate } from 'firebase/remote-config';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBxEaf-92uDmuaRT9Ba9dAVaTgVbGR3Ew8",
  authDomain: "superquote-1bf05.firebaseapp.com",
  projectId: "superquote-1bf05",
  storageBucket: "superquote-1bf05.firebasestorage.app",
  messagingSenderId: "376888360970",
  appId: "1:376888360970:web:04a858aa05ef217745dff3",
  measurementId: "G-L82B9G0FZ9"
};

const app = initializeApp(firebaseConfig);

// Initialize Remote Config
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour default
remoteConfig.defaultConfig = {
  is_holiday_campaign_active: true,
};

// Fetch and activate
fetchAndActivate(remoteConfig)
  .then(() => {
    console.log('Remote Config fetched and activated');
  })
  .catch((err) => {
    console.error('Remote Config fetch failed', err);
  });

let analytics;

// Initialize analytics only if supported (client-side)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, remoteConfig };
