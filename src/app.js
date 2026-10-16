// Main Interactive Application for PUBLIC DOOM (Logartis-style 3D World + PS1 Dither Engine)
import * as THREE from 'three';
import { Renderer, DEFAULT_LOOK } from './renderer.js';
import { camera, aim } from './world/kit.js';
import { createAllWorlds, WORLD_META, WORLD_ORDER, CHARACTER_DATA } from './worlds.js';
import { MERCH_ITEMS } from './merch.js';
import { SoundSystem, TRACK_LIST } from './audio.js';
import { clamp, lerp, E, triggerTalk } from './core.js';

class PublicDoomApp {
  constructor() {
    this.canvas = document.getElementById('stage-canvas');
    this.renderer = new Renderer(this.canvas);
    this.sound = new SoundSystem();

    // Build all 5 3D worlds (Studio, Playground, Homer's Diner, Grass Field, Diorama Island)
    this.worlds = createAllWorlds();
    this.activeWorldId = 'studio';
    this.activeCharId = null;
    this.activeHotspot = null;

    // Camera state with smooth damped interpolation + mouse parallax + orbit drag
    this.cam = camera(46);
    const d0 = WORLD_META.studio.defaultCam;
    this.camPos = new THREE.Vector3(...d0.pos);
    this.camTarget = new THREE.Vector3(...d0.target);
    this.camFov = d0.fov;

    this.goalPos = this.camPos.clone();
    this.goalTarget = this.camTarget.clone();
    this.goalFov = d0.fov;

    // Transition whip-pan smear effect (Logartis / PS1 style)
    this.transitionTimer = 0;
    this.smearVec = [0, 0];

    // Orbit & pointer state
    this.pointer = { x: 0, y: 0, nx: 0, ny: 0, down: false, dragDist: 0, lastX: 0, lastY: 0 };
    this.orbitOffset = { yaw: 0, pitch: 0, zoom: 0 };
    this.raycaster = new THREE.Raycaster();
    this.projVec = new THREE.Vector3();

    // User Post-FX Shader overrides
    this.LookOverrides = {
      ps1: 2,
      dither: 0.7,
      scan: 0.15,
      barrel: 0.05,
      toon: 0,
      dz: 0,
      dzPalIdx: 0,
      crt: 0,
    };
    this.dzPalettes = [
      { name: 'DOOM ICE', pal: ['#0c0f14', '#1d3b52', '#a6d7e6', '#f0e8da'] },
      { name: 'CRIMSON', pal: ['#0d070a', '#4c111b', '#d8261c', '#f5e9dc'] },
      { name: 'VIOLET', pal: ['#0b0814', '#2e1a5e', '#8b5cf6', '#f3e8ff'] },
      { name: 'MATRIX', pal: ['#050c08', '#0f3822', '#22c55e', '#dcfce7'] },
    ];

    // Merch store state
    this.cart = [
      { item: MERCH_ITEMS[0], size: 'L', qty: 1 },
    ];
    this.merchFilter = 'ALL';
    this.merchCanvases = [];

    // Quote indices per character
    this.quoteCursor = { JAX: 0, TOPENG: 0, AYESHA: 0, ATHENA: 0 };

    this.frameCount = 0;
    this.startTime = performance.now() * 0.001;

    this.initDOM();
    this.initEvents();
    this.rebuildPins();
    this.updateWorldHUD();
    this.renderMerchGrid();
    this.updateCartBadge();

    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  get activeWorld() {
    return this.worlds[this.activeWorldId];
  }

  get activeMeta() {
    return WORLD_META[this.activeWorldId];
  }

  initDOM() {
    this.pinsLayer = document.getElementById('pins-layer');
    this.charPanel = document.getElementById('char-panel');
    this.hotspotToast = document.getElementById('hotspot-toast');
    this.merchModal = document.getElementById('merch-modal');
    this.episodeModal = document.getElementById('episode-modal');
    this.receiptModal = document.getElementById('receipt-modal');
    this.fxDrawer = document.getElementById('fx-drawer');

    // Sound track change callback
    this.sound.onTrackChange = (tr, playing) => {
      const titleEl = document.getElementById('bgm-track-title');
      const stateEl = document.getElementById('bgm-play-btn');
      if (titleEl && tr) titleEl.textContent = tr.title;
      if (stateEl) stateEl.textContent = playing ? '❚❚ PAUSE' : '▶ PLAY';
    };
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.renderer.resize(window.innerWidth, window.innerHeight);
    });
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // Boot Splash Start
    const startBtn = document.getElementById('boot-start-btn');
    const skipBtn = document.getElementById('boot-skip-btn');
    const dismissBoot = (withChime = true) => {
      const boot = document.getElementById('boot-screen');
      if (!boot || boot.classList.contains('hidden')) return;
      if (withChime) this.sound.playBoot();
      this.sound.playTrackById(this.activeMeta.bgm, true);
      boot.classList.add('hidden');
      this.triggerSmear(0.12, 0);
    };
    if (startBtn) startBtn.addEventListener('click', () => dismissBoot(true));
    if (skipBtn) skipBtn.addEventListener('click', () => dismissBoot(false));

    // World Navigation Tabs
    document.querySelectorAll('[data-world-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = btn.getAttribute('data-world-btn');
        this.switchWorld(w);
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

    // Quick Character Dock Buttons (Jax, Topeng, Ayesha, Athena)
    document.querySelectorAll('[data-char-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-char-btn');
        this.focusCharacter(cid);
      });
    });

    // Character Inspector Controls
    document.getElementById('char-close-btn')?.addEventListener('click', () => this.closeCharacterPanel());
    document.getElementById('char-quote-btn')?.addEventListener('click', () => this.nextCharacterQuote());
    document.getElementById('char-outfit-btn')?.addEventListener('click', () => this.cycleCharacterOutfit());
    document.getElementById('char-merch-btn')?.addEventListener('click', () => {
      if (!this.activeCharId) return;
      this.openMerchModal(this.activeCharId);
    });

    document.querySelectorAll('[data-pose-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pose = btn.getAttribute('data-pose-btn');
        if (!this.activeCharId) return;
        const entry = this.activeWorld.cast[this.activeCharId];
        if (entry) {
          entry.setPose(pose);
          this.sound.sfxClick(1320);
        }
        document.querySelectorAll('[data-pose-btn]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    document.querySelectorAll('[data-expr-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const expr = btn.getAttribute('data-expr-btn');
        if (!this.activeCharId) return;
        const entry = this.activeWorld.cast[this.activeCharId];
        if (entry) {
          entry.setExpr(expr, this.now());
          if (expr === 'talk') {
            triggerTalk(3.2, this.now());
            this.sound.sfxVoice(this.activeCharId);
          } else {
            this.sound.sfxClick(1080);
          }
        }
        document.querySelectorAll('[data-expr-btn]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Hotspot Toast Close
    document.getElementById('toast-close-btn')?.addEventListener('click', () => {
      this.hotspotToast?.classList.add('hidden');
      this.resetCameraToWorld();
    });

    // Audio HUD Controls
    document.getElementById('bgm-play-btn')?.addEventListener('click', () => this.sound.togglePlay());
    document.getElementById('bgm-next-btn')?.addEventListener('click', () => this.sound.nextTrack());
    document.getElementById('bgm-mute-btn')?.addEventListener('click', e => {
      const m = this.sound.toggleMute();
      e.currentTarget.textContent = m ? 'MUTE: ON' : 'MUTE: OFF';
      e.currentTarget.classList.toggle('active', m);
    });

    // Top Navigation Modals (Merch Store, Episode Video Player, Shader FX Lab)
    document.getElementById('open-merch-btn')?.addEventListener('click', () => this.openMerchModal('ALL'));
    document.getElementById('close-merch-btn')?.addEventListener('click', () => this.closeMerchModal());
    document.getElementById('open-episode-btn')?.addEventListener('click', () => this.openEpisodeModal());
    document.getElementById('close-episode-btn')?.addEventListener('click', () => this.closeEpisodeModal());
    document.getElementById('toggle-fx-btn')?.addEventListener('click', () => {
      this.fxDrawer?.classList.toggle('hidden');
      this.sound.sfxClick(1100);
    });
    document.getElementById('reset-cam-btn')?.addEventListener('click', () => {
      this.closeCharacterPanel();
      this.resetCameraToWorld();
    });

    // Merch Category Filter Buttons
    document.querySelectorAll('[data-merch-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-merch-filter');
        this.merchFilter = f;
        document.querySelectorAll('[data-merch-filter]').forEach(b => b.classList.toggle('active', b === btn));
        this.renderMerchGrid();
        this.sound.sfxClick(1250);
      });
    });

    // Checkout Button
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

    // Keyboard shortcuts (1-4 for worlds, 0 for island map, M for merch, ESC to reset)
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeMerchModal();
        this.closeEpisodeModal();
        this.closeCharacterPanel();
        this.hotspotToast?.classList.add('hidden');
        this.resetCameraToWorld();
      } else if (e.key === '1') this.switchWorld('studio');
      else if (e.key === '2') this.switchWorld('playground');
      else if (e.key === '3') this.switchWorld('diner');
      else if (e.key === '4') this.switchWorld('meadow');
      else if (e.key === '0') this.switchWorld('island');
      else if (e.key === 'm' || e.key === 'M') this.openMerchModal('ALL');
    });
  }

  now() {
    return performance.now() * 0.001 - this.startTime;
  }

  triggerSmear(sx = 0.04, sy = 0.0) {
    this.smearVec = [sx, sy];
    this.transitionTimer = 0.16;
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

    const meta = WORLD_META[worldId];
    const d = meta.defaultCam;
    this.camPos.set(d.pos[0] + 0.35 * dir, d.pos[1] + 0.12, d.pos[2] + 0.45);
    this.camTarget.set(...d.target);
    this.camFov = d.fov + 4;
    this.flyCamera(d.pos, d.target, d.fov);
    this.triggerSmear(0.035 * dir, 0.005);
    this.sound.sfxTransition();
    this.sound.playTrackById(meta.bgm, this.sound.playing);

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

    // Camera view sub-buttons for this world
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

    // 1. Character Pins (Jax, Topeng, Ayesha, Athena)
    Object.values(world.cast).forEach(entry => {
      const el = document.createElement('button');
      el.className = 'pin-tag char-pin';
      el.style.setProperty('--pin-accent', entry.meta.accent);
      el.innerHTML = `
        <span class="pin-dot"></span>
        <span class="pin-name">${entry.meta.name}</span>
        <span class="pin-role">${entry.id === 'JAX' ? 'HOST' : entry.id === 'TOPENG' ? 'LABS' : entry.id === 'AYESHA' ? 'DIR' : 'SYNTH'}</span>
      `;
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.focusCharacter(entry.id);
      });
      this.pinsLayer.appendChild(el);
      this.pinElements.push({
        type: 'char',
        id: entry.id,
        el,
        getPos: () => entry.getHeadWorldPos(),
      });
    });

    // 2. Prop / Portal Hotspot Pins
    world.hotspots.forEach(hs => {
      const el = document.createElement('button');
      el.className = 'pin-tag prop-pin';
      el.innerHTML = `
        <span class="pin-plus">+</span>
        <span class="pin-copy">
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
        type: 'hotspot',
        id: hs.id,
        el,
        getPos: () => hs.pos,
      });
    });
  }

  focusCharacter(charId) {
    const entry = this.activeWorld.cast[charId];
    if (!entry) return;
    this.activeCharId = charId;
    this.hotspotToast?.classList.add('hidden');

    const cam = entry.getFocusCam();
    this.flyCamera(cam.pos, cam.target, cam.fov);
    entry.triggerWave(this.now());
    entry.setExpr('talk', this.now());
    triggerTalk(3.2, this.now());
    this.sound.sfxVoice(charId);

    // Populate Character Dossier Panel
    const meta = entry.meta;
    document.getElementById('char-panel-tag').textContent = meta.tag;
    document.getElementById('char-panel-name').textContent = meta.name;
    document.getElementById('char-panel-name').style.color = meta.accent;
    document.getElementById('char-panel-role').textContent = meta.role;
    document.getElementById('char-panel-bio').textContent = meta.bio;
    document.getElementById('char-outfit-label').textContent = entry.outfitLabel;

    const qIdx = this.quoteCursor[charId] % meta.quotes.length;
    document.getElementById('char-panel-quote').textContent = meta.quotes[qIdx];

    const statsGrid = document.getElementById('char-stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = Object.entries(meta.stats).map(([k, v]) => `
        <div class="stat-cell">
          <span class="stat-k">${k}</span>
          <span class="stat-v">${v}</span>
        </div>
      `).join('');
    }

    document.querySelectorAll('[data-char-btn]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-char-btn') === charId);
    });

    this.charPanel?.classList.remove('hidden');
  }

  closeCharacterPanel() {
    this.activeCharId = null;
    this.charPanel?.classList.add('hidden');
    document.querySelectorAll('[data-char-btn]').forEach(b => b.classList.remove('active'));
  }

  nextCharacterQuote() {
    if (!this.activeCharId) return;
    const entry = this.activeWorld.cast[this.activeCharId];
    if (!entry) return;
    this.quoteCursor[this.activeCharId] = (this.quoteCursor[this.activeCharId] + 1) % entry.meta.quotes.length;
    const q = entry.meta.quotes[this.quoteCursor[this.activeCharId]];
    document.getElementById('char-panel-quote').textContent = q;
    entry.setExpr('talk', this.now());
    triggerTalk(3.0, this.now());
    this.sound.sfxVoice(this.activeCharId);
  }

  cycleCharacterOutfit() {
    if (!this.activeCharId) return;
    const entry = this.activeWorld.cast[this.activeCharId];
    if (!entry) return;
    const label = entry.cycleOutfit();
    document.getElementById('char-outfit-label').textContent = label;
    this.sound.sfxCash();
  }

  triggerHotspot(hs) {
    this.closeCharacterPanel();
    if (hs.action === 'world' && hs.targetWorld) {
      this.switchWorld(hs.targetWorld);
      return;
    }
    if (hs.cam) {
      this.flyCamera(hs.cam.pos, hs.cam.target, hs.cam.fov);
    }
    if (hs.action === 'episode') {
      this.openEpisodeModal();
      return;
    }
    if (hs.action === 'bgm-cycle') {
      this.sound.nextTrack();
    } else if (hs.action === 'custom' && hs.onTrigger) {
      hs.onTrigger(this.activeWorld, this);
      this.sound.sfxClick(1280);
    } else {
      this.sound.sfxClick(1020);
    }

    if (this.hotspotToast) {
      document.getElementById('toast-title').textContent = hs.title || hs.label;
      document.getElementById('toast-desc').textContent = hs.desc || '';
      this.hotspotToast.classList.remove('hidden');
    }
  }

  checkHoverCursor() {
    this.raycaster.setFromCamera({ x: this.pointer.nx, y: this.pointer.ny }, this.cam);
    const hits = this.raycaster.intersectObjects(this.activeWorld.scene.children, true);
    let pick = null;
    for (const h of hits) {
      if (h.object.userData && h.object.userData.pick) {
        pick = h.object.userData.pick;
        break;
      }
    }
    this.canvas.style.cursor = pick ? 'pointer' : 'grab';
  }

  handleCanvasClick(e) {
    this.raycaster.setFromCamera({ x: this.pointer.nx, y: this.pointer.ny }, this.cam);
    const hits = this.raycaster.intersectObjects(this.activeWorld.scene.children, true);
    for (const h of hits) {
      const p = h.object.userData?.pick;
      if (!p) continue;
      if (p.type === 'character') {
        this.focusCharacter(p.id);
        return;
      }
      if (p.type === 'world-portal' && p.targetWorld) {
        this.switchWorld(p.targetWorld);
        return;
      }
      if (p.type === 'hotspot' && p.hotspot) {
        this.triggerHotspot(p.hotspot);
        return;
      }
    }
  }

  // ============================================================================
  // MERCHANDISE STORE & CART
  // ============================================================================
  openMerchModal(filter = 'ALL') {
    this.merchFilter = filter;
    document.querySelectorAll('[data-merch-filter]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-merch-filter') === filter);
    });
    this.renderMerchGrid();
    this.merchModal?.classList.remove('hidden');
    this.sound.sfxClick(1160);
  }

  closeMerchModal() {
    this.merchModal?.classList.add('hidden');
  }

  renderMerchGrid() {
    const grid = document.getElementById('merch-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.merchCanvases = [];

    const list = MERCH_ITEMS.filter(item => {
      if (this.merchFilter === 'ALL') return true;
      return item.category === this.merchFilter || item.character === this.merchFilter;
    });

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'merch-card';
      let selectedSize = item.sizes[Math.min(1, item.sizes.length - 1)];

      card.innerHTML = `
        <div class="merch-preview-wrap">
          <canvas width="180" height="150" class="merch-canvas"></canvas>
          <span class="merch-badge">${item.badge}</span>
          <span class="merch-code">${item.code}</span>
        </div>
        <div class="merch-body">
          <div class="merch-head-row">
            <div>
              <div class="merch-sub">${item.subtitle}</div>
              <h3 class="merch-title">${item.name}</h3>
            </div>
            <div class="merch-price">$${item.price}</div>
          </div>
          <p class="merch-desc">${item.desc}</p>
          <div class="merch-specs">
            ${item.specs.map(s => `<span>• ${s}</span>`).join('')}
          </div>
          <div class="merch-controls">
            <div class="size-row">
              ${item.sizes.map(sz => `<button class="sz-btn ${sz === selectedSize ? 'active' : ''}" data-sz="${sz}">${sz}</button>`).join('')}
            </div>
            <div class="merch-actions">
              <button class="try-3d-btn" title="Preview on ${item.character} in 3D World">TRY ON ${item.character} IN 3D</button>
              <button class="add-cart-btn">+ ADD TO BAG</button>
            </div>
          </div>
        </div>
      `;

      const cv = card.querySelector('.merch-canvas');
      this.merchCanvases.push({ cv, ctx: cv.getContext('2d'), item });

      card.querySelectorAll('.sz-btn').forEach(b => {
        b.addEventListener('click', () => {
          selectedSize = b.getAttribute('data-sz');
          card.querySelectorAll('.sz-btn').forEach(x => x.classList.toggle('active', x === b));
          this.sound.sfxClick(1300);
        });
      });

      card.querySelector('.add-cart-btn').addEventListener('click', () => {
        const existing = this.cart.find(c => c.item.id === item.id && c.size === selectedSize);
        if (existing) existing.qty++;
        else this.cart.push({ item, size: selectedSize, qty: 1 });
        this.updateCartBadge();
        this.sound.sfxCash();
      });

      card.querySelector('.try-3d-btn').addEventListener('click', () => {
        this.closeMerchModal();
        this.focusCharacter(item.character);
      });

      grid.appendChild(card);
    });
  }

  updateCartBadge() {
    const totalQty = this.cart.reduce((s, c) => s + c.qty, 0);
    const totalPrice = this.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = totalQty;
    const summaryEl = document.getElementById('cart-summary-text');
    if (summaryEl) summaryEl.textContent = `${totalQty} ITEM(S) // $${totalPrice}.00 USD`;

    const cartList = document.getElementById('cart-items-list');
    if (cartList) {
      if (!this.cart.length) {
        cartList.innerHTML = `<div class="cart-empty">BAG IS EMPTY // SELECT ARTIFACTS ABOVE</div>`;
      } else {
        cartList.innerHTML = this.cart.map((c, idx) => `
          <div class="cart-row">
            <span><strong>${c.item.name}</strong> [${c.size}] × ${c.qty}</span>
            <span>$${c.item.price * c.qty}.00 <button class="cart-rm" data-rm="${idx}">×</button></span>
          </div>
        `).join('');
        cartList.querySelectorAll('.cart-rm').forEach(b => {
          b.addEventListener('click', () => {
            const i = +b.getAttribute('data-rm');
            this.cart.splice(i, 1);
            this.updateCartBadge();
            this.sound.sfxClick(780);
          });
        });
      }
    }
  }

  openCheckoutReceipt() {
    if (!this.cart.length) return;
    this.sound.sfxCash();
    const total = this.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
    const body = document.getElementById('receipt-body');
    if (body) {
      const orderNo = 'PD-' + Math.floor(100000 + Math.random() * 899999);
      body.innerHTML = `
        <div class="rc-header">
          <strong>HOMER'S DINER × PUBLIC DOOM SUPPLY</strong>
          <div>EST. 8TH CENTURY BC // SECTOR 03</div>
          <div>ORDER #${orderNo} · CASHIER: JAX</div>
        </div>
        <hr class="rc-dash"/>
        ${this.cart.map(c => `
          <div class="rc-line">
            <span>${c.qty}x ${c.item.name} (${c.size})</span>
            <span>$${(c.item.price * c.qty).toFixed(2)}</span>
          </div>
        `).join('')}
        <hr class="rc-dash"/>
        <div class="rc-line"><span>SUBTOTAL</span><span>$${total.toFixed(2)}</span></div>
        <div class="rc-line"><span>BUNKER SHIPPING</span><span>$0.00 (FREE)</span></div>
        <div class="rc-line rc-total"><span>TOTAL PAID</span><span>$${total.toFixed(2)}</span></div>
        <hr class="rc-dash"/>
        <div class="rc-foot">
          "NOTHING IS INTERESTING UNLESS YOU MAKE IT."<br/>
          THANK YOU FOR SUPPORTING PUBLIC DOOM P(●)
        </div>
      `;
    }
    this.receiptModal?.classList.remove('hidden');
  }

  // ============================================================================
  // EPISODE VIDEO ARCHIVE MODAL
  // ============================================================================
  openEpisodeModal() {
    this.episodeModal?.classList.remove('hidden');
    const vid = document.getElementById('episode-video');
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
    this.sound.sfxClick(1180);
  }

  closeEpisodeModal() {
    this.episodeModal?.classList.add('hidden');
    const vid = document.getElementById('episode-video');
    if (vid) vid.pause();
  }

  // ============================================================================
  // MAIN FRAME LOOP
  // ============================================================================
  animate() {
    requestAnimationFrame(this.animate);
    const t = this.now();
    this.frameCount++;

    // Update active 3D world & character animations
    const world = this.activeWorld;
    world.update(t);

    // Update merch preview canvases if store modal is open
    if (this.merchModal && !this.merchModal.classList.contains('hidden')) {
      for (const m of this.merchCanvases) {
        m.item.drawPreview(m.ctx, m.cv.width, m.cv.height, t);
      }
    }

    // Update audio visualizer bars in HUD
    if (this.frameCount % 3 === 0) {
      const bars = this.sound.getBars(8);
      const barEls = document.querySelectorAll('.eq-bar');
      barEls.forEach((el, i) => {
        el.style.transform = `scaleY(${bars[i] || 0.15})`;
      });
    }

    // Smoothly interpolate camera position, target, and FOV + mouse parallax + orbit offset
    const damp = 0.085;
    this.camPos.lerp(this.goalPos, damp);
    this.camTarget.lerp(this.goalTarget, damp);
    this.camFov = lerp(this.camFov, this.goalFov, damp);

    // Compute orbited + parallaxed camera eye
    const offset = this.camPos.clone().sub(this.camTarget);
    const dist = Math.max(1.2, offset.length() + this.orbitOffset.zoom);
    offset.normalize().multiplyScalar(dist);

    // Apply user orbit drag + subtle mouse parallax
    const pxYaw = this.orbitOffset.yaw + this.pointer.nx * 0.08;
    const pxPitch = this.orbitOffset.pitch + this.pointer.ny * 0.05;
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), pxYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), pxYaw);
    offset.applyAxisAngle(right, pxPitch);

    const finalEye = this.camTarget.clone().add(offset);
    finalEye.y = Math.max(0.28, finalEye.y);

    this.cam.fov = this.camFov;
    this.cam.updateProjectionMatrix();
    aim(this.cam, [finalEye.x, finalEye.y, finalEye.z], [this.camTarget.x, this.camTarget.y, this.camTarget.z]);

    // Decay camera whip-pan smear
    if (this.transitionTimer > 0) {
      this.transitionTimer = Math.max(0, this.transitionTimer - 1 / 60);
    } else {
      this.smearVec = [0, 0];
    }

    // Compose Look uniforms (World look + User PS1/Dither overrides)
    const pal = this.dzPalettes[this.LookOverrides.dzPalIdx].pal;
    const look = {
      ...DEFAULT_LOOK,
      ...this.activeMeta.look,
      ps1: this.LookOverrides.ps1,
      dither: this.LookOverrides.dither,
      scan: this.LookOverrides.scan,
      barrel: this.LookOverrides.barrel,
      toon: this.LookOverrides.toon,
      dz: this.LookOverrides.dz,
      dzPal: pal,
      smear: this.transitionTimer > 0 ? this.smearVec : [0, 0],
    };

    // Render 3D scene through PS1 + Dither + CRT post-processing pipeline
    this.renderer.frame({
      scene: world.scene,
      camera: this.cam,
      look,
      t,
      frame: this.frameCount,
      target: 'screen',
    });

    // Project 3D pins to 2D screen coordinates
    this.updateProjectedPins();
  }

  updateProjectedPins() {
    if (!this.pinElements) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.cam.updateMatrixWorld();

    for (const p of this.pinElements) {
      const worldPos = p.getPos();
      this.projVec.copy(worldPos).project(this.cam);
      const behind = this.projVec.z > 1.0 || this.projVec.z < -1.0;
      const sx = (this.projVec.x * 0.5 + 0.5) * W;
      const sy = (-this.projVec.y * 0.5 + 0.5) * H;
      const inBounds = !behind && sx > 20 && sx < W - 20 && sy > 20 && sy < H - 20;

      if (!inBounds) {
        p.el.style.opacity = '0';
        p.el.style.pointerEvents = 'none';
      } else {
        p.el.style.opacity = '1';
        p.el.style.pointerEvents = 'auto';
        p.el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0) translate(-50%, -100%)`;
        p.el.classList.toggle('selected', p.type === 'char' && p.id === this.activeCharId);
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.PUBLIC_DOOM = new PublicDoomApp();
});
