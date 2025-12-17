import { useState, useEffect } from 'react';
import type { Template } from '../types';

// Extend Template to ensure isPremium is recognized
interface TemplateWithPremium extends Template {
  isPremium?: boolean;
}

export function useAutoTemplates(): Template[] {
  const [folderTemplates, setFolderTemplates] = useState<Template[]>([]);

  useEffect(() => {
    // 1. Carrega todas as imagens dentro de src/assets/templates
    const modules = import.meta.glob<string>('/src/assets/templates/**/*.{png,jpg,jpeg,webp}', {
      eager: true,
      import: 'default',
      query: '?url',
    });

    const newTemplates: TemplateWithPremium[] = [];
    let counter = 0;

    for (const path in modules) {
      const imageUrl = modules[path] as string;

      const parts = path.split('/');

      // Categoria = nome da pasta imediatamente antes do ficheiro
      const categoryRaw = parts[parts.length - 2];
      const category = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);

      // Nome do ficheiro (sem extensão)
      const fileNameWithExt = parts[parts.length - 1];
      const fileNameBase = fileNameWithExt.replace(/\.[^.]+$/, ''); // tira .png/.jpg/etc
      const fileNameLower = fileNameBase.toLowerCase();

      // Regra:
      // - ficheiros com "_free" no nome → grátis
      // - resto → premium
      const isFree = fileNameLower.includes('_free');
      const isPremiumTemplate = !isFree;

      // Nome para mostrar: sem "_free"
      const displayName = fileNameBase.replace(/_free/gi, '');

      newTemplates.push({
        id: `auto-${category}-${counter++}`,
        name: displayName,          // ex: "sunset_free" -> "sunset"
        category: category as Template['category'],
        backgroundType: 'image',
        value: imageUrl,
        textColor: '#ffffff',
        fontFamily: 'Inter',
        overlayOpacity: 0.2,
        isPremium: isPremiumTemplate, // <- chave para paywall
      });
    }
    // 🔥 AQUI: ordenar para pôr free primeiro e PRO depois
    newTemplates.sort((a, b) => {
      const aVal = ((a as TemplateWithPremium).isPremium ?? false) ? 1 : 0;
     const bVal = ((b as TemplateWithPremium).isPremium ?? false) ? 1 : 0;
      return aVal - bVal;              // 0 vem antes de 1 → free antes de pro
    });
    setFolderTemplates(newTemplates);
  }, []);

  return folderTemplates;
}