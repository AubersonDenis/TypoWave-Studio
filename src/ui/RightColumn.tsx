/**
 * Colonne droite : Variables et Environnement Audio
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et boutons rubis/grenat
 */

import React, { useRef, useEffect, useState } from 'react';
import { AudioMetrics, AudioSettings, AudioSourceType, FontItem, TypographySettings } from '../types';
import { 
  Sliders, 
  Mic, 
  Music, 
  Volume2, 
  Activity, 
  Download, 
  Save, 
  FolderOpen, 
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface RightColumnProps {
  currentFont: FontItem;
  settings: TypographySettings;
  onUpdateBaseAxis: (tag: string, val: number) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (partial: Partial<AudioSettings>) => void;
  onToggleAudioEnabled: () => void;
  onSwitchAudioSource: (source: AudioSourceType) => void;
  audioMetrics: AudioMetrics;
  audioErrorMessage: string | null;
  onOpenExportModal: () => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onClose?: () => void;
}

export const RightColumn: React.FC<RightColumnProps> = ({
  currentFont,
  settings,
  onUpdateBaseAxis,
  audioSettings,
  onUpdateAudioSettings,
  onToggleAudioEnabled,
  onSwitchAudioSource,
  audioMetrics,
  audioErrorMessage,
  onOpenExportModal,
  onSaveProject,
  onLoadProject,
  onClose,
}) => {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputProjectRef = useRef<HTMLInputElement>(null);
  const [showDetailedEq, setShowDetailedEq] = useState(false);

  // Rendu de la forme d'onde liquide lumineuse haute définition
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Fond verre liquide sombre avec halo radial grenat
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 1.5);
    bgGrad.addColorStop(0, 'rgba(45, 12, 12, 0.85)');
    bgGrad.addColorStop(1, 'rgba(12, 3, 3, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Grille typographique & repères d'oscilloscope subtils
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.08)';
    ctx.lineWidth = 1;
    // Lignes verticales
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Ligne centrale repère
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const buffer = audioMetrics.timeDomain;
    const isPlaying = audioSettings.isEnabled && (audioMetrics.rms > 0.01 || buffer.some(v => Math.abs(v) > 0.02));

    if (buffer && buffer.length > 0 && isPlaying) {
      const centerY = height / 2;
      const step = Math.ceil(buffer.length / width);
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < width; i++) {
        const bufIndex = Math.min(buffer.length - 1, i * step);
        const v = buffer[bufIndex]; // -1.0 à 1.0
        // Amplification dynamique fluide
        const amp = (height / 2.4) * (0.8 + audioMetrics.rms * 0.6);
        const y = centerY - (v * amp);
        points.push({ x: i, y });
      }

      // 3. Remplissage dégradé sous l'onde (Verre liquide rubis)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(width, centerY);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, centerY - (height / 2.5), 0, centerY);
      waveGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      waveGrad.addColorStop(0.7, 'rgba(185, 28, 28, 0.15)');
      waveGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = waveGrad;
      ctx.fill();
      ctx.restore();

      // 4. Réflection symétrique inférieure (effet miroir liquide)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let i = 0; i < points.length; i++) {
        const mirroredY = centerY + (centerY - points[i].y) * 0.45;
        ctx.lineTo(points[i].x, mirroredY);
      }
      ctx.lineTo(width, centerY);
      ctx.closePath();

      const reflectGrad = ctx.createLinearGradient(0, centerY, 0, height);
      reflectGrad.addColorStop(0, 'rgba(255, 77, 109, 0.18)');
      reflectGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = reflectGrad;
      ctx.fill();
      ctx.restore();

      // 5. Halo lumineux rouge néon
      ctx.save();
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ff3366';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // 6. Crête centrale brillante
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

    } else {
      // Onde de veille liquide sinusoïdale fluide
      const time = performance.now() / 800;
      const centerY = height / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin((x / 30) - time) * 4 * Math.sin(x / width * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [audioMetrics, audioSettings.isEnabled]);

  const getAxisEnergyBadge = (tag: string) => {
    switch (tag) {
      case 'wght':
        return { label: 'Graves (Bass)', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
      case 'wdth':
        return { label: 'Médiums', color: 'text-rose-400 bg-rose-950/40 border-rose-500/30' };
      case 'slnt':
      case 'ital':
        return { label: 'Aigus (Treble)', color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' };
      case 'opsz':
        return { label: 'Médiums + RMS', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' };
      default:
        return { label: 'Mix Énergie', color: 'text-red-400 bg-red-950/40 border-red-500/30' };
    }
  };

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadProject(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-[rgba(255,100,100,0.2)] liquid-glass-drawer flex flex-col">
      <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mt-2 md:hidden flex-shrink-0" />
      {onClose && (
        <div className="px-4 py-2.5 md:py-3 border-b border-[rgba(255,100,100,0.12)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold tracking-wide text-white uppercase">Axes & Environnement Audio</span>
          </div>
          <button
            onClick={onClose}
            title="Fermer le menu audio et axes"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl btn-liquid-secondary text-[#c9adad] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* 1. VARIABLE AXES DYNAMIQUES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              Variable Axes ({currentFont.axes.length})
            </label>
            <span className="text-[10px] text-[#8c6f6f] font-mono">
              Réactif en direct
            </span>
          </div>

          <div className="space-y-2.5">
            {currentFont.axes.map((axis) => {
              const baseVal = settings.baseAxes[axis.tag] !== undefined
                ? settings.baseAxes[axis.tag]
                : axis.defaultVal;

              const badge = getAxisEnergyBadge(axis.tag);

              return (
                <div
                  key={axis.tag}
                  className="liquid-glass-card p-3 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">
                        {axis.name}
                      </span>
                      <span className="ml-1 text-[10px] font-mono text-[#8c6f6f]">
                        ({axis.tag})
                      </span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#c9adad]">
                    <span className="text-[10px] text-[#8c6f6f] font-mono">{axis.min}</span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {baseVal}
                    </span>
                    <span className="text-[10px] text-[#8c6f6f] font-mono">{axis.max}</span>
                  </div>

                  <input
                    type="range"
                    min={axis.min}
                    max={axis.max}
                    step={axis.step}
                    value={baseVal}
                    onChange={(e) => onUpdateBaseAxis(axis.tag, Number(e.target.value))}
                    className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. ENVIRONNEMENT & RÉGLAGE MICRO / AUDIO */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              Environnement Sonore
            </label>

            {/* Interrupteur ON/OFF global */}
            <button
              onClick={onToggleAudioEnabled}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all ${
                audioSettings.isEnabled
                  ? 'btn-liquid-primary shadow-md'
                  : 'btn-liquid-secondary opacity-60'
              }`}
            >
              {audioSettings.isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Message d'erreur didactique si micro ou audio échoue */}
          {audioErrorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 shadow-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold text-white">Information :</p>
                <p className="text-[11px] leading-tight text-red-200/90">{audioErrorMessage}</p>
              </div>
            </div>
          )}

          {/* Interrupteur de source : Musique vs Microphone */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#a88d8d]">Source active</span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/20 rounded-xl border border-red-500/20">
              <button
                onClick={() => onSwitchAudioSource('file')}
                className={`py-1.5 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  audioSettings.sourceType === 'file'
                    ? 'btn-liquid-primary shadow-xs'
                    : 'text-[#8c6f6f] hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Musique</span>
              </button>
              <button
                onClick={() => onSwitchAudioSource('mic')}
                className={`py-1.5 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  audioSettings.sourceType === 'mic'
                    ? 'btn-liquid-primary shadow-xs'
                    : 'text-[#8c6f6f] hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Microphone</span>
              </button>
            </div>
          </div>

          {/* Slider Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#c9adad]">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-red-400" />
                Volume (Gain d'entrée)
              </span>
              <span className="font-mono text-white">{audioSettings.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={audioSettings.volume}
              onChange={(e) => onUpdateAudioSettings({ volume: Number(e.target.value) })}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
          </div>

          {/* Slider Equalizer */}
          <div className="space-y-1.5 p-2.5 rounded-xl liquid-glass-subtle border border-red-500/15">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Égaliseur (EQ)</span>
              <button
                onClick={() => setShowDetailedEq(!showDetailedEq)}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>{showDetailedEq ? 'Simple' : '3 bandes'}</span>
              </button>
            </div>

            {!showDetailedEq ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#8c6f6f]">
                  <span>Balance Spectrale</span>
                  <span className="font-mono text-red-300">
                    {audioSettings.equalizer.bass > 0 ? `+${audioSettings.equalizer.bass} dB` : `${audioSettings.equalizer.bass} dB`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={audioSettings.equalizer.bass}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateAudioSettings({
                      equalizer: { bass: val, mid: Math.round(val * 0.3), treble: -val },
                    });
                  }}
                  className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-[#8c6f6f]">
                  <span>Plus d'aigus</span>
                  <span>Neutre</span>
                  <span>Plus de graves</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-[#8c6f6f]">
                    <span>Graves (250Hz)</span>
                    <span className="font-mono text-white">{audioSettings.equalizer.bass}dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={audioSettings.equalizer.bass}
                    onChange={(e) =>
                      onUpdateAudioSettings({
                        equalizer: { ...audioSettings.equalizer, bass: Number(e.target.value) },
                      })
                    }
                    className="w-full cursor-pointer h-1 rounded-lg appearance-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#8c6f6f]">
                    <span>Médiums (1kHz)</span>
                    <span className="font-mono text-white">{audioSettings.equalizer.mid}dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={audioSettings.equalizer.mid}
                    onChange={(e) =>
                      onUpdateAudioSettings({
                        equalizer: { ...audioSettings.equalizer, mid: Number(e.target.value) },
                      })
                    }
                    className="w-full cursor-pointer h-1 rounded-lg appearance-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#8c6f6f]">
                    <span>Aigus (4kHz)</span>
                    <span className="font-mono text-white">{audioSettings.equalizer.treble}dB</span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={audioSettings.equalizer.treble}
                    onChange={(e) =>
                      onUpdateAudioSettings({
                        equalizer: { ...audioSettings.equalizer, treble: Number(e.target.value) },
                      })
                    }
                    className="w-full cursor-pointer h-1 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. ONDE SONORE REDESIGNÉE EN VERRE LIQUIDE */}
        <section className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#e8c8c8] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              Onde Sonore (Temps Réel)
            </label>
            <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/30">
              <span className={`w-1.5 h-1.5 rounded-full ${audioMetrics.rms > 0.05 ? 'bg-red-400 animate-ping' : 'bg-red-700'}`} />
              <span>RMS: {Math.round(audioMetrics.rms * 100)}%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-black/30 border border-red-500/25 text-white shadow-inner relative overflow-hidden group">
            {/* Visualisation Waveform Canvas Haute Définition */}
            <div className="h-28 w-full rounded-xl overflow-hidden border border-red-500/30 relative shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <canvas
                ref={waveformCanvasRef}
                width={480}
                height={160}
                className="w-full h-full block"
              />
              {/* Badges d'ambiance en surimpression discrète */}
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-red-400/60 pointer-events-none">
                <span>FFT 1024 • 60 FPS</span>
                <span>OSCILLOSCOPE RUBIS</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ACTIONS : EXPORT ET SAUVEGARDE PROJET */}
        <section className="space-y-2 pt-1">
          <button
            onClick={onOpenExportModal}
            className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Exporter (SVG, PNG, Vidéo)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSaveProject}
              className="py-2 px-3 rounded-xl btn-liquid-secondary text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-red-400" />
              <span>Save Projet</span>
            </button>

            <button
              onClick={() => fileInputProjectRef.current?.click()}
              className="py-2 px-3 rounded-xl btn-liquid-secondary text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Charger</span>
            </button>
            <input
              ref={fileInputProjectRef}
              type="file"
              accept=".json"
              onChange={handleProjectFileChange}
              className="hidden"
            />
          </div>
        </section>

      </div>
    </div>
  );
};
