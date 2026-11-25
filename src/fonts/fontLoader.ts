/**
 * Module de chargement dynamique des polices variables (Google Fonts & Fichiers locaux)
 * Conçu pour être léger, sans bloquer l'interface, avec mise en cache des liens CSS.
 */

import { FontItem, FontAxis } from '../types';
import fontsData from './fonts.json';

// Cache des promesses de chargement par id de police pour éviter les doublons
const fontLoadPromises = new Map<string, Promise<boolean>>();

function injectStylesheet(href: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => resolve(true)).catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };
      link.onerror = () => resolve(false);
      document.head.appendChild(link);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Charge une police variable depuis Google Fonts via l'API CSS2
 */
export function loadGoogleFont(font: FontItem): Promise<boolean> {
  if (font.isCustom || !font.googleFontFamily) {
    return Promise.resolve(true);
  }

  const existing = fontLoadPromises.get(font.id);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const primaryUrl = `https://fonts.googleapis.com/css2?family=${font.googleFontFamily}&display=swap`;
    const ok = await injectStylesheet(primaryUrl);
    if (ok) return true;

    // Secours avec le nom simple si la syntaxe multi-axes échoue
    const fallbackFamily = encodeURIComponent(font.name).replace(/%20/g, '+');
    const fallbackUrl = `https://fonts.googleapis.com/css2?family=${fallbackFamily}:wght@400;600&display=swap`;
    const fallbackOk = await injectStylesheet(fallbackUrl);
    if (!fallbackOk) {
      console.warn(`Impossible de charger la police Google Fonts: ${font.name}`);
    }
    return fallbackOk;
  })();

  fontLoadPromises.set(font.id, promise);
  return promise;
}

/**
 * Précharge un ensemble de polices afin que chaque entrée du sélecteur
 * s'affiche directement avec sa propre typographie.
 */
export function preloadFontList(fonts: FontItem[]): void {
  fonts.forEach((font) => {
    loadGoogleFont(font);
  });
}

/**
 * Charge un fichier de police variable personnalisé (.woff2, .ttf) fourni par l'utilisateur
 */
export async function loadCustomFontFile(file: File): Promise<FontItem> {
  const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, '');
  const uniqueId = `custom-${Date.now()}`;
  const arrayBuffer = await file.arrayBuffer();

  // Création et enregistrement de la FontFace dans le navigateur
  const fontFace = new FontFace(fontName, arrayBuffer);
  await fontFace.load();
  document.fonts.add(fontFace);

  // Axes par défaut pour une police variable personnalisée
  const detectedAxes: FontAxis[] = [
    { tag: 'wght', name: 'Graisse (Weight)', min: 100, max: 900, defaultVal: 400, step: 10 },
    { tag: 'wdth', name: 'Chasse (Width)', min: 50, max: 200, defaultVal: 100, step: 1 },
    { tag: 'slnt', name: 'Inclinaison (Slant)', min: -15, max: 0, defaultVal: 0, step: 0.5 },
  ];

  const customFont: FontItem = {
    id: uniqueId,
    name: fontName,
    category: 'display',
    license: 'Police personnalisée importée',
    author: 'Utilisateur',
    sourceUrl: 'Import local',
    isCustom: true,
    axes: detectedAxes,
  };

  return customFont;
}

/**
 * Liste initiale des polices variables
 */
export function getInitialFonts(): FontItem[] {
  return fontsData as FontItem[];
}
