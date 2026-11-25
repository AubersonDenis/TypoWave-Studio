/**
 * Colonne centrale : Live Preview
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et rendu en petits points (Dot Matrix)
 */

import React, { useEffect, useRef, useState } from 'react';
import { CharacterKineticState } from '../mapping/kineticMapper';
import { FontItem, TypographySettings } from '../types';
import { Maximize2, Minimize2, Grid } from 'lucide-react';

interface CenterPreviewProps {
  kineticStates: CharacterKineticState[];
  selectedFont: FontItem;
  settings: TypographySettings;
  fps: number;
  isAudioActive: boolean;
  rmsLevel: number;
}

export const CenterPreview: React.FC<CenterPreviewProps> = ({
  kineticStates,
  selectedFont,
  settings,
  fps,
  isAudioActive,
  rmsLevel,
}) => {
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const canFullscreen =
    typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current || !canFullscreen) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mise à l'échelle adaptative uniquement visuelle sur mobile/tablette (sans modifier settings.fontSize pour l'export)
  const scaleRatio =
    containerWidth > 0 && containerWidth < 760
      ? Math.max(0.32, containerWidth / 760)
      : 1;
  const displayFontSize = Math.round(settings.fontSize * scaleRatio);

  const textAlignClass = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end',
    justify: 'text-justify justify-between',
  }[settings.alignment];

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full relative flex flex-col overflow-hidden bg-[#0F0404]"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(65, 12, 12, 0.45) 0%, rgba(15, 4, 4, 1) 75%)',
      }}
    >
      {/* Barre d'outils supérieure du viewport */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-5 sm:right-5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Badge FPS */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full liquid-glass-subtle text-[11px] font-mono tabular-nums shadow-md text-[#d9c4c4]">
            <span
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                fps > 50 ? 'bg-emerald-400 text-emerald-400 animate-pulse' : fps > 30 ? 'bg-amber-400 text-amber-400' : 'bg-red-400 text-red-400'
              }`}
            />
            <span>{fps} FPS</span>
          </div>

          {/* Témoin de pulsation audio & Effet actif */}
          {isAudioActive && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-subtle text-[11px] font-mono tabular-nums shadow-md text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>EFFET: {(settings.effect || 'dots').toUpperCase()}</span>
              <span className="text-red-400/40">•</span>
              <span>RMS: {Math.round(rmsLevel * 100)}%</span>
            </div>
          )}
        </div>

        {/* Contrôles d'affichage du canevas */}
        <div className="flex items-center gap-1.5 pointer-events-auto liquid-glass-subtle p-1 rounded-2xl shadow-md border border-red-500/20">
          {/* Grille typographique */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Afficher/masquer les repères typographiques"
            className={`p-2 rounded-xl text-xs transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
              showGrid ? 'btn-liquid-primary shadow-xs' : 'text-[#8c6f6f] hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Plein écran (masqué sur navigateurs mobiles qui ne le supportent pas hors vidéo) */}
          {canFullscreen && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              className="p-2 rounded-xl text-[#8c6f6f] hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Grille typographique optionnelle */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full bg-[radial-gradient(rgba(255,100,100,0.5)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <div className="absolute top-1/2 -translate-y-8 left-0 right-0 h-[1px] bg-rose-400/40 border-dashed" />
        </div>
      )}

      {/* Zone de rendu central du texte animé */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10 md:p-14 overflow-auto">
        <div
          className={`w-full max-w-5xl flex flex-wrap items-center ${textAlignClass} select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]`}
          style={{
            fontFamily: `"${selectedFont.name}", sans-serif`,
            fontSize: `${displayFontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {kineticStates.map((state, idx) => {
            if (state.char === '\u00A0') {
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    width: `${displayFontSize * 0.3}px`,
                  }}
                >
                  &nbsp;
                </span>
              );
            }

            // Rendu exclusivement en petits points (sans démarcation ni silhouette sous-jacente)
            if (state.dotEffectActive) {
              const scaledDotGridSize = Math.max(2, Math.round(state.dotGridSize * scaleRatio));
              return (
                <span
                  key={idx}
                  className="inline-block transition-transform duration-75 will-change-transform relative"
                  style={{
                    fontVariationSettings: state.fontVariationSettings,
                    marginRight: `${state.letterSpacingEm}em`,
                    transform: state.transform,
                    transformOrigin: 'center bottom',
                    filter: state.textShadow !== 'none' ? `drop-shadow(0 0 10px ${state.dotsColor}88)` : 'none',
                  }}
                >
                  {/* Trame de petits points composant exclusivement chaque lettre */}
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundImage: `radial-gradient(circle at center, ${state.dotsColor} ${state.dotRadiusPercent}%, transparent ${state.dotRadiusPercent + 2}%)`,
                      backgroundSize: `${scaledDotGridSize}px ${scaledDotGridSize}px`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    {state.char}
                  </span>
                </span>
              );
            }

            // Rendu standard ou glitch
            return (
              <span
                key={idx}
                className="inline-block transition-transform duration-75 will-change-transform relative"
                style={{
                  fontVariationSettings: state.fontVariationSettings,
                  marginRight: `${state.letterSpacingEm}em`,
                  transform: state.transform,
                  transformOrigin: 'center bottom',
                  color: state.color,
                  textShadow: state.textShadow,
                }}
              >
                {state.char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Note d'attribution en bas de viewport */}
      <div className="absolute bottom-2.5 left-3 right-3 sm:left-5 sm:right-5 text-[10px] text-[#8c6f6f] pointer-events-none font-mono flex items-center gap-2 truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0" />
        <span className="truncate">{selectedFont.name} • {selectedFont.license} • {selectedFont.author}</span>
        <span className="text-red-400/40 hidden sm:inline">•</span>
        <span className="uppercase text-red-300 hidden sm:inline shrink-0">
          {settings.effect === 'dots' ? 'LETTRES EN POINTS' : `EFFET: ${settings.effect}`}
        </span>
      </div>
    </div>
  );
};
