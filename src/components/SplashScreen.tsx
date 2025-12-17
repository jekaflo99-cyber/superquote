import React from 'react';
import languageIcon from '../assets/icons/icon.png';

export const SplashScreen: React.FC = () => {
  return (
    <div className="h-full w-full bg-dark-carbon flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[50%] bg-neon-pulse/20 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-neon-mist/20 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Logo Area */}
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
            
<div className="w-28 h-28 bg-gradient-to-tr from-neon-pulse to-neon-mist rounded-[2rem] shadow-[0_0_40px_rgba(0,255,114,0.4)] flex items-center justify-center mb-8 transform -rotate-6 ring-4 ring-dark-graphite">
    <img src={languageIcon} alt="language" className="w-full h-full object-cover animate-neon-pulse" />
</div>

            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                Insta<span className="text-neon-pulse">Quote</span>
            </h1>
            <p className="text-text-secondary font-medium text-lg tracking-wide">Create. Inspire. Share.</p>
        </div>

        {/* Loading Indicator */}
        <div className="absolute bottom-16 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-neon-pulse rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-neon-pulse rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-neon-pulse rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
        </div>
    </div>
  );
};