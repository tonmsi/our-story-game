import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export default class CinemaHandScene extends Phaser.Scene {
  constructor() {
    super("CinemaHand");
  }

  create() {
    // --- tuning ---
    this.SPEED_RETRACT = 900;
    this.SPEED_OK = 250;
    this.NEAR_DIST = 15;
    this.HOLD_TIME = 0.7;
    this.RETRACT_TIME = 1.2;
    this.MOVIE_TIME = 25.0;

    // spawns (whack-a-mole stile)
    this.SPAWN_MIN = 1.5;
    this.SPAWN_MAX = 3.5;
    this.SPAWN_SPEED = 520; // entrata/uscita più veloce
    this.BAIT_STOP_X = GAME_W * 0.60;
    this.HAND_STOP_X = GAME_W * 0.63; // mano sporge un po' di più
    this.HAND_RETREAT_BOOST = 1.8;   // mano rientra più veloce
    this.EXPOSE_TIME = 0.8; // tempo standard bait
    this.HAND_EXPOSE_TIME = 0.45; // mano di Tom resta meno

    // --- positions ---
    this.cx = GAME_W / 2;
    this.cy = GAME_H / 2;

    // mano Fra più a sinistra e più in alto
    this.fraBase = new Phaser.Math.Vector2(GAME_W * 0.34, GAME_H * 0.60);
    this.tomBase = new Phaser.Math.Vector2(GAME_W * 0.62, GAME_H * 0.58); // mano Tom più bassa
    this.fraPos = this.fraBase.clone();
    this.tomPos = this.tomBase.clone();
    this.presaNeutral = new Phaser.Math.Vector2(GAME_W * 0.45, GAME_H * 0.55); // neutra un po' più in alto e a sinistra
    this.fraMaxTilt = Phaser.Math.DegToRad(-22); // rotazione max verso l'alto
    // linea diagonale over sinistro (per coperta/scoperta)
    this.diagP1 = new Phaser.Math.Vector2(366, 142);
    this.diagP2 = new Phaser.Math.Vector2(520, 670);

    // limiti Y per effetto dietro/davanti sedile
    this.fraMinY = this.fraBase.y - 160;
    this.fraMaxY = this.fraBase.y + 40;
    this.tomMinY = this.tomBase.y - 80;
    this.tomMaxY = this.tomBase.y + 30;

    // input / puntatore
    this.pointer = this.input.activePointer;
    this.prevPointer = new Phaser.Math.Vector2(
      this.pointer.x || this.fraBase.x,
      this.pointer.y || this.fraBase.y
    );

    // --- layers ---
    this.add.rectangle(this.cx, this.cy, GAME_W, GAME_H, 0x0b0b0b).setDepth(0);

    const CINEMA_SCALE = 1;

    const screenW = GAME_W * 0.20;
    const screenH = screenW * (506 / 532); // mantiene l'aspect del video loop1.gif/mp4
    const screenY = GAME_H * 0.34;
    if (this.cache.video.exists("filmLoop")) {
      this.film = this.add.video(this.cx, screenY, "filmLoop").setDepth(1);
      this.film.setDisplaySize(screenW, screenH);
      this.film.setMute(true);
      this.film.play(true);
      this.film.video.playbackRate = 0.8; // rallenta il loop
    } else if (this.textures.exists("filmGif")) {
      this.film = this.add.image(this.cx, screenY, "filmGif").setDepth(1);
      this.film.setDisplaySize(screenW, screenH);
    } else {
      this.film = this.add
        .rectangle(this.cx, screenY, screenW, screenH, 0x111111)
        .setDepth(1);
    }
    // Film alternativo (loop2) mostrato alla presa
    if (this.textures.exists("filmLoop2")) {
      const altW = screenW * 2.5; // doppia larghezza solo per loop2
      const altH = altW * (240 / 480); // mantiene aspect 2:1 di loop2
      this.filmAlt = this.add
        .image(this.cx, screenY, "filmLoop2")
        .setDepth(1.1)
        .setDisplaySize(altW, altH)
        .setVisible(false);
    } else {
      this.filmAlt = null;
    }

    this.cinemaUnder = this.add
      .image(this.cx, this.cy, "cinemaUnder")
      .setDepth(5)
      .setDisplaySize(GAME_W, GAME_H);

    this.SPRITE_SCALE = 0.9; // mano di Tom leggermente più piccola
    this.FRA_SCALE = 0.5;
    this.FRA_MOUSE_OFFSET_X = -200; // porta il cursore verso il centro della mano
    this.FRA_MOUSE_OFFSET_Y = -100; // alza leggermente il cursore
    this.handFra = this.add
      .image(this.fraPos.x, this.fraPos.y, "F1")
      .setDepth(10)
      .setScale(this.FRA_SCALE);
    this.handTom = this.add
      .image(this.tomPos.x, this.tomPos.y, "T1")
      .setDepth(10)
      .setScale(this.SPRITE_SCALE)
      .setInteractive({ useHandCursor: true });
    this.item = this.add
      .image(this.tomPos.x, this.tomPos.y, "corn")
      .setDepth(10)
      .setScale(this.SPRITE_SCALE)
      .setVisible(false);
    this.presa = this.add
      .image(this.cx, this.cy, "presa")
      .setDepth(10)
      .setScale(this.FRA_SCALE)
      .setVisible(false);

    // Emoji vittoria (balloon pop)
    this.emoji1 = this.add
      .image(GAME_W * 0.00, GAME_H * 0.35, "emoji1")
      .setOrigin(0, 0.5) // si espande verso destra
      .setScale(0)
      .setDepth(11) // leggermente sopra le mani (10)
      .setVisible(false);
    this.emoji2 = this.add
      .image(GAME_W * 1.0, GAME_H * 0.30, "emoji2")
      .setOrigin(1, 0.5) // si espande verso sinistra
      .setScale(0)
      .setDepth(11) // stesso livello delle mani, poco sopra
      .setVisible(false);

    this.cinemaOver = this.add
      .image(this.cx, this.cy, "cinemaOver")
      .setDepth(20)
      .setDisplaySize(GAME_W, GAME_H);

    this.msg = this.add
      .text(this.cx, 22, "", {
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.hint = this.add
      .text(this.cx, GAME_H - 16, "Mouse muove. Click/SPACE = fermati.", {
        fontSize: "10px",
        color: "#cccccc",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(30);

    // Pulsante continue (prossimo livello)
    this.continueBtn = this.add
      .image(this.cx - 120, GAME_H - 90, "continue") // più a sinistra e un po' più in alto
      .setDepth(40)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .setScale(0.9) // leggermente più piccolo
      .setAlpha(0);
    this.continueBtn.on("pointerdown", () => {
      // placeholder: prossimo livello non implementato, per ora restart
      this.scene.restart();
    });

    // Overlay game over
    this.gameOverBg = this.add
      .rectangle(this.cx, this.cy, GAME_W, GAME_H, 0x000000, 0.6)
      .setDepth(48)
      .setVisible(false);
    this.gameOverImage = this.add
      .image(this.cx, this.cy - 30, "gameover")
      .setDepth(49)
      .setVisible(false);
    this.tryAgainBtn = this.add
      .image(this.cx - 120, this.cy - 60, "tryagain") // ancora più in alto
      .setDepth(50)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .setScale(0.8);

    // Barra tempo film (sotto)
    this.barMargin = 8;
    this.barHeight = 10; // barra più spessa
    this.barY = GAME_H - 10;
    this.barWidth = GAME_W - this.barMargin * 2;
    this.timeBarBg = this.add
      .rectangle(this.barMargin, this.barY, this.barWidth, this.barHeight, 0x333333)
      .setOrigin(0, 0.5)
      .setDepth(25);
    this.timeBar = this.add
      .rectangle(this.barMargin, this.barY, this.barWidth, this.barHeight, 0xffffff) // bianca
      .setOrigin(0, 0.5)
      .setDepth(26);

    // --- state ---
    this.state = "IDLE";
    this.retractLeft = 0;
    this.hold = 0;
    this.movieLeft = this.MOVIE_TIME;
    this.freeze = false;
    this.spawnType = null; // "hand" | "corn" | "coke"
    this.spawnTimer = 0;
    this.spawnExiting = false;
    this.spawnRetreatRight = false;
    this.showedEmojis = false;
    this.gameOverActive = false;

    // Audio: bgm + click vuoto
    this.bgm = null;
    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.playBgm());
    } else {
      this.playBgm();
    }
    this.input.on("pointerdown", () => {
      if (!this.gameOverActive && this.cache.audio.exists("click")) {
        this.sound.play("click", { volume: 0.7 });
      }
    });
    // Audio (solo success + click vuoto)
    this.input.on("pointerdown", () => {
      if (!this.gameOverActive && this.cache.audio.exists("click")) {
        this.sound.play("click", { volume: 0.7 });
      }
    });

    // --- input freeze ---
    this.input.on("pointerdown", () => (this.freeze = true));
    this.input.on("pointerup", () => (this.freeze = false));
    this.input.keyboard.on("keydown-SPACE", () => (this.freeze = true));
    this.input.keyboard.on("keyup-SPACE", () => (this.freeze = false));

    this.handTom.on("pointerdown", () => {
      if (this.spawnType === "hand" && !this.spawnExiting && this.state !== "SUCCESS" && this.state !== "HORROR") {
        this.onClickWin();
      }
    });

    this.queueSpawn();
  }

  drawSpawnGuide(divs) {}

  queueSpawn() {
    const delay = Phaser.Math.FloatBetween(this.SPAWN_MIN, this.SPAWN_MAX) * 1000;
    this.time.addEvent({ delay, callback: () => this.spawnEntity() });
  }

  spawnEntity() {
    if (this.gameOverActive) return;
    // Probabilità mano: più alta se Fra è coperta dall'over (mano bassa) + distanza dal centro
    const centerX = GAME_W * 0.5;
    const distNorm = Phaser.Math.Clamp(Math.abs(this.fraPos.x - centerX) / centerX, 0, 1);
    const coverT = Phaser.Math.Clamp((this.fraPos.y - this.fraMinY) / (this.fraMaxY - this.fraMinY), 0, 1);
    const handProb = Phaser.Math.Clamp(
      0.25 + 0.4 * distNorm + 0.35 * (1 - coverT), // più coperta (mano alta) => più probabilità
      0.25,
      0.9
    );

    const isCovered = this.isFraCovered();
    const mouseNearTom = this.pointer && this.pointer.x >= 720; // veto spawn T1 se il cursore è oltre 720px

    // Bias sinistra/destra: più a sinistra => più prob; più a destra => meno
    const leftBias = Phaser.Math.Clamp((centerX - this.fraPos.x) / centerX, 0, 1);
    const leftFactor = 0.6 + 0.8 * leftBias; // destra 0.6, sinistra 1.4

    // Bias copertura: coperta => +20%, scoperta => -20%
    const coverFactor = isCovered ? 1.2 : 0.8;

    let effectiveHandProb = Phaser.Math.Clamp(handProb * leftFactor * coverFactor, 0, 1);

    if (mouseNearTom) {
      effectiveHandProb = 0; // se il cursore è lì, T1 non deve spawnare
    }
    // Se Fra è molto verso destra (vicino al centro del film), aumentiamo bait:
    // oltre 500px => hand max 5% ; oltre 580px => hand max 1%
    if (this.fraPos.x >= 580) {
      effectiveHandProb = Math.min(effectiveHandProb, 0.01);
    } else if (this.fraPos.x >= 500) {
      effectiveHandProb = Math.min(effectiveHandProb, 0.05);
    }

    const r = Math.random();
    if (r < effectiveHandProb) {
      this.spawnType = "hand";
      this.handTom.setVisible(true).setTexture("T1").setScale(this.SPRITE_SCALE);
      this.item.setVisible(false);
    } else {
      this.spawnType = Math.random() < 0.5 ? "corn" : "coke";
      this.item
        .setTexture(this.spawnType)
        .setVisible(true)
        .setScale(this.SPRITE_SCALE * 0.9); // bait leggermente più grandi
      this.handTom.setVisible(false);
    }
    this.spawnExiting = false;
    this.spawnRetreatRight = false;
    this.spawnTimer = 0;
    this.tomPos.x = GAME_W + 160;
    if (this.spawnType === "hand") {
      this.tomPos.y = this.tomBase.y + 60; // mano T1 leggermente più in basso
    } else if (this.spawnType === "corn") {
      this.tomPos.y = this.tomBase.y - 160; // corn più in alto
    } else if (this.spawnType === "coke") {
      this.tomPos.y = this.tomBase.y - 220;
    }
    this.item.setPosition(this.tomPos.x, this.tomPos.y);
  }

  despawnEntity() {
    this.spawnType = null;
    this.handTom.setVisible(false);
    this.item.setVisible(false);
    this.queueSpawn();
  }

  update(_, delta) {
    if (this.gameOverActive) return;
    const dt = delta / 1000;

    if (this.state !== "SUCCESS" && this.state !== "HORROR") {
      this.movieLeft -= dt;
      if (this.movieLeft <= 0) {
        this.state = "HORROR";
        this.onHorror();
      }
    }

    // velocità del puntatore
    const p = new Phaser.Math.Vector2(this.pointer.x, this.pointer.y);
    const d = Phaser.Math.Distance.Between(p.x, p.y, this.prevPointer.x, this.prevPointer.y);
    const speed = d / Math.max(dt, 1e-6);
    this.prevPointer.copy(p);

    // movimento mano di Fra (player)
    if (!this.freeze && this.state !== "SUCCESS" && this.state !== "HORROR") {
      const maxX = GAME_W * 0.40;
      this.fraPos.x = Phaser.Math.Clamp(this.pointer.x + this.FRA_MOUSE_OFFSET_X, 0, maxX);
      this.fraPos.y = Phaser.Math.Clamp(this.pointer.y + this.FRA_MOUSE_OFFSET_Y, this.fraMinY, this.fraMaxY);
    }

    // movimento spawn (hand / corn / coke) da destra verso sinistra
    if (this.spawnType) {
      if (!this.spawnExiting) {
        // fase entrata
        const stopX = this.spawnType === "hand" ? this.HAND_STOP_X : this.BAIT_STOP_X;
        if (this.tomPos.x > stopX) {
          this.tomPos.x -= this.SPAWN_SPEED * dt;
        } else {
          this.spawnTimer += dt;
          const distHands = Phaser.Math.Distance.Between(
            this.fraPos.x,
            this.fraPos.y,
            this.tomPos.x,
            this.tomPos.y
          );
          const tooFastClose = this.spawnType === "hand" && distHands < 90 && this.SPAWN_SPEED > this.SPEED_RETRACT * 0.55;
          const exposeTarget = this.spawnType === "hand" ? this.HAND_EXPOSE_TIME : this.EXPOSE_TIME;

          // Nuovo: se la mano T1 ha appena iniziato l'esposizione e Fra è già oltre 720px, retrai subito
          const fraTooRightAtStart =
            this.spawnType === "hand" &&
            this.spawnTimer <= 0.05 && // appena arrivata allo stop
            this.fraPos.x >= 720;

          if (tooFastClose || this.spawnTimer >= exposeTarget) {
            this.spawnExiting = true;
            this.spawnRetreatRight = true; // mano e bait rientrano verso destra (capolino e ritiro)
          } else if (fraTooRightAtStart) {
            this.state = "RETRACT";
            this.retractLeft = this.RETRACT_TIME;
            this.spawnExiting = true;
            this.spawnRetreatRight = true;
            this.hold = 0;
          }
        }
      } else {
        // fase uscita
    const dir = this.spawnRetreatRight ? 1 : -1;
    const retreatSpeed = this.spawnType === "hand" ? this.SPAWN_SPEED * this.HAND_RETREAT_BOOST : this.SPAWN_SPEED;
        this.tomPos.x += dir * retreatSpeed * dt;
        const offscreen = this.spawnRetreatRight ? this.tomPos.x > GAME_W + 200 : this.tomPos.x < -160;
        if (offscreen) this.despawnEntity();
      }
    }

    // retrazione mano di Tom (solo se attiva e bersaglio visibile)
    if (this.state === "RETRACT") {
      this.retractLeft -= dt;
      this.tomPos.y = Phaser.Math.Linear(this.tomPos.y, this.tomMinY, 0.18);
      if (this.retractLeft <= 0) {
        this.state = "IDLE";
      }
    } else if (this.state === "IDLE" || this.state === "HOLDING") {
      this.tomPos.y = Phaser.Math.Linear(this.tomPos.y, this.tomBase.y, 0.08);
    }

    const targetVisible = this.spawnType === "hand" && !this.spawnExiting; // prendibile solo quando fermo
    const distHands = Phaser.Math.Distance.Between(
      this.fraPos.x,
      this.fraPos.y,
      this.tomPos.x,
      this.tomPos.y
    );

    if (this.state !== "RETRACT" && this.state !== "SUCCESS" && this.state !== "HORROR") {
      if (targetVisible && distHands < 60 && speed > this.SPEED_RETRACT) {
        this.state = "RETRACT";
        this.retractLeft = this.RETRACT_TIME;
        this.hold = 0;
      }
    }

    if (this.state !== "SUCCESS" && this.state !== "HORROR") {
      const canHold = targetVisible && distHands <= this.NEAR_DIST && this.freeze && speed <= this.SPEED_OK;
      if (canHold && this.state !== "RETRACT") {
        this.state = "HOLDING";
        this.hold += dt;
        if (this.hold >= this.HOLD_TIME) {
          this.state = "SUCCESS";
          this.onSuccess();
          this.despawnEntity();
        }
      } else {
        this.hold = Math.max(0, this.hold - dt * 0.5);
      }
    }

    if (this.state === "SUCCESS") {
      this.tomPos.x = Phaser.Math.Linear(this.tomPos.x, this.fraPos.x + 8, 0.15);
      this.tomPos.y = Phaser.Math.Linear(this.tomPos.y, Math.min(this.fraPos.y + 2, this.tomMaxY), 0.15);
    }

    // clamp posizioni Y per l'effetto sedile
    if (this.spawnType === "hand") {
      this.tomPos.y = Phaser.Math.Clamp(this.tomPos.y, this.tomMinY, this.tomMaxY);
    }
    this.fraPos.y = Phaser.Math.Clamp(this.fraPos.y, this.fraMinY, this.fraMaxY);

    // applica posizioni
    this.handFra.setPosition(this.fraPos.x, this.fraPos.y);
    this.handTom.setPosition(this.tomPos.x, this.tomPos.y);
    this.item.setPosition(this.tomPos.x, this.tomPos.y);

    // aggiorna barra tempo film
    const progress = Phaser.Math.Clamp(this.movieLeft / this.MOVIE_TIME, 0, 1);
    this.timeBar.setDisplaySize(this.barWidth * progress, this.barHeight);

    // rotazione mano Fra basata sull'altezza
    const tiltT = Phaser.Math.Clamp((this.fraBase.y - this.fraPos.y) / (this.fraMaxY - this.fraMinY), 0, 1);
    this.handFra.setRotation(this.fraMaxTilt * tiltT);

    // testo di stato
    if (this.state === "HORROR") this.msg.setText("SCENA HORROR");
    else if (this.state === "SUCCESS") this.msg.setText("PRESA");
    else if (this.state === "RETRACT") this.msg.setText("TROPPO VELOCE");
    else this.msg.setText(this.freeze ? "FERMA" : "");

    // swap texture / visibilità in base allo stato/spawn
    if (this.state !== "SUCCESS" && this.state !== "HORROR") {
      this.handFra.setTexture(this.freeze ? "F2" : "F1");
      this.handTom.setTexture(this.state === "RETRACT" ? "T2" : "T1");

      if (this.spawnType === "hand") {
        this.handTom.setVisible(true);
        this.item.setVisible(false);
      } else if (this.spawnType === "corn" || this.spawnType === "coke") {
        this.handTom.setVisible(false);
        this.item.setVisible(true);
      } else {
        this.handTom.setVisible(false);
        this.item.setVisible(false);
      }
    }

    if (this.state === "SUCCESS") {
      this.handFra.setTexture("presa");
      this.handTom.setVisible(false);
      this.item.setVisible(false);
      if (this.presa.visible) {
        this.presa.x = Phaser.Math.Linear(this.presa.x, this.presaNeutral.x, 0.06);
        this.presa.y = Phaser.Math.Linear(this.presa.y, this.presaNeutral.y, 0.06);
      }
    } else if (this.state === "HORROR") {
      this.handTom.setVisible(false);
      this.item.setVisible(true);
    }
  }

  onSuccess() {
    this.handFra.setTexture("presa");
    this.handTom.setVisible(false);
    this.item.setVisible(false);
    this.launchEmojis();
    this.switchToLoop2();
    this.playSuccess();
    this.showContinueLater();
  }

  onHorror() {
    this.handTom.setVisible(false);
    this.item.setVisible(false);
    this.handFra.setTexture("F2");
    this.showGameOver();
  }

  onClickWin() {
    this.state = "SUCCESS";
    this.spawnType = null;
    this.handFra.setVisible(false);
    this.handTom.setVisible(false);
    this.item.setVisible(false);
    const mx = (this.fraPos.x + this.tomPos.x) / 2;
    const my = (this.fraPos.y + this.tomPos.y) / 2;
    this.presa.setPosition(mx, my).setVisible(true);
    this.msg.setText("PRESA");
    this.launchEmojis();
    this.switchToLoop2();
    this.playSuccess();
    this.showContinueLater();
  }

  launchEmojis() {
    if (this.showedEmojis) return;
    this.showedEmojis = true;
    const targetScale = 1;
    this.emoji1.setScale(0).setVisible(true);
    this.tweens.add({
      targets: this.emoji1,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 520,
      ease: "Back.Out",
      onComplete: () => {
        this.emoji2.setScale(0).setVisible(true);
        this.tweens.add({
          targets: this.emoji2,
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 520,
          ease: "Back.Out",
        });
      },
    });
  }

  showContinueLater() {
    this.time.delayedCall(1000, () => {
      this.continueBtn.setVisible(true);
      this.tweens.add({
        targets: this.continueBtn,
        alpha: 1,
        duration: 1000, // fade-in 1s
        ease: "Sine.Out",
      });
    });
  }

  switchToLoop2() {
    if (this.filmAlt && !this.filmAlt.visible) {
      if (this.film && this.film.stop) {
        this.film.stop();
      }
      if (this.film) this.film.setVisible(false);
      this.filmAlt.setVisible(true);
    }
  }

  showGameOver() {
    if (this.gameOverActive) return;
    this.gameOverActive = true;
    this.spawnType = null;
    this.handFra.setVisible(false);
    this.handTom.setVisible(false);
    this.item.setVisible(false);
    this.gameOverBg.setVisible(true);
    this.gameOverImage.setVisible(true);
    this.tryAgainBtn.setVisible(true);
    this.tryAgainBtn.removeAllListeners();
    this.tryAgainBtn.on("pointerdown", () => {
      this.scene.restart();
    });
    // piccolo effetto pop-in
    this.tryAgainBtn.setScale(0);
    this.tweens.add({
      targets: this.tryAgainBtn,
      scaleX: 0.8,
      scaleY: 0.8,
      y: this.cy - 60,
      duration: 320,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: this.tryAgainBtn,
          y: this.cy - 70,
          duration: 120,
          yoyo: true,
          ease: "Sine.InOut",
          repeat: 1,
        });
      },
    });
  }

  isFraCovered() {
    // Restituisce true se Fra è a sinistra (lato sedile) della linea diagonale over sinistro
    // Usa prodotto vettoriale per capire il lato rispetto al segmento diagP1->diagP2
    const ax = this.diagP2.x - this.diagP1.x;
    const ay = this.diagP2.y - this.diagP1.y;
    const bx = this.fraPos.x - this.diagP1.x;
    const by = this.fraPos.y - this.diagP1.y;
    const cross = ax * by - ay * bx;
    return cross < 0; // lato sinistro del vettore (schermo con Y verso il basso)
  }

  drawDiagonalGuide() {}

  playBgm() {
    if (this.bgm || !this.cache.audio.exists("bgm")) return;
    this.bgm = this.sound.add("bgm", { loop: true, volume: 0.05 });
    this.bgm.play({ seek: 60 }); // avvia dal minuto 1
  }

  playSuccess() {
    if (this.cache.audio.exists("success")) {
      this.sound.play("success", { volume: 0.8 });
    }
  }
}
