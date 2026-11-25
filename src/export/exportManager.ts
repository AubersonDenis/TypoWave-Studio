/**
 * Module d'exportation pour TypoWave Studio
 * Supporte :
 * 1. Export SVG vectoriel pur (avec @import Google Fonts & font-variation-settings par tspan, compatible Figma)
 * 2. Export PNG haute définition (Retina 2x/3x)
 * 3. Export Vidéo (MediaRecorder WebM / MP4 avec piste audio optionnelle)
 * 4. Export JSON des réglages et mentions légales OFL
 */

import { CharacterKineticState } from '../mapping/kineticMapper';
import { FontItem, TypographySettings } from '../types';

/**
 * Génère un fichier SVG vectoriel avec chaque glyphe stylisé
 */
export function generateSvgExport(
  states: CharacterKineticState[],
  font: FontItem,
  settings: TypographySettings,
  isDarkMode = false
): string {
  // Calcul dimensions approximatives pour le viewBox
  const fontSize = settings.fontSize;
  const approxWidth = Math.max(800, states.length * fontSize * 0.65 + 160);
  const approxHeight = Math.max(400, fontSize * settings.lineHeight * 2 + 160);

  const bgColor = '#0F0404';
  const textColor = settings.textColor || '#ffffff';

  // Construction des tspans pour chaque lettre avec son font-variation-settings
  const tspans = states
    .map((s) => {
      const charStr = s.char === '\u00A0' ? ' ' : s.char;
      const safeChar = charStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<tspan style="font-variation-settings: ${s.fontVariationSettings};">${safeChar}</tspan>`;
    })
    .join('');

  // Lien Google Fonts CSS2 pour l'import dans les navigateurs et Figma
  const fontImport = font.googleFontFamily
    ? `@import url('https://fonts.googleapis.com/css2?family=${font.googleFontFamily}&amp;display=swap');`
    : '';

  const textAnchor = settings.alignment === 'center' ? 'middle' : settings.alignment === 'right' ? 'end' : 'start';
  const startX = settings.alignment === 'center' ? approxWidth / 2 : settings.alignment === 'right' ? approxWidth - 80 : 80;
  const startY = approxHeight / 2 + fontSize * 0.35;

  const isDotEffect = settings.effect === 'dots' || settings.effect === 'hybrid';
  const dotSpacing = settings.dotSize || 8;
  const dotRadius = (dotSpacing * 0.35).toFixed(1);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${approxWidth} ${approxHeight}" width="${approxWidth}" height="${approxHeight}">
  <defs>
    ${isDotEffect ? `<pattern id="dotGrid" width="${dotSpacing}" height="${dotSpacing}" patternUnits="userSpaceOnUse">
      <circle cx="${dotSpacing / 2}" cy="${dotSpacing / 2}" r="${dotRadius}" fill="${settings.dotsColor || textColor}" />
    </pattern>` : ''}
    <style>
      ${fontImport}
      .kinetic-text {
        font-family: "${font.name}", sans-serif;
        font-size: ${fontSize}px;
        fill: ${isDotEffect ? 'url(#dotGrid)' : textColor};
        letter-spacing: ${settings.letterSpacing / 100}em;
        text-anchor: ${textAnchor};
      }
      .meta-credit {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        fill: #8c6f6f;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${bgColor}" />
  <text x="${startX}" y="${startY}" class="kinetic-text">
    ${tspans}
  </text>
  <text x="30" y="${approxHeight - 25}" class="meta-credit">
    TypoWave Studio — Police : ${font.name} (${font.license}) par ${font.author}
  </text>
</svg>`;
}

/**
 * Télécharge un fichier Blob sous un nom donné
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exporte l'image au format PNG haute résolution
 */
export async function exportAsPng(
  svgString: string,
  scale = 2,
  filename = 'typowave-render.png'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Impossible de créer le contexte canvas 2D."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          triggerDownload(blob, filename);
          resolve();
        } else {
          reject(new Error("Échec de la génération du PNG."));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Erreur de chargement du rendu vectoriel."));
    };

    img.src = url;
  });
}

/**
 * Enregistrement de l'animation en vidéo WebM / MP4 via MediaRecorder
 */
export async function recordAnimationVideo(
  renderFrameToCanvas: (canvas: HTMLCanvasElement, timestamp: number) => void,
  durationSeconds = 6,
  includeAudio = false,
  audioDestination?: MediaStreamAudioDestinationNode | null,
  onProgress?: (progress0to1: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;

  // Création du flux canvas 60 fps
  const canvasStream = canvas.captureStream(60);

  // Ajout de la piste audio si demandée et disponible
  let combinedStream = canvasStream;
  if (includeAudio && audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    combinedStream = new MediaStream([canvasStream.getVideoTracks()[0], audioTrack]);
  }

  // Choix du format supporté
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    recorder.start(100);

    let animationFrameId: number;

    const renderLoop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(1, elapsed / durationSeconds);

      if (onProgress) {
        onProgress(progress);
      }

      renderFrameToCanvas(canvas, elapsed);

      if (elapsed < durationSeconds) {
        animationFrameId = requestAnimationFrame(renderLoop);
      } else {
        cancelAnimationFrame(animationFrameId);
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        };
        recorder.stop();
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    recorder.onerror = (err) => {
      cancelAnimationFrame(animationFrameId);
      reject(err);
    };
  });
}
