/**
 * Modal d'Aide & Guide Pédagogique
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et boutons rubis/grenat
 */

import React from 'react';
import { X, BookOpen, Music, Sliders, Waves, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass border border-red-500/30 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/40 flex items-center justify-center text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Guide du Designer</h2>
              <p className="text-[11px] text-[#8c6f6f]">Typographie Variable & Réactivité Sonore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl btn-liquid-secondary text-[#c9adad]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#c9adad] leading-relaxed flex-1">
          
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-400" />
              1. Qu'est-ce qu'une police variable ?
            </h3>
            <p className="text-[#a88d8d]">
              Une <strong>police variable (OpenType Font Variations)</strong> regroupe toutes les graisses, chasses et inclinaisons dans un seul fichier grâce à des <em>axes d'interpolation continue</em>, pilotés en direct via <code className="font-mono bg-black/50 px-1.5 py-0.5 rounded text-white border border-red-500/20">font-variation-settings: 'wght' 700, 'wdth' 120;</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Music className="w-4 h-4 text-rose-400" />
              2. La chaîne d'analyse sonore (Web Audio API)
            </h3>
            <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-red-500/20 font-mono text-[11px] text-white flex items-center justify-between flex-wrap gap-2 shadow-inner">
              <span>Source (Mic / MP3)</span>
              <span className="text-red-400">→</span>
              <span>Gain (Volume)</span>
              <span className="text-red-400">→</span>
              <span>Égaliseur 3 Bandes</span>
              <span className="text-red-400">→</span>
              <span>AnalyserNode (FFT)</span>
            </div>
            <p className="text-[#a88d8d]">
              L'analyse FFT extrait en continu l'énergie des <strong>Basses (20–250 Hz)</strong>, des <strong>Médiums (250–4000 Hz)</strong>, des <strong>Aigus (4–16 kHz)</strong> et le <strong>Volume global (RMS)</strong>. Un filtre de lissage adaptatif (attaque rapide, relâchement doux) assure une cadence fluide à 60 fps sans saccade.
            </p>
          </section>

          <section className="space-y-2.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-red-400" />
              3. Comment le son transforme la lettre (Mapping)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-amber-500/30">
                <span className="font-bold text-amber-400 block mb-1">🔈 Basses fréquences</span>
                <span className="text-[#a88d8d]">Modulent la <strong>Graisse (wght)</strong>. Les kicks et basses percutantes font gonfler les caractères.</span>
              </div>
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-rose-500/30">
                <span className="font-bold text-rose-400 block mb-1">🔉 Médiums</span>
                <span className="text-[#a88d8d]">Modulent la <strong>Chasse (wdth)</strong> et la <strong>Taille optique (opsz)</strong>. Les voix et synthétiseurs étirent le mot.</span>
              </div>
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-purple-500/30">
                <span className="font-bold text-purple-400 block mb-1">🔊 Aigus</span>
                <span className="text-[#a88d8d]">Modulent l'<strong>Inclinaison (slnt/ital)</strong> et l'<strong>Interlettrage</strong>. Les cymbales et hi-hats créent de la vitesse.</span>
              </div>
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-red-500/30">
                <span className="font-bold text-red-400 block mb-1">⚡ Volume RMS</span>
                <span className="text-[#a88d8d]">Contrôle l'<strong>Amplitude générale</strong> et imprime un punch d'impact sur chaque temps fort.</span>
              </div>
            </div>
            <p className="text-[11px] text-[#8c6f6f] pt-1">
              <strong>Redistribution intelligente :</strong> Si la police sélectionnée ne possède qu'un seul axe (comme <em>Syne</em> ou <em>Oswald</em>), l'intégralité de l'énergie sonore est automatiquement redistribuée sur cet axe pour garantir une réactivité maximale.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-red-300" />
              4. Ondulation cinétique (Fréquence & Vitesse)
            </h3>
            <p className="text-[#a88d8d]">
              Chaque lettre a sa propre phase sinusoïdale calculée selon son index dans la phrase. La <strong>Fréquence</strong> détermine le nombre d'ondulations le long du texte, tandis que la <strong>Vitesse</strong> fait glisser l'onde dans le temps.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-red-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="btn-liquid-primary px-5 py-2 font-bold text-xs rounded-xl"
          >
            Compris, retour à l'atelier
          </button>
        </div>

      </div>
    </div>
  );
};
