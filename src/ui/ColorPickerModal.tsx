/**
 * Composant de Roue Chromatique et Sélecteur de Couleur Précis
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass)
 * 
 * Permet de :
 * 1. Choisir visuellement une teinte sur une roue chromatique 360° interactive (Canvas)
 * 2. Ajuster la luminosité via un curseur dédié
 * 3. Saisir directement un code hexadécimal (ex: #FFFFFF, #FF3366, #00F0FF)
 * 4. Ajuster les composantes RGB directement
 * 5. Sélectionner parmi des teintes typographiques sélectionnées
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Pipette, Check, Sparkles } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSelectColor: (hexColor: string) => void;
  title?: string;
  subtitle?: string;
}

// Utilitaires de conversion de couleurs
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : [r, g, b];
  }
  return null;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
}

const PALETTE_PRESETS = [
  { name: 'Blanc Pur', hex: '#FFFFFF' },
  { name: 'Glace Givrée', hex: '#E0F2FE' },
  { name: 'Rouge Rubis', hex: '#FF3366' },
  { name: 'Flamme Corail', hex: '#FF5E57' },
  { name: 'Ambre Doré', hex: '#FFAA00' },
  { name: 'Jaune Cyber', hex: '#FFE600' },
  { name: 'Vert Fluo', hex: '#00FF88' },
  { name: 'Cyan Néon', hex: '#00F0FF' },
  { name: 'Bleu Électrique', hex: '#3B82F6' },
  { name: 'Violet Spectre', hex: '#B026FF' },
  { name: 'Rose Bubblegum', hex: '#FF70A6' },
  { name: 'Argent Métal', hex: '#A1A1AA' },
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  onSelectColor,
  title,
  subtitle,
}) => {
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(0); // 0 à 1
  const [sat, setSat] = useState(0); // 0 à 1
  const [val, setVal] = useState(1); // 0 à 1 (Luminosité)
  const [hexInput, setHexInput] = useState(currentColor);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);

  // Initialisation des coordonnées HSV depuis la couleur passée en prop
  useEffect(() => {
    const rgb = hexToRgb(currentColor);
    if (rgb) {
      const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setHue(h);
      setSat(s);
      setVal(v);
      setHexInput(currentColor.toUpperCase());
    }
  }, [currentColor, isOpen]);

  // Rendu de la roue chromatique 360° sur Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2;
    const cx = radius;
    const cy = radius;

    ctx.clearRect(0, 0, width, height);

    // Dessin radial pixel par pixel avec dégradé angulaire et saturation
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          // Angle 0 à 2PI -> Hue 0 à 1
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI * 2;
          const h = angle / (Math.PI * 2);
          const s = dist / radius; // Saturation 0 au centre, 1 au bord

          const [r, g, b] = hsvToRgb(h, s, val);
          const idx = (y * width + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Réticule de sélection (curseur blanc/noir avec ombre)
    const angle = hue * Math.PI * 2;
    const dist = sat * radius;
    const selX = cx + Math.cos(angle) * dist;
    const selY = cy + Math.sin(angle) * dist;

    ctx.save();
    ctx.beginPath();
    ctx.arc(selX, selY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(selX, selY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }, [isOpen, hue, sat, val]);

  // Gestion du clic et glissement sur la roue
  const handleWheelInteract = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2;
    const newHue = angle / (Math.PI * 2);
    const newSat = Math.min(1, dist / radius);

    setHue(newHue);
    setSat(newSat);

    const [r, g, b] = hsvToRgb(newHue, newSat, val);
    const hex = rgbToHex(r, g, b);
    setHexInput(hex);
    onSelectColor(hex);
  }, [val, onSelectColor]);

  const handleMouseDownWheel = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingWheel(true);
    handleWheelInteract(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWheel) {
        handleWheelInteract(e);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingWheel(false);
    };

    if (isDraggingWheel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWheel, handleWheelInteract]);

  // Modification du curseur de luminosité
  const handleValChange = (newVal: number) => {
    setVal(newVal);
    const [r, g, b] = hsvToRgb(hue, sat, newVal);
    const hex = rgbToHex(r, g, b);
    setHexInput(hex);
    onSelectColor(hex);
  };

  // Saisie directe de code hexadécimal
  const handleHexInputChange = (text: string) => {
    setHexInput(text);
    const rgb = hexToRgb(text);
    if (rgb) {
      const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setHue(h);
      setSat(s);
      setVal(v);
      const cleanHex = rgbToHex(rgb[0], rgb[1], rgb[2]);
      onSelectColor(cleanHex);
    }
  };

  const handleSelectPreset = (hex: string) => {
    setHexInput(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setHue(h);
      setSat(s);
      setVal(v);
    }
    onSelectColor(hex);
  };

  if (!isOpen) return null;

  const currentRgb = hsvToRgb(hue, sat, val);
  const activeHex = rgbToHex(currentRgb[0], currentRgb[1], currentRgb[2]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass border border-red-500/30 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        
        {/* Header de la modale */}
        <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/40 flex items-center justify-center text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <Pipette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{title || "Roue Chromatique Typo"}</h2>
              <p className="text-[11px] text-[#8c6f6f]">{subtitle || "Sélection de couleur précise & code hexadécimal"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl btn-liquid-secondary text-[#c9adad]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du sélecteur */}
        <div className="p-6 space-y-5">
          
          {/* 1. Roue Chromatique Canvas & Preview */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative p-2 rounded-full liquid-glass-subtle border border-red-500/25 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
              <canvas
                ref={wheelCanvasRef}
                width={190}
                height={190}
                onMouseDown={handleMouseDownWheel}
                className="w-[190px] h-[190px] rounded-full cursor-crosshair block"
              />
            </div>

            {/* Slider de Luminosité */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[11px] text-[#a88d8d]">
                <span>Luminosité</span>
                <span className="font-mono text-white">{Math.round(val * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={val}
                onChange={(e) => handleValChange(Number(e.target.value))}
                className="w-full cursor-pointer h-2 rounded-lg appearance-none"
                style={{
                  background: `linear-gradient(to right, #000000, ${rgbToHex(...hsvToRgb(hue, sat, 1))})`,
                }}
              />
            </div>
          </div>

          {/* 2. Saisie directe du Code Couleur (Hex & RGB) */}
          <div className="liquid-glass-card p-3.5 rounded-2xl space-y-2.5 border border-red-500/20">
            <div className="flex items-center gap-3">
              {/* Échantillon couleur active */}
              <div
                className="w-12 h-12 rounded-xl border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex-shrink-0 transition-colors"
                style={{ backgroundColor: activeHex }}
              />

              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-[#8c6f6f] uppercase tracking-wider block">
                  Code Hexadécimal
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400 font-mono font-bold text-sm">#</span>
                  <input
                    type="text"
                    value={hexInput.replace('#', '')}
                    onChange={(e) => handleHexInputChange('#' + e.target.value)}
                    placeholder="FFFFFF"
                    maxLength={7}
                    className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-black/50 border border-red-500/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-white uppercase shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Décomposition RGB directe */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-red-500/15 text-center font-mono text-[10px]">
              <div className="bg-black/30 p-1.5 rounded-lg border border-red-500/10">
                <span className="text-[#8c6f6f] block">R</span>
                <span className="text-white font-bold">{currentRgb[0]}</span>
              </div>
              <div className="bg-black/30 p-1.5 rounded-lg border border-red-500/10">
                <span className="text-[#8c6f6f] block">G</span>
                <span className="text-white font-bold">{currentRgb[1]}</span>
              </div>
              <div className="bg-black/30 p-1.5 rounded-lg border border-red-500/10">
                <span className="text-[#8c6f6f] block">B</span>
                <span className="text-white font-bold">{currentRgb[2]}</span>
              </div>
            </div>
          </div>

          {/* 3. Nuancier de Préréglages Graphiques */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#8c6f6f] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-400" />
              Nuances Recommandées
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => handleSelectPreset(preset.hex)}
                  title={`${preset.name} (${preset.hex})`}
                  className={`h-7 rounded-xl border transition-all flex items-center justify-center ${
                    activeHex.toUpperCase() === preset.hex.toUpperCase()
                      ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                      : 'border-white/15 hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {activeHex.toUpperCase() === preset.hex.toUpperCase() && (
                    <Check className={`w-3.5 h-3.5 ${preset.hex === '#FFFFFF' || preset.hex === '#FFE600' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-red-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="btn-liquid-primary px-5 py-2 font-bold text-xs rounded-xl"
          >
            Appliquer cette couleur
          </button>
        </div>

      </div>
    </div>
  );
};
