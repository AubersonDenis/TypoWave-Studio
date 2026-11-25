/**
 * Types TypeScript pour TypoWave Studio
 * Définition des structures de données pour les polices, l'audio, la cinétique et les projets.
 */

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';

export interface FontAxis {
  tag: string;         // 'wght', 'wdth', 'slnt', 'ital', 'opsz', etc.
  name: string;        // Nom lisible: 'Graisse', 'Chasse', 'Inclinaison', etc.
  min: number;
  max: number;
  defaultVal: number;
  step: number;
}

export interface FontItem {
  id: string;
  name: string;
  category: FontCategory;
  license: string;     // Ex: 'SIL Open Font License 1.1'
  author: string;
  sourceUrl: string;
  googleFontFamily?: string; // Nom exact pour l'API Google Fonts
  isCustom?: boolean;
  fontDataUrl?: string; // Pour les polices importées .ttf / .woff2
  axes: FontAxis[];
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export type TextKineticEffect = 'wave' | 'glitch' | 'dots' | 'pulse' | 'hybrid';

export interface TypographySettings {
  text: string;
  fontFamily: string;
  fontSize: number;       // Défaut 120px
  alignment: TextAlignment;
  lineHeight: number;     // Défaut 1.1
  letterSpacing: number;  // Défaut 0 (en px ou em)
  frequency: number;      // Fréquence spatiale de l'onde (défaut 1.5)
  speed: number;          // Vitesse de déplacement temporel (défaut 1.2)
  baseAxes: Record<string, number>; // Valeurs manuelles de base pour chaque axe
  textColor: string;      // Couleur hexadécimale du texte (ex: '#FFFFFF')
  dotsColor: string;      // Couleur hexadécimale des points (ex: '#FF3366')
  effect: TextKineticEffect; // Effet sonore : 'wave' | 'glitch' | 'dots' | 'pulse' | 'hybrid'
  effectIntensity: number; // Intensité de l'effet 0 à 100%
  glowIntensity: number;   // Halo néon 0 à 100%
  dotSize: number;         // Taille de la trame de points (défaut: 8px)
}

export type AudioSourceType = 'file' | 'mic';

export interface AudioSettings {
  sourceType: AudioSourceType;
  isEnabled: boolean;     // Interrupteur ON/OFF principal de l'analyse sonore
  volume: number;         // 0 à 100 (gain master)
  equalizer: {
    bass: number;         // -12 à +12 dB
    mid: number;          // -12 à +12 dB
    treble: number;       // -12 à +12 dB
  };
}

export interface AudioMetrics {
  bass: number;    // 0 à 1 (énergie basses fréquences 20-250 Hz)
  mid: number;     // 0 à 1 (énergie moyennes fréquences 250-4000 Hz)
  treble: number;  // 0 à 1 (énergie hautes fréquences 4000-16000 Hz)
  rms: number;     // 0 à 1 (volume global ressenti)
  peakL: number;   // 0 à 1 (vu-mètre gauche)
  peakR: number;   // 0 à 1 (vu-mètre droite)
  timeDomain: Float32Array; // Échantillons temporels pour la forme d'onde
}

export interface ProjectData {
  version: string;
  savedAt: string;
  name: string;
  typography: TypographySettings;
  audio: AudioSettings;
  theme: 'dark' | 'light';
}
