// Main Interactive 3D World & UI Controller for PUBLIC DOOM
import * as THREE from 'three';
import { createPS1Renderer, Look } from './renderer.js';
import { clamp, lerp, triggerTalk } from './core.js';
import {
  createAllWorlds,
  WORLD_META,
  WORLD_ORDER,
  CHARACTER_DATA,
  MALE_ATTIRES,
  FEMALE_ATTIRES,
  ACCESSORIES_LIST,
  FEMALE_HAIRSTYLES,
  FEMALE_LINGERIE_COLLECTION,
} from './worlds.js';
import { MERCH_ITEMS, renderMerchGraphic } from './merch.js';
import { SoundController, TRACKS } from './audio.js';
import { ChessController } from './chess_game.js';
import { JamStudioController } from './jam_studio.js';

const EPISODES_DATA = {
  ep1: {
    title: 'EPISODE 1 — PUBLIC DOOM',
    embedUrl: 'https://www.youtube.com/embed/4LVgV36cOxs?si=I6acaTrBUCJpkWaB',
    watchUrl: 'https://youtu.be/4LVgV36cOxs?si=g37vh75cO-CSEGSw',
  },
  ep2: {
    title: 'EPISODE 2 — PUBLIC DOOM',
    embedUrl: 'https://www.youtube.com/embed/0V4OMKovN2U?si=hfjJYtqGsnSA838S',
    watchUrl: 'https://youtu.be/0V4OMKovN2U?si=14UTpkVt2WtId-yI',
  },
  ep3: {
    title: 'EPISODE 3 — PUBLIC DOOM',
    embedUrl: 'https://www.youtube.com/embed/5zE50zOFR28?si=AXWJKcPQQEaFg8Xz',
    watchUrl: 'https://youtu.be/5zE50zOFR28?si=1uIliJFYRj0SKTpy',
  },
};

class PublicDoomApp {
  constructor() {
    this.canvas = document.getElementById('stage-canvas');
    this.pinsLayer = document.getElementById('pins-layer');
    this.sound = new SoundController();
    this.chess = new ChessController(this.sound);
    this.jam = new JamStudioController(this.sound);

    // Initialize PS1 + Bayer Dither WebGL2 Renderer
    this.ps1 = createPS1Renderer(this.canvas, window.innerWidth, window.innerHeight);

    // Camera & smooth damped spring targets
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.08, 260);
    this.camPos = new THREE.Vector3(0.1, 1.58, 2.55);
    this.camTarget = new THREE.Vector3(0.0, 1.15, -0.75);
    this.goalPos = this.camPos.clone();
    this.goalTarget = this.camTarget.clone();
    this.camFov = 48;
    this.goalFov = 48;

    // Mouse parallax & orbit drag state
    this.pointer = { x: 0, y: 0, nx: 0, ny: 0, down: false, dragDist: 0, lastX: 0, lastY: 0 };
    this.orbitOffset = { yaw: 0, pitch: 0, zoom: 0 };
    this.raycaster = new THREE.Raycaster();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Game-like Character Walk keys (WASD + Arrows)
    this.walkKeys = new Set();

    // Build all 10 3D Worlds (9 rooms + 3D Atlas)
    this.worlds = createAllWorlds();
    this.activeWorldId = 'studio';
    this.activeCharId = null;
    this.quoteIndices = { JAX: 0, TOPENG: 0, AYESHA: 0, ATHENA: 0 };

    // Password-locked Female Lingerie Collection state (Passcode: 5539)
    this.lingerieUnlocked = false;

    // Post-processing user overrides (PS1 Shader Lab)
    this.LookOverrides = {
      ps1: 2,
      dither: 0.68,
      scan: 0.15,
      barrel: 0.05,
      toon: 0,
      dz: 0,
      dzPalIdx: 0,
    };
    this.dzPalettes = [
      { name: 'DOOM ICE', dark: [0.04, 0.05, 0.09], light: [0.68, 0.85, 0.94] },
      { name: 'HOMER AMBER', dark: [0.09, 0.04, 0.02], light: [1.0, 0.78, 0.32] },
      { name: 'TOPENG CRIMSON', dark: [0.08, 0.02, 0.04], light: [1.0, 0.28, 0.42] },
      { name: 'MATRIX GREEN', dark: [0.02, 0.07, 0.04], light: [0.35, 0.96, 0.58] },
    ];

    // Transition smear effect timer
    this.transitionTimer = 0;
    this.smearVec = [0, 0];
    this.transitBannerTimer = null;

    // Merch Store Cart state
    this.cart = [{ item: MERCH_ITEMS[0], size: 'L', qty: 1 }];
    this.activeMerchCategory = 'ALL';

    this.startTime = performance.now() * 0.001;
    this.lastFrameTime = this.startTime;
    this.pinElements = [];

    this.initDOM();
    this.rebuildPins();
    this.updateWorldHUD();
    this.renderMerchGrid();
    this.updateCartUI();
    this.renderProfilesModal();
    this.renderCapsuleModal();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  get activeWorld() {
    return this.worlds[this.activeWorldId];
  }

  get activeMeta() {
    return WORLD_META[this.activeWorldId];
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ps1.resize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  initDOM() {
    // Boot Splash Screen ("INSERT DISC // BOOT PUBLIC DOOM")
    const bootScreen = document.getElementById('boot-screen');
    const bootBtn = document.getElementById('boot-start-btn');
    const skipBootBtn = document.getElementById('boot-skip-btn');

    const finishBoot = playChime => {
      if (typeof window.enterPublicDoom === 'function') {
        window.enterPublicDoom(playChime);
      } else {
        if (bootScreen) {
          bootScreen.classList.add('hidden');
          bootScreen.style.display = 'none';
        }
      }
    };

    if (bootBtn) bootBtn.addEventListener('click', () => finishBoot(true));
    if (skipBootBtn) skipBootBtn.addEventListener('click', () => finishBoot(false));

    // World Navigation Tabs
    document.querySelectorAll('[data-world-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wId = btn.getAttribute('data-world-btn');
        this.switchWorld(wId);
      });
    });

    // Prev / Next World Arrows
    document.getElementById('prev-world-btn')?.addEventListener('click', () => {
      const idx = WORLD_ORDER.indexOf(this.activeWorldId);
      const prev = WORLD_ORDER[(idx - 1 + WORLD_ORDER.length) % WORLD_ORDER.length];
      this.switchWorld(prev);
    });
    document.getElementById('next-world-btn')?.addEventListener('click', () => {
      const idx = WORLD_ORDER.indexOf(this.activeWorldId);
      const next = WORLD_ORDER[(idx + 1) % WORLD_ORDER.length];
      this.switchWorld(next);
    });

    // Character Quick Selector Buttons (Top Bar)
    document.querySelectorAll('[data-char-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-char-btn');
        this.focusCharacter(cId);
      });
    });

    // Reset Camera View Button
    document.getElementById('reset-cam-btn')?.addEventListener('click', () => {
      this.closeCharacterPanel();
      this.resetCameraToWorld();
    });

    // Character Dossier Panel Controls
    this.charPanel = document.getElementById('char-panel');
    document.getElementById('char-close-btn')?.addEventListener('click', () => {
      this.closeCharacterPanel();
      this.resetCameraToWorld();
    });

    document.getElementById('char-quote-btn')?.addEventListener('click', () => {
      if (!this.activeCharId) return;
      this.speakNextQuote(this.activeCharId);
    });

    document.getElementById('char-merch-btn')?.addEventListener('click', () => {
      const filter = this.activeCharId || 'ALL';
      this.openMerchModal(filter);
    });

    // Password-locked 10 Lingerie Collection controls (Passcode: 5539)
    document.getElementById('lingerie-unlock-toggle-btn')?.addEventListener('click', () => {
      const form = document.getElementById('lingerie-pass-form');
      form?.classList.toggle('hidden');
      document.getElementById('lingerie-pass-input')?.focus();
      this.sound.sfxClick(960);
    });

    const verifyLingeriePass = () => {
      const input = document.getElementById('lingerie-pass-input');
      const msg = document.getElementById('lingerie-pass-msg');
      const val = (input?.value || '').trim();
      if (val === '5539') {
        this.lingerieUnlocked = true;
        this.sound.sfxAddCart();
        if (msg) {
          msg.textContent = '✓ PASSCODE 5539 ACCEPTED — 10 LINGERIE COLLECTION UNLOCKED!';
          msg.style.color = '#38d399';
        }
        if (this.activeCharId) {
          const entry = this.activeWorld.cast[this.activeCharId];
          if (entry) this.renderCustomizationControls(entry);
        }
      } else {
        this.sound.sfxClick(320);
        if (msg) {
          msg.textContent = '✕ ACCESS DENIED — ENTER PASSCODE 5539';
          msg.style.color = '#ff3b30';
        }
      }
    };

    document.getElementById('lingerie-pass-submit')?.addEventListener('click', verifyLingeriePass);
    document.getElementById('lingerie-pass-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') verifyLingeriePass();
    });

    // Pose & Expression Buttons inside Character Dossier
    document.querySelectorAll('[data-pose-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.activeCharId) return;
        const pose = btn.getAttribute('data-pose-btn');
        const entry = this.activeWorld.cast[this.activeCharId];
        if (entry) {
          entry.setPose(pose);
          this.sound.sfxClick(880);
          document.querySelectorAll('[data-pose-btn]').forEach(b => b.classList.toggle('active', b === btn));
        }
      });
    });

    document.querySelectorAll('[data-expr-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.activeCharId) return;
        const expr = btn.getAttribute('data-expr-btn');
        const entry = this.activeWorld.cast[this.activeCharId];
        if (entry) {
          entry.setExpr(expr);
          if (expr === 'talk') triggerTalk(this.now(), 2.6);
          this.sound.sfxVoiceBlip(this.activeCharId);
          document.querySelectorAll('[data-expr-btn]').forEach(b => b.classList.toggle('active', b === btn));
        }
      });
    });

    // Audio / Soundtrack Bar Controls
    document.getElementById('bgm-play-btn')?.addEventListener('click', () => {
      this.sound.togglePlay();
    });
    document.getElementById('bgm-next-btn')?.addEventListener('click', () => {
      this.sound.nextTrack();
      this.sound.sfxClick(1020);
    });
    document.getElementById('bgm-mute-btn')?.addEventListener('click', () => {
      this.sound.toggleMute();
    });

    // Merch Store Modal Controls
    this.merchModal = document.getElementById('merch-modal');
    document.getElementById('open-merch-btn')?.addEventListener('click', () => this.openMerchModal('ALL'));
    document.getElementById('close-merch-btn')?.addEventListener('click', () => this.closeMerchModal());

    document.querySelectorAll('[data-merch-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-merch-filter');
        this.activeMerchCategory = cat;
        document.querySelectorAll('[data-merch-filter]').forEach(b => b.classList.toggle('active', b === btn));
        this.renderMerchGrid();
        this.sound.sfxClick(960);
      });
    });

    // Episode Video Modal (Episodes 1, 2, 3 + Local Cut)
    this.episodeModal = document.getElementById('episode-modal');
    document.getElementById('open-episode-btn')?.addEventListener('click', () => this.openEpisodeModal('ep1'));
    document.getElementById('close-episode-btn')?.addEventListener('click', () => this.closeEpisodeModal());

    document.querySelectorAll('[data-ep-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const epKey = btn.getAttribute('data-ep-tab');
        this.selectEpisodeTab(epKey);
      });
    });

    // Cast Profiles Modal
    this.profilesModal = document.getElementById('profiles-modal');
    document.getElementById('open-profiles-btn')?.addEventListener('click', () => {
      this.profilesModal?.classList.remove('hidden');
      this.sound.sfxOpenModal();
    });
    document.getElementById('close-profiles-btn')?.addEventListener('click', () => {
      this.profilesModal?.classList.add('hidden');
      this.sound.sfxClick(680);
    });

    // Playable Chess Modal
    this.chessModal = document.getElementById('chess-modal');
    document.getElementById('open-chess-btn')?.addEventListener('click', () => {
      if (this.activeWorldId !== 'chess') this.switchWorld('chess');
      this.openChessModal();
    });
    document.getElementById('close-chess-btn')?.addEventListener('click', () => {
      this.chessModal?.classList.add('hidden');
      this.sound.sfxClick(680);
    });
    document.querySelectorAll('[data-chess-opp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const oppId = btn.getAttribute('data-chess-opp');
        this.chess.setOpponent(oppId);
        this.sound.sfxVoiceBlip(oppId);
      });
    });
    document.getElementById('chess-reset-btn')?.addEventListener('click', () => {
      this.chess.resetBoard();
      this.sound.sfxClick(940);
    });

    // Playable Jamming Studio Modal
    this.jamModal = document.getElementById('jam-modal');
    document.getElementById('open-jam-btn')?.addEventListener('click', () => {
      if (this.activeWorldId !== 'jam') this.switchWorld('jam');
      this.openJamModal('synth');
    });
    document.getElementById('close-jam-btn')?.addEventListener('click', () => {
      this.jam.stopLoop();
      this.jamModal?.classList.add('hidden');
      this.sound.sfxClick(680);
    });
    document.querySelectorAll('[data-jam-inst]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inst = btn.getAttribute('data-jam-inst');
        this.jam.setInstrument(inst);
      });
    });
    document.getElementById('jam-loop-btn')?.addEventListener('click', () => {
      this.jam.toggleBeatLoop();
    });

    // Capsule Corp. Boring Tunnel Modal
    this.capsuleModal = document.getElementById('capsule-modal');
    document.getElementById('open-capsule-btn')?.addEventListener('click', () => {
      this.openCapsuleModal();
    });
    document.getElementById('close-capsule-btn')?.addEventListener('click', () => {
      this.capsuleModal?.classList.add('hidden');
      this.sound.sfxClick(680);
    });

    // PS1 / Dither Shader Lab Toggle
    this.fxDrawer = document.getElementById('fx-drawer');
    document.getElementById('toggle-fx-btn')?.addEventListener('click', () => {
      this.fxDrawer?.classList.toggle('hidden');
      this.sound.sfxClick(1080);
    });

    // Hotspot Info Toast
    this.hotspotToast = document.getElementById('hotspot-toast');
    document.getElementById('toast-close-btn')?.addEventListener('click', () => {
      this.hotspotToast?.classList.add('hidden');
    });

    // Checkout Receipt Modal
    this.receiptModal = document.getElementById('receipt-modal');
    document.getElementById('checkout-btn')?.addEventListener('click', () => this.openCheckoutReceipt());
    document.getElementById('close-receipt-btn')?.addEventListener('click', () => {
      this.receiptModal?.classList.add('hidden');
    });

    // Shader Lab Controls
    document.querySelectorAll('[data-ps1-scale]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.LookOverrides.ps1 = +btn.getAttribute('data-ps1-scale');
        document.querySelectorAll('[data-ps1-scale]').forEach(b => b.classList.toggle('active', b === btn));
        this.sound.sfxClick(940);
      });
    });
    document.getElementById('fx-dither-range')?.addEventListener('input', e => {
      this.LookOverrides.dither = parseFloat(e.target.value);
    });
    document.getElementById('fx-scan-range')?.addEventListener('input', e => {
      this.LookOverrides.scan = parseFloat(e.target.value);
    });
    document.getElementById('fx-barrel-range')?.addEventListener('input', e => {
      this.LookOverrides.barrel = parseFloat(e.target.value);
    });
    document.getElementById('fx-toon-btn')?.addEventListener('click', e => {
      this.LookOverrides.toon = this.LookOverrides.toon > 0 ? 0 : 1;
      e.currentTarget.classList.toggle('active', this.LookOverrides.toon > 0);
      e.currentTarget.textContent = this.LookOverrides.toon > 0 ? 'HALFTONE TOON: ON' : 'HALFTONE TOON: OFF';
      this.sound.sfxClick(1120);
    });
    document.getElementById('fx-dz-btn')?.addEventListener('click', e => {
      this.LookOverrides.dz = this.LookOverrides.dz > 0 ? 0 : 1;
      e.currentTarget.classList.toggle('active', this.LookOverrides.dz > 0);
      e.currentTarget.textContent = this.LookOverrides.dz > 0 ? '4-COLOR DITHER: ON' : '4-COLOR DITHER: OFF';
      this.sound.sfxClick(1320);
    });
    document.getElementById('fx-pal-btn')?.addEventListener('click', e => {
      this.LookOverrides.dzPalIdx = (this.LookOverrides.dzPalIdx + 1) % this.dzPalettes.length;
      const p = this.dzPalettes[this.LookOverrides.dzPalIdx];
      e.currentTarget.textContent = 'PALETTE: ' + p.name;
      this.sound.sfxClick(1440);
    });

    // Pointer / Orbit / Raycast interaction on 3D Canvas
    this.canvas.addEventListener('pointerdown', e => {
      this.pointer.down = true;
      this.pointer.dragDist = 0;
      this.pointer.lastX = e.clientX;
      this.pointer.lastY = e.clientY;
    });

    window.addEventListener('pointermove', e => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ny = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.pointer.down) {
        const dx = e.clientX - this.pointer.lastX;
        const dy = e.clientY - this.pointer.lastY;
        this.pointer.dragDist += Math.hypot(dx, dy);
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;
        this.orbitOffset.yaw = clamp(this.orbitOffset.yaw - dx * 0.0055, -1.35, 1.35);
        this.orbitOffset.pitch = clamp(this.orbitOffset.pitch + dy * 0.004, -0.45, 0.65);
      } else {
        this.checkHoverCursor();
      }
    });

    window.addEventListener('pointerup', e => {
      if (this.pointer.down && this.pointer.dragDist < 6 && e.target === this.canvas) {
        this.handleCanvasClick(e);
      }
      this.pointer.down = false;
    });

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.orbitOffset.zoom = clamp(this.orbitOffset.zoom + e.deltaY * 0.0025, -1.8, 3.2);
    }, { passive: false });

    // Keyboard shortcuts: WASD / Arrows for character walking, Jamming Studio keys, or room hotkeys
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      // If Jamming Studio modal is open, route keys to JamStudioController
      if (this.jamModal && !this.jamModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          this.jam.stopLoop();
          this.jamModal.classList.add('hidden');
          return;
        }
        if (this.jam.handleKeyDown(e.key)) {
          e.preventDefault();
          return;
        }
      }

      if (e.key === 'Escape') {
        this.closeMerchModal();
        this.closeEpisodeModal();
        this.profilesModal?.classList.add('hidden');
        this.chessModal?.classList.add('hidden');
        this.jam.stopLoop();
        this.jamModal?.classList.add('hidden');
        this.capsuleModal?.classList.add('hidden');
        this.closeCharacterPanel();
        this.hotspotToast?.classList.add('hidden');
        this.resetCameraToWorld();
        return;
      }

      // WASD / Arrow Keys for Game Character Walking
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        this.walkKeys.add(k);
        if (!this.activeCharId) {
          this.activeCharId = 'JAX';
        }
        return;
      }

      if (e.key === '1') this.switchWorld('studio');
      else if (e.key === '2') this.switchWorld('playground');
      else if (e.key === '3') this.switchWorld('diner');
      else if (e.key === '4') this.switchWorld('meadow');
      else if (e.key === '5') this.switchWorld('gym');
      else if (e.key === '6') this.switchWorld('chess');
      else if (e.key === '7') this.switchWorld('spa');
      else if (e.key === '8') this.switchWorld('jam');
      else if (e.key === '9') this.switchWorld('tunnel');
      else if (e.key === '0') this.switchWorld('island');
      else if (k === 'm') this.openMerchModal('ALL');
    });

    window.addEventListener('keyup', e => {
      this.walkKeys.delete(e.key.toLowerCase());
    });
  }

  now() {
    return performance.now() * 0.001 - this.startTime;
  }

  triggerSmear(sx = 0.04, sy = 0.0) {
    this.smearVec = [sx, sy];
    this.transitionTimer = 0.16;
  }

  showCapsuleTransitBanner(worldTitle) {
    const banner = document.getElementById('capsule-transit-banner');
    const txt = document.getElementById('capsule-transit-text');
    if (!banner || !txt) return;
    txt.textContent = `CAPSULE CORP. POD → ${worldTitle}`;
    banner.classList.remove('hidden');
    if (this.transitBannerTimer) clearTimeout(this.transitBannerTimer);
    this.transitBannerTimer = setTimeout(() => {
      banner.classList.add('hidden');
    }, 1500);
  }

  switchWorld(worldId) {
    if (!this.worlds[worldId]) return;
    const prevIdx = WORLD_ORDER.indexOf(this.activeWorldId);
    const nextIdx = WORLD_ORDER.indexOf(worldId);
    const dir = nextIdx >= prevIdx ? 1 : -1;

    this.activeWorldId = worldId;
    this.activeCharId = null;
    this.charPanel?.classList.add('hidden');
    this.hotspotToast?.classList.add('hidden');
    this.capsuleModal?.classList.add('hidden');

    const meta = WORLD_META[worldId];
    const d = meta.defaultCam;
    this.camPos.set(d.pos[0] + 0.35 * dir, d.pos[1] + 0.12, d.pos[2] + 0.45);
    this.camTarget.set(...d.target);
    this.camFov = d.fov + 4;
    this.flyCamera(d.pos, d.target, d.fov);
    this.triggerSmear(0.035 * dir, 0.005);
    this.sound.sfxTransition();
    this.sound.playTrackById(meta.bgm, this.sound.playing);
    this.showCapsuleTransitBanner(meta.title);

    this.rebuildPins();
    this.updateWorldHUD();
  }

  flyCamera(pos, target, fov = 45) {
    this.goalPos.set(...pos);
    this.goalTarget.set(...target);
    this.goalFov = fov;
    this.orbitOffset.yaw = 0;
    this.orbitOffset.pitch = 0;
    this.orbitOffset.zoom = 0;
  }

  resetCameraToWorld() {
    const d = this.activeMeta.defaultCam;
    this.flyCamera(d.pos, d.target, d.fov);
    this.sound.sfxClick(880);
  }

  updateWorldHUD() {
    const meta = this.activeMeta;
    document.getElementById('hud-world-index').textContent = `SECTOR // ${meta.index}`;
    document.getElementById('hud-world-title').textContent = meta.title;
    document.getElementById('hud-world-sub').textContent = meta.subtitle;
    document.getElementById('hud-world-desc').textContent = meta.description;

    document.querySelectorAll('[data-world-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-world-btn') === this.activeWorldId);
    });

    const viewsBar = document.getElementById('world-views-bar');
    if (viewsBar) {
      viewsBar.innerHTML = '';
      meta.views.forEach((v, idx) => {
        const b = document.createElement('button');
        b.className = 'cam-chip' + (idx === 0 ? ' active' : '');
        b.textContent = `CAM 0${idx + 1} · ${v.label}`;
        b.addEventListener('click', () => {
          this.closeCharacterPanel();
          this.flyCamera(v.pos, v.target, v.fov);
          this.sound.sfxClick(1040);
          viewsBar.querySelectorAll('.cam-chip').forEach(c => c.classList.toggle('active', c === b));
        });
        viewsBar.appendChild(b);
      });
    }
  }

  // Create floating 3D-to-2D projected pins for the 4 characters + scene hotspots
  rebuildPins() {
    if (!this.pinsLayer) return;
    this.pinsLayer.innerHTML = '';
    this.pinElements = [];

    const world = this.activeWorld;

    // 1. Character Pins
    Object.values(world.cast).forEach(entry => {
      const el = document.createElement('button');
      el.className = 'world-pin char-pin';
      el.style.setProperty('--pin-accent', entry.meta.accent);
      el.innerHTML = `
        <span class="pin-dot"></span>
        <span class="pin-name">${entry.meta.name}</span>
        <span class="pin-role">${entry.meta.age}Y</span>
      `;
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.focusCharacter(entry.id);
      });
      this.pinsLayer.appendChild(el);
      this.pinElements.push({
        el,
        getPos: () => entry.getHeadWorldPos(),
      });
    });

    // 2. Interactive Prop / Portal Hotspot Pins
    (world.hotspots || []).forEach(hs => {
      const el = document.createElement('button');
      el.className = 'world-pin prop-pin';
      el.innerHTML = `
        <span class="pin-icon">+</span>
        <span class="pin-text">
          <strong>${hs.label}</strong>
          <small>${hs.sub}</small>
        </span>
      `;
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.triggerHotspot(hs);
      });
      this.pinsLayer.appendChild(el);
      this.pinElements.push({
        el,
        getPos: () => hs.pos,
      });
    });
  }

  updatePinsProjection() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const v = new THREE.Vector3();

    for (const item of this.pinElements) {
      v.copy(item.getPos());
      v.project(this.camera);
      if (v.z > 1.0 || v.z < -1.0) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        continue;
      }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-(v.y * 0.5) + 0.5) * h;
      item.el.style.opacity = '1';
      item.el.style.pointerEvents = 'auto';
      item.el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
    }
  }

  checkHoverCursor() {
    this.raycaster.setFromCamera({ x: this.pointer.nx, y: this.pointer.ny }, this.camera);
    const hits = this.raycaster.intersectObjects(this.activeWorld.scene.children, true);
    let pick = null;
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData?.pick) o = o.parent;
      if (o && o.userData?.pick) { pick = o.userData.pick; break; }
    }
    this.canvas.style.cursor = pick ? 'pointer' : (this.activeCharId ? 'crosshair' : 'grab');
  }

  handleCanvasClick() {
    this.raycaster.setFromCamera({ x: this.pointer.nx, y: this.pointer.ny }, this.camera);
    const hits = this.raycaster.intersectObjects(this.activeWorld.scene.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData?.pick) o = o.parent;
      if (o && o.userData?.pick) {
        const p = o.userData.pick;
        if (p.type === 'character') {
          this.focusCharacter(p.id);
          return;
        }
        if (p.type === 'world-portal') {
          this.switchWorld(p.targetWorld);
          return;
        }
        if (p.type === 'hotspot') {
          this.triggerHotspot(p.hotspot);
          return;
        }
      }
    }

    // If a character is currently selected, clicking the floor sets a walk waypoint!
    if (this.activeCharId) {
      const entry = this.activeWorld.cast[this.activeCharId];
      if (entry) {
        const hitPt = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.floorPlane, hitPt)) {
          entry.setWaypoint(hitPt.x, hitPt.z, this.activeWorld.bounds);
          this.sound.sfxClick(720);
        }
      }
    }
  }

  triggerHotspot(hs) {
    this.sound.sfxClick(1160);
    if (hs.action === 'world' && hs.targetWorld) {
      this.switchWorld(hs.targetWorld);
      return;
    }
    if (hs.cam) {
      this.flyCamera(hs.cam.pos, hs.cam.target, hs.cam.fov);
    }
    if (hs.action === 'episode') {
      this.openEpisodeModal('ep1');
      return;
    }
    if (hs.action === 'open-chess') {
      this.openChessModal();
      return;
    }
    if (hs.action === 'open-jam') {
      this.openJamModal(hs.instrument || 'synth');
      return;
    }
    if (hs.action === 'capsule-menu') {
      this.openCapsuleModal();
      return;
    }
    if (hs.action === 'open-wardrobe') {
      this.focusCharacter('AYESHA');
      return;
    }
    if (hs.action === 'bgm-cycle') {
      this.sound.nextTrack();
    }
    if (hs.action === 'custom' && typeof hs.onTrigger === 'function') {
      hs.onTrigger(this.activeWorld, this);
    }
    if (hs.title && hs.desc && this.hotspotToast) {
      document.getElementById('toast-title').textContent = hs.title;
      document.getElementById('toast-desc').textContent = hs.desc;
      this.hotspotToast.classList.remove('hidden');
    }
  }

  focusCharacter(charId) {
    const entry = this.activeWorld.cast[charId];
    if (!entry) return;
    this.activeCharId = charId;
    this.hotspotToast?.classList.add('hidden');

    const camSpec = entry.getFocusCam();
    this.flyCamera(camSpec.pos, camSpec.target, camSpec.fov);

    entry.triggerWave(this.now());
    triggerTalk(this.now(), 2.8);
    this.sound.sfxVoiceBlip(charId);

    const meta = entry.meta;
    document.getElementById('char-panel-tag').textContent = meta.tag;
    document.getElementById('char-panel-name').textContent = meta.name;
    document.getElementById('char-panel-name').style.color = meta.accent;
    document.getElementById('char-panel-role').textContent = meta.role;
    document.getElementById('char-panel-bio').textContent = meta.bio;
    document.getElementById('char-outfit-label').textContent = entry.outfitLabel;

    const qIdx = this.quoteIndices[charId] || 0;
    document.getElementById('char-panel-quote').textContent = meta.quotes[qIdx % meta.quotes.length];

    const statsGrid = document.getElementById('char-stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = '';
      for (const [k, v] of Object.entries(meta.stats)) {
        const d = document.createElement('div');
        d.className = 'stat-cell';
        d.innerHTML = `<span class="stat-k">${k}</span><span class="stat-v">${v}</span>`;
        statsGrid.appendChild(d);
      }
    }

    this.renderCustomizationControls(entry);

    document.querySelectorAll('[data-char-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-char-btn') === charId);
    });

    this.charPanel?.classList.remove('hidden');
  }

  renderCustomizationControls(entry) {
    const meta = entry.meta;
    const isFemale = meta.gender === 'female';
    const attireList = isFemale ? FEMALE_ATTIRES : MALE_ATTIRES;

    // 1. Render 5 Attires
    const attiresEl = document.getElementById('char-attires-list');
    if (attiresEl) {
      attiresEl.innerHTML = '';
      attireList.forEach(a => {
        const b = document.createElement('button');
        b.className = 'chip-btn' + (entry.attireId === a.id ? ' active' : '');
        b.setAttribute('data-attire-id', a.id);
        b.textContent = a.label;
        b.addEventListener('click', () => {
          const lbl = entry.setAttire(a.id);
          document.getElementById('char-outfit-label').textContent = lbl;
          this.sound.sfxClick(1180);
          this.renderCustomizationControls(entry);
        });
        attiresEl.appendChild(b);
      });
    }

    // 2. Render 5 Accessories (+ None)
    const accEl = document.getElementById('char-accessories-list');
    if (accEl) {
      accEl.innerHTML = '';
      ACCESSORIES_LIST.forEach(acc => {
        const b = document.createElement('button');
        b.className = 'chip-btn' + (entry.accessoryId === acc.id ? ' active' : '');
        b.setAttribute('data-acc-id', acc.id);
        b.textContent = acc.label;
        b.addEventListener('click', () => {
          entry.setAccessory(acc.id);
          this.sound.sfxClick(1240);
          this.renderCustomizationControls(entry);
        });
        accEl.appendChild(b);
      });
    }

    // 3. Render 5 Female Hairstyles (if female)
    const hairSec = document.getElementById('char-hairstyles-section');
    const hairList = document.getElementById('char-hairstyles-list');
    if (hairSec && hairList) {
      hairSec.classList.toggle('hidden', !isFemale);
      if (isFemale) {
        hairList.innerHTML = '';
        FEMALE_HAIRSTYLES.forEach(h => {
          const b = document.createElement('button');
          b.className = 'chip-btn' + (entry.hairstyleId === h.id ? ' active' : '');
          b.setAttribute('data-hair-id', h.id);
          b.textContent = h.label;
          b.addEventListener('click', () => {
            entry.setHairstyle(h.id);
            this.sound.sfxClick(1320);
            this.renderCustomizationControls(entry);
          });
          hairList.appendChild(b);
        });
      }
    }

    // 4. Render 10 Female Lingerie Collection (Passcode: 5539)
    const lingSec = document.getElementById('char-lingerie-section');
    const lockBox = document.getElementById('lingerie-lock-box');
    const lockStatus = document.getElementById('lingerie-lock-status');
    const lingList = document.getElementById('char-lingerie-list');

    if (lingSec && lockBox && lockStatus && lingList) {
      lingSec.classList.toggle('hidden', !isFemale);
      if (isFemale) {
        if (this.lingerieUnlocked) {
          lockStatus.textContent = '🔓 UNLOCKED (5539)';
          lockStatus.style.color = '#38d399';
          lockBox.classList.add('hidden');
          lingList.classList.remove('hidden');
          lingList.innerHTML = '';
          FEMALE_LINGERIE_COLLECTION.forEach(item => {
            const b = document.createElement('button');
            b.className = 'chip-btn' + (entry.attireId === item.id ? ' active' : '');
            b.setAttribute('data-lingerie-id', item.id);
            b.textContent = item.label;
            b.addEventListener('click', () => {
              const lbl = entry.setAttire(item.id);
              document.getElementById('char-outfit-label').textContent = lbl;
              this.sound.sfxClick(1420);
              this.renderCustomizationControls(entry);
            });
            lingList.appendChild(b);
          });
        } else {
          lockStatus.textContent = '🔒 PASSCODE REQUIRED';
          lockStatus.style.color = '#ff3b30';
          lockBox.classList.remove('hidden');
          lingList.classList.add('hidden');
        }
      }
    }
  }

  speakNextQuote(charId) {
    const meta = CHARACTER_DATA[charId];
    if (!meta) return;
    this.quoteIndices[charId] = ((this.quoteIndices[charId] || 0) + 1) % meta.quotes.length;
    const q = meta.quotes[this.quoteIndices[charId]];
    document.getElementById('char-panel-quote').textContent = q;
    triggerTalk(this.now(), 3.0);
    this.sound.sfxVoiceBlip(charId);
  }

  closeCharacterPanel() {
    this.activeCharId = null;
    this.charPanel?.classList.add('hidden');
    document.querySelectorAll('[data-char-btn]').forEach(btn => btn.classList.remove('active'));
  }

  // ==========================================================================
  // CAST PROFILES MODAL & CAPSULE CORP MODAL
  // ==========================================================================
  renderProfilesModal() {
    const grid = document.getElementById('profiles-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(CHARACTER_DATA).forEach(c => {
      const card = document.createElement('div');
      card.className = 'profile-dossier-card';
      card.style.borderTop = `3px solid ${c.accent}`;
      card.innerHTML = `
        <div>
          <div class="char-tag">${c.tag}</div>
          <div style="font-size:22px;font-weight:900;color:${c.accent};">${c.name}</div>
          <div style="font-size:9px;color:var(--muted);margin-bottom:8px;">${c.role}</div>
          <ul class="profile-meta-list">
            <li><strong>AGE:</strong> ${c.age}</li>
            <li><strong>ORIGIN:</strong> ${c.origin}</li>
            <li><strong>HIGH SCHOOL:</strong> ${c.highSchool}</li>
            <li><strong>COLLEGE:</strong> ${c.college}</li>
            <li><strong>EX-EMPLOYERS:</strong> ${c.formerJobs}</li>
            <li><strong>FAMILY:</strong> ${c.family}</li>
          </ul>
          <p style="font-size:10px;color:#cbd5e1;line-height:1.45;margin-top:8px;">${c.bio}</p>
        </div>
        <button class="full-cta-btn" data-profile-focus="${c.id}">FOCUS &amp; CUSTOMIZE ${c.name} IN 3D →</button>
      `;
      card.querySelector('[data-profile-focus]')?.addEventListener('click', () => {
        this.profilesModal?.classList.add('hidden');
        this.focusCharacter(c.id);
      });
      grid.appendChild(card);
    });
  }

  renderCapsuleModal() {
    const grid = document.getElementById('capsule-destinations-grid');
    if (!grid) return;
    grid.innerHTML = '';
    WORLD_ORDER.forEach(wId => {
      const m = WORLD_META[wId];
      const card = document.createElement('div');
      card.className = 'profile-dossier-card';
      card.style.borderTop = '3px solid #00f0ff';
      card.innerHTML = `
        <div>
          <div class="char-tag">SECTOR // ${m.index}</div>
          <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:3px;">${m.title}</div>
          <div style="font-size:9px;color:#00f0ff;margin-bottom:6px;">${m.subtitle}</div>
          <p style="font-size:10px;color:var(--muted);line-height:1.4;">${m.description}</p>
        </div>
        <button class="full-cta-btn" style="background:#0284c7;border-color:#38bdf8;" data-capsule-go="${wId}">
          🚇 LAUNCH CAPSULE TO ${m.title} →
        </button>
      `;
      card.querySelector('[data-capsule-go]')?.addEventListener('click', () => {
        this.switchWorld(wId);
      });
      grid.appendChild(card);
    });
  }

  openCapsuleModal() {
    this.capsuleModal?.classList.remove('hidden');
    this.sound.sfxOpenModal();
  }

  openChessModal() {
    this.chessModal?.classList.remove('hidden');
    this.chess.render();
    this.sound.sfxOpenModal();
  }

  openJamModal(instrument = 'synth') {
    this.jamModal?.classList.remove('hidden');
    this.jam.setInstrument(instrument);
    this.sound.sfxOpenModal();
  }

  // ==========================================================================
  // YOUTUBE EPISODES 1, 2, 3 & LOCAL CUT MODAL
  // ==========================================================================
  openEpisodeModal(epKey = 'ep1') {
    this.episodeModal?.classList.remove('hidden');
    this.selectEpisodeTab(epKey);
    this.sound.sfxOpenModal();
  }

  selectEpisodeTab(epKey) {
    document.querySelectorAll('[data-ep-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-ep-tab') === epKey);
    });

    const iframeWrap = document.getElementById('ep-iframe-wrap');
    const iframe = document.getElementById('episode-iframe');
    const vid = document.getElementById('episode-video');
    const titleEl = document.getElementById('episode-modal-title');
    const directLink = document.getElementById('ep-direct-yt-link');

    if (epKey === 'local') {
      iframeWrap?.classList.add('hidden');
      if (iframe) iframe.src = '';
      if (vid) {
        vid.classList.remove('hidden');
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
      if (titleEl) titleEl.textContent = 'LOCAL 3D ENGINE CUT — PUBLIC DOOM';
    } else {
      const ep = EPISODES_DATA[epKey] || EPISODES_DATA.ep1;
      if (vid) {
        vid.pause();
        vid.classList.add('hidden');
      }
      iframeWrap?.classList.remove('hidden');
      if (iframe && iframe.src !== ep.embedUrl) {
        iframe.src = ep.embedUrl;
      }
      if (titleEl) titleEl.textContent = ep.title;
      if (directLink) directLink.href = ep.watchUrl;
    }
    this.sound.sfxClick(1020);
  }

  closeEpisodeModal() {
    this.episodeModal?.classList.add('hidden');
    const vid = document.getElementById('episode-video');
    if (vid) vid.pause();
    this.sound.sfxClick(660);
  }

  // ==========================================================================
  // MERCHANDISE STORE & 3D CHARACTER TRY-ON
  // ==========================================================================
  openMerchModal(category = 'ALL') {
    this.activeMerchCategory = category;
    document.querySelectorAll('[data-merch-filter]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-merch-filter') === category);
    });
    this.renderMerchGrid();
    this.merchModal?.classList.remove('hidden');
    this.sound.sfxOpenModal();
  }

  closeMerchModal() {
    this.merchModal?.classList.add('hidden');
    this.sound.sfxClick(680);
  }

  renderMerchGrid() {
    const grid = document.getElementById('merch-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = MERCH_ITEMS.filter(item => {
      if (this.activeMerchCategory === 'ALL') return true;
      if (['JAX', 'TOPENG', 'AYESHA', 'ATHENA'].includes(this.activeMerchCategory)) {
        return item.character === this.activeMerchCategory || item.character === 'ALL';
      }
      return item.category === this.activeMerchCategory;
    });

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'merch-card';
      card.innerHTML = `
        <div class="merch-preview-wrap">
          <canvas width="200" height="150" class="merch-canvas"></canvas>
          <span class="merch-badge" style="background:${item.accent}">${item.badge}</span>
          <span class="merch-code">${item.code}</span>
        </div>
        <div class="merch-body">
          <div class="merch-top">
            <div>
              <div class="merch-subtitle">${item.subtitle}</div>
              <h3 class="merch-name">${item.name}</h3>
            </div>
            <div class="merch-price">$${item.price}</div>
          </div>
          <p class="merch-desc">${item.desc}</p>
          <ul class="merch-specs">
            ${item.specs.map(s => `<li>▪ ${s}</li>`).join('')}
          </ul>
          <div class="merch-sizes">
            ${item.sizes.map((sz, i) => `<button class="size-chip ${i === 1 || i === 0 ? 'active' : ''}" data-size="${sz}">${sz}</button>`).join('')}
          </div>
          <div class="merch-actions">
            <button class="try3d-btn">TRY ON ${item.character === 'ALL' ? 'CAST' : item.character} IN 3D</button>
            <button class="add-cart-btn">+ ADD TO BAG</button>
          </div>
        </div>
      `;

      const cvs = card.querySelector('.merch-canvas');
      renderMerchGraphic(cvs, item);

      const sizeBtns = card.querySelectorAll('.size-chip');
      let selectedSize = item.sizes[Math.min(1, item.sizes.length - 1)];
      sizeBtns.forEach(sb => {
        sb.addEventListener('click', () => {
          selectedSize = sb.getAttribute('data-size');
          sizeBtns.forEach(b => b.classList.toggle('active', b === sb));
          this.sound.sfxClick(900);
        });
      });

      card.querySelector('.try3d-btn')?.addEventListener('click', () => {
        const targetChar = item.character === 'ALL' ? 'JAX' : item.character;
        this.closeMerchModal();
        this.focusCharacter(targetChar);
      });

      card.querySelector('.add-cart-btn')?.addEventListener('click', () => {
        this.addToCart(item, selectedSize);
      });

      grid.appendChild(card);
    });
  }

  addToCart(item, size) {
    const existing = this.cart.find(c => c.item.id === item.id && c.size === size);
    if (existing) existing.qty += 1;
    else this.cart.push({ item, size, qty: 1 });
    this.sound.sfxAddCart();
    this.updateCartUI();
  }

  removeFromCart(idx) {
    this.cart.splice(idx, 1);
    this.sound.sfxClick(620);
    this.updateCartUI();
  }

  updateCartUI() {
    const count = this.cart.reduce((s, c) => s + c.qty, 0);
    const total = this.cart.reduce((s, c) => s + c.item.price * c.qty, 0);

    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = String(count);

    const summary = document.getElementById('cart-summary-text');
    if (summary) summary.textContent = `${count} ITEM(S) // $${total.toFixed(2)} USD`;

    const list = document.getElementById('cart-items-list');
    if (list) {
      list.innerHTML = '';
      if (this.cart.length === 0) {
        list.innerHTML = `<div class="cart-empty">BAG IS EMPTY — SELECT ARTIFACTS</div>`;
        return;
      }
      this.cart.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
          <div>
            <strong>${c.item.name}</strong>
            <small>[${c.size}] × ${c.qty}</small>
          </div>
          <div class="cart-row-right">
            <span>$${(c.item.price * c.qty).toFixed(2)}</span>
            <button class="cart-rm" title="Remove">✕</button>
          </div>
        `;
        row.querySelector('.cart-rm')?.addEventListener('click', () => this.removeFromCart(idx));
        list.appendChild(row);
      });
    }
  }

  openCheckoutReceipt() {
    if (!this.receiptModal) return;
    const total = this.cart.reduce((s, c) => s + c.item.price * c.qty, 0);
    const lines = this.cart.map(c =>
      `<div class="rc-line"><span>${c.qty}x ${c.item.name} (${c.size})</span><span>$${(c.item.price * c.qty).toFixed(2)}</span></div>`
    ).join('');

    document.getElementById('receipt-body').innerHTML = `
      <div class="rc-header">
        <strong>HOMER'S 24H DINER × PUBLIC DOOM</strong>
        <div>MARS, CITY OF AUSTIN // SECTOR 03</div>
        <div>ORDER #PD-${Math.floor(10000 + Math.random() * 89999)}</div>
      </div>
      <hr class="rc-dash" />
      ${lines || '<div class="rc-line"><span>1x THE ODYSSEY BURGER</span><span>$9.99</span></div>'}
      <hr class="rc-dash" />
      <div class="rc-line rc-total"><span>TOTAL DUE</span><span>$${(total || 9.99).toFixed(2)} USD</span></div>
      <div class="rc-foot">THANK YOU FOR SUPPORTING PUBLIC DOOM P(●)<br/>"TIDAK MAU TO BORING WEBSITES"</div>
    `;
    this.receiptModal.classList.remove('hidden');
    this.sound.sfxAddCart();
  }

  // ==========================================================================
  // MAIN RENDER & ANIMATION LOOP
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const t = this.now();
    const dt = Math.min(0.05, Math.max(0.001, t - this.lastFrameTime));
    this.lastFrameTime = t;
    const world = this.activeWorld;
    const meta = this.activeMeta;

    // Handle Game-Like Character Walking with WASD / Arrow Keys
    if (this.walkKeys.size > 0 && this.activeCharId) {
      const entry = world.cast[this.activeCharId];
      if (entry) {
        let f = 0, r = 0;
        if (this.walkKeys.has('w') || this.walkKeys.has('arrowup')) f += 1;
        if (this.walkKeys.has('s') || this.walkKeys.has('arrowdown')) f -= 1;
        if (this.walkKeys.has('d') || this.walkKeys.has('arrowright')) r += 1;
        if (this.walkKeys.has('a') || this.walkKeys.has('arrowleft')) r -= 1;

        if (f !== 0 || r !== 0) {
          const camDir = new THREE.Vector3();
          this.camera.getWorldDirection(camDir);
          camDir.y = 0;
          if (camDir.lengthSq() < 1e-4) camDir.set(0, 0, -1);
          camDir.normalize();
          const rightDir = new THREE.Vector3(-camDir.z, 0, camDir.x);

          const dx = camDir.x * f + rightDir.x * r;
          const dz = camDir.z * f + rightDir.z * r;
          entry.moveStep(dx, dz, dt, world.bounds);

          // Smooth third-person follow target on the walking character
          this.goalTarget.set(entry.holder.position.x, 1.18, entry.holder.position.z);
        }
      }
    }

    // Update 3D world & character spring hair / blinking / lip-sync / walking
    world.update(t);

    // Smoothly damp camera toward goalPos & goalTarget + mouse parallax & orbit offset
    this.camPos.lerp(this.goalPos, 0.085);
    this.camTarget.lerp(this.goalTarget, 0.095);
    this.camFov = lerp(this.camFov, this.goalFov, 0.09);

    const offset = this.camPos.clone().sub(this.camTarget);
    const dist = Math.max(0.9, offset.length() + this.orbitOffset.zoom);
    offset.normalize().multiplyScalar(dist);

    const totalYaw = this.orbitOffset.yaw - this.pointer.nx * 0.09;
    const totalPitch = this.orbitOffset.pitch + this.pointer.ny * 0.05;
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), totalYaw);

    const rightAxis = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), totalYaw);
    offset.applyAxisAngle(rightAxis, totalPitch);

    this.camera.position.copy(this.camTarget).add(offset);
    if (this.camera.position.y < 0.25) this.camera.position.y = 0.25;
    this.camera.fov = this.camFov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.camTarget);

    // Apply PS1 + Bayer Dither + CRT Look parameters
    Object.assign(Look, meta.look);
    Look.ps1 = this.LookOverrides.ps1;
    Look.dither = this.LookOverrides.dither;
    Look.scan = this.LookOverrides.scan;
    Look.barrel = this.LookOverrides.barrel;
    Look.toon = this.LookOverrides.toon;
    Look.dz = this.LookOverrides.dz;
    const pal = this.dzPalettes[this.LookOverrides.dzPalIdx];
    Look.dzDark = pal.dark;
    Look.dzLight = pal.light;

    if (this.transitionTimer > 0) {
      this.transitionTimer = Math.max(0, this.transitionTimer - dt);
      const k = this.transitionTimer / 0.16;
      Look.smear = [this.smearVec[0] * k, this.smearVec[1] * k];
      Look.flash = k * 0.18;
    } else {
      Look.smear = [0, 0];
      Look.flash = 0;
    }

    this.ps1.render(world.scene, this.camera, t);
    this.updatePinsProjection();
    this.sound.updateVisualizer();
  }
}

function initPublicDoom() {
  if (window.PUBLIC_DOOM) return;
  try {
    window.PUBLIC_DOOM = new PublicDoomApp();
    if (window.__PENDING_BOOT_CHIME !== undefined) {
      if (window.__PENDING_BOOT_CHIME) {
        window.PUBLIC_DOOM.sound?.playBootChime?.();
        setTimeout(() => {
          window.PUBLIC_DOOM.sound?.playTrackById?.(window.PUBLIC_DOOM.activeMeta?.bgm, true);
        }, 650);
      }
      window.PUBLIC_DOOM.triggerSmear?.(0.08, 0.02);
      delete window.__PENDING_BOOT_CHIME;
    }
  } catch (err) {
    console.error('[PUBLIC DOOM] Engine initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPublicDoom);
} else {
  initPublicDoom();
}
