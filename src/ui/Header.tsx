/**
 * En-tête de l'application TypoWave Studio
 * Tous les panneaux et réglages sont accessibles via des menus hamburger,
 * à l'exception des menus d'export (toujours visibles) et de la barre audio en bas de page.
 */

import React, { useState, useRef, useEffect } from 'react';
import { FontItem, AudioSourceType } from '../types';
import {
  Menu,
  X,
  Mic,
  Music,
  VolumeX,
  Sparkles,
  HelpCircle,
  Download,
  FileCode,
  Image as ImageIcon,
  Video,
  FileJson,
  Save,
  FolderOpen,
} from 'lucide-react';

interface HeaderProps {
  currentFont: FontItem;
  audioSourceType: AudioSourceType;
  isAudioEnabled: boolean;
  isLeftDrawerOpen: boolean;
  isRightDrawerOpen: boolean;
  onToggleLeftDrawer: () => void;
  onToggleRightDrawer: () => void;
  onToggleAudioEnabled: () => void;
  onSwitchAudioSource: (source: AudioSourceType) => void;
  onPlayDemoBeat: () => void;
  onOpenHelp: () => void;
  onOpenExport: (tab?: 'still' | 'video' | 'json') => void;
  onQuickExportSvg: () => void;
  onQuickExportPng: () => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFont,
  audioSourceType,
  isAudioEnabled,
  isLeftDrawerOpen,
  isRightDrawerOpen,
  onToggleLeftDrawer,
  onToggleRightDrawer,
  onToggleAudioEnabled,
  onSwitchAudioSource,
  onPlayDemoBeat,
  onOpenHelp,
  onOpenExport,
  onQuickExportSvg,
  onQuickExportPng,
  onSaveProject,
  onLoadProject,
}) => {
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const studioMenuRef = useRef<HTMLDivElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (studioMenuRef.current && !studioMenuRef.current.contains(e.target as Node)) {
        setIsStudioMenuOpen(false);
      }
    };
    if (isStudioMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStudioMenuOpen]);

  const handleProjectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadProject(e.target.files[0]);
      setIsStudioMenuOpen(false);
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 flex-shrink-0 border-b border-[rgba(255,100,100,0.14)] liquid-glass px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 z-40 relative">
      {/* Zone gauche : Hamburger Typo & Marque */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleLeftDrawer}
          aria-expanded={isLeftDrawerOpen}
          title="Ouvrir / fermer le menu Typographie & Effets"
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
            isLeftDrawerOpen
              ? 'btn-liquid-primary shadow-md'
              : 'btn-liquid-secondary'
          }`}
        >
          {isLeftDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-red-400" />}
          <span className="hidden sm:inline">Typo & Effets</span>
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/40 flex items-center justify-center text-white font-bold text-xs tracking-tighter shadow-[0_0_15px_rgba(239,68,68,0.35)]">
            T~W
          </div>
          <span className="font-bold tracking-tight text-sm text-white whitespace-nowrap hidden md:inline">
            TYPOWAVE STUDIO
          </span>
        </div>
      </div>

      {/* Zone droite : Menu d'Export toujours visible + Hamburgers Audio/Axes & Studio */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Menu d'Export permanent (jamais caché dans un hamburger) */}
        <div className="flex items-center gap-1 p-1 rounded-xl liquid-glass-subtle border border-red-500/25">
          <button
            onClick={onQuickExportSvg}
            title="Télécharger immédiatement en SVG vectoriel"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#f3e8e8] hover:text-white hover:bg-red-950/60 transition-colors whitespace-nowrap shrink-0"
          >
            <FileCode className="w-3.5 h-3.5 text-red-400" />
            <span>SVG</span>
          </button>

          <button
            onClick={onQuickExportPng}
            title="Télécharger immédiatement en PNG 2x"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#f3e8e8] hover:text-white hover:bg-red-950/60 transition-colors whitespace-nowrap shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={() => onOpenExport('video')}
            title="Exporter une animation vidéo 60 fps"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#f3e8e8] hover:text-white hover:bg-red-950/60 transition-colors whitespace-nowrap shrink-0"
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span>Vidéo</span>
          </button>

          <button
            onClick={() => onOpenExport('json')}
            title="Exporter les paramètres JSON"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#f3e8e8] hover:text-white hover:bg-red-950/60 transition-colors whitespace-nowrap shrink-0"
          >
            <FileJson className="w-3.5 h-3.5 text-red-300" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => onOpenExport('still')}
            className="btn-liquid-primary px-3 sm:px-3.5 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Hamburger Droit : Variables & Environnement Audio */}
        <button
          onClick={onToggleRightDrawer}
          aria-expanded={isRightDrawerOpen}
          title="Ouvrir / fermer le menu Axes Variables & Audio"
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
            isRightDrawerOpen
              ? 'btn-liquid-primary shadow-md'
              : 'btn-liquid-secondary'
          }`}
        >
          {isRightDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-red-400" />}
          <span className="hidden sm:inline">Axes & Audio</span>
        </button>

        {/* Hamburger Menu Principal : Outils Studio, Projet, Aide */}
        <div className="relative" ref={studioMenuRef}>
          <button
            onClick={() => setIsStudioMenuOpen(!isStudioMenuOpen)}
            aria-expanded={isStudioMenuOpen}
            title="Menu Studio (Audio, Projet, Aide)"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              isStudioMenuOpen
                ? 'btn-liquid-primary shadow-md'
                : 'btn-liquid-secondary'
            }`}
          >
            {isStudioMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-red-400" />}
            <span className="hidden md:inline">Menu</span>
          </button>

          {isStudioMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl liquid-glass border border-red-500/30 shadow-2xl p-3 space-y-2 z-50">
              {/* Info police active en texte propre */}
              <div className="px-2.5 py-2 border-b border-red-500/15 space-y-0.5">
                <div className="text-xs font-semibold text-white truncate">{currentFont.name}</div>
                <div className="text-[11px] text-[#a88d8d] truncate">
                  {currentFont.author} · {currentFont.license}
                </div>
              </div>

              {/* Contrôles Audio rapides */}
              <button
                onClick={() => {
                  onPlayDemoBeat();
                  setIsStudioMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center gap-2.5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                <span>Lancer le Beat Démo</span>
              </button>

              <button
                onClick={() => {
                  onToggleAudioEnabled();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center justify-between whitespace-nowrap"
              >
                <span className="flex items-center gap-2.5">
                  {isAudioEnabled ? (
                    audioSourceType === 'mic' ? (
                      <Mic className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <Music className="w-4 h-4 text-red-400 shrink-0" />
                    )
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#8c6f6f] shrink-0" />
                  )}
                  <span>Analyse sonore</span>
                </span>
                <span className={`text-[11px] font-mono font-bold ${isAudioEnabled ? 'text-red-300' : 'text-[#8c6f6f]'}`}>
                  {isAudioEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  onSwitchAudioSource(audioSourceType === 'file' ? 'mic' : 'file');
                  setIsStudioMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center justify-between whitespace-nowrap"
              >
                <span className="flex items-center gap-2.5">
                  {audioSourceType === 'file' ? (
                    <Mic className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <Music className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>
                    {audioSourceType === 'file' ? 'Passer au Microphone' : 'Passer au Fichier Audio'}
                  </span>
                </span>
              </button>

              {/* Gestion de projet */}
              <div className="pt-1 border-t border-red-500/15 space-y-1">
                <button
                  onClick={() => {
                    onSaveProject();
                    setIsStudioMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center gap-2.5 whitespace-nowrap"
                >
                  <Save className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Sauvegarder le projet (.json)</span>
                </button>

                <button
                  onClick={() => projectFileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center gap-2.5 whitespace-nowrap"
                >
                  <FolderOpen className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Charger un projet (.json)</span>
                </button>
                <input
                  ref={projectFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleProjectUpload}
                  className="hidden"
                />
              </div>

              {/* Aide */}
              <div className="pt-1 border-t border-red-500/15">
                <button
                  onClick={() => {
                    onOpenHelp();
                    setIsStudioMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-[#f3e8e8] hover:text-white hover:bg-red-950/50 transition-colors flex items-center gap-2.5 whitespace-nowrap"
                >
                  <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Guide & Mapping Audio</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
