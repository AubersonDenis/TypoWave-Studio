/**
 * Barre de contrôle du lecteur audio en bas de page (toujours visible)
 * Direction artistique : Fond #0F0404, Verre Liquide (Liquid Glass) et boutons rubis/grenat
 */

import React, { useRef } from 'react';
import { AudioSourceType } from '../types';
import { Play, Pause, Upload, Sparkles, Music, Mic } from 'lucide-react';

interface AudioPlayerBarProps {
  sourceType: AudioSourceType;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fileName: string | null;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onUploadFile: (file: File) => void;
  onLoadDemoBeat: () => void;
  onSwitchToFile: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  sourceType,
  isPlaying,
  currentTime,
  duration,
  fileName,
  onTogglePlay,
  onSeek,
  onUploadFile,
  onLoadDemoBeat,
  onSwitchToFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-14 flex-shrink-0 border-t border-[rgba(255,100,100,0.14)] liquid-glass px-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4 z-30 relative shadow-2xl">
      {sourceType === 'mic' ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.35)]">
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white whitespace-nowrap">Capture Microphone Active</div>
              <div className="text-[10px] text-[#8c6f6f] whitespace-nowrap">Analyse sonore en temps réel</div>
            </div>
          </div>

          <div className="flex-1 hidden sm:flex items-center justify-center">
            <button
              onClick={onSwitchToFile}
              className="btn-liquid-secondary px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Music className="w-3.5 h-3.5 text-red-400" />
              <span>Revenir au lecteur audio</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Contrôles de lecture & Info fichier */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full btn-liquid-primary flex items-center justify-center transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-white text-white" />
              )}
            </button>

            <div className="hidden sm:block text-xs">
              <div className="font-bold text-white truncate max-w-[200px] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{fileName || 'Beat Démo Synthétisé'}</span>
              </div>
              <div className="text-[10px] text-[#8c6f6f] font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration || 12)}
              </div>
            </div>
          </div>

          {/* Barre de progression temporelle (Timeline) */}
          <div className="flex-1 max-w-xl flex items-center gap-2.5">
            <span className="text-[10px] font-mono tabular-nums text-[#8c6f6f] w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full cursor-pointer h-1.5 rounded-lg appearance-none"
            />
            <span className="text-[10px] font-mono tabular-nums text-[#8c6f6f] w-8 shrink-0">
              {formatTime(duration || 12)}
            </span>
          </div>
        </>
      )}

      {/* Import de fichier et raccourci Démo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-liquid-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
          title="Importer un fichier audio local (MP3, WAV, AAC, M4A)"
        >
          <Upload className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden md:inline">Importer Musique</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={onLoadDemoBeat}
          className="p-2 rounded-xl btn-liquid-secondary text-red-300 shrink-0"
          title="Charger le Beat Démo de test"
        >
          <Sparkles className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
};
