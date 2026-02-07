import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export default class Level2RunnerScene extends Phaser.Scene {
  constructor() {
    super("Level2Runner");
  }

  create() {
    this.physics.world.gravity.y = 2000;

    this.phase = "CUTSCENE"; // CUTSCENE -> RUN_OUTSIDE -> FOREST -> WIN/GAMEOVER
    this.runnerActive = false;
    this.score = 0;
    this.lives = 3;
    this.hasShield = false;
    this.shieldTimer = null;
    this.currentSpeed = 420;
    this.spawnEvents = [];
    this.outsideDuration = 8500; // ms
    this.groundHeight = 120;
    this.groundY = GAME_H - this.groundHeight / 2;

    this.obstacles = this.physics.add.group();
    this.powerups = this.physics.add.group();
    this.decorMoves = [];

    this.buildBackground();
    this.buildGround();
    this.buildPlayer();
    this.buildUI();
    this.showIntroCutscene();
    this.setupControls();

    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (this.phase === "RUN_OUTSIDE" || this.phase === "FOREST") {
          this.addScore(1);
        }
      },
    });
  }

  buildBackground() {
    this.cameras.main.setBackgroundColor("#8bd0ff");

    // simple sky + sun
    this.sky = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x8bd0ff).setDepth(0);
    this.sun = this.add.circle(GAME_W * 0.82, GAME_H * 0.18, 70, 0xfff3b0).setDepth(0.1);

    // parallax hills
    const hillColors = [0xa5d6a7, 0x7cb342];
    hillColors.forEach((c, i) => {
      const hill = this.add.ellipse(GAME_W * 0.4 + i * 220, GAME_H * 0.9, GAME_W * 0.9, 240, c).setDepth(0.2 + i * 0.05);
      this.decorMoves.push({ sprite: hill, speed: 20 + i * 8, resetX: GAME_W * 1.2 });
    });

    // road stripe
    this.makeTexture("groundTile", 64, 64, 0x3b5c2c);
    this.makeTexture("roadTile", 32, 32, 0x5b4636);
    this.groundTiles = this.add
      .tileSprite(GAME_W / 2, GAME_H - this.groundHeight / 2, GAME_W, this.groundHeight, "groundTile")
      .setDepth(1);
    this.roadLine = this.add
      .tileSprite(GAME_W / 2, GAME_H - this.groundHeight, GAME_W, 10, "roadTile")
      .setDepth(1.1);

    this.decorGroup = this.add.group();
    this.time.addEvent({ delay: 900, loop: true, callback: () => this.spawnDecor() });
  }

  makeTexture(key, w, h, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  buildGround() {
    const groundRect = this.add.rectangle(GAME_W / 2, this.groundY, GAME_W, this.groundHeight, 0x000000, 0);
    this.physics.add.existing(groundRect, true);
    groundRect.body.updateFromGameObject();
    this.ground = groundRect;
  }

  buildPlayer() {
    const PLAYER_W = 60;
    const PLAYER_H = 110;
    this.player = this.add.rectangle(GAME_W * 0.25, this.groundY - PLAYER_H / 2, PLAYER_W, PLAYER_H, 0xffffff).setDepth(5);
    this.physics.add.existing(this.player);
    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setSize(PLAYER_W, PLAYER_H);
    body.setBounce(0);
    body.setDrag(0, 180);

    // small eye detail
    this.eye = this.add.circle(this.player.x + 12, this.player.y - 10, 6, 0x000000).setDepth(6);

    this.physics.add.collider(this.player, this.ground);

    this.hitFlash = this.tweens.createTimeline();
  }

  buildUI() {
    const style = { fontSize: "26px", color: "#ffffff", stroke: "#000000", strokeThickness: 4, fontFamily: "Arial" };
    this.scoreText = this.add.text(22, 16, "Score: 0", style).setDepth(50).setScrollFactor(0);
    this.lifeText = this.add.text(22, 52, "Lives: 3", style).setDepth(50).setScrollFactor(0);
    this.buffText = this.add.text(22, 88, "Power: none", style).setDepth(50).setScrollFactor(0);
    this.stageText = this.add.text(GAME_W - 220, 20, "Esterno", style).setDepth(50).setScrollFactor(0);
    this.infoText = this.add
      .text(22, GAME_H - 60, "SPACE/click = salto breve | SHIFT/UP = lungo | evita i rami", {
        fontSize: "20px",
        color: "#e0e0e0",
        stroke: "#000000",
        strokeThickness: 3,
        fontFamily: "Arial",
      })
      .setDepth(50)
      .setScrollFactor(0);
  }

  setupControls() {
    this.input.on("pointerdown", () => {
      if (this.phase === "CUTSCENE") {
        this.startRun();
      } else {
        this.shortJump();
      }
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.phase === "CUTSCENE") this.startRun();
      else this.shortJump();
    });
    this.input.keyboard.on("keydown-UP", () => {
      if (this.phase === "CUTSCENE") this.startRun();
      else this.longJump();
    });
    this.input.keyboard.on("keydown-SHIFT", () => {
      if (this.phase === "CUTSCENE") this.startRun();
      else this.longJump();
    });
  }

  showIntroCutscene() {
    const bubbleW = 420;
    const bubbleH = 150;
    const bubbleX = GAME_W * 0.12;
    const bubbleY = GAME_H * 0.22;
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xffffff, 1);
    g.lineStyle(3, 0x0f172a, 1);
    g.fillRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 18);
    g.strokeRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 18);
    g.fillTriangle(bubbleX + 80, bubbleY + bubbleH, bubbleX + 130, bubbleY + bubbleH, bubbleX + 110, bubbleY + bubbleH + 32);
    g.lineStyle(3, 0x0f172a, 1);
    g.strokeTriangle(bubbleX + 80, bubbleY + bubbleH, bubbleX + 130, bubbleY + bubbleH, bubbleX + 110, bubbleY + bubbleH + 32);

    this.cutsceneGroup = this.add.container(0, 0, [g]);
    const txt = this.add.text(bubbleX + 22, bubbleY + 18, "Fuori dal cinema.\nCorri verso il bosco!\nClick o SPACE per partire.", {
      fontSize: "26px",
      color: "#111111",
      fontFamily: "Arial",
    });
    this.cutsceneGroup.add(txt);
    this.tweens.add({ targets: this.cutsceneGroup, alpha: { from: 0, to: 1 }, duration: 320 });
  }

  startRun() {
    if (this.phase !== "CUTSCENE") return;
    this.phase = "RUN_OUTSIDE";
    this.runnerActive = true;
    this.stageText.setText("Esterno");
    if (this.cutsceneGroup) {
      this.tweens.add({
        targets: this.cutsceneGroup,
        alpha: 0,
        duration: 260,
        onComplete: () => this.cutsceneGroup.destroy(),
      });
    }

    this.outsideTimer = this.time.delayedCall(this.outsideDuration, () => this.enterForest());
  }

  enterForest() {
    if (this.phase !== "RUN_OUTSIDE") return;
    this.phase = "FOREST";
    this.stageText.setText("Foresta");
    this.cameras.main.flash(200, 40, 70, 40);
    this.cameras.main.setBackgroundColor("#3a4b30");
    this.sky.fillColor = 0x4a5d3c;
    this.groundTiles.setTint(0x264029);
    this.roadLine.setTint(0x1c1c1c);

    this.spawnEvents.push(
      this.time.addEvent({ delay: this.nextSpawnDelay(), loop: true, callback: () => this.spawnObstacle() })
    );
    this.spawnEvents.push(
      this.time.addEvent({ delay: 12000, loop: true, callback: () => this.spawnPowerup() })
    );
  }

  nextSpawnDelay() {
    return Phaser.Math.Between(1100, 2200);
  }

  spawnDecor() {
    if (!this.runnerActive) return;
    const h = Phaser.Math.Between(80, 220);
    const tree = this.add.rectangle(GAME_W + 40, this.groundY - h / 2, 26, h, 0x2e4029).setDepth(2.5);
    this.decorGroup.add(tree);
    this.decorMoves.push({ sprite: tree, speed: 160 + Phaser.Math.Between(-20, 40), resetX: GAME_W + 80 });
  }

  spawnObstacle() {
    if (this.phase !== "FOREST") return;
    const r = Math.random();
    let type = "root";
    if (r > 0.55 && r <= 0.85) type = "stone";
    else if (r > 0.85) type = "branch";

    let w = 80;
    let h = 40;
    let y = this.groundY - h / 2;
    let color = 0x8d6e63;
    if (type === "stone") {
      w = 110;
      h = 70;
      y = this.groundY - h / 2;
      color = 0x6d4c41;
    }
    if (type === "branch") {
      w = 160;
      h = 24;
      y = this.groundY - 180;
      color = 0x4e342e;
    }

    const obs = this.add.rectangle(GAME_W + 120, y, w, h, color).setDepth(6);
    this.physics.add.existing(obs);
    const body = obs.body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(-this.currentSpeed);
    obs.typeTag = type;
    obs.passed = false;
    this.obstacles.add(obs);
  }

  spawnPowerup() {
    if (!this.runnerActive || this.phase === "WIN" || this.phase === "GAMEOVER") return;
    const type = Math.random() < 0.5 ? "life" : "shield";
    const pu = this.add.rectangle(GAME_W + 140, this.groundY - 200, 34, 34, 0xffe97d).setStrokeStyle(3, 0x111111).setDepth(8);
    const icon = this.add.text(pu.x, pu.y, type === "life" ? "+" : "S", {
      fontSize: "24px",
      color: "#111111",
      fontFamily: "Arial",
    }).setOrigin(0.5).setDepth(9);
    pu.icon = icon;

    this.physics.add.existing(pu);
    const body = pu.body;
    body.setAllowGravity(false);
    body.setVelocityX(-this.currentSpeed * 0.85);
    pu.powerType = type;
    this.powerups.add(pu);
  }

  shortJump() {
    if (!this.runnerActive || this.phase === "WIN" || this.phase === "GAMEOVER") return;
    const body = this.player.body;
    if (body.blocked.down || body.touching.down) {
      body.setVelocityY(-760);
    }
  }

  longJump() {
    if (!this.runnerActive || this.phase === "WIN" || this.phase === "GAMEOVER") return;
    const body = this.player.body;
    if (body.blocked.down || body.touching.down) {
      body.setVelocityY(-980);
    }
  }

  handleObstacleHit(player, obs) {
    if (this.phase === "WIN" || this.phase === "GAMEOVER") return;
    if (this.invulnerable) return;

    if (this.hasShield) {
      this.clearShield();
      this.popObstacle(obs);
      return;
    }

    this.lives -= 1;
    this.updateLifeText();
    this.flashPlayer();
    this.popObstacle(obs);

    if (this.lives <= 0) {
      this.onGameOver();
    }
  }

  popObstacle(obs) {
    if (!obs || !obs.body) return;
    obs.body.setVelocityX(obs.body.velocity.x * 0.2);
    this.tweens.add({ targets: obs, scaleX: 0, scaleY: 0, duration: 200, onComplete: () => obs.destroy() });
  }

  collectPowerup(player, item) {
    if (!item || !item.powerType) return;
    const type = item.powerType;
    if (item.icon) item.icon.destroy();
    item.destroy();
    if (type === "life") {
      this.lives = Math.min(5, this.lives + 1);
      this.updateLifeText();
      this.buffText.setText("Power: extra life");
      this.time.delayedCall(1200, () => this.buffText.setText(this.hasShield ? "Power: shield" : "Power: none"));
    } else if (type === "shield") {
      this.applyShield();
    }
  }

  applyShield() {
    this.hasShield = true;
    this.buffText.setText("Power: shield");
    if (this.shieldTimer) this.shieldTimer.remove(false);
    this.shieldTimer = this.time.delayedCall(9000, () => this.clearShield());
    this.player.setFillStyle(0xb2f2ff);
  }

  clearShield() {
    if (!this.hasShield) return;
    this.hasShield = false;
    this.buffText.setText("Power: none");
    this.player.setFillStyle(0xffffff);
  }

  flashPlayer() {
    this.invulnerable = true;
    this.tweens.add({
      targets: [this.player, this.eye],
      alpha: { from: 0.2, to: 1 },
      yoyo: true,
      repeat: 4,
      duration: 120,
      onComplete: () => {
        this.invulnerable = false;
        this.player.setAlpha(1);
        this.eye.setAlpha(1);
      },
    });
  }

  addScore(delta) {
    this.score += delta;
    this.scoreText.setText(`Score: ${this.score}`);
    if (this.score >= 100 && this.phase !== "WIN") {
      this.onVictory();
    }
  }

  updateLifeText() {
    this.lifeText.setText(`Lives: ${this.lives}`);
  }

  onVictory() {
    this.phase = "WIN";
    this.runnerActive = false;
    if (this.outsideTimer) this.outsideTimer.remove(false);
    this.stopSpawnEvents();
    this.physics.pause();
    this.showLakeCutscene();
  }

  onGameOver() {
    if (this.phase === "GAMEOVER") return;
    this.phase = "GAMEOVER";
    this.runnerActive = false;
    if (this.outsideTimer) this.outsideTimer.remove(false);
    this.stopSpawnEvents();
    this.physics.pause();
    this.showGameOver();
  }

  stopSpawnEvents() {
    this.spawnEvents.forEach((e) => e.remove(false));
    this.spawnEvents = [];
  }

  showLakeCutscene() {
    const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0b1e3d, 0.8).setDepth(90);
    const lake = this.add.rectangle(GAME_W / 2, GAME_H * 0.65, GAME_W * 0.9, GAME_H * 0.25, 0x2c7bdc, 0.95).setDepth(91);
    lake.setStrokeStyle(4, 0xffffff, 0.4);
    const text = this.add.text(GAME_W / 2, GAME_H * 0.30, "Lago raggiunto!", {
      fontSize: "48px",
      color: "#ffffff",
      stroke: "#0c2d5a",
      strokeThickness: 6,
      fontFamily: "Arial",
    })
      .setOrigin(0.5)
      .setDepth(92);

    const sub = this.add.text(GAME_W / 2, GAME_H * 0.38, "Respira, poi avanti col prossimo livello.", {
      fontSize: "26px",
      color: "#e0f4ff",
      fontFamily: "Arial",
      stroke: "#0c2d5a",
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(92);

    const nextBtn = this.add
      .image(GAME_W / 2, GAME_H * 0.50, "continue")
      .setDepth(93)
      .setInteractive({ useHandCursor: true })
      .setScale(0.9);

    nextBtn.on("pointerdown", () => {
      this.scene.start("Menu");
    });

    this.tweens.add({ targets: [overlay, lake, text, sub, nextBtn], alpha: { from: 0, to: 1 }, duration: 400 });
  }

  showGameOver() {
    const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.65).setDepth(90);
    const img = this.add.image(GAME_W / 2, GAME_H / 2 - 70, "gameover").setDepth(91);
    this.scaleImage(img, GAME_W * 0.5, GAME_H * 0.5);
    const btn = this.add.image(GAME_W / 2, GAME_H / 2 + 60, "tryagain").setDepth(92).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      this.scene.restart();
    });
    this.tweens.add({ targets: [overlay, img, btn], alpha: { from: 0, to: 1 }, duration: 200 });
  }

  scaleImage(img, maxW, maxH) {
    const scale = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(scale);
  }

  update(_, delta) {
    const dt = delta / 1000;

    // parallax decor + tile scroll
    if (this.runnerActive && (this.phase === "RUN_OUTSIDE" || this.phase === "FOREST")) {
      this.groundTiles.tilePositionX += this.currentSpeed * dt;
      this.roadLine.tilePositionX += this.currentSpeed * dt * 1.2;
    }

    this.decorMoves.forEach((d) => {
      d.sprite.x -= d.speed * dt;
      if (d.sprite.x < -120) d.sprite.x = d.resetX + Phaser.Math.Between(0, 220);
    });

    // keep eye on player
    this.eye.setPosition(this.player.x + 12, this.player.y - 10);

    if (!this.runnerActive) return;

    // cleanup obstacles and scoring when passed
    this.obstacles.children.iterate((obs) => {
      if (!obs) return;
      if (obs.x + obs.displayWidth / 2 < -80) {
        obs.destroy();
        return;
      }
      if (!obs.passed && obs.x + obs.displayWidth / 2 < this.player.x) {
        obs.passed = true;
        this.addScore(1);
      }
      // keep velocity consistent after pause/resume
      if (obs.body && obs.body.velocity.x === 0 && this.phase === "FOREST") {
        obs.body.setVelocityX(-this.currentSpeed);
      }
    });

    this.powerups.children.iterate((item) => {
      if (!item) return;
      if (item.icon) item.icon.setPosition(item.x, item.y);
      if (item.x < -80) {
        if (item.icon) item.icon.destroy();
        item.destroy();
      }
    });

    // collisions handled here to manage branch rule
    this.physics.world.overlap(this.player, this.powerups, (p, item) => this.collectPowerup(p, item));
    this.physics.world.collide(this.player, this.obstacles, (p, obs) => this.handleObstacleHit(p, obs));
  }
}
