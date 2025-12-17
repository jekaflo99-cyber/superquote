import React, { useState } from 'react';
import { LayoutGrid, Palette, Share2, ArrowRight, Check } from 'lucide-react';

interface Props {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const slides = [
    {
      id: 0,
      icon: LayoutGrid,
      title: "Choose Your Category",
      desc: "From 'Love' to 'Fitness Motivation'. Find the perfect phrase for your moment in seconds.",
      color: "text-neon-pulse",
      bgGlow: "bg-neon-pulse/20"
    },
    {
      id: 1,
      icon: Palette,
      title: "Create Neon Quotes",
      desc: "Transform simple text into viral art. Neon, 3D, Gold styles and much more with a tap.",
      color: "text-neon-mint",
      bgGlow: "bg-neon-mint/20"
    },
    {
      id: 2,
      icon: Share2,
      title: "Share with the World",
      desc: "Export in High Definition for Instagram, TikTok or WhatsApp. Your feed will never be the same.",
      color: "text-neon-mist",
      bgGlow: "bg-neon-mist/20"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    setIsExiting(true);
    setTimeout(onFinish, 300); // Wait for exit animation
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className={`h-full w-full bg-dark-carbon flex flex-col relative overflow-hidden transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Dynamic Background Blobs */}
      <div className={`absolute top-[-20%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[120px] transition-colors duration-700 pointer-events-none ${slides[currentSlide].bgGlow}`}></div>
      <div className={`absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full blur-[100px] transition-colors duration-700 pointer-events-none opacity-30 ${slides[currentSlide].bgGlow}`}></div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button 
            onClick={finish}
            className="text-text-dim text-sm font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
            Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        
        {/* Animated Icon Container */}
        <div key={`icon-${currentSlide}`} className="mb-12 relative animate-fade-up">
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse ${slides[currentSlide].bgGlow}`}></div>
            <div className="w-40 h-40 bg-dark-graphite border border-dark-steel rounded-[2.5rem] flex items-center justify-center shadow-2xl relative transform rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <CurrentIcon className={`w-20 h-20 ${slides[currentSlide].color} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                
                {/* Decorative particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
        </div>

        {/* Text Content */}
        <div key={`text-${currentSlide}`} className="text-center space-y-4 max-w-xs animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                {slides[currentSlide].title}
            </h2>
            <p className="text-text-secondary text-lg font-medium leading-relaxed">
                {slides[currentSlide].desc}
            </p>
        </div>

      </div>

      {/* Footer Navigation */}
      <div className="p-8 pb-12 flex flex-col gap-8 z-10">
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-3">
            {slides.map((_, index) => (
                <div 
                    key={index}
                    className={`h-2 rounded-full transition-all duration-500 ${
                        index === currentSlide 
                        ? `w-8 ${slides[currentSlide].bgGlow.replace('/20', '')} bg-neon-pulse` 
                        : 'w-2 bg-dark-steel'
                    }`}
                />
            ))}
        </div>

        {/* Action Button */}
        <button
            onClick={handleNext}
            className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all active:scale-95 group ${
                currentSlide === slides.length - 1
                ? 'bg-neon-pulse text-dark-carbon hover:bg-neon-mint shadow-[0_0_20px_rgba(0,255,114,0.3)]'
                : 'bg-dark-graphite text-white border border-dark-steel hover:border-neon-pulse/50'
            }`}
        >
            <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}</span>
            {currentSlide === slides.length - 1 ? (
                <Check className="w-6 h-6" />
            ) : (
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            )}
        </button>
      </div>
    </div>
  );
};
