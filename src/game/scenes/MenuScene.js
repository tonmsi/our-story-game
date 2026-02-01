import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    const { width, height } = this.scale;

    // due layer intro sovrapposti
    this.stage = 0;
    this.layerBottom = this.add.image(width / 2, height / 2, "intro2").setDepth(1);
    this.layerTop = this.add.image(width / 2, height / 2, "intro1").setDepth(2);
    this.scaleImage(this.layerBottom, width, height);
    this.scaleImage(this.layerTop, width, height);

    this.flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0).setDepth(3);

    const hit = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);

    const next = () => {
      if (this.stage === 0) {
        this.layerTop.setVisible(false);
        this.stage = 1;
      } else if (this.stage === 1) {
        this.layerBottom.setVisible(false);
        this.stage = 2;
        this.doFlashAndStart();
      }
    };

    hit.on("pointerdown", next);
    this.input.keyboard.on("keydown-SPACE", next);
    this.input.keyboard.on("keydown-ENTER", next);
  }

  scaleImage(img, w, h) {
    const maxW = w * 0.98;
    const maxH = h * 0.98;
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
