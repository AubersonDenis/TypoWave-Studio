/**
 * Module de gestion et sauvegarde de projet (.json)
 * Permet d'exporter l'état complet du studio (hors fichier binaire audio) et de le recharger
 */

import { AudioSettings, ProjectData, TypographySettings } from '../types';
import { triggerDownload } from '../export/exportManager';

/**
 * Sauvegarde la configuration complète du projet dans un fichier JSON
 */
export function saveProjectToFile(
  projectName: string,
  typography: TypographySettings,
  audio: AudioSettings,
  theme: 'dark' | 'light'
) {
  const safeName = (projectName || 'projet-typowave').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const project: ProjectData = {
    version: '1.0.0',
    savedAt: new Date().toISOString(),
    name: projectName || 'TypoWave_Projet',
    typography: { ...typography },
    audio: {
      sourceType: audio.sourceType,
      isEnabled: audio.isEnabled,
      volume: audio.volume,
      equalizer: { ...audio.equalizer },
    },
    theme,
  };

  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `${safeName}.typowave.json`);
}

/**
 * Charge et valide un fichier de projet JSON
 */
export async function loadProjectFromFile(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;

        // Validation minimale
        if (!data.typography || !data.typography.fontFamily) {
          throw new Error("Structure de projet invalide : paramètres typographiques manquants.");
        }

        // Valeurs par défaut sécurisées si champs omis
        const sanitized: ProjectData = {
          version: data.version || '1.0.0',
          savedAt: data.savedAt || new Date().toISOString(),
          name: data.name || 'Projet importé',
          typography: {
            text: data.typography.text || 'Projet_1 / Phase_2',
            fontFamily: data.typography.fontFamily,
            fontSize: Number(data.typography.fontSize) || 120,
            alignment: data.typography.alignment || 'center',
            lineHeight: Number(data.typography.lineHeight) || 1.1,
            letterSpacing: Number(data.typography.letterSpacing) || 0,
            frequency: Number(data.typography.frequency) || 1.2,
            speed: Number(data.typography.speed) || 1.0,
            baseAxes: data.typography.baseAxes || {},
            textColor: data.typography.textColor || '#FFFFFF',
            dotsColor: data.typography.dotsColor || '#FF3366',
            effect: data.typography.effect || 'dots',
            effectIntensity: data.typography.effectIntensity !== undefined ? Number(data.typography.effectIntensity) : 70,
            glowIntensity: data.typography.glowIntensity !== undefined ? Number(data.typography.glowIntensity) : 40,
            dotSize: data.typography.dotSize !== undefined ? Number(data.typography.dotSize) : 8,
          },
          audio: {
            sourceType: data.audio?.sourceType || 'file',
            isEnabled: data.audio?.isEnabled !== undefined ? data.audio.isEnabled : true,
            volume: Number(data.audio?.volume) || 80,
            equalizer: {
              bass: Number(data.audio?.equalizer?.bass) || 0,
              mid: Number(data.audio?.equalizer?.mid) || 0,
              treble: Number(data.audio?.equalizer?.treble) || 0,
            },
          },
          theme: data.theme === 'light' ? 'light' : 'dark',
        };

        resolve(sanitized);
      } catch (err) {
        reject(new Error("Fichier de projet illisible ou corrompu."));
      }
    };

    reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
    reader.readAsText(file);
  });
}
