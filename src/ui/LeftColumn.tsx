/**
 * Colonne gauche : Texte, Typographie, Couleur et Effets Cinétiques
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et boutons rubis/grenat
 *
 * Ordre strict demandé :
 * 1. Texte à composer
 * 2. Police variable
 * 3. Couleur du texte
 * 4. Taille de police
 * 5. Alignement
 * 6. Détail typo
 * 7. Effet visuel du texte (Sélection d'effet + Réglages des points : Couleur, Taille, Intensité, Halo)
 * 8. Onde de mouvement
 */

import React, { useState, useRef } from 'react';
import { FontItem, TextAlignment, TextKineticEffect, TypographySettings } from '../types';
import { FontPickerModal } from './FontPickerModal';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  ChevronDown, 
  Upload, 
  Minus, 
  Plus, 
  ExternalLink,
  Sliders, 
  Type, 
  Waves, 
  Pipette, 
  Zap, 
  CircleDot, 
  Activity, 
  Sparkles,
  X
} from 'lucide-react';

interface LeftColumnProps {
  fonts: FontItem[];
  selectedFont: FontItem;
  onSelectFont: (font: FontItem) => void;
  onImportCustomFont: (file: File) => void;
  settings: TypographySettings;
  onUpdateSettings: (partial: Partial<TypographySettings>) => void;
  onOpenTextColorPicker: () => void;
  onOpenDotsColorPicker: () => void;
  onClose?: () => void;
}

const QUICK_COLORS = ['#FFFFFF', '#FF3366', '#FF5E57', '#FFAA00', '#FFE600', '#00FF88', '#00F0FF', '#B026FF'];
const QUICK_DOTS_COLORS = ['#FF3366', '#FFFFFF', '#00F0FF', '#00FF88', '#FFE600', '#FF5E57', '#B026FF', '#FF0055'];

const EFFECT_OPTIONS: { id: TextKineticEffect; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'dots', label: 'Lettres en Points', icon: CircleDot, desc: 'Composé exclusivement de points réactifs' },
  { id: 'wave', label: 'Ondulation', icon: Waves, desc: 'Onde sinusoïdale spatio-temporelle fluide' },
  { id: 'glitch', label: 'Glitch RGB', icon: Zap, desc: 'Aberration chromatique sur aigus' },
  { id: 'pulse', label: 'Pulsation', icon: Activity, desc: 'Impact et punch sur les kicks' },
  { id: 'hybrid', label: 'Hybride', icon: Sparkles, desc: 'Points + Ondulation + Lueur' },
];

export const LeftColumn: React.FC<LeftColumnProps> = ({
  fonts,
  selectedFont,
  onSelectFont,
  onImportCustomFont,
  settings,
  onUpdateSettings,
  onOpenTextColorPicker,
  onOpenDotsColorPicker,
  onClose,
}) => {
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCustomFont(e.target.files[0]);
    }
  };

  const adjustFontSize = (delta: number) => {
    const next = Math.max(16, Math.min(320, settings.fontSize + delta));
    onUpdateSettings({ fontSize: next });
  };

  const isDotMode = (settings.effect || 'dots') === 'dots' || settings.effect === 'hybrid';

  return (
    <div className="w-full h-full rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-[rgba(255,100,100,0.2)] liquid-glass-drawer flex flex-col">
      <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mt-2 md:hidden flex-shrink-0" />
      {onClose && (
        <div className="px-4 py-2.5 md:py-3 border-b border-[rgba(255,100,100,0.12)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold tracking-wide text-white uppercase">Typographie & Effets</span>
          </div>
          <button
            onClick={onClose}
            title="Fermer le menu typographie"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl btn-liquid-secondary text-[#c9adad] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ========================================================
            1. TEXTE À COMPOSER
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-red-400" />
              Texte à composer
            </label>
            <span className="text-[10px] text-[#8c6f6f] font-mono">
              {settings.text.length} car.
            </span>
          </div>
          <textarea
            value={settings.text}
            onChange={(e) => onUpdateSettings({ text: e.target.value })}
            rows={2}
            placeholder="Saisissez votre texte..."
            className="w-full px-3 py-2 text-sm bg-black/20 border border-red-500/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/60 text-white resize-none shadow-inner"
          />
          <div className="flex gap-1.5 flex-wrap">
            {['Projet_1 / Phase_2', 'KINETIC GLITCH', 'WAVE PARTICLE', 'VARIABLE 60FPS'].map((preset) => (
              <button
                key={preset}
                onClick={() => onUpdateSettings({ text: preset })}
                className="text-[10px] px-2 py-0.5 rounded-lg btn-liquid-secondary text-[#d9c4c4]"
              >
                {preset}
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================
            2. POLICE VARIABLE
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              Police Variable ({fonts.length})
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importer un fichier de police variable (.ttf ou .woff2)"
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>Import .ttf/.woff2</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.woff2,.otf"
              onChange={handleCustomFileUpload}
              className="hidden"
            />
          </div>

          {/* Déclencheur de la fenêtre de choix de typo (s'ouvre au-dessus de tout) */}
          <button
            onClick={() => setIsFontPickerOpen(true)}
            className="w-full px-3 py-2.5 text-left text-sm bg-black/20 border border-red-500/20 rounded-xl flex items-center justify-between gap-2 text-white hover:border-red-400/50 transition-all shadow-inner"
          >
            <span
              className="font-semibold text-base truncate"
              style={{ fontFamily: `"${selectedFont.name}", sans-serif` }}
            >
              {selectedFont.name}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/30">
                {selectedFont.axes.length} axe{selectedFont.axes.length > 1 ? 's' : ''}
              </span>
              <ChevronDown className="w-4 h-4 text-red-400" />
            </span>
          </button>

          <FontPickerModal
            isOpen={isFontPickerOpen}
            onClose={() => setIsFontPickerOpen(false)}
            fonts={fonts}
            selectedFont={selectedFont}
            onSelectFont={onSelectFont}
            onImportCustomFont={onImportCustomFont}
          />

          <div className="p-3 rounded-xl liquid-glass-subtle border border-red-500/15 text-xs space-y-1.5 text-[#c9adad]">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">{selectedFont.name}</span>
              <a
                href={selectedFont.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] transition-colors"
                title="Consulter le spécimen"
              >
                <span>Spécimen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] text-[#8c6f6f]">
              Auteur : <span className="text-[#c9adad]">{selectedFont.author}</span>
            </div>
            <div className="text-[11px] text-[#8c6f6f] flex items-center gap-1.5">
              <span>Licence :</span>
              <span className="text-red-300 font-mono text-[10px]">
                {selectedFont.license}
              </span>
            </div>
            <div className="pt-1 flex flex-wrap gap-1">
              {selectedFont.axes.map((ax) => (
                <span
                  key={ax.tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/20 border border-red-500/20 text-[#f3e8e8]"
                >
                  {ax.tag} ({ax.min}—{ax.max})
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            3. COULEUR DU TEXTE
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Pipette className="w-3.5 h-3.5 text-red-400" />
              Couleur du Texte
            </label>
            <button
              onClick={onOpenTextColorPicker}
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Roue Chromatique</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Pastille déclencheur */}
            <button
              onClick={onOpenTextColorPicker}
              title="Ouvrir la roue chromatique du texte"
              className="w-10 h-10 rounded-xl border border-white/30 shadow-[0_0_12px_rgba(0,0,0,0.6)] flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
              style={{ backgroundColor: settings.textColor || '#FFFFFF' }}
            >
              <Pipette className="w-3.5 h-3.5 text-black drop-shadow-sm opacity-60" />
            </button>

            {/* Saisie directe du code couleur */}
            <div className="flex-1 flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-red-500/20 shadow-inner">
              <span className="text-red-400 font-mono font-bold text-xs">#</span>
              <input
                type="text"
                value={(settings.textColor || '#FFFFFF').replace('#', '')}
                onChange={(e) => {
                  const val = '#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                  onUpdateSettings({ textColor: val });
                }}
                maxLength={6}
                placeholder="FFFFFF"
                className="w-full text-xs font-mono font-bold uppercase bg-transparent text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Raccourcis de couleurs */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {QUICK_COLORS.map((hex) => (
              <button
                key={hex}
                onClick={() => onUpdateSettings({ textColor: hex })}
                title={hex}
                className={`w-6 h-6 rounded-lg border transition-all ${
                  (settings.textColor || '#FFFFFF').toUpperCase() === hex.toUpperCase()
                    ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                    : 'border-white/20 hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </section>

        {/* ========================================================
            4. TAILLE DE POLICE
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
          <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider">
            Taille de police (px)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustFontSize(-8)}
              className="p-2 rounded-xl btn-liquid-secondary"
              title="Réduire de 8px"
            >
              <Minus className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              type="number"
              min={16}
              max={320}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) || 120 })}
              className="w-full text-center px-3 py-1.5 text-sm font-mono bg-black/20 border border-red-500/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-white shadow-inner"
            />
            <button
              onClick={() => adjustFontSize(8)}
              className="p-2 rounded-xl btn-liquid-secondary"
              title="Augmenter de 8px"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <input
            type="range"
            min={24}
            max={260}
            step={2}
            value={settings.fontSize}
            onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
            className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
          />
        </section>

        {/* ========================================================
            5. ALIGNEMENT
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2">
          <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider">
            Alignement
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-xl border border-red-500/20">
            {[
              { id: 'left', icon: AlignLeft, label: 'Gauche' },
              { id: 'center', icon: AlignCenter, label: 'Centre' },
              { id: 'right', icon: AlignRight, label: 'Droite' },
              { id: 'justify', icon: AlignJustify, label: 'Justifié' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onUpdateSettings({ alignment: id as TextAlignment })}
                title={label}
                className={`py-1.5 flex items-center justify-center rounded-lg transition-all ${
                  settings.alignment === id
                    ? 'btn-liquid-primary shadow-sm'
                    : 'text-[#8c6f6f] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================
            6. DÉTAIL TYPO
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-3">
          <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider">
            Détail Typo
          </label>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Hauteur de ligne (Line height)</span>
              <span className="font-mono text-white">{settings.lineHeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={2.2}
              step={0.05}
              value={settings.lineHeight}
              onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Interlettrage (Letter spacing)</span>
              <span className="font-mono text-white">{settings.letterSpacing}</span>
            </div>
            <input
              type="range"
              min={-20}
              max={50}
              step={1}
              value={settings.letterSpacing}
              onChange={(e) => onUpdateSettings({ letterSpacing: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>
        </section>

        {/* ========================================================
            7. EFFET VISUEL DU TEXTE
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-3.5 border-red-500/25">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Effet Visuel du Texte
            </label>
            <span className="text-[10px] font-mono text-red-300">
              {EFFECT_OPTIONS.find((e) => e.id === (settings.effect || 'wave'))?.label}
            </span>
          </div>

          {/* Boutons sélecteurs de modes d'effets */}
          <div className="grid grid-cols-2 gap-1.5">
            {EFFECT_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
              const isSelected = (settings.effect || 'wave') === id;
              return (
                <button
                  key={id}
                  onClick={() => onUpdateSettings({ effect: id })}
                  title={desc}
                  className={`p-2 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'btn-liquid-primary shadow-sm border-white/30'
                      : 'btn-liquid-secondary text-[#c9adad] border-red-500/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[11px] font-bold truncate">{label}</span>
                  </div>
                  <p className="text-[9px] text-[#8c6f6f] truncate mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Configuration spécifique des POINTS : Couleur des points & Taille de la trame */}
          {isDotMode && (
            <div className="space-y-3 p-3 rounded-2xl bg-black/25 border border-red-500/30 shadow-inner">
              
              {/* Couleur des points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <CircleDot className="w-3 h-3 text-red-400" />
                    Couleur des Points
                  </span>
                  <button
                    onClick={onOpenDotsColorPicker}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                  >
                    <span>Roue Chromatique</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenDotsColorPicker}
                    title="Ouvrir la roue chromatique des points"
                    className="w-8 h-8 rounded-lg border border-white/30 shadow-sm flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
                    style={{ backgroundColor: settings.dotsColor || '#FF3366' }}
                  >
                    <CircleDot className="w-3 h-3 text-white drop-shadow-sm opacity-80" />
                  </button>

                  <div className="flex-1 flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-red-500/20 shadow-inner">
                    <span className="text-red-400 font-mono font-bold text-xs">#</span>
                    <input
                      type="text"
                      value={(settings.dotsColor || '#FF3366').replace('#', '')}
                      onChange={(e) => {
                        const val = '#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                        onUpdateSettings({ dotsColor: val });
                      }}
                      maxLength={6}
                      placeholder="FF3366"
                      className="w-full text-xs font-mono font-bold uppercase bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Nuancier rapide pour les points */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {QUICK_DOTS_COLORS.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => onUpdateSettings({ dotsColor: hex })}
                      title={hex}
                      className={`w-5 h-5 rounded-md border transition-all ${
                        (settings.dotsColor || '#FF3366').toUpperCase() === hex.toUpperCase()
                          ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Slider Taille de la trame de points */}
              <div className="space-y-1.5 pt-1 border-t border-red-500/15">
                <div className="flex justify-between text-xs text-[#c9adad]">
                  <span className="font-semibold text-white">Taille de la trame de points</span>
                  <span className="font-mono text-red-300 font-bold">{settings.dotSize ?? 8} px</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={1}
                  value={settings.dotSize ?? 8}
                  onChange={(e) => onUpdateSettings({ dotSize: Number(e.target.value) })}
                  className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-[#8c6f6f]">
                  <span>Très fin (3px)</span>
                  <span>Moyen (8px)</span>
                  <span>Gros points (20px)</span>
                </div>
              </div>

            </div>
          )}

          {/* Slider Intensité de l'effet */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Intensité de l'effet</span>
              <span className="font-mono text-white">{settings.effectIntensity ?? 70}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.effectIntensity ?? 70}
              onChange={(e) => onUpdateSettings({ effectIntensity: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>

          {/* Slider Halo Néon (Glow) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Halo Lumineux (Glow)</span>
              <span className="font-mono text-white">{settings.glowIntensity ?? 40}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.glowIntensity ?? 40}
              onChange={(e) => onUpdateSettings({ glowIntensity: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>
        </section>

        {/* ========================================================
            8. ONDE DE MOUVEMENT
            ======================================================== */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-3 border-red-500/30">
          <div className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-red-400" />
            <label className="text-[11px] font-bold text-red-300 uppercase tracking-wider">
              Onde de Mouvement
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Fréquence spatiale</span>
              <span className="font-mono text-white">{settings.frequency.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.frequency}
              onChange={(e) => onUpdateSettings({ frequency: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span>Vitesse (Speed)</span>
              <span className="font-mono text-white">{settings.speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0}
              max={3.0}
              step={0.1}
              value={settings.speed}
              onChange={(e) => onUpdateSettings({ speed: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>
        </section>

      </div>
    </div>
  );
};
