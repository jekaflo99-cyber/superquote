export type LanguageCode = 'pt-BR' | 'pt-PT' | 'en' | 'es';

export interface PhraseData {
  [language: string]: {
    [category: string]: string[];
  };
}

export interface Template {
  id: string;
  name: string;
  // Alterado de union type restrito para string para permitir 'Meus Templates', etc.
  category: 'Agradecimento' | 'Amor' | 'Aniversario' | 'BoaNoite' | 'BomDia' | 'Deus' | 'Diversos' | 'Gym' | 'Agradecimento' | 'Luto' | 'Mae' | 'Natal' | 'Neon' | 'Pai' | 'Paisagens' | 'Praia' | 'Reflexao' | 'Sabedoria' | 'Vida' | string;
  backgroundType: 'image' | 'gradient' | 'solid';
  value: string; // URL or CSS gradient string
  textColor: string;
  fontFamily: string;
  overlayOpacity?: number;
  isPremium?: boolean; // Nova propriedade para controlar acesso
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextVerticalAlign = 'top' | 'center' | 'bottom';
export type TextTransform = 'none' | 'uppercase' | 'lowercase';

export interface EditorConfig {
  text: string;
  templateId: string;
  fontSize: number;
  textAlign: TextAlign;
  verticalAlign: TextVerticalAlign;
  fontFamily: string;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;

  // Format Extras
  letterSpacing: number; // in pixels (approx)
  textTransform: TextTransform;

  // Background Box
  textBackgroundColor: string;
  textBackgroundOpacity: number;
  textBoxStyle: 'block' | 'highlight'; // 'block' (one big box) or 'highlight' (per line)
  boxGradientColors?: string[]; // If present, overrides textBackgroundColor

  lineHeight: number;

  // Text Gradient
  textGradientColors?: string[]; // If present, overrides textColor

  // Effects
  textShadow: boolean;
  textShadowOpacity: number; // 0 to 1
  textShadowColor: string; // New: Specific shadow color
  textShadowBlur: number; // New: Specific shadow blur

  textOutline: boolean;
  textOutlineWidth: number; // 0 to 10 scale
  textOutlineColor: string;

  // Glow
  textGlowWidth: number; // 0 to 20
  textGlowColor: string;

  // 3D / Shifted Text
  text3DOffsetX: number;
  text3DOffsetY: number;
  text3DColor: string;

  // Super Stroke
  textSuperStrokeWidth: number;
  textSuperStrokeColor: string;

  // Texture Overlays
  textureType?: 'none' | 'grain' | 'paper' | 'leak' | 'dust';
  textureOpacity?: number;
}

export type ScreenName = 'language' | 'categories' | 'phrases' | 'editor' | 'favorites';

export interface NavigationState {
  currentScreen: ScreenName;
  selectedLanguage: LanguageCode | null;
  selectedCategory: string | null;
  selectedPhrase: string | null;
}
