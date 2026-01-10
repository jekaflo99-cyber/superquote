
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Box, Layers, PenTool, Lightbulb, Sparkles, Minus, Plus, Layout, Share2, X, Instagram, Facebook, Music, ArrowUpToLine, ArrowDownToLine, MoveVertical, Crown, Check, Edit2, Zap, Upload, Maximize2, Minimize2, Aperture } from 'lucide-react';
import { type EditorConfig, type Template, type LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../Data/translations';
import { generateImage } from '../services/canvasGenerator';
import { useAutoTemplates } from '../Data/templates';
import { admobService } from '../services/admobService';
import { dailyUnlockService } from '../services/dailyUnlockService';
import { revenueCatService } from '../services/revenueCatService';
import StripeService from '../services/stripeService';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import { RewardedAdModal } from './RewardedAdModal';
import { SubscriptionModal } from './SubscriptionModal';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { buildTextPlan } from '../services/textPlan';
import { splitRunsIntoLines } from '../services/emphasisPlan';
import { extractPaletteFromImage, chooseSmartColor } from '../services/colorService';
import TEMPLATES_SMART_DATA from '../Data/templates_smart_data.json';


interface Props {
    initialPhrase: string;
    onBack: () => void;
    isPremium: boolean;
    onUnlock: () => void;
    language: LanguageCode;
}

// --- CATEGORY TRANSLATIONS ---
const CATEGORY_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
    'All': { 'pt-PT': 'Todos', 'pt-BR': 'Todos', 'en': 'All', 'es': 'Todos' },
    'Agradecimento': { 'pt-PT': 'Agradecimento', 'pt-BR': 'Gratidão', 'en': 'Gratitude', 'es': 'Gratitud' },
    'Amor-relacionamento': { 'pt-PT': 'Amor', 'pt-BR': 'Amor', 'en': 'Love', 'es': 'Amor' },
    'Aniversario': { 'pt-PT': 'Aniversário', 'pt-BR': 'Aniversário', 'en': 'Birthday', 'es': 'Cumpleaños' },
    'BoaNoite': { 'pt-PT': 'Boa Noite', 'pt-BR': 'Boa Noite', 'en': 'Good Night', 'es': 'Buenas Noches' },
    'Bomdia': { 'pt-PT': 'Bom Dia', 'pt-BR': 'Bom Dia', 'en': 'Good Morning', 'es': 'Buenos Días' },
    'Deus-fé': { 'pt-PT': 'Fé', 'pt-BR': 'Fé', 'en': 'Faith', 'es': 'Fe' },
    'Diversos': { 'pt-PT': 'Diversos', 'pt-BR': 'Diversos', 'en': 'Various', 'es': 'Varios' },
    'Gym': { 'pt-PT': 'Ginásio', 'pt-BR': 'Academia', 'en': 'Gym', 'es': 'Gimnasio' },
    'Luto': { 'pt-PT': 'Luto', 'pt-BR': 'Luto', 'en': 'Mourning', 'es': 'Luto' },
    'Mae': { 'pt-PT': 'Mãe', 'pt-BR': 'Mãe', 'en': 'Mother', 'es': 'Madre' },
    'Natal': { 'pt-PT': 'Natal', 'pt-BR': 'Natal', 'en': 'Christmas', 'es': 'Navidad' },
    'Neon': { 'pt-PT': 'Neon', 'pt-BR': 'Neon', 'en': 'Neon', 'es': 'Neón' },
    'Pai': { 'pt-PT': 'Pai', 'pt-BR': 'Pai', 'en': 'Father', 'es': 'Padre' },
    'Paisagens-Natureza': { 'pt-PT': 'Natureza', 'pt-BR': 'Natureza', 'en': 'Nature', 'es': 'Naturaleza' },
    'PassagemDeAno': { 'pt-PT': 'Ano Novo', 'pt-BR': 'Ano Novo', 'en': 'New Year', 'es': 'Año Nuevo' },
    'Praias': { 'pt-PT': 'Praias', 'pt-BR': 'Praias', 'en': 'Beaches', 'es': 'Playas' },
    'Reflexão-Paz': { 'pt-PT': 'Reflexão', 'pt-BR': 'Reflexão', 'en': 'Reflection', 'es': 'Reflexión' },
    'Sabedoria': { 'pt-PT': 'Sabedoria', 'pt-BR': 'Sabedoria', 'en': 'Wisdom', 'es': 'Sabiduría' },
    'Vida': { 'pt-PT': 'Vida', 'pt-BR': 'Vida', 'en': 'Life', 'es': 'Vida' },
};

const translateCategory = (category: string, language: LanguageCode): string => {
    return CATEGORY_TRANSLATIONS[category]?.[language] || category;
};

// --- FONT LIST ---
const FONTS_LIST = [
    // Free Fonts (12)
    { name: 'Playfair Black', font: 'Playfair Display', weight: 900, type: 'Free' },
    { name: 'Roboto Black', font: 'Roboto', weight: 900, type: 'Free' },
    { name: 'Open Sans', font: 'Open Sans', weight: 800, type: 'Free' },
    { name: 'Oswald', font: 'Oswald', weight: 700, type: 'Free' },
    { name: 'Nunito', font: 'Nunito', weight: 800, type: 'Free' },
    { name: 'Inter Black', font: 'Inter', weight: 900, type: 'Free' },
    { name: 'Pacifico', font: 'Pacifico', weight: 400, type: 'Free' },
    { name: 'Dancing Script', font: 'Dancing Script', weight: 700, type: 'Free' },
    { name: 'Indie Flower', font: 'Indie Flower', weight: 400, type: 'Free' },
    { name: 'TikTok (DM Sans)', font: 'DM Sans', weight: 700, type: 'Free' },
    { name: 'Ubuntu', font: 'Ubuntu', weight: 700, type: 'Free' },
    { name: 'Luckiest Guy', font: 'Luckiest Guy', weight: 400, type: 'Free' },

    // Pro Fonts (Rest)
    { name: 'Montserrat Black', font: 'Montserrat', weight: 900, type: 'Pro' },
    { name: 'Bebas Neue', font: 'Bebas Neue', weight: 400, type: 'Pro' },
    { name: 'Gotham (Urbanist)', font: 'Urbanist', weight: 900, type: 'Pro' },
    { name: 'Avenir (Mulish)', font: 'Mulish', weight: 800, type: 'Pro' },
    { name: 'Futura (Jost)', font: 'Jost', weight: 700, type: 'Pro' },
    { name: 'Anton', font: 'Anton', weight: 400, type: 'Pro' },
    { name: 'Circular (Plus Jakarta)', font: 'Plus Jakarta Sans', weight: 700, type: 'Pro' },
    { name: 'Cocogoose (Saira)', font: 'Saira', weight: 700, type: 'Pro' },
    { name: 'Sofia (Outfit)', font: 'Outfit', weight: 700, type: 'Pro' },
    { name: 'Gilroy (Manrope)', font: 'Manrope', weight: 800, type: 'Pro' },
    { name: 'Poppins Extra', font: 'Poppins', weight: 800, type: 'Pro' },
    { name: 'Lato Heavy', font: 'Lato', weight: 900, type: 'Pro' },
    { name: 'Raleway', font: 'Raleway', weight: 900, type: 'Pro' },
    { name: 'Cinzel', font: 'Cinzel', weight: 700, type: 'Pro' },
    { name: 'Lobster', font: 'Lobster', weight: 400, type: 'Pro' },
    { name: 'Righteous', font: 'Righteous', weight: 400, type: 'Pro' },
    { name: 'Science Gothic', font: 'Science Gothic', weight: 400, type: 'Pro' },
    { name: 'Playwrite NO', font: 'Playwrite NO', weight: 400, type: 'Pro' },
    { name: 'Bungee Spice', font: 'Bungee Spice', weight: 400, type: 'Pro' },
    { name: 'Caveat', font: 'Caveat', weight: 700, type: 'Pro' },
    { name: 'Momo (WindSong)', font: 'WindSong', weight: 500, type: 'Pro' },
    { name: 'Satisfy', font: 'Satisfy', weight: 400, type: 'Pro' },
    { name: 'Great Vibes', font: 'Great Vibes', weight: 400, type: 'Pro' },
    { name: 'Amatic SC', font: 'Amatic SC', weight: 700, type: 'Pro' },
    { name: 'Kaushan Script', font: 'Kaushan Script', weight: 400, type: 'Pro' },
    { name: 'Sacramento', font: 'Sacramento', weight: 400, type: 'Pro' }
];

const COLORS = [
    '#000000', '#ffffff', '#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
    '#fca5a5', '#fdba74', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4',
    '#7f1d1d', '#78350f', '#14532d', '#1e3a8a', '#4c1d95', '#831843'
];



interface PresetConfig extends Partial<EditorConfig> {
    name: string;
    id: string;
    isPremium?: boolean;
}

// --- ALL PRESETS (1-70) ---
const PRESET_STYLES: PresetConfig[] = [
    // FREE STYLES (10 selected)
    { id: 'p1', name: 'Clean', isPremium: false, fontFamily: 'Inter', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textShadowOpacity: 0, textOutlineWidth: 0, textBackgroundColor: '#ffffff', textBackgroundOpacity: 0 },
    { id: 'p2', name: 'Romantic', isPremium: false, fontFamily: 'Great Vibes', fontSize: 16, textAlign: 'justify', textColor: '#b03030', textShadowOpacity: 0, textOutlineWidth: 0 },
    { id: 'p3', name: 'Impact', isPremium: false, fontFamily: 'Oswald', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textShadowOpacity: 1, textShadowBlur: 5, textShadowColor: '#000000' },
    { id: 'p8', name: 'Neon', isPremium: false, fontFamily: 'Righteous', fontSize: 16, textAlign: 'justify', textColor: '#00ff99', textShadowOpacity: 1, textShadowColor: '#00ff99', textShadowBlur: 10, textBackgroundColor: '#000000', textBackgroundOpacity: 0.7, textBoxStyle: 'block' },
    { id: 'p9', name: 'Note', isPremium: false, fontFamily: 'Indie Flower', fontSize: 16, textAlign: 'justify', textColor: '#000000', textBackgroundColor: '#fef3c7', textBackgroundOpacity: 1, textBoxStyle: 'block' },
    { id: 'p11', name: 'Dark', isPremium: false, fontFamily: 'Roboto', fontSize: 16, textAlign: 'justify', textColor: '#f8fafc', textBackgroundColor: '#000000', textBackgroundOpacity: 0.85, textBoxStyle: 'block' },
    { id: 'p17', name: 'Chill', isPremium: false, fontFamily: 'Lato', fontSize: 16, textAlign: 'justify', textColor: '#475569', textBackgroundColor: '#f1f5f9', textBackgroundOpacity: 0.7, textBoxStyle: 'block' },
    { id: 'p24', name: 'Block', isPremium: false, fontFamily: "Indie Flower", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#2563eb", textBackgroundColor: "#dbeafe", textBackgroundOpacity: 0.9, textBoxStyle: "block", lineHeight: 1.5, textShadowOpacity: 0, textShadowColor: "#000000", textShadowBlur: 0, textOutlineWidth: 4, textOutlineColor: "#2563eb", textGlowWidth: 2, textGlowColor: "#ffffff", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", textSuperStrokeWidth: 0, textSuperStrokeColor: "#ffffff", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false },
    { id: 'p29', name: 'Candy', isPremium: false, fontFamily: "Indie Flower", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#bd00ad", textBackgroundColor: "#fbcfe8", textBackgroundOpacity: 0.9, textBoxStyle: "block", lineHeight: 1.5, textShadowOpacity: 0, textShadowColor: "#000000", textShadowBlur: 0, textOutlineWidth: 4, textOutlineColor: "#bd00ad", textGlowWidth: 2, textGlowColor: "#ffffff", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", textSuperStrokeWidth: 0, textSuperStrokeColor: "#ffffff", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false },
    { id: 'p35', name: '3D Pro', isPremium: false, fontFamily: 'Montserrat', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', text3DColor: '#00000099', text3DOffsetX: 7, text3DOffsetY: 7 },
    {
        id: 'p72',
        name: 'Xmas Classic',
        isPremium: false,
        fontFamily: 'Playfair Display',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textColor: '#fef9c3', // dourado claro
        textBackgroundColor: '#7f1d1d', // vermelho vinho
        textBackgroundOpacity: 0.9,
        textBoxStyle: 'block',
        textShadowOpacity: 1,
        textShadowColor: '#000000',
        textShadowBlur: 14,
        letterSpacing: 1.2
    },
    { id: 'p88', name: 'Ginger', isPremium: false, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: '#8B4513', textGradientColors: ["#cd853f", "#8b4513"], textOutlineColor: "#ffffff", textOutlineWidth: 3, textShadowColor: "#5e300d", textShadowBlur: 5, textSuperStrokeColor: "#3e1f08", textSuperStrokeWidth: 2 },
    // PREMIUM STYLES
    { id: 'p4', name: 'Signature', isPremium: true, fontFamily: 'WindSong', fontSize: 16, textAlign: 'justify', textColor: '#e2c792' },
    { id: 'p5', name: 'Classic', isPremium: true, fontFamily: 'Merriweather', fontSize: 16, textAlign: 'justify', textColor: '#1a1a1a' },
    { id: 'p6', name: 'Pastel', isPremium: true, fontFamily: 'Quicksand', fontSize: 16, textAlign: 'justify', textColor: '#4a4a4a', textBackgroundColor: '#fce7f3', textBackgroundOpacity: 0.7, textBoxStyle: 'block' },
    { id: 'p7', name: 'Boss', isPremium: true, fontFamily: 'Montserrat', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#0f172a', textBackgroundOpacity: 0.9, textBoxStyle: 'block' },
    { id: 'p10', name: 'Gold', isPremium: true, fontFamily: 'Playfair Display', fontSize: 16, textAlign: 'justify', textColor: '#d4af37', text3DOffsetX: 2, text3DOffsetY: 1, text3DColor: '#3c3c3cff' },
    { id: 'p12', name: 'Vintage', isPremium: true, fontFamily: 'Roboto Mono', fontSize: 16, textAlign: 'justify', textColor: '#3f2e26', textBackgroundColor: '#f5ebe0', textBackgroundOpacity: 0.95, textBoxStyle: 'block' },
    { id: 'p13', name: 'Story', isPremium: true, fontFamily: 'Open Sans', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#000000', textBackgroundOpacity: 0.5, textBoxStyle: 'highlight' },
    { id: 'p14', name: 'Faith', isPremium: true, fontFamily: 'Cinzel', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#818cf8', textBackgroundOpacity: 0.4, textBoxStyle: 'block' },
    { id: 'p15', name: 'Cute', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: '#db2777', textBackgroundColor: '#fce7f3', textBackgroundOpacity: 0.8, textBoxStyle: 'block' },
    { id: 'p16', name: 'Street', isPremium: true, fontFamily: 'Anton', fontSize: 16, textAlign: 'justify', textColor: '#fbbf24', textBackgroundColor: '#171717', textBackgroundOpacity: 0.8, textBoxStyle: 'highlight' },
    { id: 'p18', name: 'Outline', isPremium: true, fontFamily: 'Bebas Neue', fontSize: 16, textAlign: 'justify', textColor: 'transparent', textOutlineWidth: 2, textOutlineColor: '#ffffff' },
    { id: 'p19', name: 'Type', isPremium: true, fontFamily: 'Courier Prime', fontSize: 16, textAlign: 'justify', textColor: '#000000', textBackgroundColor: '#ffffff', textBackgroundOpacity: 0.9, textBoxStyle: 'block' },
    { id: 'p20', name: 'Marker', isPremium: true, fontFamily: 'Permanent Marker', fontSize: 16, textAlign: 'justify', textColor: '#000000', textBackgroundColor: '#bef264', textBackgroundOpacity: 0.8, textBoxStyle: 'highlight' },
    { id: 'p21', name: 'Cyber', isPremium: true, fontFamily: 'Orbitron', fontSize: 16, textAlign: 'justify', textColor: '#06b6d4', textGlowWidth: 15, textGlowColor: '#06b6d4', textOutlineWidth: 1, textOutlineColor: '#164e63' },
    { id: 'p22', name: 'Ice', isPremium: true, fontFamily: 'Raleway', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#ffffff', textBackgroundOpacity: 0.3, textShadowOpacity: 1, textBoxStyle: 'block' },
    { id: 'p23', name: 'Retro', isPremium: true, fontFamily: 'Pacifico', fontSize: 16, textAlign: 'justify', textColor: '#f59e0b', textOutlineWidth: 4, textOutlineColor: '#000000', textShadowOpacity: 1, textShadowColor: '#000000', textShadowBlur: 0, text3DOffsetX: 3, text3DOffsetY: 3, text3DColor: '#000000' },
    { id: 'p25', name: 'Duotone', isPremium: true, fontFamily: 'Bebas Neue', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#db2777', textBackgroundOpacity: 1, textOutlineWidth: 1, textOutlineColor: '#ffffff', textBoxStyle: 'block' },
    { id: 'p26', name: 'Neon M', isPremium: true, fontFamily: 'Montserrat', fontSize: 16, textAlign: 'justify', textColor: '#000000', textBackgroundColor: '#a3e635', textBackgroundOpacity: 0.3, textGlowWidth: 5, textGlowColor: '#a3e635', textBoxStyle: 'highlight' },
    { id: 'p27', name: 'Soft', isPremium: true, fontFamily: 'Nunito', fontSize: 16, textAlign: 'justify', textColor: '#787878', textOutlineWidth: 2, textOutlineColor: '#ff9ed7', textShadowOpacity: 1, textShadowColor: '#f472b6', textBoxStyle: 'block', textGlowWidth: 5, textGlowColor: '#ff00ff' },
    { id: 'p28', name: 'Double', isPremium: true, fontFamily: 'Cinzel', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textOutlineWidth: 1, textOutlineColor: '#4c0519', textGlowWidth: 10, textGlowColor: '#9f1239' },
    { id: 'p30', name: 'Noir', isPremium: true, fontFamily: 'Playfair Display', fontSize: 16, textAlign: 'justify', textColor: '#fefce8', textBackgroundColor: '#000000', textBackgroundOpacity: 0.6, textBoxStyle: 'highlight' },
    { id: 'p31', name: 'Pulse', isPremium: true, fontFamily: 'Righteous', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textGlowColor: '#9bff8a', textGlowWidth: 5, textShadowColor: '#00ff88', textShadowBlur: 10, textOutlineColor: '#003300', textOutlineWidth: 3, textGradientColors: ['#00ff88', '#00ccff'] },
    { id: 'p32', name: 'Royal', isPremium: true, fontFamily: "Cinzel", fontSize: 16, textAlign: "justify", verticalAlign: "center", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.3, textShadowColor: "#000000", textShadowBlur: 0, textOutlineWidth: 2, textOutlineColor: "#f2be50", textGlowWidth: 0, textGlowColor: "#ffdd55", text3DOffsetX: 2, text3DOffsetY: 2, text3DColor: "#6e4c1e", textSuperStrokeWidth: 0, textSuperStrokeColor: "#ffffff", letterSpacing: 0, textTransform: "none", isItalic: false, textGradientColors: ["#fbd786", "#f7797d", "#c6ffdd"], },
    { id: 'p33', name: 'Diamond', isPremium: true, fontFamily: 'Playfair Display', fontSize: 16, textAlign: 'justify', textColor: '#e2e2e2', textGradientColors: ['#ffffff', '#d7d7d7', '#bcbcbc'], textShadowColor: '#000000', textShadowBlur: 10, textGlowColor: '#d6d6d6', textGlowWidth: 8, letterSpacing: 2, textOutlineWidth: 2, textOutlineColor: "#ffffff" },
    { id: 'p34', name: 'Thunder', isPremium: true, fontFamily: 'Bebas Neue', fontSize: 16, textAlign: 'justify', textColor: '#cce7ff', textGlowColor: '#0a9dff', textGlowWidth: 3, textShadowColor: '#0033cc', textShadowBlur: 10, textGradientColors: ['#0077ff', '#00c8ff'], textOutlineWidth: 2, textOutlineColor: "#001685" },
    { id: 'p36', name: '80s', isPremium: true, fontFamily: 'Pacifico', fontSize: 16, textAlign: 'justify', textColor: '#fff', textGradientColors: ['#ff00cc', '#3333ff'], textGlowColor: '#ff33ff', textShadowColor: '#220044', textShadowBlur: 12, letterSpacing: 1.5 },
    { id: 'p37', name: 'Cinema', isPremium: true, fontFamily: 'Oswald', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textGradientColors: ['#202020', '#000000'], textShadowColor: '#000000', textShadowBlur: 12, letterSpacing: 2, textTransform: 'uppercase' },
    { id: 'p38', name: 'Pink', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: '#ffd6f6', textGlowColor: '#c200c2', textGlowWidth: 12, textShadowColor: '#b300b3', textShadowBlur: 14 },
    { id: 'p39', name: 'Magma', isPremium: true, fontFamily: 'Anton', fontSize: 16, textAlign: 'justify', textColor: '#fff5e6', textGradientColors: ['#ff7a00', '#ff0033'], textShadowColor: '#660000', textShadowBlur: 10, textGlowColor: '#cc2900' },
    { id: 'p40', name: 'Clean Pro', isPremium: true, fontFamily: 'Inter', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: '#000000', textBackgroundOpacity: 0.25, textShadowColor: '#00000055', textShadowBlur: 4, letterSpacing: 1, textBoxStyle: 'block' },
    { id: 'p41', name: 'Ice Blue', isPremium: true, fontFamily: 'Inter', fontSize: 16, textAlign: 'center', textGradientColors: ["#e6f7ff", "#b3e0ff"], textBackgroundColor: "#002233", textBackgroundOpacity: 0.25, textGlowColor: "#0095c7", textGlowWidth: 3, textShadowColor: "#00334d", textShadowBlur: 14, textOutlineColor: "#99e6ff", textOutlineWidth: 2, text3DColor: "#004466", text3DOffsetX: 2, text3DOffsetY: 2, textBoxStyle: 'block' },
    { id: 'p42', name: 'Lux Noir', isPremium: true, fontFamily: 'Jost', fontSize: 16, textAlign: 'center', letterSpacing: 2, textGradientColors: ["#1a1a1a", "#000000"], textGlowColor: "#614100", textGlowWidth: 12, textShadowColor: "#3d2b00", textShadowBlur: 10, textOutlineColor: "#d9a441", textOutlineWidth: 2, textBoxStyle: 'block', textTransform: "none", isBold: false, isItalic: false },
    { id: 'p43', name: 'Pastel C', isPremium: true, fontFamily: 'Nunito', fontSize: 16, textAlign: 'center', textTransform: "none", textGradientColors: ["#ffe6ff", "#ffeedd"], textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textGlowColor: "#ffb3ff", textGlowWidth: 10, textShadowColor: "#ff99cc", textShadowBlur: 10, textOutlineColor: "#ffccff", textOutlineWidth: 3, textBoxStyle: 'block' },
    { id: 'p44', name: 'Nebula', isPremium: true, fontFamily: 'Montserrat', fontSize: 16, textAlign: 'center', letterSpacing: 3, textGradientColors: ["#8e2de2", "#4a00e0"], textGlowColor: "#c799ff", textGlowWidth: 35, textShadowColor: "#1d0033", textShadowBlur: 18, text3DColor: "#330066", text3DOffsetX: 5, text3DOffsetY: 5 },
    { id: 'p45', name: 'Sunset', isPremium: true, fontFamily: 'Raleway', fontSize: 16, textAlign: 'center', textTransform: "uppercase", textGradientColors: ["#ff9966", "#ff5e62"], textShadowColor: "#663300", textShadowBlur: 8, textGlowColor: "#940000", textGlowWidth: 10 },
    { id: 'p46', name: 'Metal', isPremium: true, fontFamily: 'Jost', fontSize: 16, textAlign: 'center', textGradientColors: ["#eeeeee", "#bbbbbb", "#d5d5d5ff"], textShadowColor: "#222", textShadowBlur: 12, textGlowColor: "#ffffff", textGlowWidth: 10 },
    { id: 'p47', name: 'Hellfire', isPremium: true, fontFamily: 'Urbanist', fontSize: 16, textAlign: 'center', textGradientColors: ["#ff1a1a", "#de0000ff"], textShadowColor: "#330000", textShadowBlur: 18, textGlowColor: "#ff3300", textGlowWidth: 5, textOutlineColor: "#4d0000", textOutlineWidth: 3 },
    { id: 'p48', name: 'Matrix', isPremium: true, fontFamily: 'Bebas Neue', fontSize: 16, textAlign: 'center', letterSpacing: 3, textGradientColors: ["#00ff99", "#00ca86ff"], textShadowColor: "#003322", textShadowBlur: 15, textGlowColor: "#00996b", textGlowWidth: 8 },
    { id: 'p50', name: 'Chalk', isPremium: true, fontFamily: 'Mulish', fontSize: 16, textAlign: 'left', letterSpacing: 1, textBackgroundColor: "#1e1e1e", textBackgroundOpacity: 1, textShadowColor: "#000", textShadowBlur: 6, textGlowColor: "#ffffff", textGlowWidth: 5, text3DColor: "#00000055", text3DOffsetX: 0, text3DOffsetY: 0, textBoxStyle: 'block' },
    { id: 'p51', name: 'Royal', isPremium: true, fontFamily: 'Poppins', fontSize: 16, textAlign: 'justify', textGradientColors: ["#6aa3ffff", "#4d7fffff"], textShadowColor: "#002b93", textShadowBlur: 18, textGlowColor: "#74a6ff", textGlowWidth: 14, textOutlineColor: "#0c2a80", textOutlineWidth: 3, textSuperStrokeColor: "#00215e", textSuperStrokeWidth: 3 },
    { id: 'p52', name: 'Lux Gold', isPremium: true, fontFamily: "Playfair Display", fontSize: 16, textAlign: "justify", verticalAlign: "center", textGradientColors: ["#ffe29e", "#f6cc84ff"], textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#4b3505", textShadowBlur: 15, textOutlineWidth: 0, textOutlineColor: "#f9a8d4", textGlowWidth: 1, textGlowColor: "#ffdd94", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", textSuperStrokeWidth: 3, textSuperStrokeColor: "#2c1f08", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false, },
    { id: 'p53', name: 'Toon', isPremium: true, fontFamily: "Luckiest Guy", fontSize: 16, textAlign: "justify", verticalAlign: "center", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 0, textGradientColors: ["#5d5d5dff", "#353535ff", "#6d6d6dff"], textShadowColor: "#000000", textShadowBlur: 0, textOutlineWidth: 5.5, textOutlineColor: "#ffeb00", textGlowWidth: 10, textGlowColor: "#4d4d00", text3DOffsetX: 5, text3DOffsetY: 5, text3DColor: "#000000", textSuperStrokeWidth: 5, textSuperStrokeColor: "#000000", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false, },
    { id: 'p54', name: 'Rose', isPremium: true, fontFamily: "Amatic SC", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#ffffff", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#b14a72", textShadowBlur: 10, textOutlineWidth: 2, textOutlineColor: "#ff8ada", textGlowWidth: 13, textGlowColor: "#fbbdff", text3DOffsetX: 1, text3DOffsetY: 2, text3DColor: "#d14700", textSuperStrokeWidth: 3, textSuperStrokeColor: "#910094", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false, textGradientColors: ["#ffb7d9", "#ff89ae"] },
    { id: 'p55', name: 'Cyan', isPremium: true, fontFamily: "Montserrat", fontSize: 16, textAlign: "justify", verticalAlign: "center", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#003c3f", textShadowBlur: 20, textOutlineWidth: 5, textOutlineColor: "#00e682", textGlowWidth: 0, textGlowColor: "#00faff", text3DOffsetX: 3, text3DOffsetY: 3, text3DColor: "#72bba3", textSuperStrokeWidth: 5, textSuperStrokeColor: "#004c4e", letterSpacing: 0, textTransform: "none", isItalic: false, textGradientColors: ["#00a0a5", "#00a0a5"] },
    { id: 'p56', name: 'Inferno', isPremium: true, fontFamily: 'Anton', fontSize: 16, textAlign: 'justify', textGradientColors: ["#ff6a00", "#ff0000"], textShadowColor: "#650000", textShadowBlur: 18, textGlowColor: "#ff4800", textGlowWidth: 14, textOutlineColor: "#7a0000", textOutlineWidth: 4, textSuperStrokeColor: "#3a0000", textSuperStrokeWidth: 4 },
    { id: 'p59', name: 'Candy', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textGradientColors: ["#ff90d0", "#ff4fa6"], textShadowColor: "#b80062", textShadowBlur: 18, textGlowColor: "#ffbde6", textGlowWidth: 0, textOutlineColor: "#ff66b8", textOutlineWidth: 4, textSuperStrokeColor: "#7c0041", textSuperStrokeWidth: 4 },
    { id: 'p60', name: 'Silver', isPremium: true, fontFamily: "Playfair Display", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#000000", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 0, textShadowColor: "#0f1f38", textShadowBlur: 5, textOutlineWidth: 5, textOutlineColor: "#545454", textGlowWidth: 50, textGlowColor: "#ededed", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#0a0a0a", textSuperStrokeWidth: 3, textSuperStrokeColor: "#ffffff", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false, textGradientColors: ["#f8f8f8", "#c6c6c6"] },
    { id: 'p71', name: 'Orange', isPremium: true, fontFamily: "Luckiest Guy", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#512006", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#000000", textShadowBlur: 20, textOutlineWidth: 5, textOutlineColor: "#db8b00", textGlowWidth: 5, textGlowColor: "#bd6e00", text3DOffsetX: 4, text3DOffsetY: 5, text3DColor: "#d14700", textSuperStrokeWidth: 0, textSuperStrokeColor: "#ef4444", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false },
    { id: 'p62', name: 'Lime', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: "#bcff85", textShadowColor: "#478f00", textShadowBlur: 20, textGlowColor: "#c9ff8e", textGlowWidth: 2, textOutlineColor: "#80ff00", textOutlineWidth: 4, textSuperStrokeColor: "#335700", textSuperStrokeWidth: 4, text3DOffsetX: 4, text3DOffsetY: 4, text3DColor: '#3d6a00' },
    { id: 'p63', name: 'Purple', isPremium: true, fontFamily: "Luckiest Guy", fontSize: 16, textAlign: "justify", verticalAlign: "center", textGradientColors: ["#e9ceff", "#b777ff"], textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 0, textShadowColor: "#000000", textShadowBlur: 0, textOutlineWidth: 10, textOutlineColor: "#630099", textGlowWidth: 13, textGlowColor: "#ff00d0", text3DOffsetX: 5, text3DOffsetY: 5, text3DColor: "#5a008e", textSuperStrokeWidth: 0, textSuperStrokeColor: "#3a005a", letterSpacing: 0, textTransform: "none", isBold: false, isItalic: false },
    { id: 'p64', name: 'Aqua', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: "#66fff5", textShadowColor: "#008099", textShadowBlur: 2, textGlowColor: "#91f2ff", textGlowWidth: 31, textOutlineColor: "#00e9ff", textOutlineWidth: 3, textSuperStrokeColor: "#005a66", textSuperStrokeWidth: 5, text3DOffsetX: 1, text3DOffsetY: 0, text3DColor: '#005a66' },
    { id: 'p65', name: 'Night', isPremium: true, fontFamily: "Montserrat", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#9497ff", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#0b2e57", textShadowBlur: 12, textOutlineWidth: 3.5, textOutlineColor: "#b2a8ff", textGlowWidth: 17, textGlowColor: "#0062ff", text3DOffsetX: 3, text3DOffsetY: 0, text3DColor: "#000000", textSuperStrokeWidth: 5, textSuperStrokeColor: "#5c00e6", letterSpacing: 0, textTransform: "none", isItalic: false, textGradientColors: ["#9ad7ff", "#dff2ff"] },
    { id: 'p66', name: 'Ruby', isPremium: true, fontFamily: "Nunito", fontSize: 16, textAlign: "justify", verticalAlign: "center", textGradientColors: ["#9B2A2A", "#AD1111", "#9B2A2A"], textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#6d0023", textShadowBlur: 14, textOutlineWidth: 7.5, textOutlineColor: "#ff2e2e", textGlowWidth: 12, textGlowColor: "#d97706", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", textSuperStrokeWidth: 4, textSuperStrokeColor: "#482323", letterSpacing: 0, textTransform: "none", isItalic: false },
    { id: 'p67', name: 'Emerald', isPremium: true, fontFamily: "Poppins", fontSize: 16, textAlign: "justify", verticalAlign: "center", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#004d20", textShadowBlur: 15, textOutlineWidth: 7.5, textOutlineColor: "#0c8d22", textGlowWidth: 9, text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", textGlowColor: "#70ff70", letterSpacing: 0, textTransform: "none", isItalic: false, textGradientColors: ["#6df7c0", "#59f7b8"] },
    { id: 'p68', name: 'Violet', isPremium: true, fontFamily: "Oswald", fontSize: 16, textAlign: "justify", verticalAlign: "center", textColor: "#262626", textBackgroundColor: "#ffffff", textBackgroundOpacity: 0, textBoxStyle: "block", lineHeight: 1.4, textShadowOpacity: 1, textShadowColor: "#1e0060", textShadowBlur: 14, textOutlineWidth: 5.5, textOutlineColor: "#ff00d0", textGlowWidth: 1, textGlowColor: "#000000", text3DOffsetX: 0, text3DOffsetY: 0, text3DColor: "#000000", letterSpacing: 0, textTransform: "none", isItalic: false },
    { id: 'p69', name: 'Liquid', isPremium: true, fontFamily: 'Montserrat', fontSize: 16, textAlign: 'justify', textGradientColors: ["#ffffff", "#d2e4ff", "#ffffff"], textShadowColor: "#3a3a3a", textShadowBlur: 12, textShadowOpacity: 1, textOutlineColor: "#2efff1", textOutlineWidth: 6, textSuperStrokeColor: "#000000", textSuperStrokeWidth: 3, textGlowWidth: 11, textGlowColor: "#72eeee" },
    { id: 'p70', name: 'Nova', isPremium: true, fontFamily: 'Poppins', fontSize: 16, textAlign: 'justify', textGradientColors: ["#ffe6ff", "#cbbaff"], textShadowColor: "#2b0052", textShadowBlur: 16, textGlowColor: "#c793ff", textGlowWidth: 14, textOutlineColor: "#7a2eff", textOutlineWidth: 4, textSuperStrokeColor: "#1a0036", textSuperStrokeWidth: 4 },


    {
        id: 'p73',
        name: 'Snow Night',
        isPremium: true,
        fontFamily: 'Merriweather',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textGradientColors: ['#ffffff', '#e0f2fe'], // branco -> azul gelo
        textBackgroundColor: '#020617', // quase preto azulado
        textBackgroundOpacity: 0.75,
        textBoxStyle: 'block',
        textShadowOpacity: 1,
        textShadowColor: '#0f172a',
        textShadowBlur: 18,
        textGlowWidth: 8,
        textGlowColor: '#e0f2fe',
        letterSpacing: 1
    },

    {
        id: 'p74',
        name: 'Candy Cane',
        isPremium: true,
        fontFamily: 'Fredoka',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textGradientColors: ['#ffffff', '#fecaca', '#f97373'], // tipo pau de açúcar
        textShadowOpacity: 1,
        textShadowColor: '#7f1d1d',
        textShadowBlur: 12,
        textOutlineWidth: 3,
        textOutlineColor: '#b91c1c',
        textGlowWidth: 10,
        textGlowColor: '#fecaca',
        letterSpacing: 1.5
    },

    {
        id: 'p75',
        name: 'Evergreen',
        isPremium: true,
        fontFamily: 'Cinzel',
        fontSize: 16,
        textAlign: 'justify',
        verticalAlign: 'center',
        textGradientColors: ['#bbf7d0', '#4ade80'], // verdes suaves
        textBackgroundColor: '#022c22',
        textBackgroundOpacity: 0.85,
        textBoxStyle: 'block',
        textShadowOpacity: 1,
        textShadowColor: '#022c22',
        textShadowBlur: 16,
        textOutlineWidth: 2,
        textOutlineColor: '#166534'
    },

    {
        id: 'p76',
        name: 'Golden Noel',
        isPremium: true,
        fontFamily: 'Playfair Display',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textGradientColors: ['#fef9c3', '#facc15', '#f97316'], // dourado quente
        textShadowOpacity: 1,
        textShadowColor: '#451a03',
        textShadowBlur: 18,
        textGlowWidth: 12,
        textGlowColor: '#facc15',
        textOutlineWidth: 2,
        textOutlineColor: '#fef9c3',
        letterSpacing: 2
    },


    {
        id: 'p78',
        name: 'Gift Wrap',
        isPremium: true,
        fontFamily: 'Montserrat',
        fontSize: 16,
        textAlign: 'justify',
        verticalAlign: 'center',
        textColor: '#ffffff',
        boxGradientColors: ['#166534', '#14532d', '#15803d'], // verde presente
        textBackgroundOpacity: 0.9,
        textBoxStyle: 'block',
        textShadowOpacity: 1,
        textShadowColor: '#022c22',
        textShadowBlur: 14,
        textOutlineWidth: 2,
        textOutlineColor: '#bbf7d0'
    },

    {
        id: 'p79',
        name: 'Holy Night',
        isPremium: true,
        fontFamily: 'Raleway',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textColor: '#e5e7eb',
        textBackgroundColor: '#020617',
        textBackgroundOpacity: 0.7,
        textBoxStyle: 'highlight',
        textShadowOpacity: 1,
        textShadowColor: '#0f172a',
        textShadowBlur: 20,
        textGlowWidth: 6,
        textGlowColor: '#facc15',
        letterSpacing: 2.5
    },

    {
        id: 'p80',
        name: 'Frost',
        isPremium: true,
        fontFamily: 'Nunito',
        fontSize: 16,
        textAlign: 'justify',
        verticalAlign: 'center',
        textGradientColors: ['#ffffff', '#e5e7eb', '#bae6fd'],
        textBackgroundColor: '#0f172a',
        textBackgroundOpacity: 0.5,
        textBoxStyle: 'block',
        textShadowOpacity: 1,
        textShadowColor: '#020617',
        textShadowBlur: 16,
        textGlowWidth: 15,
        textGlowColor: '#e0f2fe'
    },

    {
        id: 'p81',
        name: 'Elf',
        isPremium: true,
        fontFamily: 'Fredoka',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        textGradientColors: ['#22c55e', '#a3e635'], // verde elfo
        textShadowOpacity: 1,
        textShadowColor: '#14532d',
        textShadowBlur: 14,
        textOutlineWidth: 4,
        textOutlineColor: '#f97316', // laranja meia "luzinhas"
        textGlowWidth: 10,
        textGlowColor: '#bbf7d0',
        letterSpacing: 1.5
    },

    { id: 'p84', name: 'Elf', isPremium: true, fontFamily: 'Fredoka', fontSize: 16, textAlign: 'justify', textColor: '#ffffff', textBackgroundColor: "#166534", textBackgroundOpacity: 0.9, textBoxStyle: 'block', textOutlineColor: "#fca5a5", textOutlineWidth: 0, textShadowColor: "#000000", textShadowBlur: 5 },
    { id: 'p85', name: 'Candy', isPremium: true, fontFamily: 'Pacifico', fontSize: 16, textAlign: 'center', textGradientColors: ["#ff0000", "#ffffff", "#ff0000"], textOutlineColor: "#ffffff", textOutlineWidth: 3, textShadowColor: "#cc0000", textShadowBlur: 8, textGlowColor: "#ffb3b3", textGlowWidth: 5 },
    { id: 'p87', name: 'Pine', isPremium: true, fontFamily: 'Anton', fontSize: 16, textAlign: 'center', textGradientColors: ["#2d6a4f", "#1b4332"], textOutlineColor: "#d8f3dc", textOutlineWidth: 2, textShadowColor: "#000000", textShadowBlur: 15, textGlowColor: "#40916c", textGlowWidth: 10 },

    { id: 'p91', name: 'Sleigh', isPremium: true, fontFamily: 'Oswald', fontSize: 16, textAlign: 'justify', textGradientColors: ["#dc2626", "#991b1b"], textOutlineColor: "#fbbf24", textOutlineWidth: 2, textShadowColor: "#000000", textShadowBlur: 15, text3DOffsetX: 4, text3DOffsetY: 4, text3DColor: "#450a0a" },
];

// Helper to render visual preview for style presets
const StyleThumbnail: React.FC<{ preset: PresetConfig }> = ({ preset }) => {
    const isGradient = preset.textGradientColors && preset.textGradientColors.length > 1;

    const shadows = [];
    if (preset.textGlowWidth && preset.textGlowWidth > 0) {
        shadows.push(`0 0 ${preset.textGlowWidth / 2}px ${preset.textGlowColor}`);
    }
    if (preset.textShadowOpacity && preset.textShadowOpacity > 0 || preset.textShadowBlur && preset.textShadowBlur > 0) {
        shadows.push(`${preset.textShadowColor} 2px 2px ${preset.textShadowBlur}px`);
    } else if (preset.text3DOffsetX) {
        shadows.push(`${preset.text3DOffsetX}px ${preset.text3DOffsetY}px 0px ${preset.text3DColor}`);
    }

    const textStyle: React.CSSProperties = {
        fontFamily: preset.fontFamily,
        fontWeight: preset.isBold ? 'bold' : 'normal',
        fontStyle: preset.isItalic ? 'italic' : 'normal',
        fontSize: '24px', // Reduced size for compact preview
        color: isGradient ? 'transparent' : preset.textColor,
        backgroundImage: isGradient ? `linear-gradient(to bottom, ${preset.textGradientColors?.join(', ')})` : 'none',
        WebkitBackgroundClip: isGradient ? 'text' : 'border-box',
        backgroundClip: isGradient ? 'text' : 'border-box',
        textShadow: shadows.join(', '),
        WebkitTextStroke: preset.textOutlineWidth ? `${preset.textOutlineWidth * 0.2}px ${preset.textOutlineColor}` : '0px transparent',
    };

    return (
        <div className="w-14 h-14 bg-dark-graphite rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner border border-dark-steel">
            {(preset.textSuperStrokeWidth || 0) > 0 && (
                <span className="absolute text-2xl font-bold select-none"
                    style={{
                        fontFamily: preset.fontFamily,
                        textShadow: getStrokeShadow((preset.textSuperStrokeWidth || 0) * 0.3, preset.textSuperStrokeColor || '#000'),
                        color: 'transparent',
                        zIndex: 0
                    }}
                >
                    Aa
                </span>
            )}
            <span className="relative z-10 select-none" style={textStyle}>Aa</span>
            {preset.isPremium && (
                <div className="absolute top-1 right-1 text-[7px] bg-neon-pulse text-dark-carbon px-1 rounded-sm font-bold">PRO</div>
            )}
        </div>
    );
};

// Helper function to generate a dense text-shadow string that simulates a thick, rounded stroke
// This avoids the "miter spikes" caused by regular CSS text-stroke on sharp fonts.
const getStrokeShadow = (width: number, color: string) => {
    if (width === 0) return 'none';
    const shadows: string[] = [];
    const steps = 16; // 16 angles for smoothness

    // Create concentric layers of shadows to fill gaps for large widths
    // We do one loop at full width, and one at 70% width to fill any internal holes
    const layers = [width, width * 0.7];

    layers.forEach(w => {
        for (let i = 0; i < steps; i++) {
            const angle = (i * 2 * Math.PI) / steps;
            const x = Math.cos(angle) * w;
            const y = Math.sin(angle) * w;
            shadows.push(`${x.toFixed(1)}px ${y.toFixed(1)}px 0 ${color}`);
        }
    });

    return shadows.join(', ');
};

const PremiumModal: React.FC<{
    onClose: () => void,
    onUnlock: () => void,
    language: LanguageCode,
    showRewardedButton?: boolean,
    onWatchAd?: () => void
}> = ({ onClose, onUnlock, language, showRewardedButton = false, onWatchAd }) => {
    // ... (Modal Content - unchanged)
    const t = UI_TRANSLATIONS[language];
    return (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-dark-graphite sm:rounded-3xl rounded-t-3xl p-8 relative shadow-2xl border border-dark-steel/50 overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-dark-steel/50 hover:bg-dark-steel rounded-full transition-colors">
                    <X className="w-5 h-5 text-text-secondary" />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-neon-pulse/10 mb-4 shadow-[0_0_30px_rgba(0,255,114,0.2)]">
                        <Crown className="w-10 h-10 text-neon-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{t.premiumTitle}</h2>
                    <p className="text-text-secondary text-sm leading-relaxed font-medium">
                        {t.premiumDesc}
                    </p>
                </div>

                <div className="space-y-6 mb-8">
                    {[
                        { icon: '🎨', title: t.premiumBenefit1, desc: t.premiumBenefit1Desc },
                        { icon: '🧩', title: t.premiumBenefit2, desc: t.premiumBenefit2Desc },
                        { icon: '🖼️', title: t.premiumBenefit3, desc: t.premiumBenefit3Desc },
                        { icon: '🚫', title: t.premiumBenefit4, desc: t.premiumBenefit4Desc },
                        { icon: '⚡', title: t.premiumBenefit5, desc: t.premiumBenefit5Desc }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                            <span className="text-2xl mt-1 opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                            <div>
                                <h3 className="font-bold text-white text-base group-hover:text-neon-pulse transition-colors">{item.title}</h3>
                                <p className="text-sm text-text-dim mt-1 leading-snug">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <button onClick={onUnlock} className="w-full bg-neon-pulse hover:bg-neon-mint text-dark-carbon font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(0,255,114,0.4)] transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wide">
                        {t.unlockNow}
                    </button>
                    {showRewardedButton && onWatchAd && (
                        <button onClick={onWatchAd} className="w-full bg-dark-steel/50 hover:bg-dark-steel border border-neon-pulse/30 text-white font-bold text-base py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                            <Zap className="w-5 h-5 text-neon-pulse" />
                            {t.watchAdButton}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const EditorScreen: React.FC<Props> = ({ initialPhrase, onBack, isPremium, onUnlock, language }) => {
    // ... (State and other functions remain unchanged)
    const allTemplates = useAutoTemplates();
    // Combine os templates fixos (DB) com os das pastas
    const [config, setConfig] = useState<EditorConfig>({
        text: initialPhrase,
        templateId: 't1',
        fontSize: 16,
        textAlign: 'center',
        verticalAlign: 'center',
        fontFamily: 'Inter',
        textColor: '#ffffff',
        isBold: false,
        isItalic: false,
        letterSpacing: 0,
        textTransform: 'none',
        textBackgroundColor: '#ffffff',
        textBackgroundOpacity: 0,
        textBoxStyle: 'highlight',
        lineHeight: 1.4,
        textShadow: false,
        textShadowOpacity: 0,
        textShadowColor: '#000000',
        textShadowBlur: 0,
        textOutline: false,
        textOutlineWidth: 0,
        textOutlineColor: '#000000',
        textGlowWidth: 0,
        textGlowColor: '#ffff00',
        text3DOffsetX: 0,
        text3DOffsetY: 0,
        text3DColor: '#000000',
        textSuperStrokeWidth: 0,
        textSuperStrokeColor: '#ffffff',
        textureType: 'none',
        textureOpacity: 0.5,
        breakMode: 'balanced',
    });
    const [previewRatio, setPreviewRatio] = useState(1);
    const [activeTool, setActiveTool] = useState<string>('templates'); // Default to templates tab
    const [magicSubTab, setMagicSubTab] = useState<'layout' | 'highlights'>('layout');
    const [templateCategory, setTemplateCategory] = useState<string>('Diversos'); // Default to Diversos category
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(true);
    const [isEditingText, setIsEditingText] = useState(false);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [showRewardedModal, setShowRewardedModal] = useState(false);
    const [rewardedModalType, setRewardedModalType] = useState<'template' | 'preset'>('template');
    const [rewardedTargetId, setRewardedTargetId] = useState<string>('');
    const [smartPresetIndex, setSmartPresetIndex] = useState(0);
    const [palette, setPalette] = useState<string[]>([]);

    // Effects for Smart Palette
    useEffect(() => {
        const template = getCurrentTemplate();
        const imageUrl = template?.value;
        if (imageUrl && imageUrl.startsWith('http')) {
            extractPaletteFromImage(imageUrl).then(setPalette);
        } else if (customImage) {
            extractPaletteFromImage(customImage).then(setPalette);
        }
    }, [config.templateId, customImage]);

    useEffect(() => {
        if (palette.length > 0) {
            handleRebuildPlan();
        }
    }, [palette]);



    // Export & Share Logic
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [exportBlob, setExportBlob] = useState<Blob | null>(null);
    const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
    const [selectedShareFormat, setSelectedShareFormat] = useState<'square' | 'story'>('square');
    const [exportQuality, setExportQuality] = useState<'standard' | 'hd'>('standard');
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [previewFitMode, setPreviewFitMode] = useState<'cover' | 'contain'>('cover');

    const t = UI_TRANSLATIONS[language];

    // Set default template
    const getCurrentTemplate = () => {
        if (config.templateId === 'custom' && customImage) {
            return {
                id: 'custom', name: 'Custom', category: 'Minimal',
                backgroundType: 'image', value: customImage,
                textColor: config.textColor, fontFamily: config.fontFamily,
                overlayOpacity: 0.2
            } as Template;
        }
        if (!allTemplates || allTemplates.length === 0) {
            return {
                id: 'placeholder', name: 'Loading...', category: 'Diversos',
                backgroundType: 'solid', value: '#1e1e1e', textColor: '#ffffff',
                fontFamily: 'Inter', overlayOpacity: 0, isPremium: false
            } as unknown as Template;
        }
        return allTemplates.find(t => t.id === config.templateId) || allTemplates[0];
    };

    useEffect(() => {
        if (allTemplates.length > 0 && config.templateId === 't1') {
            const defaultTemplate = allTemplates.find(t => t.category === 'Diversos');
            if (defaultTemplate) {
                handleTemplateSelect(defaultTemplate);
            }
        }
    }, [allTemplates]);

    // Apply Text Plan on initial phrase
    useEffect(() => {
        if (initialPhrase) {
            // Rebuild with possible palette aware logic
            handleRebuildPlan(initialPhrase);
        }
    }, [initialPhrase, language]);


    // Rewarded Ad Handler
    const handleTemplateSelect = (template: Template) => {
        setConfig(prev => ({ ...prev, templateId: template.id }));
        setPreviewFitMode('cover');
        setShowTemplateModal(false);
        setActiveTool('styles');

        // Apply Smart Recommendations
        setSmartPresetIndex(0);
        applySmartSuggestion(template, 0);
    };

    const handleWatchRewardedAd = async () => {
        setShowRewardedModal(false);
        setShowPremiumModal(false);
        const rewarded = await admobService.showRewardedAd();

        if (rewarded) {
            if (rewardedModalType === 'template') {
                dailyUnlockService.unlockTemplate(rewardedTargetId);
                const template = allTemplates.find(t => t.id === rewardedTargetId);
                if (template) {
                    handleTemplateSelect(template);
                } else {
                    setConfig({ ...config, templateId: rewardedTargetId });
                }
                // Show success feedback
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            } else {

                const preset = PRESET_STYLES.find((p: PresetConfig) => p.id === rewardedTargetId);
                if (preset) {
                    dailyUnlockService.unlockPreset(rewardedTargetId);
                    applyPresetConfig(preset);
                    // Show success feedback
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 3000);
                }
            }
        } else {
            // Ad not completed - could show error message here if needed
            console.log('Rewarded ad not completed');
        }
    };

    const matchSmartData = (template: Template) => {
        // 1. Prepare template filename: remove path, query, extension, _free, and lowercase
        const urlParts = template.value.split('/');
        const rawFileName = decodeURIComponent(urlParts.pop()?.split('?')[0] || '');
        const templateBaseName = rawFileName
            .replace(/\.[^/.]+$/, "") // Remove extension (e.g. .webp, .png)
            .replace('_free', '')      // Remove _free suffix
            .toLowerCase()
            .trim();

        const templateCategory = template.category.toLowerCase();

        return TEMPLATES_SMART_DATA.find(item => {
            const itemParts = item.imagePath.split('/');
            const itemFileName = itemParts.pop() || '';
            const itemCategory = itemParts.pop() || '';

            // 2. Prepare JSON filename: remove extension, _free, lowercase
            const itemBaseName = itemFileName
                .replace(/\.[^/.]+$/, "")
                .replace('_free', '')
                .toLowerCase()
                .trim();

            // 3. Compare: Category matches AND Filename matches (base name only)
            const categoryMatch = itemCategory.toLowerCase() === templateCategory;
            const nameMatch = itemBaseName === templateBaseName;

            return categoryMatch && nameMatch;
        });
    };


    const applySmartSuggestion = (template: Template, index: number) => {
        const smartMatch = matchSmartData(template);

        let presetName = '';
        let safeZone = 'CENTER';
        let brightness = 100;
        let noise = 0;

        if (smartMatch) {
            if (index === 0) presetName = smartMatch.smartData.recommendedPreset;
            else if (index === 1) presetName = smartMatch.smartData.alternativePresets[0];
            else if (index === 2) presetName = smartMatch.smartData.alternativePresets[1];

            safeZone = smartMatch.smartData.safeZone || 'CENTER';
            brightness = smartMatch.smartData.brightness ?? 100;
            noise = smartMatch.smartData.noise ?? 0;
        } else {
            // Fallback presets for templates without smart data
            const fallbacks = ['Clean', 'Classic', 'Ginger'];
            presetName = fallbacks[index % fallbacks.length];
        }

        if (!presetName) return;

        const preset = PRESET_STYLES.find(p => p.name.toLowerCase() === presetName.toLowerCase());
        if (preset) {
            applyPresetConfig({
                ...preset,
                verticalAlign: safeZone.toLowerCase() as any,
                brightness: brightness,
                noise: noise
            });
        }
    };



    const handleOpenRewardedModal = () => {
        setShowPremiumModal(false);
        setShowRewardedModal(true);
    };




    const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.category))).sort((a, b) => {
        if (a === 'Diversos') return -1;
        if (b === 'Diversos') return 1;
        if (a === 'PassagemDeAno') return -1;
        if (b === 'PassagemDeAno') return 1;
        if (a === 'Natal') return -1;
        if (b === 'Natal') return 1;
        return a.localeCompare(b);
    })];
    const filteredTemplates = templateCategory === 'All'
        ? allTemplates
        : allTemplates.filter(t => t.category === templateCategory);

    // Scroll to active category
    useEffect(() => {
        if (showTemplateModal && categoryScrollRef.current) {
            const activeBtn = categoryScrollRef.current.querySelector(`[data-category="${templateCategory}"]`);
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [showTemplateModal, templateCategory]);


    useEffect(() => {
        let active = true;

        const updatePreview = async () => {
            const template = getCurrentTemplate();

            // 1. Define dimensões baseadas no formato (Tenta manter qualidade HD)
            let w = 1080;
            let h = 1080;

            // Se for imagem de fundo, tentamos descobrir o rácio original
            if (template.backgroundType === 'image' && template.value) {
                // Truque rápido: Carregar imagem para ver tamanho real
                const img = new Image();
                img.src = template.value;
                await img.decode().catch(() => { }); // Espera carregar os metadados

                // Se for mais alta que larga (Vertical/Story)
                if (img.naturalHeight > img.naturalWidth) {
                    h = 1920; // Muda para formato Story
                }
            }
            setPreviewRatio(w / h);
            // Atualiza a proporção visual do container (opcional, mas recomendado)
            // setPreviewRatio(w / h); 

            // 2. Gera a imagem com as dimensões corretas
            const sanitizedConfig = { ...config, text: config.text.replace(/<br\s*\/?>\s+/gi, '<br>') };
            const blob = await generateImage(sanitizedConfig, template, w, h, isPremium, true);

            if (blob && active) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            }
        };

        // Debounce melhorado
        const timeout = setTimeout(updatePreview, 150);
        return () => {
            active = false;
            clearTimeout(timeout);
        };
    }, [config, isPremium, customImage]);

    const applyPreset = async (preset: PresetConfig) => {
        // Verifica se é premium
        if (preset.isPremium && !isPremium) {
            // Verifica se já está desbloqueado hoje
            if (dailyUnlockService.isPresetUnlocked(preset.id)) {
                // Já desbloqueado hoje, aplica direto
                applyPresetConfig(preset);
                return;
            }

            // Mostra modal premium (com botão de rewarded ad se disponível)
            setRewardedModalType('preset');
            setRewardedTargetId(preset.id);
            setShowPremiumModal(true);
            return;
        }

        // Não é premium ou user já é premium
        applyPresetConfig(preset);
    };

    const applyPresetConfig = (preset: PresetConfig) => {
        const defaultStyleState: Partial<EditorConfig> = {
            textColor: '#000000',
            textGradientColors: undefined,
            textBackgroundColor: '#ffffff',
            textBackgroundOpacity: 0,
            boxGradientColors: undefined,
            textBoxStyle: 'block',
            textShadow: false,
            textShadowOpacity: 0,
            textShadowColor: '#000000',
            textShadowBlur: 0,
            textOutline: false,
            textOutlineWidth: 0,
            textOutlineColor: '#000000',
            textGlowWidth: 0,
            textGlowColor: '#ffff00',
            text3DOffsetX: 0,
            text3DOffsetY: 0,
            text3DColor: '#000000',
            textSuperStrokeWidth: 0,
            textSuperStrokeColor: '#ffffff',
            letterSpacing: 0,
            textTransform: 'none',
            lineHeight: 1.4,
            isBold: false,
            isItalic: false,
            brightness: 100, // Default baseline (100% or calibrated)
            noise: 0
        };


        setConfig(prev => ({
            ...prev,
            ...defaultStyleState,
            ...preset,
            textAlign: 'center', // Always center aligned as requested
            textGradientColors: preset.textGradientColors || undefined,
            boxGradientColors: preset.boxGradientColors || undefined,
            verticalAlign: preset.verticalAlign || prev.verticalAlign, // Keep previous if not in preset
            brightness: preset.brightness ?? prev.brightness ?? 100,
            noise: preset.noise ?? prev.noise ?? 0
        }));
    };


    const handleToolClick = (toolId: string) => {
        if (toolId === 'templates') {
            setShowTemplateModal(true);
            return;
        }

        const lockedTools = ['stroke', 'box', 'glow', '3d', 'textures', 'magic'];
        if (lockedTools.includes(toolId) && !isPremium) {
            setShowPremiumModal(true);
        } else {
            setActiveTool(toolId);
        }
    };

    function handleRebuildPlan(newText?: string, mode?: 'balanced' | 'compact' | 'impact') {
        const textToProcess = (newText !== undefined ? newText : config.text).replace(/\n/g, ' '); // Clean existing breaks to allow fresh layout
        const targetMode = mode || config.breakMode || 'balanced';

        // Tentar preservar a cor atual do extraBold se existir
        const currentExtraBoldColor = config.textRuns?.find(r => r.weight === 'extraBold')?.color;

        // Choose smart color
        const isNote = config.templateId.includes('paper') || config.templateId.includes('note');
        const candidates = [...palette, config.textColor, config.textBackgroundColor, config.textSuperStrokeColor];
        const smartColor = chooseSmartColor(candidates, [config.textBackgroundColor], config.textColor, isNote);

        const finalSecondaryColor = currentExtraBoldColor || smartColor;

        const plan = buildTextPlan({
            text: textToProcess,
            lang: language,
            breakMode: targetMode,
            forcedHighlights: config.disableSmartHighlights ? [] : config.highlights,
            secondaryColor: finalSecondaryColor
        });

        setConfig(prev => ({
            ...prev,
            text: plan.textBroken,
            textRuns: plan.runs,
            highlights: plan.highlights,
            breakMode: plan.breakMode
        }));
    };

    function toggleHighlight(word: string) {
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, '');
        const targetNorm = norm(word);

        const current = config.highlights || [];
        const exists = current.find(h => norm(h) === targetNorm);

        let next: string[];
        if (exists) {
            // Remove todas as variantes da palavra selecionada
            next = current.filter(h => norm(h) !== targetNorm);
        } else {
            next = [...current, word];
        }

        // Tentar preservar a cor atual do extraBold se existir
        const currentExtraBoldColor = config.textRuns?.find(r => r.weight === 'extraBold')?.color;

        // Choose smart color as fallback
        const isNote = config.templateId.includes('paper') || config.templateId.includes('note');
        const candidates = [...palette, config.textColor, config.textBackgroundColor, config.textSuperStrokeColor];
        const smartColor = chooseSmartColor(candidates, [config.textBackgroundColor], config.textColor, isNote);

        const finalSecondaryColor = currentExtraBoldColor || smartColor;

        const plan = buildTextPlan({
            text: config.text.replace(/\n/g, ' '),
            lang: language,
            breakMode: config.breakMode || 'balanced',
            forcedHighlights: next,
            secondaryColor: finalSecondaryColor
        });

        setConfig({
            ...config,
            highlights: plan.highlights,
            textRuns: plan.runs,
            disableSmartHighlights: true
        });
    }

    const changeExtraBoldColor = (color: string) => {
        setConfig(prev => ({
            ...prev,
            textRuns: prev.textRuns?.map(run =>
                run.weight === 'extraBold' ? { ...run, color } : run
            )
        }));
    };

    const clearExtraBold = () => {
        const isTurningOff = (config.highlights && config.highlights.length > 0);

        const nextHighlights = isTurningOff ? [] : undefined; // undefined triggers AUTO again if we decide to re-enable

        const plan = buildTextPlan({
            text: config.text.replace(/\n/g, ' '),
            lang: language,
            breakMode: config.breakMode || 'balanced',
            forcedHighlights: nextHighlights
        });

        setConfig(prev => ({
            ...prev,
            highlights: plan.highlights,
            textRuns: plan.runs,
            disableSmartHighlights: isTurningOff
        }));
    };

    const handleDownload = async () => {
        // Mostra interstitial antes de abrir o menu (apenas se não for premium)
        if (!isPremium) {
            await admobService.showInterstitialOnExport();
        }
        // Depois mostra o menu de exportação
        setShowExportMenu(true);
    };

    const handleUnlock = () => {
        // Abre o modal de subscrição em vez de chamar onUnlock diretamente
        setShowSubscriptionModal(true);
        setShowPremiumModal(false);
    };

    const handlePurchase = async (plan: 'yearly' | 'monthly' | 'weekly' | 'holidayPass') => {
        try {
            console.log('Purchasing plan:', plan);

            const success = await revenueCatService.purchasePackage(plan);

            if (success) {
                // Compra bem sucedida
                setShowSubscriptionModal(false);
                onUnlock();

                // Mostra mensagem de sucesso (opcional)
                alert(t.unlockSuccess.replace('Meia-Noite', 'Sempre'));
            } else {
                // Usuário cancelou ou erro
                console.log('Purchase cancelled or failed');
            }
        } catch (error) {
            console.error('Error during purchase:', error);
            alert('Erro ao processar compra. Tenta novamente.');
        }
    };

    const handleRestorePurchases = async (email?: string) => {
        try {
            console.log('Restoring purchases...');

            if (!Capacitor.isNativePlatform()) {
                // Web Restore Logic
                if (!email || !email.includes('@')) {
                    alert('Por favor insira um email válido para restaurar.');
                    return;
                }

                const isPremium = await StripeService.checkSubscriptionStatus(email);
                if (isPremium) {
                    setShowSubscriptionModal(false);
                    onUnlock();
                    localStorage.setItem('userEmail', email); // Save for future
                    alert('Acesso Premium restaurado com sucesso!');
                } else {
                    alert('Nenhuma subscrição ativa encontrada para este email.');
                }
                return;
            }

            const hasActivePurchase = await revenueCatService.restorePurchases();

            if (hasActivePurchase) {
                // Tem subscrição ativa
                setShowSubscriptionModal(false);
                onUnlock();
                alert('Compras restauradas com sucesso!');
            } else {
                // Não tem subscrição
                alert('Nenhuma compra encontrada.');
            }
        } catch (error) {
            console.error('Error restoring purchases:', error);
            alert('Erro ao restaurar compras.');
        }
    };

    const toggleQuality = () => {
        if (exportQuality === 'standard') {
            if (isPremium) {
                setExportQuality('hd');
            } else {
                setShowPremiumModal(true);
            }
        } else {
            setExportQuality('standard');
        }
    };

    const getExportDimensions = (format: 'square' | 'story') => {
        if (exportQuality === 'hd') {
            return format === 'square' ? { w: 2048, h: 2048 } : { w: 2160, h: 3840 };
        }
        return format === 'square' ? { w: 1080, h: 1080 } : { w: 1080, h: 1920 };
    };

    const handleSaveFile = async (format: 'square' | 'story') => {
        setIsGenerating(true);
        const template = getCurrentTemplate();
        const { w, h } = getExportDimensions(format);
        const sanitizedConfig = { ...config, text: config.text.replace(/<br\s*\/?>\s+/gi, '<br>') };
        const blob = await generateImage(sanitizedConfig, template, w, h, isPremium, false);
        if (blob) {
            try {
                // Converter blob para base64
                const reader = new FileReader();
                reader.readAsDataURL(blob);

                reader.onloadend = async () => {
                    const base64Data = (reader.result as string).split(',')[1]; // Remove cabeçalho data:image...
                    const NOME_ALBUM = 'SuperQuote';
                    const fileName = `quote_${new Date().getTime()}.jpg`;

                    try {
                        // 1. Tentar encontrar o álbum primeiro
                        let albumId = null;
                        try {
                            const listaAlbuns = await Media.getAlbums();
                            console.log('Álbuns encontrados:', listaAlbuns);
                            const albumEncontrado = listaAlbuns.albums.find(a => a.name === NOME_ALBUM);

                            if (albumEncontrado) {
                                console.log('Álbum encontrado, ID:', albumEncontrado.identifier);
                                albumId = albumEncontrado.identifier;
                            }
                        } catch (e) {
                            console.warn('Erro ao ler álbuns, vamos tentar criar um direto.', e);
                        }

                        // 2. Função auxiliar para tentar guardar
                        const tentarGuardar = async (idDoAlbum: string) => {
                            return await Media.savePhoto({
                                path: `data:image/jpeg;base64,${base64Data}`,
                                albumIdentifier: idDoAlbum,
                                fileName: fileName
                            });
                        };

                        try {
                            // TENTATIVA 1: Se temos ID, tentamos usar
                            if (albumId) {
                                console.log('Tentativa 1: Guardar no álbum existente...');
                                await tentarGuardar(albumId);
                                console.log('Imagem guardada no álbum SuperQuote!');
                                setShowSaveSuccess(true);
                                setTimeout(() => setShowSaveSuccess(false), 3000);
                            } else {
                                // Se não temos ID, forçamos erro para cair no catch e criar
                                throw new Error('Sem álbum, criar novo.');
                            }
                        } catch (erroSave) {
                            console.warn('Tentativa 1 falhou. O álbum antigo pode ser inválido. Criando novo...', erroSave);

                            // TENTATIVA 2: Criar o álbum e guardar no novo ID
                            try {
                                await Media.createAlbum({ name: NOME_ALBUM });
                                // Depois de criar, buscamos o ID correto novamente
                                const novaLista = await Media.getAlbums();
                                const novoAlbum = novaLista.albums.find(a => a.name === NOME_ALBUM);

                                if (novoAlbum) {
                                    console.log('Tentativa 2: Guardar no álbum recém-criado/corrigido...', novoAlbum.identifier);
                                    await tentarGuardar(novoAlbum.identifier);
                                    console.log('Imagem guardada no álbum SuperQuote!');
                                    setShowSaveSuccess(true);
                                    setTimeout(() => setShowSaveSuccess(false), 3000);
                                } else {
                                    throw new Error('Não foi possível criar ou encontrar o álbum.');
                                }
                            } catch (erroFatal) {
                                // TENTATIVA 3 (Desespero): Guardar sem álbum (vai para a raiz da galeria)
                                console.error('Tentativa 2 falhou. Guardando na galeria geral.', erroFatal);
                                await Media.savePhoto({
                                    path: `data:image/jpeg;base64,${base64Data}`,
                                    fileName: fileName
                                    // Sem albumIdentifier
                                });
                                console.log('Imagem guardada na galeria geral!');
                                setShowSaveSuccess(true);
                                setTimeout(() => setShowSaveSuccess(false), 3000);
                            }
                        }
                    } catch (error) {
                        console.error('Erro fatal ao guardar:', error);
                        // Fallback final: download tradicional
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SuperQuote_${format}_${exportQuality}.jpg`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                };
            } catch (error) {
                console.error('Erro ao processar imagem:', error);
            }
        }
        setIsGenerating(false);
        setShowExportMenu(false);
    };

    const handleSocialPreview = async (format: 'square' | 'story') => {
        setIsGenerating(true);
        const template = getCurrentTemplate();
        const { w, h } = getExportDimensions(format);

        const sanitizedConfig = { ...config, text: config.text.replace(/<br\s*\/?>\s+/gi, '<br>') };
        const blob = await generateImage(sanitizedConfig, template, w, h, isPremium, false);
        if (blob) {
            const url = URL.createObjectURL(blob);
            setExportBlob(blob);
            setExportPreviewUrl(url);
            setSelectedShareFormat(format);
            setShowExportMenu(false);
            setShowPreviewDialog(true);
        }
        setIsGenerating(false);
    };

    const executeShare = async () => {
        if (!exportBlob) return;

        try {
            // Converter blob para base64
            const reader = new FileReader();
            reader.readAsDataURL(exportBlob);

            reader.onloadend = async () => {
                if (!Capacitor.isNativePlatform()) {
                    // Lógica para Web/PWA
                    try {
                        const file = new File([exportBlob], `SuperQuote_${Date.now()}.png`, { type: exportBlob.type });
                        const shareData = {
                            files: [file],
                            title: 'SuperQuote',
                            text: 'Criado com SuperQuote'
                        };

                        if (navigator.canShare && navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                        } else {
                            // Fallback para download se Web Share API não suportar ficheiros
                            throw new Error('Web Share API não suporta partilha de ficheiros neste browser.');
                        }
                    } catch (webShareError) {
                        console.warn('Web Share falhou, fallback para download:', webShareError);
                        // Fallback: Download
                        const url = URL.createObjectURL(exportBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SuperQuote_${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }
                } else {
                    // Lógica para Native (Android/iOS)
                    const base64Data = reader.result as string;
                    // Remove o prefixo "data:image/png;base64,"
                    const base64Image = base64Data.split(',')[1];

                    try {
                        // Salvar ficheiro usando Capacitor Filesystem
                        const fileName = `SuperQuote_${selectedShareFormat}_${Date.now()}.jpg`;
                        const savedFile = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Image,
                            directory: Directory.Cache
                        });

                        // Partilhar usando Capacitor Share
                        await Share.share({
                            title: 'SuperQuote',
                            text: 'Criado com SuperQuote',
                            files: [savedFile.uri],
                            dialogTitle: 'Partilhar'
                        });
                    } catch (shareError) {
                        console.error('Erro ao partilhar:', shareError);
                    }
                }
            };
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
        }

        setShowPreviewDialog(false);
    };

    // ... (hexToRgba, handleUploadClick, handleFileChange...)
    const hexToRgba = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const handleUploadClick = () => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCustomImage(event.target.result as string);
                    setConfig(prev => ({ ...prev, templateId: 'custom' }));
                    setPreviewFitMode('cover'); // Reset para cover
                    setShowTemplateModal(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getPreviewStyles = () => {
        const isGradient = config.textGradientColors && config.textGradientColors.length >= 2;

        const shadows = [];
        if (config.textGlowWidth > 0) {
            shadows.push(`0 0 ${config.textGlowWidth}px ${config.textGlowColor}`);
            shadows.push(`0 0 ${config.textGlowWidth * 1.5}px ${config.textGlowColor}`);
        }

        if (config.textShadowOpacity > 0) {
            shadows.push(`${config.textShadowColor} 4px 4px ${config.textShadowBlur || 5}px`);
        } else if (config.text3DOffsetX !== 0 || config.text3DOffsetY !== 0) {
            shadows.push(`${config.text3DOffsetX}px ${config.text3DOffsetY}px 0px ${config.text3DColor}`);
        }

        return {
            fontFamily: config.fontFamily,
            fontSize: `${config.fontSize}px`,
            textAlign: config.textAlign as any,
            fontWeight: config.isBold ? 'bold' : 'normal',
            fontStyle: config.isItalic ? 'italic' : 'normal',
            lineHeight: config.lineHeight,
            letterSpacing: `${config.letterSpacing}px`,
            textTransform: config.textTransform,
            color: isGradient ? 'transparent' : config.textColor,
            backgroundImage: isGradient ? `linear-gradient(to bottom, ${config.textGradientColors?.join(', ')})` : 'none',
            WebkitBackgroundClip: isGradient ? 'text' : 'border-box',
            backgroundClip: isGradient ? 'text' : 'border-box',
            WebkitTextStroke: config.textOutlineWidth > 0 ? `${config.textOutlineWidth * 0.2}px ${config.textOutlineColor}` : '0px transparent',
            textShadow: shadows.join(', '),
            whiteSpace: 'pre-wrap',
        };
    };

    const renderTextureOverlay = () => {
        if (!config.textureType || config.textureType === 'none' || !config.textureOpacity) return null;

        const textureUrls: Record<string, string> = {
            'grain': 'none',
            'paper': 'https://images.unsplash.com/photo-1586075010471-9799292db3b8?auto=format&fit=crop&q=80&w=1000',
            'leak': 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop',
            'dust': 'https://www.transparenttextures.com/patterns/dust.png'
        };

        if (config.textureType === 'grain') {
            return (
                <div className="absolute inset-0 z-[5] pointer-events-none opacity-40 mix-blend-screen"
                    style={{
                        opacity: config.textureOpacity,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />
            );
        }

        return (
            <div className="absolute inset-0 z-[5] pointer-events-none"
                style={{
                    opacity: config.textureOpacity,
                    backgroundImage: `url(${textureUrls[config.textureType]})`,
                    backgroundSize: 'cover',
                    mixBlendMode: config.textureType === 'paper' ? 'multiply' : 'screen',
                    filter: config.textureType === 'dust' ? 'brightness(1.2) contrast(1.1)' : 'none'
                }}
            />
        );
    };

    const renderTextWithBackground = () => {
        const styles = getPreviewStyles();
        const isJustify = config.textAlign === 'justify';

        const sanitizedText = config.text.replace(/<br\s*\/?>\s+/gi, '\n');
        const lines = sanitizedText.split('\n');

        // Debug logs removed

        const linesOfRuns = config.textRuns ? splitRunsIntoLines(config.textRuns) : null;

        const bgStyle: React.CSSProperties = {
            ...styles,
            position: 'relative',
            zIndex: 10,
            backgroundColor: config.textBackgroundOpacity > 0 ? `rgba(${hexToRgba(config.textBackgroundColor).r}, ${hexToRgba(config.textBackgroundColor).g}, ${hexToRgba(config.textBackgroundColor).b}, ${config.textBackgroundOpacity})` : 'transparent',
            padding: config.textBoxStyle === 'highlight' ? '0.15em 0.4em' : '0.20em 0.4em',
            borderRadius: config.textBackgroundOpacity > 0 ? `${config.fontSize * 0.24}px` : '0',
            // Blur removed as requested
            border: 'none',
            width: isJustify ? '100%' : 'fit-content',
            display: isJustify ? 'block' : 'inline-block',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
        };

        if (config.boxGradientColors && config.boxGradientColors.length >= 2 && config.textBackgroundOpacity > 0) {
            bgStyle.backgroundImage = `linear-gradient(to bottom, ${config.boxGradientColors.join(', ')})`;
            if (config.textGradientColors) {
                delete bgStyle.backgroundImage;
                delete bgStyle.WebkitBackgroundClip;
                delete bgStyle.backgroundClip;
                delete bgStyle.color;
            }
        }

        const superStrokeStyle: React.CSSProperties = {
            ...styles,
            textShadow: getStrokeShadow(config.textSuperStrokeWidth * 0.6, config.textSuperStrokeColor),
            color: 'transparent',
            padding: bgStyle.padding,
            display: isJustify ? 'block' : 'inline-block',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: -1,
            pointerEvents: 'none',
            userSelect: 'none',
        };

        return (
            <div className="preview-rich-text" style={{
                position: 'relative',
                width: isJustify ? '100%' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
                gap: config.textBoxStyle === 'highlight' ? '-0.1em' : '4px'
            }}>
                <style>{`
                    .preview-rich-text b, .preview-rich-text .extra-bold {
                        text-transform: uppercase !important;
                        font-weight: 900 !important;
                    }
                    .preview-rich-text u {
                        text-decoration: none !important;
                        position: relative;
                        background-color: color-mix(in srgb, ${config.textColor}, transparent 75%);
                        padding: 0 2px;
                        border-radius: 4px;
                    }
                `}</style>

                {config.textBoxStyle === 'block' ? (
                    /* UMA ÚNICA CAIXA PARA TUDO */
                    <div style={{ ...bgStyle, position: 'relative' }}>
                        {config.textSuperStrokeWidth > 0 && (
                            <div style={{ ...superStrokeStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                {config.textRuns ? (
                                    <div style={{ whiteSpace: 'pre-line' }}>
                                        {config.textRuns.map((run, ri) => (
                                            <span key={ri} className={run.weight === 'extraBold' ? 'extra-bold' : ''} style={run.color ? { color: run.color } : undefined}>
                                                {run.text}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    lines.map((line, idx) => (
                                        <div key={`s-${idx}`} dangerouslySetInnerHTML={{ __html: line }} />
                                    ))
                                )}
                            </div>
                        )}
                        {config.textRuns ? (
                            <div style={{ whiteSpace: 'pre-line' }}>
                                {config.textRuns.map((run, ri) => (
                                    <span key={ri} className={run.weight === 'extraBold' ? 'extra-bold' : ''} style={run.color ? { color: run.color, WebkitTextStrokeColor: config.textOutlineWidth > 0 ? run.color : undefined } : undefined}>
                                        {run.text}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            lines.map((line, idx) => (
                                <div key={idx} dangerouslySetInnerHTML={{ __html: line }} />
                            ))
                        )}
                    </div>
                ) : (
                    /* CAIXA POR LINHA (HIGHLIGHT) */
                    lines.map((line, idx) => {
                        const currentLineRuns = linesOfRuns ? linesOfRuns[idx] : null;

                        return (
                            <div key={idx} style={{ position: 'relative', width: isJustify ? '100%' : 'fit-content' }}>
                                {config.textSuperStrokeWidth > 0 && (
                                    <div style={superStrokeStyle}>
                                        {currentLineRuns ? (
                                            currentLineRuns.map((run, ri) => (
                                                <span key={ri} className={run.weight === 'extraBold' ? 'extra-bold' : ''} style={run.color ? { color: run.color, WebkitTextStrokeColor: config.textOutlineWidth > 0 ? run.color : undefined } : undefined}>
                                                    {run.text}
                                                </span>
                                            ))
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: line }} />
                                        )}
                                    </div>
                                )}
                                <div style={bgStyle}>
                                    {config.textGradientColors && config.boxGradientColors ? (
                                        <span style={{
                                            backgroundImage: `linear-gradient(to bottom, ${config.textGradientColors.join(', ')})`,
                                            WebkitBackgroundClip: 'text',
                                            backgroundClip: 'text',
                                            color: 'transparent'
                                        }}>
                                            {currentLineRuns ? (
                                                currentLineRuns.map((run, ri) => (
                                                    <span key={ri} className={run.weight === 'extraBold' ? 'extra-bold' : ''} style={run.color ? { color: run.color, WebkitTextStrokeColor: config.textOutlineWidth > 0 ? run.color : undefined } : undefined}>
                                                        {run.text}
                                                    </span>
                                                ))
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: line }} />
                                            )}
                                        </span>
                                    ) : (
                                        <>
                                            {currentLineRuns ? (
                                                currentLineRuns.map((run, ri) => (
                                                    <span key={ri} className={run.weight === 'extraBold' ? 'extra-bold' : ''} style={run.color ? { color: run.color, WebkitTextStrokeColor: config.textOutlineWidth > 0 ? run.color : undefined } : undefined}>
                                                        {run.text}
                                                    </span>
                                                ))
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: line }} />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };


    return (
        <div className="flex flex-col h-full bg-dark-carbon text-text-primary relative animate-fade-up">
            {/* ... (Header) */}
            <header className="flex items-center justify-between p-4 bg-dark-graphite border-b border-dark-steel z-20">
                <button onClick={onBack} className="p-2 text-text-secondary hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="bg-neon-pulse hover:bg-neon-mint text-dark-carbon px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,255,114,0.3)]"
                >
                    {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {t.export}
                </button>
            </header>

            {/* ... (Main Content, Tools, Modals - Unchanged logic, just re-rendering) */}
            <div className="flex-1 bg-dark-carbon flex items-center justify-center relative overflow-hidden">
                <div className="relative shadow-2xl overflow-hidden"
                    style={{
                        width: '90%',
                        aspectRatio: `${previewRatio}`, // ✅ Agora a caixa adapta-se ao formato!

                        maxWidth: '400px',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat'
                    }}>

                    <div className="absolute inset-0 z-0">
                        {getCurrentTemplate().backgroundType === 'image' ? (
                            <img
                                src={previewUrl || getCurrentTemplate().value}
                                className="w-full h-full object-cover transition-all duration-500"
                                style={{
                                    filter: config.brightness ? `brightness(${config.brightness / 128})` : 'none'
                                }}
                                alt="bg"
                            />
                        ) : getCurrentTemplate().backgroundType === 'gradient' ? (
                            <div className="w-full h-full" style={{ background: getCurrentTemplate().value }}>
                                {previewUrl && <img src={previewUrl} className="w-full h-full object-cover absolute inset-0" style={{ filter: config.brightness ? `brightness(${config.brightness / 128})` : 'none' }} alt="preview" />}
                            </div>
                        ) : (
                            <div className="w-full h-full" style={{ backgroundColor: getCurrentTemplate().value }}>
                                {previewUrl && <img src={previewUrl} className="w-full h-full object-cover absolute inset-0" style={{ filter: config.brightness ? `brightness(${config.brightness / 128})` : 'none' }} alt="preview" />}
                            </div>
                        )}
                        {!previewUrl && getCurrentTemplate().backgroundType === 'image' && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${getCurrentTemplate().overlayOpacity || 0})` }}></div>}

                        {/* Noise Overlay from Smart Data */}
                        {config.noise && config.noise > 0 && (
                            <div className="absolute inset-0 z-[4] pointer-events-none opacity-40 mix-blend-overlay"
                                style={{
                                    opacity: config.noise / 255,
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                }}
                            />
                        )}

                        {renderTextureOverlay()}
                    </div>


                    {previewUrl ? (
                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" alt="preview" />
                    ) : (
                        <div className="absolute inset-0 z-0"></div>
                    )}

                    <div
                        className="absolute inset-0 z-10 flex p-8 cursor-text group hover:bg-black/5 transition-colors"
                        onClick={() => setIsEditingText(true)}
                        style={{
                            alignItems: config.verticalAlign === 'top' ? 'flex-start' : config.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                            <Edit2 className="w-4 h-4" />
                        </div>
                        {renderTextWithBackground()}
                    </div>

                    {!isPremium && (
                        <div className="absolute bottom-3 right-3 pointer-events-none z-20 opacity-30">
                            <span className="text-white font-black text-xs tracking-wider shadow-black drop-shadow-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                                SuperQuote
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-dark-graphite border-t border-dark-steel flex flex-col z-20">
                {/* Tools Area */}
                <div className="h-32 p-3 overflow-hidden border-b border-dark-steel flex flex-col justify-center">
                    {activeTool === 'font' && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar h-full items-center">
                            {FONTS_LIST.map((font) => (
                                <button
                                    key={font.name}
                                    onClick={() => {
                                        if (font.type === 'Pro' && !isPremium) {
                                            setShowPremiumModal(true);
                                        } else {
                                            setConfig({ ...config, fontFamily: font.font });
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex flex-col items-center gap-0.5 border transition-all ${config.fontFamily === font.font ? 'bg-neon-pulse border-neon-pulse text-dark-carbon' : 'bg-dark-steel border-dark-steel text-text-secondary hover:bg-dark-steel/80'}`}
                                >
                                    <span style={{ fontFamily: font.font }} className="text-base">{font.name.split(' ')[0]}</span>
                                    <span className="text-[9px] uppercase opacity-60 tracking-wider flex items-center gap-1">
                                        {font.type === 'Pro' && <Crown className="w-2.5 h-2.5 text-neon-pulse fill-neon-pulse" />}
                                        {font.type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTool === 'size' && (
                        <div className="flex items-center gap-3 px-2 h-full">
                            <button onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 2) }))} className="p-2 bg-dark-steel rounded-full hover:bg-dark-steel/80"><Minus className="w-4 h-4" /></button>
                            <input
                                type="range" min="10" max="100"
                                value={config.fontSize}
                                onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                                className="flex-1 accent-neon-pulse h-2 bg-dark-steel rounded-lg appearance-none cursor-pointer"
                            />
                            <button onClick={() => setConfig(prev => ({ ...prev, fontSize: Math.min(100, prev.fontSize + 2) }))} className="p-2 bg-dark-steel rounded-full hover:bg-dark-steel/80"><Plus className="w-4 h-4" /></button>
                            <span className="text-lg font-bold w-10 text-center text-text-primary">{config.fontSize}</span>
                        </div>
                    )}

                    {activeTool === 'color' && (
                        <div className="space-y-2 h-full flex flex-col justify-center">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <input
                                    type="color"
                                    value={config.textColor}
                                    onChange={(e) => setConfig({ ...config, textColor: e.target.value, textGradientColors: undefined })}
                                    className="w-9 h-9 rounded-full border-0 p-0 overflow-hidden cursor-pointer flex-shrink-0"
                                />
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setConfig({ ...config, textColor: color, textGradientColors: undefined })}
                                        className={`w-9 h-9 rounded-full flex-shrink-0 border-2 ${config.textColor === color ? 'border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'styles' && (
                        <div className="flex flex-col gap-1 h-full justify-center">
                            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar px-1 items-center">
                                {/* Smart Cycle Button */}
                                <button
                                    onClick={() => {
                                        const template = getCurrentTemplate();
                                        const nextIndex = (smartPresetIndex + 1) % 3;
                                        setSmartPresetIndex(nextIndex);
                                        applySmartSuggestion(template, nextIndex);
                                    }}
                                    className="flex flex-col items-center gap-1 group flex-shrink-0 mr-2"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-neon-pulse to-neon-mint rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                        <Sparkles className="w-8 h-8 text-dark-carbon" />
                                    </div>
                                    <span className="text-[9px] text-neon-pulse font-black uppercase tracking-tighter">{(t as any).smartSuggestion} {smartPresetIndex + 1}</span>
                                </button>

                                <div className="w-[1px] h-10 bg-dark-steel mr-1" />

                                {PRESET_STYLES.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className="flex flex-col items-center gap-1 group flex-shrink-0"
                                    >
                                        <StyleThumbnail preset={preset} />
                                        <span className="text-[9px] text-text-dim group-hover:text-white font-medium">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    {activeTool === 'effects' && (
                        <div className="grid grid-cols-2 gap-4 h-full relative items-center px-1">
                            <div className="relative">
                                <div className={`space-y-1 ${!isPremium ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
                                    <div className="flex justify-between text-[10px] text-text-dim">
                                        <span>Outline</span>
                                        <span>{config.textOutlineWidth}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="10" step="0.5"
                                        value={config.textOutlineWidth}
                                        onChange={(e) => setConfig({ ...config, textOutlineWidth: Number(e.target.value) })}
                                        className="w-full accent-neon-pulse bg-dark-steel h-1 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                        <input
                                            type="color"
                                            value={config.textOutlineColor}
                                            onChange={(e) => setConfig({ ...config, textOutlineColor: e.target.value })}
                                            className="w-5 h-5 rounded-full border-0 p-0 overflow-hidden cursor-pointer flex-shrink-0"
                                        />
                                        <div className="w-5 h-5 rounded-full border-0 bg-white flex-shrink-0" />

                                        {COLORS.slice(0, 3).map(c => (
                                            <button key={c} onClick={() => setConfig({ ...config, textOutlineColor: c })} className="w-5 h-5 flex-shrink-0 rounded-full border-2" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                                {!isPremium && (
                                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setShowPremiumModal(true)}>
                                        <div className="bg-dark-graphite/90 p-1.5 rounded-full border border-neon-pulse/50 shadow-lg group hover:scale-110 transition-transform">
                                            <Crown className="w-4 h-4 text-neon-pulse fill-neon-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-text-dim">
                                    <span>Shadow</span>
                                    <span>{Math.round(config.textShadowOpacity * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={config.textShadowOpacity}
                                    onChange={(e) => setConfig({ ...config, textShadowOpacity: Number(e.target.value) })}
                                    className="w-full accent-neon-pulse bg-dark-steel h-1 rounded-lg cursor-pointer"
                                />
                                <div className="flex gap-1 mt-1">
                                    {['#000', '#555', '#330000', '#003300', '#000033'].map(c => (
                                        <button key={c} onClick={() => setConfig({ ...config, textShadowColor: c })} className="w-5 h-5 rounded-full" style={{ backgroundColor: c, borderWidth: config.textShadowColor === c ? 2 : 0, borderColor: 'white' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTool === 'stroke' && (
                        <div className="space-y-2 h-full flex flex-col justify-center px-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-text-dim">Super Stroke Width</span>
                                <span className="text-[10px] text-text-dim">{config.textSuperStrokeWidth}</span>
                            </div>
                            <input
                                type="range" min="0" max="40" step="1"
                                value={config.textSuperStrokeWidth}
                                onChange={(e) => setConfig({ ...config, textSuperStrokeWidth: Number(e.target.value) })}
                                className="w-full accent-neon-pulse bg-dark-steel h-1.5 rounded-lg"
                            />
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                <input type="color" value={config.textSuperStrokeColor} onChange={(e) => setConfig({ ...config, textSuperStrokeColor: e.target.value })} className="w-7 h-7 rounded-full border-0 p-0 overflow-hidden cursor-pointer flex-shrink-0" />
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setConfig({ ...config, textSuperStrokeColor: c })} className={`w-7 h-7 rounded-full flex-shrink-0 border-2 ${config.textSuperStrokeColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'glow' && (
                        <div className="space-y-2 h-full flex flex-col justify-center px-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-text-dim">Glow Intensity</span>
                                <span className="text-[10px] text-text-dim">{config.textGlowWidth}</span>
                            </div>
                            <input
                                type="range" min="0" max="50" step="1"
                                value={config.textGlowWidth}
                                onChange={(e) => setConfig({ ...config, textGlowWidth: Number(e.target.value) })}
                                className="w-full accent-yellow-400 bg-dark-steel h-1.5 rounded-lg"
                            />
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                <input type="color" value={config.textGlowColor} onChange={(e) => setConfig({ ...config, textGlowColor: e.target.value })} className="w-7 h-7 rounded-full border-0 p-0 overflow-hidden cursor-pointer flex-shrink-0" />
                                {['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'].map(c => (
                                    <button key={c} onClick={() => setConfig({ ...config, textGlowColor: c })} className={`w-7 h-7 rounded-full border-2 ${config.textGlowColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === '3d' && (
                        <div className="space-y-3 h-full flex flex-col justify-center px-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-text-dim block mb-1">Offset X</label>
                                    <input type="range" min="-20" max="20" value={config.text3DOffsetX} onChange={(e) => setConfig({ ...config, text3DOffsetX: Number(e.target.value) })} className="w-full accent-neon-pulse h-1 bg-dark-steel" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-dim block mb-1">Offset Y</label>
                                    <input type="range" min="-20" max="20" value={config.text3DOffsetY} onChange={(e) => setConfig({ ...config, text3DOffsetY: Number(e.target.value) })} className="w-full accent-neon-pulse h-1 bg-dark-steel" />
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] text-text-dim">Color:</span>
                                <input type="color" value={config.text3DColor} onChange={(e) => setConfig({ ...config, text3DColor: e.target.value })} className="w-6 h-6 rounded border-0 p-0" />
                            </div>
                        </div>
                    )}

                    {activeTool === 'align' && (
                        <div className="flex flex-col gap-3 h-full px-2 justify-center">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Horizontal</span>
                                <div className="flex bg-dark-steel rounded-lg p-0.5">
                                    {['left', 'center', 'right', 'justify'].map((align) => (
                                        <button key={align} onClick={() => setConfig({ ...config, textAlign: align as any })} className={`flex-1 p-1.5 rounded-md flex justify-center ${config.textAlign === align ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim hover:text-white'}`}>
                                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                                            {align === 'justify' && <AlignJustify className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider block mb-0.5">Vertical</span>
                                <div className="flex bg-dark-steel rounded-lg p-0.5">
                                    <button onClick={() => setConfig({ ...config, verticalAlign: 'top' })} className={`flex-1 p-1.5 rounded-md flex justify-center ${config.verticalAlign === 'top' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim hover:text-white'}`}>
                                        <ArrowUpToLine className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setConfig({ ...config, verticalAlign: 'center' })} className={`flex-1 p-1.5 rounded-md flex justify-center ${config.verticalAlign === 'center' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim hover:text-white'}`}>
                                        <MoveVertical className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setConfig({ ...config, verticalAlign: 'bottom' })} className={`flex-1 p-1.5 rounded-md flex justify-center ${config.verticalAlign === 'bottom' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim hover:text-white'}`}>
                                        <ArrowDownToLine className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTool === 'box' && (
                        <div className="space-y-2 h-full flex flex-col justify-center px-2">
                            <div className="flex gap-4">
                                <button onClick={() => setConfig({ ...config, textBoxStyle: 'block' })} className={`flex-1 py-0.5 text-[10px] rounded border ${config.textBoxStyle === 'block' ? 'bg-neon-pulse border-neon-pulse text-dark-carbon' : 'bg-dark-steel border-dark-steel text-text-secondary'}`}>Box</button>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-text-dim flex justify-between"><span>Opacity</span> <span>{Math.round(config.textBackgroundOpacity * 100)}%</span></label>
                                <input type="range" min="0" max="1" step="0.05" value={config.textBackgroundOpacity} onChange={(e) => setConfig({ ...config, textBackgroundOpacity: Number(e.target.value) })} className="w-full accent-neon-pulse h-1 bg-dark-steel rounded-lg h-3" />
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-8 no-scrollbar">
                                <input type="color" value={config.textBackgroundColor} onChange={(e) => setConfig({ ...config, textBackgroundColor: e.target.value })} className="w-7 h-7 rounded-full border-0 p-0 overflow-hidden cursor-pointer flex-shrink-0" />
                                {['#ffffff', '#000000', '#f1f5f9', '#1e293b'].map(c => (
                                    <button key={c} onClick={() => setConfig({ ...config, textBackgroundColor: c })} className={`w-7 h-7 rounded-full border-2 ${config.textBackgroundColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'format' && (
                        <div className="grid grid-cols-2 gap-4 h-full relative items-center px-1">
                            <div className="space-y-1 relative">
                                <div className={`${!isPremium ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
                                    <span className="text-[10px] text-text-dim">Line Height</span>
                                    <input type="range" min="0.8" max="2.5" step="0.1" value={config.lineHeight} onChange={(e) => setConfig({ ...config, lineHeight: Number(e.target.value) })} className="w-full accent-neon-pulse h-1 bg-dark-steel cursor-pointer" />
                                </div>
                                {!isPremium && (
                                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-10" onClick={() => setShowPremiumModal(true)}>
                                        <div className="bg-dark-graphite/90 p-1.5 rounded-full border border-neon-pulse/50 shadow-lg">
                                            <Crown className="w-3 h-3 text-neon-pulse fill-neon-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-text-dim">Spacing</span>
                                <input type="range" min="-2" max="10" step="0.5" value={config.letterSpacing} onChange={(e) => setConfig({ ...config, letterSpacing: Number(e.target.value) })} className="w-full accent-neon-pulse h-1 bg-dark-steel cursor-pointer" />
                            </div>

                            <div className="col-span-2 relative">
                                <div className={`flex justify-between bg-dark-steel p-0.5 rounded-lg ${!isPremium ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
                                    <button onClick={() => setConfig({ ...config, textTransform: 'none' })} className={`flex-1 py-1 text-[10px] rounded ${config.textTransform === 'none' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim'}`}>Normal</button>
                                    <button onClick={() => setConfig({ ...config, textTransform: 'uppercase' })} className={`flex-1 py-1 text-[10px] rounded ${config.textTransform === 'uppercase' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim'}`}>AA</button>
                                    <button onClick={() => setConfig({ ...config, textTransform: 'lowercase' })} className={`flex-1 py-1 text-[10px] rounded ${config.textTransform === 'lowercase' ? 'bg-dark-carbon text-neon-pulse' : 'text-text-dim'}`}>aa</button>
                                </div>
                                {!isPremium && (
                                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-10" onClick={() => setShowPremiumModal(true)}>
                                        <div className="bg-dark-graphite/90 p-1.5 rounded-full border border-neon-pulse/50 shadow-lg">
                                            <Crown className="w-3 h-3 text-neon-pulse fill-neon-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTool === 'textures' && (
                        <div className="space-y-2 h-full flex flex-col justify-center px-1">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                                {[
                                    { id: 'none', label: 'None', icon: <X className="w-4 h-4" /> },
                                    { id: 'grain', label: 'Grain', icon: <Sparkles className="w-4 h-4" /> },
                                    { id: 'paper', label: 'Paper', icon: <Box className="w-4 h-4" /> },
                                    { id: 'leak', label: 'Leak', icon: <Zap className="w-4 h-4" /> },
                                    { id: 'dust', label: 'Dust', icon: <Layout className="w-4 h-4" /> }
                                ].map((tex) => (
                                    <button
                                        key={tex.id}
                                        onClick={() => setConfig({ ...config, textureType: tex.id as any })}
                                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex flex-col items-center gap-1 border transition-all ${config.textureType === tex.id ? 'bg-neon-pulse border-neon-pulse text-dark-carbon' : 'bg-dark-steel border-dark-steel text-text-secondary hover:bg-dark-steel/80'}`}
                                    >
                                        {tex.icon}
                                        <span className="text-[10px] font-bold">{tex.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-[9px] text-text-dim w-10">Opacity</span>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={config.textureOpacity || 0.5}
                                    onChange={(e) => setConfig({ ...config, textureOpacity: Number(e.target.value) })}
                                    className="flex-1 accent-neon-pulse h-1 bg-dark-steel rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-text-primary">{Math.round((config.textureOpacity || 0.5) * 100)}%</span>
                            </div>
                        </div>
                    )}
                    {activeTool === 'magic' && (
                        <div className="flex h-full w-full items-center overflow-hidden">
                            {/* Sub-Nav */}
                            <div className="flex flex-col border-r border-white/5 py-1 px-1.5 gap-1.5 justify-center h-full min-w-[75px] bg-dark-carbon/20">
                                <button
                                    onClick={() => setMagicSubTab('layout')}
                                    className={`flex flex-col items-center py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all ${magicSubTab === 'layout' ? 'bg-neon-pulse text-dark-carbon' : 'text-text-dim hover:text-white'}`}
                                >
                                    <Layout className="w-3.5 h-3.5 mb-1" />
                                    Layout
                                </button>
                                <button onClick={() => setMagicSubTab('highlights')} className={`py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${magicSubTab === 'highlights' ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'text-text-dim hover:text-white/60'}`}>
                                    <Zap className="w-3.5 h-3.5" />
                                    Keyword
                                </button>
                            </div>

                            <div className="flex-1 h-full flex flex-col justify-center px-3 py-1">
                                {magicSubTab === 'layout' ? (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider opacity-60">{(t as any).lineDirection}</span>
                                        <div className="flex gap-2">
                                            {(['balanced', 'compact', 'impact'] as const).map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => handleRebuildPlan(undefined, mode)}
                                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex-1 ${config.breakMode === mode ? 'bg-neon-pulse border-neon-pulse text-dark-carbon' : 'bg-dark-steel border-dark-steel text-text-secondary'}`}
                                                >
                                                    {(t as any)[`layout${mode.charAt(0).toUpperCase() + mode.slice(1)}`]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 h-full justify-center">
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 bg-dark-steel/30 px-2 py-1.5 rounded-lg border border-white/5 flex-grow overflow-hidden">
                                                <input type="color" value={config.textRuns?.find(r => r.weight === 'extraBold')?.color || config.textColor} onChange={(e) => changeExtraBoldColor(e.target.value)} className="w-5 h-5 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
                                                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                    {palette.slice(0, 3).map(c => (
                                                        <button key={c} onClick={() => changeExtraBoldColor(c)} className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={clearExtraBold} className={`px-3 py-2 rounded-lg text-[9px] font-bold border transition-all ${config.disableSmartHighlights ? 'bg-neon-pulse/20 border-neon-pulse/50 text-neon-pulse' : 'bg-dark-steel border-dark-steel text-text-dim'}`}>
                                                {config.disableSmartHighlights ? (t as any).manual : (t as any).auto}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1 overflow-y-auto no-scrollbar max-h-[38px] pb-1">
                                            {(() => {
                                                const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, '');
                                                const currentHighlights = config.highlights || [];
                                                const activeColor = config.textRuns?.find(r => r.weight === 'extraBold')?.color || '#f700ff';

                                                const isDark = (color: string) => {
                                                    const c = color.startsWith('#') ? color.substring(1) : color;
                                                    if (c.length !== 6) return true;
                                                    const rgb = parseInt(c, 16);
                                                    const r = (rgb >> 16) & 0xff;
                                                    const g = (rgb >> 8) & 0xff;
                                                    const b = (rgb >> 0) & 0xff;
                                                    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                                                    return luma < 128;
                                                };

                                                return config.text.replace(/\n/g, ' ').split(/\s+/).filter(w => w.length >= 2).map((word, i) => {
                                                    const isHighlighted = currentHighlights.some(h => norm(h) === norm(word));
                                                    return (
                                                        <button
                                                            key={`${word}-${i}`}
                                                            onClick={() => toggleHighlight(word)}
                                                            className={`px-2 py-0.5 rounded text-[9px] transition-all border ${isHighlighted
                                                                ? 'border-transparent font-bold'
                                                                : 'bg-dark-steel/40 border-dark-steel/50 text-text-dim'
                                                                }`}
                                                            style={isHighlighted ? {
                                                                backgroundColor: activeColor,
                                                                color: isDark(activeColor) ? '#ffffff' : '#000000'
                                                            } : {}}
                                                        >
                                                            {word.replace(/[^\p{L}\p{N}]+$/gu, '')}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex overflow-x-auto no-scrollbar py-3 px-2 gap-1 bg-dark-carbon">
                    {[
                        { id: 'templates', icon: Layout, label: t.toolTemplates },
                        { id: 'styles', icon: Sparkles, label: t.toolStyles },
                        { id: 'magic', icon: Zap, label: (t as any).toolMagic, isLocked: true },
                        { id: 'font', icon: Type, label: t.toolFont },
                        { id: 'size', icon: Plus, label: t.toolSize },
                        { id: 'stroke', icon: PenTool, label: t.toolStroke, isLocked: true },
                        { id: 'align', icon: AlignLeft, label: t.toolAlign },
                        { id: 'color', icon: Palette, label: t.toolColor },
                        { id: 'box', icon: Box, label: t.toolBox, isLocked: true },
                        { id: 'glow', icon: Lightbulb, label: t.toolGlow, isLocked: true },
                        { id: 'effects', icon: Layers, label: t.toolEffects },
                        { id: '3d', icon: Box, label: t.tool3D, isLocked: true },
                        { id: 'textures', icon: Aperture, label: t.toolTextures, isLocked: true },
                        { id: 'format', icon: AlignJustify, label: t.toolFormat },
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.id)}
                            className={`flex flex-col items-center justify-center min-w-[64px] h-14 rounded-lg transition-colors relative ${activeTool === tool.id ? 'text-neon-pulse bg-dark-steel' : 'text-text-dim hover:text-white'}`}
                        >
                            <tool.icon className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium">{tool.label}</span>
                            {tool.isLocked && !isPremium && (
                                <div className="absolute top-1 right-1 bg-neon-pulse rounded-full p-[2px] shadow-sm">
                                    <Crown className="w-2 h-2 text-dark-carbon fill-dark-carbon" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ... (Export, Template, Preview Modals - Unchanged) */}
            {
                showExportMenu && (
                    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full bg-dark-graphite rounded-t-3xl p-6 text-white pb-10 shadow-2xl border-t border-dark-steel">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{t.export}</h2>
                                <button onClick={() => setShowExportMenu(false)} className="p-2 bg-dark-steel rounded-full hover:bg-dark-steel/80">
                                    <X className="w-5 h-5 text-text-secondary" />
                                </button>
                            </div>

                            <div className="mb-6 flex gap-2 p-1 bg-dark-steel/50 rounded-xl">
                                <button
                                    onClick={() => setExportQuality('standard')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${exportQuality === 'standard' ? 'bg-dark-carbon text-white shadow-md' : 'text-text-dim hover:text-white'}`}
                                >
                                    <Zap className="w-4 h-4" /> {t.exportStandard}
                                </button>
                                <button
                                    onClick={toggleQuality}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${exportQuality === 'hd' ? 'bg-neon-pulse text-dark-carbon shadow-md' : 'text-text-dim hover:text-white'}`}
                                >
                                    <Crown className={`w-4 h-4 ${exportQuality === 'hd' ? 'fill-dark-carbon' : 'text-neon-pulse'}`} /> {t.exportHD}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">{t.saveGallery}</p>

                                    <button
                                        onClick={() => handleSaveFile('square')}
                                        className="w-full flex items-center justify-between p-4 bg-dark-steel hover:bg-dark-steel/80 rounded-xl transition-colors group border border-transparent hover:border-neon-mint/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-neon-pulse/20 p-2 rounded-full text-neon-pulse shadow-sm">
                                                <Download className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-white">Square (1:1)</p>
                                                <p className="text-xs text-text-secondary">
                                                    {exportQuality === 'hd' ? '2048 x 2048 px' : '1080 x 1080 px'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-neon-pulse">⬇️</span>
                                    </button>

                                    <button
                                        onClick={() => handleSaveFile('story')}
                                        className="w-full flex items-center justify-between p-4 bg-dark-steel hover:bg-dark-steel/80 rounded-xl transition-colors group border border-transparent hover:border-neon-mint/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-neon-pulse/20 p-2 rounded-full text-neon-pulse shadow-sm">
                                                <Download className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-white">Story (9:16)</p>
                                                <p className="text-xs text-text-secondary">
                                                    {exportQuality === 'hd' ? '2160 x 3840 px' : '1080 x 1920 px'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-neon-pulse">⬇️</span>
                                    </button>
                                </div>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-dark-steel"></div>
                                    <span className="flex-shrink-0 mx-4 text-text-dim text-xs font-bold uppercase">{t.shareTo}</span>
                                    <div className="flex-grow border-t border-dark-steel"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSocialPreview('story')}
                                        className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-pink-500/20 hover:border-pink-500/50 transition-all active:scale-95"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg text-white flex items-center justify-center mb-2 shadow-sm">
                                            <Instagram className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-200">Instagram</span>
                                        <span className="text-[10px] text-gray-400">
                                            {exportQuality === 'hd' ? '2160x3840 px' : '1080x1920 px'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => handleSocialPreview('story')}
                                        className="flex flex-col items-center justify-center p-4 bg-dark-steel/50 hover:bg-dark-steel rounded-xl border border-dark-steel hover:border-gray-500 transition-all active:scale-95"
                                    >
                                        <div className="w-10 h-10 bg-black rounded-lg text-white flex items-center justify-center mb-2 shadow-sm border border-gray-700">
                                            <Music className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-200">TikTok</span>
                                        <span className="text-[10px] text-gray-400">
                                            {exportQuality === 'hd' ? '2160x3840 px' : '1080x1920 px'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => handleSocialPreview('square')}
                                        className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all active:scale-95"
                                    >
                                        <div className="w-10 h-10 bg-green-500 rounded-lg text-white flex items-center justify-center mb-2 shadow-sm">
                                            <Share2 className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-200">WhatsApp</span>
                                        <span className="text-[10px] text-gray-400">
                                            {exportQuality === 'hd' ? '2048x2048 px' : '1080x1080 px'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => handleSocialPreview('square')}
                                        className="flex flex-col items-center justify-center p-4 bg-blue-900/20 hover:bg-blue-900/30 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all active:scale-95"
                                    >
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg text-white flex items-center justify-center mb-2 shadow-sm">
                                            <Facebook className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-200">Facebook</span>
                                        <span className="text-[10px] text-gray-400">
                                            {exportQuality === 'hd' ? '2048x2048 px' : '1080x1080 px'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showTemplateModal && (
                    <div className="absolute inset-0 z-50 bg-dark-carbon flex flex-col animate-fade-up">
                        <div className="flex items-center justify-between p-4 border-b border-dark-steel bg-dark-graphite">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Layout className="w-5 h-5 text-neon-pulse" />
                                {t.chooseTemplate}
                            </h2>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="p-2 bg-dark-steel rounded-full hover:bg-dark-steel/80 transition-colors"
                            >
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-dark-steel bg-dark-carbon/50 backdrop-blur-sm">
                                <div ref={categoryScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            data-category={cat}
                                            onClick={() => setTemplateCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${templateCategory === cat ? 'bg-neon-pulse text-dark-carbon' : 'bg-dark-steel text-text-dim hover:text-neon-pulse'}`}
                                        >
                                            {translateCategory(cat, language)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {templateCategory === 'All' && (
                                        <button
                                            onClick={handleUploadClick}
                                            className="relative w-full h-40 sm:h-44 md:h-48 rounded-xl bg-dark-steel/50 flex flex-col items-center justify-center border-2 border-dashed border-text-dim hover:border-neon-pulse transition-all gap-2 group"
                                        >
                                            <div className="bg-dark-steel p-3 rounded-full group-hover:bg-neon-pulse/20 transition-colors">
                                                <Upload className="w-6 h-6 text-text-dim group-hover:text-neon-pulse" />
                                            </div>
                                            <span className="text-xs text-text-dim group-hover:text-white uppercase font-bold tracking-wide">
                                                {t.uploadImage}
                                            </span>
                                            {!isPremium && (
                                                <div className="absolute top-2 right-2 bg-neon-pulse rounded-full p-1 shadow-sm">
                                                    <Crown className="w-3 h-3 text-dark-carbon fill-dark-carbon" />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                        </button>
                                    )}

                                    {filteredTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={async () => {
                                                if ((template as any).isPremium === true && !isPremium) {
                                                    // Verifica se já está desbloqueado hoje
                                                    if (dailyUnlockService.isTemplateUnlocked(template.id)) {
                                                        handleTemplateSelect(template);
                                                        return;
                                                    }

                                                    // Mostra modal premium (com botão de rewarded ad se disponível)
                                                    setRewardedModalType('template');
                                                    setRewardedTargetId(template.id);
                                                    setShowPremiumModal(true);
                                                    return;
                                                }

                                                handleTemplateSelect(template);
                                            }}
                                            className={`relative w-full h-40 sm:h-44 md:h-48 rounded-xl overflow-hidden border-2 transition-all group ${config.templateId === template.id
                                                ? 'border-neon-pulse shadow-[0_0_15px_rgba(0,255,114,0.3)]'
                                                : 'border-transparent hover:border-neon-pulse/50'
                                                }`}
                                        >
                                            {template.backgroundType === 'image' ? (
                                                <img
                                                    src={template.value}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt={template.name}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    style={{ background: template.value }}
                                                />
                                            )}

                                            {(template as any).isPremium === true && (
                                                <div className="absolute top-2 left-2 bg-neon-pulse text-dark-carbon text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                                    <Crown className="w-3 h-3 fill-dark-carbon" />
                                                    PRO
                                                </div>
                                            )}

                                            {/* Check de selecionado */}

                                            {config.templateId === template.id && (
                                                <div className="absolute top-2 right-2 bg-neon-pulse rounded-full p-1">
                                                    <Check className="w-3 h-3 text-dark-carbon" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showPreviewDialog && exportPreviewUrl && (
                    <div className="absolute inset-0 z-[60] bg-dark-carbon flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-full flex justify-between items-center p-6 absolute top-0 left-0 bg-gradient-to-b from-black/80 to-transparent z-10">
                            <button onClick={() => setShowPreviewDialog(false)} className="text-white/80 hover:text-white flex items-center gap-1">
                                <ArrowLeft className="w-5 h-5" /> Edit
                            </button>
                            <span className="font-bold text-white tracking-widest text-sm uppercase opacity-90">{t.preview}</span>
                            <button
                                onClick={() => setPreviewFitMode(prev => prev === 'cover' ? 'contain' : 'cover')}
                                className="text-white/80 hover:text-white flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10"
                            >
                                {previewFitMode === 'cover' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                <span className="text-xs font-medium">{previewFitMode === 'cover' ? 'Fit' : 'Fill'}</span>
                            </button>
                        </div>

                        <div className="relative w-full h-full flex items-center justify-center p-8">
                            <div className={`relative bg-gray-800 rounded-[2rem] border-4 border-gray-700 shadow-2xl overflow-hidden ${selectedShareFormat === 'story' ? 'aspect-[9/16] h-[75%]' : 'aspect-square w-[90%]'}`}>
                                {/* Container com position relative */}
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                                    {/* CAMADA 1: FUNDO (Imagem com Zoom/Pan) */}
                                    <TransformWrapper
                                        initialScale={1}
                                        minScale={0.5}
                                        maxScale={5}
                                        centerOnInit={true}
                                        limitToBounds={false}
                                        panning={{ disabled: false }}
                                        pinch={{ disabled: false }}
                                        doubleClick={{ disabled: false }}
                                    >
                                        <TransformComponent
                                            wrapperStyle={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                            contentStyle={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {getCurrentTemplate().backgroundType === 'image' || customImage ? (
                                                <img
                                                    src={customImage || getCurrentTemplate().value}
                                                    alt="Preview"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: previewFitMode,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        backgroundColor: getCurrentTemplate().value
                                                    }}
                                                />
                                            )}
                                        </TransformComponent>
                                    </TransformWrapper>

                                    {/* CAMADA 2: OVERLAY (Tint) */}
                                    <div
                                        className="absolute inset-0 bg-black pointer-events-none"
                                        style={{ opacity: getCurrentTemplate().overlayOpacity || 0 }}
                                    />

                                    {/* CAMADA 3: TEXTO (Fixo) */}
                                    <div
                                        className="absolute inset-0 flex justify-center pointer-events-none z-10 p-8"
                                        style={{
                                            alignItems: config.verticalAlign === 'top' ? 'flex-start' :
                                                config.verticalAlign === 'bottom' ? 'flex-end' : 'center'
                                        }}
                                    >
                                        {renderTextWithBackground()}
                                    </div>

                                    {/* CAMADA 4: UI DECORATIVA (Notch/Label) */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                        zIndex: 20
                                    }}>
                                        {/* Notch do telemóvel */}
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-black/50 rounded-full"></div>

                                        {/* Label "Your Story" para formato story */}
                                        {selectedShareFormat === 'story' && (
                                            <div className="absolute top-6 left-4 text-[10px] text-white/70 font-mono">Your Story</div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="w-full p-6 bg-dark-graphite border-t border-dark-steel">
                            <button
                                onClick={executeShare}
                                className="w-full bg-neon-pulse text-dark-carbon font-bold py-4 rounded-full text-lg shadow-[0_0_20px_rgba(0,255,114,0.4)] hover:bg-neon-mint transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-5 h-5" /> {t.shareNow}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                isEditingText && (
                    <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-dark-graphite rounded-2xl p-6 shadow-2xl border border-dark-steel">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">{t.editText}</h3>
                                <button onClick={() => setIsEditingText(false)} className="p-1 bg-dark-steel rounded-full">
                                    <X className="w-4 h-4 text-text-dim" />
                                </button>
                            </div>
                            <textarea
                                autoFocus
                                value={config.text}
                                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                                className="w-full bg-dark-carbon text-white p-4 rounded-xl border border-dark-steel focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse outline-none min-h-[150px] text-lg resize-none mb-4"
                                placeholder={t.writePhrase}
                            />
                            <button
                                onClick={() => {
                                    handleRebuildPlan();
                                    setIsEditingText(false);
                                }}
                                className="w-full bg-neon-pulse text-dark-carbon font-bold py-3 rounded-xl hover:bg-neon-mint transition-colors shadow-lg shadow-neon-pulse/20"
                            >
                                {t.done}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                showSaveSuccess && (
                    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-dark-graphite border-2 border-dark-steel rounded-2xl shadow-2xl px-8 py-6 max-w-sm mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-neon-pulse/20 flex items-center justify-center">
                                    <Check className="w-7 h-7 text-neon-pulse" strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-bold text-neon-pulse drop-shadow-[0_0_10px_rgba(0,255,114,0.5)]">
                                    {t.savedSuccess}
                                </h3>
                            </div>
                            <p className="text-text-secondary text-sm pl-16">
                                {t.savedDescription}
                            </p>
                        </div>
                    </div>
                )
            }

            {
                showPremiumModal && (
                    <PremiumModal
                        onClose={() => setShowPremiumModal(false)}
                        onUnlock={handleUnlock}
                        language={language}
                        showRewardedButton={
                            rewardedModalType === 'template'
                                ? dailyUnlockService.canUnlockTemplate()
                                : dailyUnlockService.canUnlockPreset()
                        }
                        onWatchAd={handleOpenRewardedModal}
                    />
                )
            }

            {
                showRewardedModal && (
                    <RewardedAdModal
                        isOpen={showRewardedModal}
                        onClose={() => setShowRewardedModal(false)}
                        onWatchAd={handleWatchRewardedAd}
                        type={rewardedModalType}
                        language={language}
                    />
                )
            }

            {
                showSubscriptionModal && (
                    <SubscriptionModal
                        isOpen={showSubscriptionModal}
                        onClose={() => setShowSubscriptionModal(false)}
                        onPurchase={handlePurchase}
                        onRestore={handleRestorePurchases}
                        language={language}
                    />
                )
            }
        </div>
    );
};
