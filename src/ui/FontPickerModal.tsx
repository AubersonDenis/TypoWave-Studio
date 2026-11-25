/**
 * Fenêtre dédiée au choix de la police variable
 * S'ouvre au-dessus de toutes les autres fenêtres de modification (z-100)
 * et affiche chaque police directement dans sa propre typographie.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FontItem } from '../types';
import { preloadFontList } from '../fonts/fontLoader';
import { Search, X, Check, Upload, Type } from 'lucide-react';

interface FontPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fonts: FontItem[];
  selectedFont: FontItem;
  onSelectFont: (font: FontItem) => void;
  onImportCustomFont: (file: File) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Toutes' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'monospace', label: 'Mono' },
  { id: 'handwriting', label: 'Script' },
];

export const FontPickerModal: React.FC<FontPickerModalProps> = ({
  isOpen,
  onClose,
  fonts,
  selectedFont,
  onSelectFont,
  onImportCustomFont,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Précharger toutes les polices dès l'ouverture pour afficher chaque typo avec sa font réelle
  useEffect(() => {
    if (!isOpen) return;
    preloadFontList(fonts);
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, fonts]);

  // Fermeture via la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFonts = fonts.filter((f) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      f.name.toLowerCase().includes(query) ||
      f.author.toLowerCase().includes(query) ||
      f.axes.some((ax) => ax.tag.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCustomFont(e.target.files[0]);
      onClose();
      e.target.value = '';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sélectionner une police variable"
    >
      <div
        className="w-full max-w-2xl max-h-[82vh] flex flex-col rounded-3xl bg-[#140505]/95 backdrop-blur-2xl border border-red-500/35 shadow-[0_24px_80px_rgba(0,0,0,0.92)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la fenêtre */}
        <div className="px-5 py-4 border-b border-red-500/20 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/40 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0">
              <Type className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base text-white truncate">
                Choisir une Police Variable
              </h2>
              <p className="text-xs text-[#a88d8d] truncate">
                {fonts.length} polices libres · Aperçu direct dans chaque typographie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importer un fichier de police variable (.ttf, .woff2, .otf)"
              className="btn-liquid-secondary px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Importer .ttf/.woff2</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.woff2,.otf"
              onChange={handleCustomUpload}
              className="hidden"
            />

            <button
              onClick={onClose}
              title="Fermer (Échap)"
              className="p-2 rounded-xl btn-liquid-secondary text-[#c9adad] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres par catégorie */}
        <div className="px-5 py-3.5 border-b border-red-500/15 space-y-3 bg-black/25 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a88d8d]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, auteur ou axe (ex: wght, wdth, slnt)..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-black/45 border border-red-500/25 rounded-xl text-white placeholder:text-[#8c6f6f] focus:outline-none focus:ring-1 focus:ring-red-500/70"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#8c6f6f] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? fonts.length
                  : fonts.filter((f) => f.category === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'btn-liquid-primary font-semibold'
                      : 'btn-liquid-secondary text-[#c9adad]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-white/80' : 'text-[#8c6f6f]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des polices écrites chacune avec sa propre fonte */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFonts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-[#c9adad]">Aucune police ne correspond à « {searchTerm} ».</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = selectedFont.id === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => {
                    onSelectFont(font);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all border ${
                    isSelected
                      ? 'bg-red-950/75 border-red-500/60 text-white shadow-[0_0_20px_rgba(239,68,68,0.22)]'
                      : 'bg-white/[0.03] hover:bg-red-950/35 border-white/[0.06] hover:border-red-500/30 text-[#f3e8e8]'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Nom de la police rendu directement avec sa propre fonte */}
                    <div
                      className="text-xl sm:text-2xl text-white truncate leading-snug"
                      style={{ fontFamily: `"${font.name}", sans-serif` }}
                    >
                      {font.name}
                    </div>
                    {/* Métadonnées propres sans boîtes */}
                    <div className="text-xs text-[#a88d8d] flex items-center gap-2 truncate">
                      <span className="truncate">{font.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{font.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-red-300/80">
                        {font.axes.map((a) => a.tag).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Échantillon rapide dans la fonte + indicateur de sélection */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="hidden sm:inline text-lg text-[#d9c4c4]/80 select-none"
                      style={{ fontFamily: `"${font.name}", sans-serif` }}
                    >
                      AaBbGg
                    </span>
                    {isSelected && (
                      <span className="w-7 h-7 rounded-full btn-liquid-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
