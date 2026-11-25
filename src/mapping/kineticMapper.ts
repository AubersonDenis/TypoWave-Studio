/**
 * Module de mapping cinétique et réactivité son > typographie
 * Calcule l'onde sinusoïdale spatio-temporelle, distribue l'énergie spectrale
 * sur les axes variables, et génère les effets visuels :
 * - Ondulation (Wave)
 * - Glitch & Décalage Chromatique RGB
 * - Lettres en Petits Points (Dot matrix / Trame de demi-teinte)
 * - Pulsation & Impact Néon
 * - Hybride
 */

import { AudioMetrics, FontAxis, FontItem, TypographySettings } from '../types';

export interface CharacterKineticState {
  char: string;
  index: number;
  fontVariationSettings: string;
  letterSpacingEm: number;
  scale: number;
  opacity: number;
  transform: string;
  textShadow: string;
  dotEffectActive: boolean;
  dotGridSize: number;
  dotRadiusPercent: number;
  color: string;
  dotsColor: string;
  currentAxesValues: Record<string, number>;
}

/**
 * Calcule l'état dynamique de chaque lettre pour la frame courante
 */
export function computeLettersKineticState(
  text: string,
  font: FontItem,
  settings: TypographySettings,
  audioMetrics: AudioMetrics,
  timeSeconds: number
): CharacterKineticState[] {
  const chars = Array.from(text);
  const totalChars = chars.length || 1;

  // Analyse des axes disponibles dans la police
  const axesMap = new Map<string, FontAxis>();
  font.axes.forEach((axis) => axesMap.set(axis.tag, axis));

  const hasWdth = axesMap.has('wdth');
  const hasSlnt = axesMap.has('slnt');
  const hasItal = axesMap.has('ital');
  const hasOpsz = axesMap.has('opsz');

  // Redistribution d'énergie
  const effectiveBass = audioMetrics.bass + (!hasWdth ? audioMetrics.mid * 0.4 : 0) + (!hasSlnt && !hasItal ? audioMetrics.treble * 0.3 : 0);
  const effectiveMid = audioMetrics.mid + (!hasOpsz ? audioMetrics.rms * 0.2 : 0);
  const effectiveTreble = audioMetrics.treble;
  const rms = audioMetrics.rms;

  const effectMode = settings.effect || 'dots';
  const intensity = (settings.effectIntensity !== undefined ? settings.effectIntensity : 70) / 100;
  const glowAmount = (settings.glowIntensity !== undefined ? settings.glowIntensity : 40) / 100;
  const textColor = settings.textColor || '#FFFFFF';
  const dotsColor = settings.dotsColor || '#FF3366';
  const baseDotSize = settings.dotSize || 8;

  return chars.map((char, index) => {
    // Si espace ou saut de ligne
    if (char === ' ') {
      return {
        char: '\u00A0',
        index,
        fontVariationSettings: 'normal',
        letterSpacingEm: settings.letterSpacing / 100,
        scale: 1,
        opacity: 1,
        transform: 'none',
        textShadow: 'none',
        dotEffectActive: false,
        dotGridSize: baseDotSize,
        dotRadiusPercent: 35,
        color: textColor,
        dotsColor,
        currentAxesValues: {},
      };
    }

    // 1. Onde spatio-temporelle de base
    const spatialPhase = (index / totalChars) * settings.frequency * Math.PI * 2;
    const temporalPhase = timeSeconds * settings.speed * 3.0;
    const wave = Math.sin(spatialPhase - temporalPhase);
    const normalizedWave = (wave + 1) / 2;

    const soundAmplitude = 0.3 + rms * 0.9 * intensity;

    // 2. Calcul des variations pour chaque axe
    const computedAxesValues: Record<string, number> = {};
    const variationParts: string[] = [];

    font.axes.forEach((axis) => {
      const baseValue = settings.baseAxes[axis.tag] !== undefined
        ? settings.baseAxes[axis.tag]
        : axis.defaultVal;

      const axisSpan = axis.max - axis.min;
      let axisModulation = 0;

      if (axis.tag === 'wght') {
        const bassImpact = effectiveBass * 0.7 + rms * 0.3;
        axisModulation = wave * 0.25 + (normalizedWave * bassImpact * 0.75);
      } else if (axis.tag === 'wdth') {
        const midImpact = effectiveMid * 0.7 + rms * 0.3;
        axisModulation = Math.cos(spatialPhase - temporalPhase) * 0.2 + (midImpact * 0.8);
      } else if (axis.tag === 'slnt') {
        const trebleImpact = effectiveTreble * 0.85;
        axisModulation = wave * 0.3 + (trebleImpact * 0.7);
      } else if (axis.tag === 'ital') {
        axisModulation = (effectiveTreble * 1.2 > 0.5 ? 1 : 0);
      } else if (axis.tag === 'opsz') {
        axisModulation = wave * 0.3 + (effectiveMid * 0.7);
      } else {
        const hybridEnergy = (effectiveBass * 0.3 + effectiveMid * 0.4 + effectiveTreble * 0.3);
        axisModulation = wave * 0.25 + (hybridEnergy * 0.75);
      }

      if (effectMode === 'glitch') {
        if (effectiveTreble > 0.55 && Math.random() > 0.7) {
          axisModulation += (Math.random() * 0.4 - 0.2) * intensity;
        }
      }

      const targetDelta = axisModulation * soundAmplitude * (axisSpan * 0.5);
      let finalVal = baseValue + targetDelta;
      finalVal = Math.max(axis.min, Math.min(axis.max, finalVal));

      if (axis.step >= 1) {
        finalVal = Math.round(finalVal);
      } else {
        finalVal = Math.round(finalVal * 100) / 100;
      }

      computedAxesValues[axis.tag] = finalVal;
      variationParts.push(`"${axis.tag}" ${finalVal}`);
    });

    const fontVariationSettings = variationParts.length > 0 ? variationParts.join(', ') : 'normal';

    // 3. Traitement des effets visuels personnalisés
    let translateY = -wave * (rms * 12 * intensity);
    let translateX = 0;
    let scale = 1;
    let skewX = 0;
    let textShadow = 'none';
    let dotActive = false;
    let dotGridSize = baseDotSize;
    let dotRadiusPercent = 35;

    // A) Mode LETTRES EN PETITS POINTS (Dot Matrix / Trame stippling)
    if (effectMode === 'dots') {
      dotActive = true;
      // Espacement de la trame de points modulée subtilement par les médiums
      dotGridSize = Math.max(3, Math.round(baseDotSize * (0.95 + effectiveMid * 0.15)));
      // Rayon des points palpitant avec les kicks et les basses (de 25% à 48%)
      dotRadiusPercent = Math.min(48, Math.round(28 + (effectiveBass * 18 + rms * 12) * intensity));
      translateY = -Math.sin(spatialPhase - temporalPhase) * (effectiveBass * 8 * intensity);

      if (glowAmount > 0) {
        const glowBlur = Math.round(glowAmount * 12 * (1 + effectiveBass));
        textShadow = `0 0 ${glowBlur}px ${textColor}88`;
      }
    }

    // B) Mode GLITCH : Décalage Chromatique RGB & Jitter horizontal
    else if (effectMode === 'glitch') {
      const glitchEnergy = (effectiveTreble * 0.65 + rms * 0.35) * intensity;
      const shouldGlitch = glitchEnergy > 0.3 && (Math.sin(timeSeconds * 20 + index * 3) > 0.2);

      if (shouldGlitch) {
        const shift = Math.round((Math.random() * 7 + 2) * glitchEnergy);
        translateX = (Math.random() * 6 - 3) * glitchEnergy;
        skewX = (Math.random() * 8 - 4) * glitchEnergy;
        textShadow = `${shift}px 0 rgba(255, 0, 85, 0.9), -${shift}px 0 rgba(0, 240, 255, 0.9)`;
      } else if (glowAmount > 0) {
        const glowBlur = Math.round(glowAmount * 15 * (1 + rms));
        textShadow = `0 0 ${glowBlur}px ${textColor}88`;
      }
    }

    // C) Mode PULSE (Impact & Strobe Néon)
    else if (effectMode === 'pulse') {
      const kickPunch = Math.max(0, rms * 1.5 - 0.2) * intensity;
      scale = 1 + kickPunch * 0.22;
      translateY = -kickPunch * 10;

      const blurRadius1 = Math.round(kickPunch * 28 + glowAmount * 12);
      const blurRadius2 = Math.round(kickPunch * 45 + glowAmount * 24);
      textShadow = `0 0 ${blurRadius1}px ${textColor}, 0 0 ${blurRadius2}px rgba(239, 68, 68, 0.6)`;
    }

    // D) Mode HYBRIDE
    else if (effectMode === 'hybrid') {
      dotActive = true;
      dotGridSize = baseDotSize;
      dotRadiusPercent = Math.min(46, Math.round(30 + (effectiveBass * 16) * intensity));
      scale = 1 + (effectiveBass * 0.16 * intensity);
      if (glowAmount > 0) {
        const blurRadius = Math.round((glowAmount * 20) * (0.6 + effectiveBass * 0.8));
        textShadow = `0 0 ${blurRadius}px ${textColor}bb`;
      }
    }

    // E) Mode ONDULATION (Wave) standard fluide
    else {
      scale = 1 + (rms * 0.12 * Math.max(0, wave) * intensity);
      if (glowAmount > 0) {
        const glowBlur = Math.round((glowAmount * 16) * (0.8 + rms * 0.8));
        textShadow = `0 0 ${glowBlur}px ${textColor}99`;
      }
    }

    const spacingMod = (settings.letterSpacing / 100) + (effectiveTreble * 0.04 * (wave * 0.5 + 0.5) * intensity);
    const transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) skewX(${skewX.toFixed(2)}deg)`;

    return {
      char,
      index,
      fontVariationSettings,
      letterSpacingEm: spacingMod,
      scale,
      opacity: 1,
      transform,
      textShadow,
      dotEffectActive: dotActive,
      dotGridSize,
      dotRadiusPercent,
      color: textColor,
      dotsColor,
      currentAxesValues: computedAxesValues,
    };
  });
}
