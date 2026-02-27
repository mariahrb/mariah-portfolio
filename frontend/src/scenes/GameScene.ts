/**
 * GameScene.ts — Main Phaser world scene for Mariah Valley v3
 *
 * Features:
 *  - Procedural tilemap (replaces with Tiled JSON in production)
 *  - Player with 4-directional animated sprite
 *  - NPC spawning from API data with interaction zones
 *  - Dialogue system with choice trees
 *  - Building entry with zoom + fade transition
 *  - Quest tracking
 *  - Analytics events fired to Go backend
 */

import Phaser from 'phaser';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NPCData {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  sprite: string;
  building?: string;
}

interface DialogueLine {
  text: string;
  speaker: string;
  choices?: Array<{ text: string; nextId?: string; action?: string }>;
}

interface DialogueTree {
  npcId: string;
  start: string;
  lines: Record<string, DialogueLine>;
}

interface Building {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sign: string;
  pageKey: string;
  color: number;
  roofColor: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE = 32;
const WORLD_W = 52;
const WORLD_H = 40;

const BUILDINGS: Building[] = [
  { id: 'home',       x:  8*TILE, y:  7*TILE, w: 6*TILE, h: 5*TILE, label: 'HOME',       sign: '🏠', pageKey: 'home',       color: 0xc87850, roofColor: 0xb06840 },
  { id: 'devlab',     x: 32*TILE, y:  7*TILE, w: 7*TILE, h: 5*TILE, label: 'DEV LAB',    sign: '💻', pageKey: 'devlab',     color: 0x4a6fa5, roofColor: 0x3a5f95 },
  { id: 'studio',     x:  8*TILE, y: 23*TILE, w: 6*TILE, h: 5*TILE, label: 'STUDIO',     sign: '🎨', pageKey: 'studio',     color: 0x9b5ea5, roofColor: 0x7b4a8b },
  { id: 'innovation', x: 32*TILE, y: 23*TILE, w: 7*TILE, h: 5*TILE, label: 'INNOVATION', sign: '🌱', pageKey: 'innovation', color: 0x3a8b5b, roofColor: 0x2a7a4b },
  { id: 'library',    x: 20*TILE, y:  5*TILE, w: 6*TILE, h: 5*TILE, label: 'LIBRARY',    sign: '📜', pageKey: 'library',    color: 0x9b853a, roofColor: 0x7b6a2a },
  { id: 'townhall',   x: 20*TILE, y: 29*TILE, w: 6*TILE, h: 5*TILE, label: 'TOWN HALL',  sign: '📬', pageKey: 'townhall',   color: 0x6b4a9b, roofColor: 0x5a3a8b },
];

// ─── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle; // Replace with Sprite when you have art
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;

  private npcObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private dialogueTrees: Map<string, DialogueTree> = new Map();
  private activeDialogue: { tree: DialogueTree; lineId: string } | null = null;
  private dialogueBox!: Phaser.GameObjects.Container;
  private interactPrompt!: Phaser.GameObjects.Container;

  private nearBuilding: Building | null = null;
  private nearNPC: NPCData | null = null;
  private visitedBuildings: Set<string> = new Set();
  private talkedNPCs: Set<string> = new Set();

  private onOpenPage!: (pageKey: string) => void;
  private sessionId: string = Math.random().toString(36).slice(2);

  constructor() {
    super({ key: 'GameScene' });
  }

  // Called by React wrapper to wire up the page overlay
  setPageCallback(cb: (key: string) => void) {
    this.onOpenPage = cb;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  preload() {
    // In production load: this.load.tilemapTiledJSON('world', '/assets/world.json');
    // this.load.spritesheet('player', '/assets/player.png', { frameWidth: 16, frameHeight: 24 });
    // For now we draw primitives — swap for real sprites later.
  }

  async create() {
    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W * TILE, WORLD_H * TILE);

    // Ground layer (procedural — swap with Tiled tilemap in production)
    this.createGroundLayer();

    // Buildings
    this.createBuildings();

    // Player
    this.createPlayer();

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W * TILE, WORLD_H * TILE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.keyboard!.on('keydown-E', () => this.handleInteract());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleInteract());

    // UI
    this.createDialogueBox();
    this.createInteractPrompt();

    // Fetch NPC data from Go API
    await this.loadNPCs();

    // Track session start
    this.trackEvent('session_start', 'world');
  }

  update() {
    this.handleMovement();
    this.checkProximity();
  }

  // ─── World Building ─────────────────────────────────────────────────────────

  private createGroundLayer() {
    const g = this.add.graphics();

    // Base grass
    g.fillStyle(0x3d6b4a);
    g.fillRect(0, 0, WORLD_W * TILE, WORLD_H * TILE);

    // Path cross
    g.fillStyle(0xc4995a);
    const cx = (WORLD_W / 2) * TILE;
    const cy = (WORLD_H / 2) * TILE;
    g.fillRect(0, cy - TILE, WORLD_W * TILE, TILE * 2);     // horizontal
    g.fillRect(cx - TILE, 0, TILE * 2, WORLD_H * TILE);     // vertical

    // Grass patches (deterministic)
    g.fillStyle(0x4a8a5a, 0.4);
    for (let i = 0; i < 150; i++) {
      const px = this.seededRand(i * 7) * WORLD_W * TILE;
      const py = this.seededRand(i * 13) * WORLD_H * TILE;
      g.fillRect(px, py, 8 + this.seededRand(i * 3) * 24, 6 + this.seededRand(i * 5) * 16);
    }

    // Flowers
    const flowerColors = [0xff8fab, 0xffd93d, 0xc7f2a4, 0xaed9e0];
    for (let i = 0; i < 100; i++) {
      const fx = this.seededRand(i * 11) * WORLD_W * TILE;
      const fy = this.seededRand(i * 17) * WORLD_H * TILE;
      g.fillStyle(flowerColors[i % flowerColors.length]);
      g.fillRect(fx, fy, 3, 3);
    }
  }

  private createBuildings() {
    for (const b of BUILDINGS) {
      const g = this.add.graphics();

      // Shadow
      g.fillStyle(0x000000, 0.15);
      g.fillRect(b.x + 4, b.y + b.h - 2, b.w + 4, 8);

      // Wall
      g.fillStyle(b.color);
      g.fillRect(b.x, b.y + TILE, b.w, b.h - TILE);

      // Wall shading
      g.fillStyle(0x000000, 0.1);
      g.fillRect(b.x + b.w - 6, b.y + TILE, 6, b.h - TILE);

      // Roof
      g.fillStyle(b.roofColor);
      g.fillTriangle(
        b.x - 6,        b.y + TILE,
        b.x + b.w / 2,  b.y,
        b.x + b.w + 6,  b.y + TILE
      );

      // Door
      g.fillStyle(0x2a1a0a);
      g.fillRect(b.x + b.w / 2 - TILE / 2, b.y + b.h - TILE, TILE, TILE);

      // Door frame
      g.fillStyle(0xc8a04a);
      g.fillRect(b.x + b.w / 2 - TILE / 2 - 2, b.y + b.h - TILE - 4, TILE + 4, 4);

      // Windows
      g.fillStyle(0x9ad4ee);
      const winCount = b.w >= 7 * TILE ? 3 : 2;
      for (let w = 0; w < winCount; w++) {
        const wx = b.x + 8 + w * (b.w / winCount);
        g.fillRect(wx, b.y + TILE + 8, 16, 12);
      }

      // Building label text
      this.add.text(b.x + b.w / 2, b.y + TILE * 2 + 2, b.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        color: '#3a2a0a',
        backgroundColor: '#f0d8a0',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      // Sign emoji
      this.add.text(b.x + b.w / 2, b.y + TILE - 4, b.sign, {
        fontSize: '14px',
      }).setOrigin(0.5);

      // Interaction zone (invisible sensor)
      const zone = this.add.zone(b.x + b.w / 2, b.y + b.h + TILE * 0.5, b.w, TILE * 2)
        .setInteractive();
      (zone as any).buildingId = b.id;
    }
  }

  private createPlayer() {
    // Placeholder rectangle — replace with animated sprite sheet in production
    // this.player = this.physics.add.sprite(cx, cy, 'player');
    const cx = (WORLD_W / 2) * TILE;
    const cy = (WORLD_H / 2) * TILE + 80;

    this.player = this.add.rectangle(cx, cy, 12, 20, 0x4a6fa5);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setCollideWorldBounds(true)
      .setSize(12, 14)
      .setOffset(0, 6);

    // Add head
    this.add.rectangle(0, -12, 10, 12, 0xf5c5a3).setDepth(1);
  }

  // ─── NPC Loading ────────────────────────────────────────────────────────────

  private async loadNPCs() {
    try {
      const res = await fetch(`${API}/game/npcs`);
      const data = await res.json();

      for (const npc of data.npcs as NPCData[]) {
        this.spawnNPC(npc);
        // Pre-load their dialogue tree
        this.loadDialogue(npc.id);
      }
    } catch (e) {
      console.warn('API unavailable, using fallback NPCs', e);
      this.spawnFallbackNPCs();
    }
  }

  private spawnNPC(npc: NPCData) {
    const body = this.add.rectangle(0, 0, 14, 20, this.npcColor(npc.id));
    const nameTag = this.add.text(0, -20, npc.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5);

    const container = this.add.container(npc.x, npc.y, [body, nameTag]);
    (container as any).npcData = npc;

    // Idle bobbing tween
    this.tweens.add({
      targets: container,
      y: npc.y - 3,
      yoyo: true,
      repeat: -1,
      duration: 1200 + Math.random() * 400,
      ease: 'Sine.easeInOut',
    });

    this.npcObjects.set(npc.id, container);
  }

  private spawnFallbackNPCs() {
    const fallback: NPCData[] = [
      { id: 'old-dev',   name: 'Old Dev',  role: 'Retired Engineer', x: 820,  y: 580, sprite: '' },
      { id: 'designer',  name: 'Pixel',    role: 'UI Wizard',        x: 340,  y: 780, sprite: '' },
      { id: 'recruiter', name: 'Scout',    role: 'Talent Scout',     x: 1100, y: 420, sprite: '' },
      { id: 'mentor',    name: 'Sage',     role: 'Mentor',           x: 660,  y: 200, sprite: '' },
    ];
    for (const npc of fallback) this.spawnNPC(npc);
  }

  private async loadDialogue(npcId: string) {
    try {
      const res = await fetch(`${API}/game/dialogue/${npcId}`);
      const tree: DialogueTree = await res.json();
      this.dialogueTrees.set(npcId, tree);
    } catch (_) { /* handled at interact time */ }
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  private handleMovement() {
    if (this.activeDialogue) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 90;
    body.setVelocity(0);

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    if (left)  body.setVelocityX(-speed);
    if (right) body.setVelocityX(speed);
    if (up)    body.setVelocityY(-speed);
    if (down)  body.setVelocityY(speed);

    // Normalize diagonal
    if ((left || right) && (up || down)) {
      body.velocity.scale(0.707);
    }
  }

  private handleInteract() {
    // If in dialogue, advance it
    if (this.activeDialogue) return;

    if (this.nearNPC) {
      this.startDialogue(this.nearNPC.id);
    } else if (this.nearBuilding) {
      this.enterBuilding(this.nearBuilding);
    }
  }

  // ─── Proximity Check ────────────────────────────────────────────────────────

  private checkProximity() {
    const px = this.player.x;
    const py = this.player.y;
    const INTERACT_DIST = 32;

    // Buildings
    this.nearBuilding = null;
    for (const b of BUILDINGS) {
      const bx = b.x + b.w / 2;
      const by = b.y + b.h;
      if (Math.abs(px - bx) < b.w / 2 + 4 && Math.abs(py - by) < INTERACT_DIST) {
        this.nearBuilding = b;
        break;
      }
    }

    // NPCs
    this.nearNPC = null;
    for (const [, container] of this.npcObjects) {
      const npc = (container as any).npcData as NPCData;
      const dist = Phaser.Math.Distance.Between(px, py, container.x, container.y);
      if (dist < INTERACT_DIST) {
        this.nearNPC = npc;
        break;
      }
    }

    // Show/hide prompt
    const hasTarget = !!this.nearBuilding || !!this.nearNPC;
    this.interactPrompt.setVisible(hasTarget);
    if (hasTarget) {
      const label = this.nearNPC
        ? `[ E ] TALK TO ${this.nearNPC.name.toUpperCase()}`
        : `[ E ] ENTER ${this.nearBuilding!.label}`;
      (this.interactPrompt.getAt(1) as Phaser.GameObjects.Text).setText(label);
      this.interactPrompt.setPosition(this.cameras.main.scrollX + this.scale.width / 2, this.cameras.main.scrollY + this.scale.height - 60);
    }
  }

  // ─── Building Entry ─────────────────────────────────────────────────────────

  private enterBuilding(b: Building) {
    this.visitedBuildings.add(b.id);
    this.trackEvent('building_entered', b.id);

    // Zoom-in + fade transition
    this.cameras.main.zoomTo(4, 400, 'Sine.easeIn');
    this.time.delayedCall(350, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
    });
    this.time.delayedCall(600, () => {
      this.cameras.main.resetFX();
      this.cameras.main.setZoom(2);
      if (this.onOpenPage) this.onOpenPage(b.pageKey);
    });
  }

  // ─── Dialogue System ────────────────────────────────────────────────────────

  private startDialogue(npcId: string) {
    const tree = this.dialogueTrees.get(npcId);
    if (!tree) {
      this.showSimpleDialogue('...', 'NPC');
      return;
    }

    this.talkedNPCs.add(npcId);
    this.trackEvent('npc_talked', npcId);
    this.activeDialogue = { tree, lineId: tree.start };
    this.renderDialogueLine();
    this.dialogueBox.setVisible(true);
  }

  private renderDialogueLine() {
    if (!this.activeDialogue) return;
    const { tree, lineId } = this.activeDialogue;
    const line = tree.lines[lineId];
    if (!line) { this.closeDialogue(); return; }

    const box = this.dialogueBox;
    box.setPosition(
      this.cameras.main.scrollX + this.scale.width / 2,
      this.cameras.main.scrollY + this.scale.height - 120
    );

    // Update speaker + text
    (box.getAt(1) as Phaser.GameObjects.Text).setText(line.speaker);
    (box.getAt(2) as Phaser.GameObjects.Text).setText(line.text);

    // Clear old choices
    while (box.length > 3) box.removeAt(3, true);

    if (line.choices && line.choices.length) {
      line.choices.forEach((choice, i) => {
        const btn = this.add.text(0, 36 + i * 18, `▸ ${choice.text}`, {
          fontFamily: '"Press Start 2P"',
          fontSize: '6px',
          color: '#f0c040',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffffff'));
        btn.on('pointerout',  () => btn.setColor('#f0c040'));
        btn.on('pointerdown', () => this.handleChoice(choice));

        box.add(btn);
      });
    } else {
      // No choices = close on E/click
      const cont = this.add.text(0, 42, '[ E ] Continue', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: '#888888',
      }).setOrigin(0.5);
      box.add(cont);
    }
  }

  private handleChoice(choice: { text: string; nextId?: string; action?: string }) {
    if (choice.action) {
      this.closeDialogue();
      const [actionType, target] = choice.action.split(':');
      if (actionType === 'open' && this.onOpenPage) {
        this.time.delayedCall(200, () => this.onOpenPage(target));
      }
      return;
    }
    if (!choice.nextId) {
      this.closeDialogue();
      return;
    }
    this.activeDialogue!.lineId = choice.nextId;
    this.renderDialogueLine();
  }

  private closeDialogue() {
    this.activeDialogue = null;
    this.dialogueBox.setVisible(false);
  }

  private showSimpleDialogue(text: string, speaker: string) {
    this.activeDialogue = {
      tree: {
        npcId: 'simple',
        start: 'line',
        lines: { line: { text, speaker } },
      },
      lineId: 'line',
    };
    this.renderDialogueLine();
    this.dialogueBox.setVisible(true);
  }

  // ─── UI Creation ────────────────────────────────────────────────────────────

  private createDialogueBox() {
    const W = 320, H = 80;
    const bg = this.add.rectangle(0, 0, W, H, 0x0e0e1c, 0.95)
      .setStrokeStyle(2, 0xf0c040);
    const speaker = this.add.text(-W / 2 + 10, -H / 2 + 8, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#f0c040',
    });
    const body = this.add.text(0, -8, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#ffffff',
      wordWrap: { width: W - 24 },
      align: 'center',
    }).setOrigin(0.5);

    this.dialogueBox = this.add.container(0, 0, [bg, speaker, body]);
    this.dialogueBox.setDepth(100).setScrollFactor(0).setVisible(false);
  }

  private createInteractPrompt() {
    const bg = this.add.rectangle(0, 0, 200, 22, 0x0e0e1c, 0.88)
      .setStrokeStyle(1.5, 0xf0c040);
    const label = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.interactPrompt = this.add.container(0, 0, [bg, label]);
    this.interactPrompt.setDepth(99).setScrollFactor(0).setVisible(false);

    // Bounce tween
    this.tweens.add({
      targets: this.interactPrompt,
      y: '-=4',
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private npcColor(id: string): number {
    const colors: Record<string, number> = {
      'old-dev': 0x8b6f47, 'designer': 0xc47dc4,
      'recruiter': 0x4a7ac4, 'mentor': 0x4ac47a,
    };
    return colors[id] ?? 0xaaaaaa;
  }

  /** Deterministic pseudo-random (LCG) */
  private seededRand(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  private async trackEvent(type: string, target: string, meta?: Record<string, string>) {
    try {
      await fetch(`${API}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target, sessionId: this.sessionId, meta }),
      });
    } catch (_) { /* non-critical */ }
  }
}
