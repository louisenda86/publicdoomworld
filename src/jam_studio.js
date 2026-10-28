// Interactive WebAudio Jamming Studio for PUBLIC DOOM Jamming Room
// Playable Instruments: SYNTH, DRUM, GUITAR, BASS, PIANO

const NOTE_DECK = [
  { key: 'A', label: 'C4', freq: 261.63 },
  { key: 'W', label: 'C#4', freq: 277.18, sharp: true },
  { key: 'S', label: 'D4', freq: 293.66 },
  { key: 'E', label: 'D#4', freq: 311.13, sharp: true },
  { key: 'D', label: 'E4', freq: 329.63 },
  { key: 'F', label: 'F4', freq: 349.23 },
  { key: 'T', label: 'F#4', freq: 369.99, sharp: true },
  { key: 'G', label: 'G4', freq: 392.00 },
  { key: 'Y', label: 'G#4', freq: 415.30, sharp: true },
  { key: 'H', label: 'A4', freq: 440.00 },
  { key: 'U', label: 'A#4', freq: 466.16, sharp: true },
  { key: 'J', label: 'B4', freq: 493.88 },
  { key: 'K', label: 'C5', freq: 523.25 },
];

const DRUM_PADS = [
  { id: 'kick', key: '1', label: 'KICK 909', col: '#ff3b30' },
  { id: 'snare', key: '2', label: 'SNARE CRACK', col: '#ff7eb6' },
  { id: 'hat_c', key: '3', label: 'CLOSED HAT', col: '#ffd43b' },
  { id: 'hat_o', key: '4', label: 'OPEN HAT', col: '#38d399' },
  { id: 'tom_l', key: '5', label: 'LOW TOM', col: '#9b6bff' },
  { id: 'tom_h', key: '6', label: 'HIGH TOM', col: '#38bdf8' },
  { id: 'clap', key: '7', label: 'BUNKER CLAP', col: '#fb7185' },
  { id: 'crash', key: '8', label: 'CRASH CYMBAL', col: '#facc15' },
];

export class JamStudioController {
  constructor(sound) {
    this.sound = sound;
    this.instrument = 'synth'; // 'synth' | 'drums' | 'guitar' | 'bass' | 'piano'
    this.loopActive = false;
    this.loopStep = 0;
    this.loopTimer = null;
  }

  ctx() {
    this.sound.ensureContext();
    return this.sound.ctx;
  }

  setInstrument(inst) {
    this.instrument = inst;
    this.render();
    this.sound?.sfxClick(1080);
  }

  playNote(freq, label = '') {
    const ctx = this.ctx();
    const now = ctx.currentTime;

    if (this.instrument === 'synth') {
      // Athena's Detuned Dual-Saw Lead Pad
      for (const det of [-8, 8]) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(det, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.5, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.45);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.58);
      }
    } else if (this.instrument === 'guitar') {
      // Jax's Overdriven Electric Guitar
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const shaper = ctx.createWaveShaper();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = Math.tanh(x * 4.5);
      }
      shaper.curve = curve;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      sub.type = 'square';
      sub.frequency.setValueAtTime(freq * 1.5, now); // Power chord fifth

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, now);
      filter.Q.setValueAtTime(1.6, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(shaper);
      sub.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.68);
      sub.stop(now + 0.68);
    } else if (this.instrument === 'bass') {
      // Ayesha's Sub & Slap Bass (1 octave down)
      const bFreq = freq * 0.5;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bFreq, now);
      const click = ctx.createOscillator();
      click.type = 'sawtooth';
      click.frequency.setValueAtTime(bFreq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(190, now + 0.25);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      osc.connect(filter);
      click.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      click.start(now);
      osc.stop(now + 0.55);
      click.stop(now + 0.12);
    } else {
      // Studio Grand Piano
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.88);
      osc2.stop(now + 0.45);
    }

    this.flashMeter(label || `${Math.round(freq)}Hz`);
  }

  playDrum(padId) {
    const ctx = this.ctx();
    const now = ctx.currentTime;

    if (padId === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (padId === 'snare' || padId === 'clap') {
      // Noise burst + body tone
      const bufSize = ctx.sampleRate * 0.18;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = padId === 'clap' ? 1100 : 600;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (padId === 'hat_c' || padId === 'hat_o' || padId === 'crash') {
      const dur = padId === 'hat_c' ? 0.06 : padId === 'hat_o' ? 0.24 : 0.65;
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (dur * 0.35)));
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = padId === 'crash' ? 3200 : 5800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else {
      // Toms
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f0 = padId === 'tom_h' ? 220 : 135;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f0, now);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.45, now + 0.22);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }

    this.flashMeter(padId.toUpperCase());
  }

  toggleBeatLoop() {
    this.loopActive = !this.loopActive;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.loopActive) {
      this.loopStep = 0;
      this.loopTimer = setInterval(() => {
        const s = this.loopStep % 8;
        if (s === 0 || s === 3 || s === 6) this.playDrum('kick');
        if (s === 2 || s === 6) this.playDrum('snare');
        if (s % 2 === 0) this.playDrum('hat_c');
        else if (s === 7) this.playDrum('hat_o');
        this.loopStep++;
      }, 210);
    }
    this.render();
  }

  stopLoop() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.loopActive = false;
  }

  flashMeter(text) {
    const el = document.getElementById('jam-live-readout');
    if (el) el.textContent = `PLAYING: ${this.instrument.toUpperCase()} // ${text}`;
  }

  handleKeyDown(key) {
    const up = key.toUpperCase();
    const pad = DRUM_PADS.find(p => p.key === up);
    if (pad) {
      this.playDrum(pad.id);
      return true;
    }
    const note = NOTE_DECK.find(n => n.key === up);
    if (note) {
      if (this.instrument === 'drums') {
        const idx = NOTE_DECK.indexOf(note) % DRUM_PADS.length;
        this.playDrum(DRUM_PADS[idx].id);
      } else {
        this.playNote(note.freq, note.label);
      }
      return true;
    }
    return false;
  }

  render() {
    document.querySelectorAll('[data-jam-inst]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-jam-inst') === this.instrument);
    });

    const loopBtn = document.getElementById('jam-loop-btn');
    if (loopBtn) {
      loopBtn.textContent = this.loopActive ? '⏹ STOP DRUM LOOP' : '▶ AUTO BEAT LOOP';
      loopBtn.classList.toggle('active', this.loopActive);
    }

    const deckEl = document.getElementById('jam-keys-container');
    if (!deckEl) return;
    deckEl.innerHTML = '';

    if (this.instrument === 'drums') {
      const grid = document.createElement('div');
      grid.className = 'jam-drum-grid';
      DRUM_PADS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'jam-drum-pad';
        btn.style.setProperty('--pad-col', p.col);
        btn.innerHTML = `<span class="pad-key">[${p.key}]</span><strong>${p.label}</strong>`;
        btn.addEventListener('pointerdown', () => this.playDrum(p.id));
        grid.appendChild(btn);
      });
      deckEl.appendChild(grid);
    } else {
      const kb = document.createElement('div');
      kb.className = 'jam-piano-row';
      NOTE_DECK.forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'jam-key-btn' + (n.sharp ? ' sharp' : '');
        btn.innerHTML = `<span class="k-note">${n.label}</span><span class="k-bind">[${n.key}]</span>`;
        btn.addEventListener('pointerdown', () => this.playNote(n.freq, n.label));
        kb.appendChild(btn);
      });
      deckEl.appendChild(kb);
    }
  }
}
