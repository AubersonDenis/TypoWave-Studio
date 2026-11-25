/**
 * Moteur Web Audio API pour TypoWave Studio
 * Gère les sources sonores (Fichier MP3/WAV ou Microphone), le gain, l'égaliseur 3 bandes,
 * et l'analyse FFT en temps réel avec lissage pour l'animation typographique.
 * 
 * Correction critique : maintien d'une instance HTMLAudioElement unique et persistante
 * pour éviter la déconnexion du MediaElementAudioSourceNode lors du chargement de fichiers.
 */

import { AudioMetrics, AudioSourceType } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  
  // Instance audio unique et persistante pour le fichier
  private audioElement: HTMLAudioElement | null = null;
  private fileSourceNode: MediaElementAudioSourceNode | null = null;
  private currentObjectUrl: string | null = null;
  public currentFileName: string | null = null;

  // Noeuds de traitement audio
  private gainNode: GainNode | null = null;
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Buffers d'analyse
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Float32Array<ArrayBuffer> | null = null;

  // Lissage des métriques (Smoothing / Interpolation temporelle)
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;
  private smoothedRms = 0;
  private smoothedPeakL = 0;
  private smoothedPeakR = 0;

  private currentSourceType: AudioSourceType = 'file';
  private isEnabled = true;
  private volumeLevel = 80; // 0 à 100
  private eqSettings = { bass: 0, mid: 0, treble: 0 }; // dB (-12 à +12)
  private masterEqAdjustment = 0; // micro-ajustement -10 à +10

  // Statut
  public isMicActive = false;
  public isFilePlaying = false;
  public audioDuration = 0;
  public audioCurrentTime = 0;
  public errorMessage: string | null = null;

  // Événements
  private onStateChangeCallback: (() => void) | null = null;

  constructor() {
    // Initialisation paresseuse au premier geste
  }

  public setOnStateChange(cb: () => void) {
    this.onStateChangeCallback = cb;
  }

  private notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  /**
   * Initialise le graphe Web Audio avec noeuds persistants
   */
  public initContext(): AudioContext {
    if (this.ctx) return this.ctx;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Gain principal (Volume)
    this.gainNode = this.ctx.createGain();
    this.setVolume(this.volumeLevel);

    // 2. Égaliseur 3 bandes (BiquadFilter)
    // Graves (Lowshelf < 250 Hz)
    this.lowFilter = this.ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 250;

    // Médiums (Peaking ~ 1000 Hz)
    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1.0;

    // Aigus (Highshelf > 4000 Hz)
    this.highFilter = this.ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 4000;

    this.applyEqualizerValues();

    // 3. Analyseur FFT
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.75;

    this.freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeData = new Float32Array(this.analyserNode.fftSize);

    // 4. Chaîne de traitement : Source -> Gain -> Low -> Mid -> High -> Analyser & Destination
    this.gainNode.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.analyserNode);

    // Pour les fichiers audio, relier également la sortie aux haut-parleurs
    this.highFilter.connect(this.ctx.destination);

    // 5. Création unique de l'élément Audio persistent
    this.setupPersistentAudioElement();

    return this.ctx;
  }

  /**
   * Configure un élément HTMLAudioElement unique raccordé une fois pour toutes au MediaElementSourceNode
   */
  private setupPersistentAudioElement() {
    if (this.audioElement || !this.ctx || !this.gainNode) return;

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';

    audio.onloadedmetadata = () => {
      this.audioDuration = audio.duration || 0;
      this.notifyStateChange();
    };

    audio.ontimeupdate = () => {
      this.audioCurrentTime = audio.currentTime || 0;
      this.notifyStateChange();
    };

    audio.onplay = () => {
      this.isFilePlaying = true;
      this.notifyStateChange();
    };

    audio.onpause = () => {
      this.isFilePlaying = false;
      this.notifyStateChange();
    };

    audio.onerror = (e) => {
      console.error("Erreur de l'élément audio:", audio.error);
      this.errorMessage = "Erreur de lecture du fichier audio (format incompatible ou flux interrompu).";
      this.isFilePlaying = false;
      this.notifyStateChange();
    };

    this.audioElement = audio;

    try {
      this.fileSourceNode = this.ctx.createMediaElementSource(audio);
      this.fileSourceNode.connect(this.gainNode);
    } catch (err) {
      console.error("Erreur createMediaElementSource:", err);
    }
  }

  /**
   * Active ou coupe l'environnement sonore (Interrupteur ON/OFF)
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (this.ctx && this.gainNode) {
      if (!this.isEnabled) {
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } else {
        this.setVolume(this.volumeLevel);
      }
    }
    this.notifyStateChange();
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Règle le volume de 0 à 100
   */
  public setVolume(volume: number) {
    this.volumeLevel = Math.max(0, Math.min(100, volume));
    if (this.gainNode && this.ctx && this.isEnabled) {
      const gainValue = (this.volumeLevel / 100) * 1.5;
      this.gainNode.gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.03);
    }
    this.notifyStateChange();
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  /**
   * Ajuste l'égaliseur
   */
  public setEqualizer(bass: number, mid: number, treble: number, masterAdjustment = 0) {
    this.eqSettings = { bass, mid, treble };
    this.masterEqAdjustment = masterAdjustment;
    this.applyEqualizerValues();
    this.notifyStateChange();
  }

  public setMasterEqualizerAdjustment(val: number) {
    this.masterEqAdjustment = val;
    this.applyEqualizerValues();
    this.notifyStateChange();
  }

  private applyEqualizerValues() {
    if (!this.lowFilter || !this.midFilter || !this.highFilter || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const lowGain = this.eqSettings.bass + (this.masterEqAdjustment > 0 ? this.masterEqAdjustment * 0.5 : 0);
    const midGain = this.eqSettings.mid;
    const highGain = this.eqSettings.treble + (this.masterEqAdjustment < 0 ? Math.abs(this.masterEqAdjustment) * 0.5 : 0);

    this.lowFilter.gain.setTargetAtTime(lowGain, now, 0.05);
    this.midFilter.gain.setTargetAtTime(midGain, now, 0.05);
    this.highFilter.gain.setTargetAtTime(highGain, now, 0.05);
  }

  /**
   * Bascule la source active entre 'mic' et 'file'
   */
  public async setSourceType(type: AudioSourceType): Promise<boolean> {
    this.errorMessage = null;
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (type === 'mic') {
      if (this.audioElement && !this.audioElement.paused) {
        this.audioElement.pause();
        this.isFilePlaying = false;
      }
      const success = await this.startMicrophone();
      if (success) {
        this.currentSourceType = 'mic';
      }
      this.notifyStateChange();
      return success;
    } else {
      this.stopMicrophone();
      this.currentSourceType = 'file';
      this.notifyStateChange();
      return true;
    }
  }

  public getSourceType(): AudioSourceType {
    return this.currentSourceType;
  }

  /**
   * Démarrage du microphone avec gestion propre des autorisations
   */
  private async startMicrophone(): Promise<boolean> {
    this.stopMicrophone();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorMessage = "Le microphone nécessite un environnement sécurisé (HTTPS ou localhost) non disponible ici.";
      console.warn(this.errorMessage);
      return false;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (!this.ctx || !this.gainNode) return false;

      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
      this.micSourceNode.connect(this.gainNode);
      this.isMicActive = true;
      this.errorMessage = null;
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.errorMessage = "Accès au micro refusé. Veuillez autoriser le micro dans les paramètres du navigateur.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        this.errorMessage = "Aucun microphone détecté sur votre appareil.";
      } else {
        this.errorMessage = `Erreur micro : ${error.message || 'Impossible d\'activer le microphone'}`;
      }
      console.warn(this.errorMessage, err);
      this.isMicActive = false;
      return false;
    }
  }

  /**
   * Arrêt du microphone
   */
  private stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.isMicActive = false;
  }

  /**
   * Charge un fichier audio utilisateur (.mp3, .wav, .m4a, .aac, .ogg)
   * et le lit de manière fiable sans casser le graphe audio
   */
  public async loadAudioFile(file: File): Promise<boolean> {
    this.initContext();
    this.errorMessage = null;

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
      }

      this.currentObjectUrl = URL.createObjectURL(file);
      this.currentFileName = file.name;

      if (!this.audioElement) {
        this.setupPersistentAudioElement();
      }

      const audio = this.audioElement!;
      audio.pause();
      // Pour les Blob URLs locales, NE PAS mettre crossorigin="anonymous" (provoque des erreurs CORS dans Chrome)
      audio.removeAttribute('crossorigin');
      audio.src = this.currentObjectUrl;
      audio.load();

      this.currentSourceType = 'file';
      this.notifyStateChange();

      // Démarrage automatique de la lecture
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch((err) => {
          console.warn("Autoplay restreint par le navigateur, en attente du clic utilisateur:", err);
          this.isFilePlaying = false;
          this.notifyStateChange();
        });
      }

      return true;
    } catch (err) {
      console.error("Erreur de chargement du fichier audio:", err);
      this.errorMessage = "Impossible de charger ce fichier audio. Essayez un autre fichier MP3 ou WAV.";
      this.notifyStateChange();
      return false;
    }
  }

  /**
   * Charge un son de démonstration synthétisé pour tester instantanément
   */
  public async loadDemoAudio(): Promise<boolean> {
    this.initContext();
    this.errorMessage = null;

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const sampleRate = 44100;
    const duration = 12; // 12 secondes de boucle électro/groove
    const numSamples = sampleRate * duration;
    const buffer = this.ctx!.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const bpm = 124;
    const beatLength = sampleRate * (60 / bpm);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const beatPos = (i % beatLength) / beatLength;
      const barPos = (i % (beatLength * 4)) / (beatLength * 4);

      // Kick percutant
      const kickEnv = Math.max(0, 1 - beatPos * 4);
      const kickFreq = 120 * Math.exp(-beatPos * 25) + 40;
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.8;

      // Snare / clap
      const isSnareTime = (barPos > 0.23 && barPos < 0.27) || (barPos > 0.73 && barPos < 0.77);
      const snareNoise = (Math.random() * 2 - 1) * (isSnareTime ? 0.35 : 0);

      // Bass synthétique ondulante
      const bassFreq = [55, 65, 49, 73][Math.floor((t * 2) % 4)];
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.4 * (1 - (beatPos % 0.5) * 1.5);

      // Hi-hats métalliques rapides
      const hatEnv = Math.max(0, 1 - ((i % (beatLength / 2)) / (beatLength / 2)) * 8);
      const hat = (Math.random() * 2 - 1) * hatEnv * 0.15;

      const monoSignal = kick + snareNoise + bass + hat;
      left[i] = monoSignal * 0.8;
      right[i] = monoSignal * 0.8;
    }

    const wavBlob = audioBufferToWavBlob(buffer);
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }
    this.currentObjectUrl = URL.createObjectURL(wavBlob);
    this.currentFileName = "Beat Démo Synthétisé (124 BPM)";

    if (!this.audioElement) {
      this.setupPersistentAudioElement();
    }

    const audio = this.audioElement!;
    audio.pause();
    audio.removeAttribute('crossorigin');
    audio.src = this.currentObjectUrl;
    audio.load();

    this.currentSourceType = 'file';
    this.notifyStateChange();

    try {
      await audio.play();
    } catch (err) {
      console.warn("Play automatique bloqué:", err);
    }

    return true;
  }

  /**
   * Contrôles de lecture fichier
   */
  public async playFile(): Promise<void> {
    this.initContext();
    if (!this.audioElement || this.currentSourceType !== 'file') return;
    
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      await this.audioElement.play();
      this.isFilePlaying = true;
      this.notifyStateChange();
    } catch (err) {
      console.warn("Impossible de lancer la lecture:", err);
      this.errorMessage = "Cliquez sur Lecture pour lancer la piste.";
      this.notifyStateChange();
    }
  }

  public pauseFile(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isFilePlaying = false;
      this.notifyStateChange();
    }
  }

  public togglePlayPause(): void {
    if (!this.audioElement) {
      this.initContext();
    }
    const audio = this.audioElement;
    if (!audio || !audio.src) {
      this.loadDemoAudio();
      return;
    }
    if (audio.paused) {
      this.playFile();
    } else {
      this.pauseFile();
    }
  }

  public seekFile(seconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioDuration, seconds));
      this.audioCurrentTime = this.audioElement.currentTime;
      this.notifyStateChange();
    }
  }

  /**
   * Calcul continu des métriques sonores (Basses, Médiums, Aigus, RMS, VU-mètres)
   */
  public getMetrics(): AudioMetrics {
    const emptyMetrics: AudioMetrics = {
      bass: 0,
      mid: 0,
      treble: 0,
      rms: 0,
      peakL: 0,
      peakR: 0,
      timeDomain: new Float32Array(512),
    };

    if (!this.isEnabled || !this.analyserNode || !this.freqData || !this.timeData) {
      this.smoothedBass *= 0.85;
      this.smoothedMid *= 0.85;
      this.smoothedTreble *= 0.85;
      this.smoothedRms *= 0.85;
      this.smoothedPeakL *= 0.85;
      this.smoothedPeakR *= 0.85;

      return {
        bass: this.smoothedBass,
        mid: this.smoothedMid,
        treble: this.smoothedTreble,
        rms: this.smoothedRms,
        peakL: this.smoothedPeakL,
        peakR: this.smoothedPeakR,
        timeDomain: new Float32Array(512),
      };
    }

    this.analyserNode.getByteFrequencyData(this.freqData);
    this.analyserNode.getFloatTimeDomainData(this.timeData);

    const binCount = this.analyserNode.frequencyBinCount;

    let bassSum = 0;
    const bassEnd = Math.min(7, binCount);
    for (let i = 1; i < bassEnd; i++) {
      bassSum += this.freqData[i];
    }
    const rawBass = bassSum / ((bassEnd - 1) * 255);

    let midSum = 0;
    const midEnd = Math.min(95, binCount);
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this.freqData[i];
    }
    const rawMid = midSum / ((midEnd - bassEnd) * 255);

    let trebleSum = 0;
    const trebleEnd = Math.min(380, binCount);
    for (let i = midEnd; i < trebleEnd; i++) {
      trebleSum += this.freqData[i];
    }
    const rawTreble = trebleSum / ((trebleEnd - midEnd) * 255);

    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      sumSquares += this.timeData[i] * this.timeData[i];
    }
    const rawRms = Math.min(1, Math.sqrt(sumSquares / this.timeData.length) * 3.2);

    const rawPeakL = Math.min(1, rawRms * 0.7 + rawBass * 0.5);
    const rawPeakR = Math.min(1, rawRms * 0.7 + rawTreble * 0.5);

    const attack = 0.45;
    const decay = 0.15;

    const smooth = (current: number, target: number) => {
      const alpha = target > current ? attack : decay;
      return current + (target - current) * alpha;
    };

    this.smoothedBass = smooth(this.smoothedBass, rawBass);
    this.smoothedMid = smooth(this.smoothedMid, rawMid);
    this.smoothedTreble = smooth(this.smoothedTreble, rawTreble);
    this.smoothedRms = smooth(this.smoothedRms, rawRms);
    this.smoothedPeakL = smooth(this.smoothedPeakL, rawPeakL);
    this.smoothedPeakR = smooth(this.smoothedPeakR, rawPeakR);

    return {
      bass: Math.min(1, Math.max(0, this.smoothedBass)),
      mid: Math.min(1, Math.max(0, this.smoothedMid)),
      treble: Math.min(1, Math.max(0, this.smoothedTreble)),
      rms: Math.min(1, Math.max(0, this.smoothedRms)),
      peakL: Math.min(1, Math.max(0, this.smoothedPeakL)),
      peakR: Math.min(1, Math.max(0, this.smoothedPeakR)),
      timeDomain: this.timeData,
    };
  }

  /**
   * Récupère le MediaStream actif pour l'exportation vidéo
   */
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode | null {
    if (!this.ctx || !this.highFilter) return null;
    if (!this.mediaStreamDest) {
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();
      this.highFilter.connect(this.mediaStreamDest);
    }
    return this.mediaStreamDest;
  }
}

/**
 * Utilitaire pour convertir un AudioBuffer en Blob WAV standard
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
