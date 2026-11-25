/**
 * Modal d'Exportation Complète
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et boutons rubis/grenat
 */

import React, { useState, useEffect } from 'react';
import { CharacterKineticState } from '../mapping/kineticMapper';
import { FontItem, TypographySettings } from '../types';
import { generateSvgExport, exportAsPng, triggerDownload, recordAnimationVideo } from '../export/exportManager';
import { 
  X, 
  FileCode, 
  Image as ImageIcon, 
  Video, 
  FileJson, 
  ShieldCheck, 
  Download, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'still' | 'video' | 'json';
  kineticStates: CharacterKineticState[];
  selectedFont: FontItem;
  settings: TypographySettings;
  renderFrameToCanvas: (canvas: HTMLCanvasElement, timestamp: number) => void;
  audioDestination?: MediaStreamAudioDestinationNode | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'still',
  kineticStates,
  selectedFont,
  settings,
  renderFrameToCanvas,
  audioDestination,
}) => {
  const [activeTab, setActiveTab] = useState<'still' | 'video' | 'json'>(initialTab);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(6);
  const [includeAudioInVideo, setIncludeAudioInVideo] = useState(true);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setExportSuccessMessage(msg);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  const handleExportSvg = () => {
    const svg = generateSvgExport(kineticStates, selectedFont, settings, true);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `typowave-${selectedFont.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    triggerDownload(blob, filename);
    showSuccess("Fichier SVG vectoriel exporté avec succès !");
  };

  const handleExportPng = async (scale = 2) => {
    try {
      const svg = generateSvgExport(kineticStates, selectedFont, settings, true);
      const filename = `typowave-${selectedFont.name.toLowerCase().replace(/\s+/g, '-')}-${scale}x.png`;
      await exportAsPng(svg, scale, filename);
      showSuccess(`Image PNG (${scale}x Retina) téléchargée !`);
    } catch (err) {
      alert("Erreur lors de la génération PNG.");
    }
  };

  const handleExportVideo = async () => {
    setIsRecording(true);
    setRecordProgress(0);
    try {
      const blob = await recordAnimationVideo(
        renderFrameToCanvas,
        videoDuration,
        includeAudioInVideo,
        audioDestination,
        (progress) => setRecordProgress(progress)
      );

      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const filename = `typowave-animation-${Date.now()}.${ext}`;
      triggerDownload(blob, filename);
      showSuccess(`Animation vidéo (${ext.toUpperCase()}) enregistrée avec succès !`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la vidéo.");
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  const handleExportJson = () => {
    const data = {
      app: 'TypoWave Studio',
      font: {
        name: selectedFont.name,
        category: selectedFont.category,
        author: selectedFont.author,
        license: selectedFont.license,
        sourceUrl: selectedFont.sourceUrl,
      },
      typography: settings,
      currentKineticValues: kineticStates.map((k) => ({
        char: k.char,
        settings: k.fontVariationSettings,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `typowave-preset-${Date.now()}.json`);
    showSuccess("Configuration JSON exportée !");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass border border-red-500/30 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/40 flex items-center justify-center text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Centre d'Exportation</h2>
              <p className="text-[11px] text-[#8c6f6f]">Formats vectoriels, matriciels & vidéo 60 fps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl btn-liquid-secondary text-[#c9adad]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message de succès */}
        {exportSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Onglets */}
        <div className="flex border-b border-red-500/20 px-6 gap-2 pt-3">
          <button
            onClick={() => setActiveTab('still')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'still'
                ? 'btn-liquid-primary shadow-sm'
                : 'text-[#8c6f6f] hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Figée (SVG / PNG)</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'btn-liquid-primary shadow-sm'
                : 'text-[#8c6f6f] hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Animation Vidéo</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'btn-liquid-primary shadow-sm'
                : 'text-[#8c6f6f] hover:text-white'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>JSON</span>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#c9adad] flex-1">
          
          {/* Onglet 1 : Image Figée */}
          {activeTab === 'still' && (
            <div className="space-y-4">
              <p className="text-[#a88d8d]">
                Capture les réglages d'axes actuels et l'ondulation pour l'insérer dans vos maquettes Figma ou Illustrator.
              </p>

              {/* SVG Vectoriel */}
              <div className="p-4 rounded-2xl liquid-glass-subtle border border-red-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-red-400" />
                      Export SVG Vectoriel Pur
                    </h3>
                    <p className="text-[11px] text-[#8c6f6f] mt-0.5">
                      Compatible Figma. Conserve les balises &lt;text&gt; avec font-variation-settings par glyphe.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportSvg}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl btn-liquid-primary font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le SVG vectoriel</span>
                </button>
              </div>

              {/* PNG Haute Résolution */}
              <div className="p-4 rounded-2xl liquid-glass-subtle border border-red-500/20 space-y-2.5">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-rose-400" />
                  Export Image PNG Haute Définition
                </h3>
                <p className="text-[11px] text-[#8c6f6f]">
                  Rendu matriciel net pour présentations et réseaux sociaux.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleExportPng(2)}
                    className="py-2.5 px-3 rounded-xl btn-liquid-secondary font-semibold"
                  >
                    PNG 2x (Standard)
                  </button>
                  <button
                    onClick={() => handleExportPng(4)}
                    className="py-2.5 px-3 rounded-xl btn-liquid-secondary font-semibold"
                  >
                    PNG 4x (Ultra HD)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onglet 2 : Vidéo */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <p className="text-[#a88d8d]">
                Enregistre l'animation cinétique à 60 images par seconde avec le flux sonore actif.
              </p>

              <div className="space-y-3 p-4 rounded-2xl liquid-glass-subtle border border-red-500/20">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#c9adad]">
                    <span>Durée de l'animation</span>
                    <span className="font-mono font-bold text-white">{videoDuration} secondes</span>
                  </div>
                  <div className="flex gap-2">
                    {[4, 6, 10, 15].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setVideoDuration(dur)}
                        disabled={isRecording}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition-all ${
                          videoDuration === dur
                            ? 'btn-liquid-primary font-bold'
                            : 'btn-liquid-secondary text-[#8c6f6f]'
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAudioInVideo}
                    onChange={(e) => setIncludeAudioInVideo(e.target.checked)}
                    disabled={isRecording}
                    className="rounded border-red-500/40 text-red-600 focus:ring-red-500"
                  />
                  <span>Inclure la piste audio dans la vidéo</span>
                </label>

                {isRecording && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] font-mono text-red-300">
                      <span>Capture 60 fps en cours...</span>
                      <span>{Math.round(recordProgress * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-red-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-100 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                        style={{ width: `${recordProgress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleExportVideo}
                  disabled={isRecording}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    isRecording
                      ? 'btn-liquid-secondary opacity-60 cursor-not-allowed'
                      : 'btn-liquid-primary shadow-lg'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Capture vidéo en cours...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Lancer l'enregistrement vidéo ({videoDuration}s)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Onglet 3 : JSON */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <p className="text-[#a88d8d]">
                Exporte la configuration typographique complète au format JSON.
              </p>
              <button
                onClick={handleExportJson}
                className="w-full py-2.5 px-3 rounded-xl btn-liquid-primary font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <FileJson className="w-4 h-4" />
                <span>Télécharger le preset JSON</span>
              </button>
            </div>
          )}

          {/* Rappel licence OFL */}
          <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-red-500/20 text-[#d9c4c4] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-red-300">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>Attribution Légale (SIL Open Font License)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#a88d8d]">
              La police <strong>{selectedFont.name}</strong> a été conçue par <strong>{selectedFont.author}</strong> sous licence libre <strong>{selectedFont.license}</strong>. 
              Vous pouvez l'utiliser librement pour vos créations personnelles ou commerciales en conservant les crédits.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
