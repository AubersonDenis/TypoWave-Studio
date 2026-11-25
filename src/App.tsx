/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AudioMetrics, 
  AudioSettings, 
  AudioSourceType, 
  FontItem, 
  TypographySettings 
} from './types';
import { getInitialFonts, loadGoogleFont, loadCustomFontFile } from './fonts/fontLoader';
import { AudioEngine } from './audio/audioEngine';
import { computeLettersKineticState, CharacterKineticState } from './mapping/kineticMapper';
import { saveProjectToFile, loadProjectFromFile } from './project/projectManager';
import { generateSvgExport, exportAsPng, triggerDownload } from './export/exportManager';

import { Header } from './ui/Header';
import { LeftColumn } from './ui/LeftColumn';
import { CenterPreview } from './ui/CenterPreview';
import { RightColumn } from './ui/RightColumn';
import { AudioPlayerBar } from './ui/AudioPlayerBar';
import { ExportModal } from './ui/ExportModal';
import { AboutModal } from './ui/AboutModal';
import { ColorPickerModal } from './ui/ColorPickerModal';

export default function App() {
  // 1. Initialisation des polices
  const [fontsList, setFontsList] = useState<FontItem[]>(() => getInitialFonts());
  const [selectedFont, setSelectedFont] = useState<FontItem>(() => fontsList[0]); // Roboto Flex par défaut

  // 2. Réglages typographiques
  const [typography, setTypography] = useState<TypographySettings>(() => ({
    text: 'Projet_1 / Phase_2',
    fontFamily: fontsList[0].name,
    fontSize: 120,
    alignment: 'center',
    lineHeight: 1.1,
    letterSpacing: 0,
    frequency: 1.2,
    speed: 1.0,
    baseAxes: {
      wght: 400,
      wdth: 100,
      slnt: 0,
      opsz: 14,
    },
    textColor: '#FFFFFF',
    dotsColor: '#FF3366',
    effect: 'dots',
    effectIntensity: 75,
    glowIntensity: 40,
    dotSize: 8,
  }));

  // 3. Réglages audio et moteur Web Audio
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sourceType: 'file',
    isEnabled: true,
    volume: 85,
    equalizer: { bass: 0, mid: 0, treble: 0 },
  });

  const audioEngineRef = useRef<AudioEngine | null>(null);
  if (!audioEngineRef.current) {
    audioEngineRef.current = new AudioEngine();
  }
  const audioEngine = audioEngineRef.current;

  // États réactifs dérivés du moteur audio
  const [audioFilePlaying, setAudioFilePlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null);

  // 4. Métriques temps réel & cinétique
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
    peakL: 0,
    peakR: 0,
    timeDomain: new Float32Array(512),
  });

  const [kineticStates, setKineticStates] = useState<CharacterKineticState[]>([]);
  const [fps, setFps] = useState(60);

  // 5. Menus hamburger (tiroirs fermés par défaut) & Modales
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportModalTab, setExportModalTab] = useState<'still' | 'video' | 'json'>('still');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'text' | 'dots'>('text');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Fermeture propre des menus hamburger / modales via Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isColorPickerOpen) setIsColorPickerOpen(false);
        else if (isExportOpen) setIsExportOpen(false);
        else if (isAboutOpen) setIsAboutOpen(false);
        else {
          setIsLeftDrawerOpen(false);
          setIsRightDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isColorPickerOpen, isExportOpen, isAboutOpen]);

  // Chargement de la police active via Google Fonts
  useEffect(() => {
    loadGoogleFont(selectedFont);
  }, [selectedFont]);

  // Synchronisation des événements du moteur audio
  useEffect(() => {
    audioEngine.setOnStateChange(() => {
      setAudioFilePlaying(audioEngine.isFilePlaying);
      setAudioCurrentTime(audioEngine.audioCurrentTime);
      setAudioDuration(audioEngine.audioDuration);
      setAudioErrorMessage(audioEngine.errorMessage);
    });
  }, [audioEngine]);

  // Boucle d'animation principale à 60 FPS (Web Audio + Kinetic Mapping)
  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (now: number) => {
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Extraction des métriques sonores
      const metrics = audioEngine.getMetrics();
      setAudioMetrics(metrics);

      // Calcul de la cinétique pour chaque caractère
      const timeSeconds = now / 1000;
      const states = computeLettersKineticState(
        typography.text,
        selectedFont,
        typography,
        metrics,
        timeSeconds
      );
      setKineticStates(states);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioEngine, typography, selectedFont]);

  // Gestion du changement de police
  const handleSelectFont = useCallback((font: FontItem) => {
    setSelectedFont(font);
    loadGoogleFont(font);

    const newBaseAxes: Record<string, number> = {};
    font.axes.forEach((axis) => {
      newBaseAxes[axis.tag] = axis.defaultVal;
    });

    setTypography((prev) => ({
      ...prev,
      fontFamily: font.name,
      baseAxes: newBaseAxes,
    }));
  }, []);

  // Importation d'une police variable locale (.woff2 / .ttf)
  const handleImportCustomFont = async (file: File) => {
    try {
      const customFont = await loadCustomFontFile(file);
      setFontsList((prev) => [customFont, ...prev]);
      handleSelectFont(customFont);
      showToast(`Police "${customFont.name}" importée.`);
    } catch {
      showToast("Erreur lors de l'import du fichier de police (TTF ou WOFF2 requis).");
    }
  };

  // Mise à jour de la valeur de base d'un axe
  const handleUpdateBaseAxis = (tag: string, value: number) => {
    setTypography((prev) => ({
      ...prev,
      baseAxes: {
        ...prev.baseAxes,
        [tag]: value,
      },
    }));
  };

  // Bascule Audio ON/OFF
  const handleToggleAudioEnabled = () => {
    const nextState = !audioSettings.isEnabled;
    setAudioSettings((prev) => ({ ...prev, isEnabled: nextState }));
    audioEngine.setEnabled(nextState);
  };

  // Bascule Source Audio (Microphone vs Fichier)
  const handleSwitchAudioSource = async (source: AudioSourceType) => {
    setAudioSettings((prev) => ({ ...prev, sourceType: source }));
    await audioEngine.setSourceType(source);
    setAudioErrorMessage(audioEngine.errorMessage);
  };

  // Mise à jour du volume et égaliseur
  const handleUpdateAudioSettings = (partial: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.volume !== undefined) {
        audioEngine.setVolume(partial.volume);
      }
      if (partial.equalizer !== undefined) {
        audioEngine.setEqualizer(
          partial.equalizer.bass,
          partial.equalizer.mid,
          partial.equalizer.treble
        );
      }
      return updated;
    });
  };

  // Importation d'un fichier audio
  const handleUploadAudioFile = async (file: File) => {
    const success = await audioEngine.loadAudioFile(file);
    if (success) {
      await audioEngine.setSourceType('file');
      setAudioSettings((prev) => ({ ...prev, sourceType: 'file', isEnabled: true }));
      await audioEngine.playFile();
    }
  };

  // Chargement du beat synthétisé de démonstration
  const handleLoadDemoBeat = async () => {
    await audioEngine.loadDemoAudio();
    await audioEngine.setSourceType('file');
    setAudioSettings((prev) => ({ ...prev, sourceType: 'file', isEnabled: true }));
    audioEngine.playFile();
  };

  // Sauvegarde du projet .json
  const handleSaveProject = () => {
    saveProjectToFile('Projet_TypoWave', typography, audioSettings, 'dark');
    showToast("Projet sauvegardé en JSON.");
  };

  // Chargement d'un projet .json
  const handleLoadProject = async (file: File) => {
    try {
      const project = await loadProjectFromFile(file);
      setTypography(project.typography);
      setAudioSettings(project.audio);

      const matching = fontsList.find(
        (f) => f.name.toLowerCase() === project.typography.fontFamily.toLowerCase()
      );
      if (matching) {
        handleSelectFont(matching);
      }

      showToast("Projet chargé avec succès !");
    } catch (err: unknown) {
      showToast((err as Error).message || "Impossible de charger ce projet.");
    }
  };

  // Exports directs depuis la barre d'export permanente
  const handleQuickExportSvg = () => {
    const svg = generateSvgExport(kineticStates, selectedFont, typography, true);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `typowave-${selectedFont.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    triggerDownload(blob, filename);
    showToast("SVG vectoriel exporté !");
  };

  const handleQuickExportPng = async () => {
    try {
      const svg = generateSvgExport(kineticStates, selectedFont, typography, true);
      const filename = `typowave-${selectedFont.name.toLowerCase().replace(/\s+/g, '-')}-2x.png`;
      await exportAsPng(svg, 2, filename);
      showToast("Image PNG 2x téléchargée !");
    } catch {
      showToast("Erreur lors de la génération PNG.");
    }
  };

  const handleOpenExportModal = (tab: 'still' | 'video' | 'json' = 'still') => {
    setExportModalTab(tab);
    setIsExportOpen(true);
  };

  // Fonction de rendu offscreen sur Canvas pour l'exportation vidéo MediaRecorder
  const renderFrameToCanvas = useCallback(
    (canvas: HTMLCanvasElement, elapsedSeconds: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Fond #0F0404 avec halo liquide
      ctx.fillStyle = '#0F0404';
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.5);
      grad.addColorStop(0, 'rgba(65, 12, 12, 0.5)');
      grad.addColorStop(1, 'rgba(15, 4, 4, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const metrics = audioEngine.getMetrics();
      const states = computeLettersKineticState(
        typography.text,
        selectedFont,
        typography,
        metrics,
        elapsedSeconds
      );

      ctx.fillStyle = typography.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = Math.min(typography.fontSize, 110);
      ctx.font = `${fontSize}px "${selectedFont.name}", sans-serif`;

      if (typography.glowIntensity > 0) {
        ctx.shadowColor = typography.textColor || '#ffffff';
        ctx.shadowBlur = Math.round(typography.glowIntensity * 0.25);
      } else {
        ctx.shadowBlur = 0;
      }

      const totalTextWidth = states.length * (fontSize * 0.55 + typography.letterSpacing);
      let currentX = (w - totalTextWidth) / 2;
      const centerY = h / 2;

      states.forEach((s) => {
        const char = s.char === '\u00A0' ? ' ' : s.char;
        ctx.save();
        ctx.translate(currentX, centerY);
        ctx.scale(s.scale, s.scale);
        ctx.fillText(char, 0, 0);
        ctx.restore();

        currentX += fontSize * 0.55 + typography.letterSpacing;
      });

      // Filigrane légal
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#7a5a5a';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`TypoWave Studio • Police : ${selectedFont.name} (${selectedFont.license})`, 40, h - 30);
    },
    [audioEngine, typography, selectedFont]
  );

  const handleToggleLeftDrawer = useCallback(() => {
    setIsLeftDrawerOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsRightDrawerOpen(false);
      }
      return next;
    });
  }, []);

  const handleToggleRightDrawer = useCallback(() => {
    setIsRightDrawerOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsLeftDrawerOpen(false);
      }
      return next;
    });
  }, []);

  return (
    <div className="h-screen-dynamic bg-[#0F0404] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Barre d'en-tête avec menus hamburger + menu d'export toujours visible */}
      <Header
        currentFont={selectedFont}
        audioSourceType={audioSettings.sourceType}
        isAudioEnabled={audioSettings.isEnabled}
        isLeftDrawerOpen={isLeftDrawerOpen}
        isRightDrawerOpen={isRightDrawerOpen}
        onToggleLeftDrawer={handleToggleLeftDrawer}
        onToggleRightDrawer={handleToggleRightDrawer}
        onToggleAudioEnabled={handleToggleAudioEnabled}
        onSwitchAudioSource={handleSwitchAudioSource}
        onPlayDemoBeat={handleLoadDemoBeat}
        onOpenHelp={() => setIsAboutOpen(true)}
        onOpenExport={(tab) => handleOpenExportModal(tab || 'still')}
        onQuickExportSvg={handleQuickExportSvg}
        onQuickExportPng={handleQuickExportPng}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
      />

      {/* 2. Corps principal : Bottom-sheet sur mobile/tablette (< md) et réduction dynamique de l'aperçu sur desktop */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Tiroir Hamburger Gauche : Bottom-sheet sur mobile, tiroir latéral sur desktop */}
        <aside
          aria-hidden={!isLeftDrawerOpen}
          className={`fixed md:relative left-0 right-0 md:right-auto bottom-14 md:bottom-auto md:top-0 z-30 h-[58dvh] md:h-full flex-shrink-0 overflow-hidden transition-[width,transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLeftDrawerOpen
              ? 'w-full md:w-80 lg:w-88 translate-y-0 md:translate-x-0 opacity-100 pointer-events-auto'
              : 'w-full md:w-0 translate-y-full md:translate-y-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-full md:w-80 lg:w-88 h-full">
            <LeftColumn
              fonts={fontsList}
              selectedFont={selectedFont}
              onSelectFont={handleSelectFont}
              onImportCustomFont={handleImportCustomFont}
              settings={typography}
              onUpdateSettings={(partial) => setTypography((prev) => ({ ...prev, ...partial }))}
              onOpenTextColorPicker={() => {
                setColorPickerTarget('text');
                setIsColorPickerOpen(true);
              }}
              onOpenDotsColorPicker={() => {
                setColorPickerTarget('dots');
                setIsColorPickerOpen(true);
              }}
              onClose={() => setIsLeftDrawerOpen(false)}
            />
          </div>
        </aside>

        {/* Aperçu Live Central (se réduit automatiquement quand un menu hamburger s'ouvre sur desktop, et se recentre au-dessus du tiroir sur mobile) */}
        <div
          className={`flex-1 min-w-0 h-full flex flex-col relative transition-[padding] duration-200 ${
            isLeftDrawerOpen || isRightDrawerOpen ? 'pb-[58dvh] md:pb-0' : 'pb-0'
          }`}
        >
          <CenterPreview
            kineticStates={kineticStates}
            selectedFont={selectedFont}
            settings={typography}
            fps={fps}
            isAudioActive={audioSettings.isEnabled}
            rmsLevel={audioMetrics.rms}
          />
        </div>

        {/* Tiroir Hamburger Droit : Bottom-sheet sur mobile, tiroir latéral sur desktop */}
        <aside
          aria-hidden={!isRightDrawerOpen}
          className={`fixed md:relative left-0 right-0 md:left-auto bottom-14 md:bottom-auto md:top-0 z-30 h-[58dvh] md:h-full flex-shrink-0 overflow-hidden transition-[width,transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isRightDrawerOpen
              ? 'w-full md:w-80 lg:w-88 translate-y-0 md:translate-x-0 opacity-100 pointer-events-auto'
              : 'w-full md:w-0 translate-y-full md:translate-y-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-full md:w-80 lg:w-88 h-full">
            <RightColumn
              currentFont={selectedFont}
              settings={typography}
              onUpdateBaseAxis={handleUpdateBaseAxis}
              audioSettings={audioSettings}
              onUpdateAudioSettings={handleUpdateAudioSettings}
              onToggleAudioEnabled={handleToggleAudioEnabled}
              onSwitchAudioSource={handleSwitchAudioSource}
              audioMetrics={audioMetrics}
              audioErrorMessage={audioErrorMessage}
              onOpenExportModal={() => handleOpenExportModal('still')}
              onSaveProject={handleSaveProject}
              onLoadProject={handleLoadProject}
              onClose={() => setIsRightDrawerOpen(false)}
            />
          </div>
        </aside>

        {/* Notification toast discrète */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl liquid-glass border border-red-500/40 text-xs font-medium text-white shadow-2xl pointer-events-none max-w-[90vw] text-center">
            {toastMessage}
          </div>
        )}
      </main>

      {/* 3. Barre inférieure de lecture audio (toujours visible en bas de la page) */}
      <AudioPlayerBar
        sourceType={audioSettings.sourceType}
        isPlaying={audioFilePlaying}
        currentTime={audioCurrentTime}
        duration={audioDuration}
        fileName={audioEngine.currentFileName || (audioEngine.isMicActive ? 'Microphone' : 'Audio Fichier')}
        onTogglePlay={() => audioEngine.togglePlayPause()}
        onSeek={(sec) => audioEngine.seekFile(sec)}
        onUploadFile={handleUploadAudioFile}
        onLoadDemoBeat={handleLoadDemoBeat}
        onSwitchToFile={() => handleSwitchAudioSource('file')}
      />

      {/* 4. Modale d'exportation complète */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialTab={exportModalTab}
        kineticStates={kineticStates}
        selectedFont={selectedFont}
        settings={typography}
        renderFrameToCanvas={renderFrameToCanvas}
        audioDestination={isExportOpen ? audioEngine.getAudioStreamDestination() : null}
      />

      {/* 5. Modale pédagogique d'aide */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 6. Modale Roue Chromatique Typographique */}
      <ColorPickerModal
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        title={colorPickerTarget === 'text' ? 'Roue Chromatique • Couleur du Texte' : 'Roue Chromatique • Couleur des Points'}
        subtitle={colorPickerTarget === 'text' ? 'Sélectionnez la teinte du texte ou entrez un code hexadécimal' : 'Sélectionnez la teinte des points composant chaque lettre'}
        currentColor={colorPickerTarget === 'text' ? (typography.textColor || '#FFFFFF') : (typography.dotsColor || '#FF3366')}
        onSelectColor={(hex) => {
          if (colorPickerTarget === 'text') {
            setTypography((prev) => ({ ...prev, textColor: hex }));
          } else {
            setTypography((prev) => ({ ...prev, dotsColor: hex }));
          }
        }}
      />
    </div>
  );
}
