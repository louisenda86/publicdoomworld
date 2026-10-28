// Audio Controller for PUBLIC DOOM:
// Plays the background music tracks extracted & synthesized from DEATH_OF_INTERESTING_THINGS_1080p60.mp4,
// plus real-time WebAudio PS1 UI SFX and character speech blips.

export const TRACK_LIST = [
  { id: 'studio-lofi', title: '01 · STUDIO LOFI (CH.LOFI)', world: 'studio', src: './assets/audio/studio-lofi.mp3' },
  { id: 'playground-retro', title: '02 · TIDAK MAU BEAT (CH.RETRO)', world: 'playground', src: './assets/audio/playground-retro.mp3' },
  { id: 'diner-warm', title: "03 · HOMER'S LATE SHIFT (CH.WARM)", world: 'diner', src: './assets/audio/diner-warm.mp3' },
  { id: 'meadow-home', title: '04 · VOXEL MEADOW (CH.HOME)', world: 'meadow', src: './assets/audio/meadow-home.mp3' },
  { id: 'video-bgm-extract', title: '05 · DEATH OF INTERESTING THINGS (STEREO BED)', world: 'island', src: './assets/audio/video-bgm-extract.mp3' },
  { id: 'video-ost-cut', title: '06 · DEATH OF INTERESTING THINGS (ORIGINAL VIDEO MIX)', world: null, src: './assets/audio/video-ost-cut.mp3' },
];

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.freqData = new Uint8Array(16);
    this.bgmAudio = new Audio();
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.58;
    this.bgmAudio.crossOrigin = 'anonymous';
    this.bootAudio = new Audio('./assets/audio/ps1-boot.mp3');
    this.bootAudio.volume = 0.72;
    this.currentTrackIdx = 0;
    this.muted = false;
    this.playing = false;
    this.sourceConnected = false;
    this.onTrackChange = null;
  }

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.sourceConnected) {
      try {
        const src = this.ctx.createMediaElementSource(this.bgmAudio);
        src.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.sourceConnected = true;
      } catch (_) {
        // Fallback if already connected
      }
    }
  }

  playBoot() {
    if (this.muted) return;
    this.ensureCtx();
    this.bootAudio.currentTime = 0;
    this.bootAudio.play().catch(() => {});
  }

  playTrackById(id, autoPlay = true) {
    const idx = TRACK_LIST.findIndex(t => t.id === id);
    if (idx >= 0) this.playTrackIndex(idx, autoPlay);
  }

  playTrackIndex(idx, autoPlay = true) {
    this.currentTrackIdx = (idx + TRACK_LIST.length) % TRACK_LIST.length;
    const tr = TRACK_LIST[this.currentTrackIdx];
    const changed = !this.bgmAudio.src.endsWith(tr.src.replace('./', ''));
    if (changed) {
      this.bgmAudio.src = tr.src;
    }
    if (autoPlay && !this.muted) {
      this.ensureCtx();
      this.bgmAudio.play().then(() => {
        this.playing = true;
        if (this.onTrackChange) this.onTrackChange(tr, this.playing);
      }).catch(() => {
        if (this.onTrackChange) this.onTrackChange(tr, this.playing);
      });
    } else if (this.onTrackChange) {
      this.onTrackChange(tr, this.playing);
    }
  }

  nextTrack() {
    this.playTrackIndex(this.currentTrackIdx + 1, true);
    this.sfxClick(980);
  }

  togglePlay() {
    this.ensureCtx();
    if (this.bgmAudio.paused) {
      if (!this.bgmAudio.src) this.bgmAudio.src = TRACK_LIST[this.currentTrackIdx].src;
      this.bgmAudio.play().then(() => {
        this.playing = true;
        if (this.onTrackChange) this.onTrackChange(TRACK_LIST[this.currentTrackIdx], true);
      }).catch(() => {});
    } else {
      this.bgmAudio.pause();
      this.playing = false;
      if (this.onTrackChange) this.onTrackChange(TRACK_LIST[this.currentTrackIdx], false);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.bgmAudio.muted = this.muted;
    this.bootAudio.muted = this.muted;
    return this.muted;
  }

  getBars(count = 8) {
    if (this.analyser && this.playing && !this.bgmAudio.paused) {
      this.analyser.getByteFrequencyData(this.freqData);
      const out = [];
      for (let i = 0; i < count; i++) {
        out.push(Math.max(0.12, (this.freqData[i + 1] || 0) / 255));
      }
      return out;
    }
    return new Array(count).fill(0.1);
  }

  // Procedural PS1 UI Click
  sfxClick(freq = 1200) {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t0 + 0.045);
    g.gain.setValueAtTime(0.09, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.045);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.05);
  }

  // Camera transition synth whoosh
  sfxTransition() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t0);
    osc.frequency.exponentialRampToValueAtTime(520, t0 + 0.18);
    osc.frequency.exponentialRampToValueAtTime(240, t0 + 0.38);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.4);
  }

  // Character speech synth cadence (PS1 RPG dialogue blips)
  sfxVoice(charId = 'JAX') {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const baseMap = { JAX: 210, TOPENG: 155, AYESHA: 330, ATHENA: 390 };
    const base = baseMap[charId] || 240;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.065;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = charId === 'TOPENG' ? 'sawtooth' : 'square';
      const f = base * (0.9 + ((i * 37) % 5) * 0.06);
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.12, t + 0.04);
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }

  // Merch cash register / cart chime
  sfxCash() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((f, idx) => {
      const t = now + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Compatibility aliases used by app.js & jam_studio.js
  ensureContext() { this.ensureCtx(); }
  playBootChime() { this.playBoot(); }
  sfxVoiceBlip(charId) { this.sfxVoice(charId); }
  sfxAddCart() { this.sfxCash(); }
  sfxOpenModal() { this.sfxClick(1120); }

  updateVisualizer() {
    const bars = this.getBars(8);
    const els = document.querySelectorAll('.eq-bar');
    els.forEach((el, i) => {
      el.style.height = `${Math.round((bars[i] || 0.15) * 14)}px`;
    });
    const tr = TRACK_LIST[this.currentTrackIdx];
    const titleEl = document.getElementById('bgm-track-title');
    if (titleEl && tr) titleEl.textContent = tr.title;
    const playBtn = document.getElementById('bgm-play-btn');
    if (playBtn) playBtn.textContent = this.playing ? '⏸ PAUSE' : '▶ PLAY';
    const muteBtn = document.getElementById('bgm-mute-btn');
    if (muteBtn) muteBtn.textContent = this.muted ? 'MUTE: ON' : 'MUTE: OFF';
  }
}

export const SoundController = SoundSystem;
export const TRACKS = TRACK_LIST;

