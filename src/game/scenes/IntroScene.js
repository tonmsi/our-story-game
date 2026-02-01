import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super("Intro");
  }

  create() {
    this.stage = 1;
    this.cx = GAME_W / 2;
    this.cy = GAME_H / 2;

    this.bg = this.add.rectangle(this.cx, this.cy, GAME_W, GAME_H, 0x000000).setDepth(0);
    this.img = this.add.image(this.cx, this.cy, "intro1").setDepth(1);
    this.img.setOrigin(0.5);
    this.scaleImage(this.img);

    this.flash = this.add.rectangle(this.cx, this.cy, GAME_W, GAME_H, 0xffffff, 0).setDepth(3);

    const next = () => {
      if (this.stage === 1) {
        this.stage = 2;
        this.img.setTexture("intro2");
        this.scaleImage(this.img);
      } else {
        this.stage = 3;
        this.doFlashAndStart();
      }
    };

    this.input.once("pointerdown", next);
    this.input.keyboard.once("keydown-SPACE", next);
    this.input.keyboard.once("keydown-ENTER", next);
  }

  scaleImage(img) {
    const maxW = GAME_W * 0.98;
    const maxH = GAME_H * 0.98;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(scale);
  }

  doFlashAndStart() {
    this.tweens.add({
      targets: this.flash,
      alpha: { from: 0, to: 1 },
      duration: 120,
      yoyo: true,
      onComplete: () => this.scene.start("CinemaHand"),
    });
  }
}
