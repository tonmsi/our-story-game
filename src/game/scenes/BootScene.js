import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Assets pubblici serviti da /public/assets
    this.load.setPath("assets");

    // Cinema
    this.load.image("cinemaUnder", "cinema/under.png");
    this.load.image("cinemaOver", "cinema/over.png");

    // Mani
    this.load.image("F1", "hands/F1.png");
    this.load.image("F2", "hands/F2.png");
    this.load.image("T1", "hands/T1.png");
    this.load.image("T2", "hands/T2.png");
    this.load.image("presa", "hands/presa.png");

    // Oggetti
    this.load.image("corn", "hands/corn.png");
    this.load.image("coke", "hands/coke.png");

    // Emoji vittoria
    this.load.image("emoji1", "hero/emoji1.png");
    this.load.image("emoji2", "hero/emoji2.png");

    // Intro
    this.load.image("intro1", "ui/intro1.png");
    this.load.image("intro2", "ui/intro2.png");
    this.load.image("gameover", "ui/gameover.png");
    this.load.image("tryagain", "ui/tryagain.png");
    this.load.image("continue", "ui/continue.png");

    // Audio
    this.load.audio("success", ["audio/success.mp3"]);
    this.load.audio("click", ["audio/click.m4a"]);
    this.load.audio("bgm", ["audio/bgm.mp3"]);

    // Film (prova più nomi in mp4/webm)
    this.load.video(
      "filmLoop",
      [
        "film/filmLoop.mp4",
        "film/film.mp4",
        "film/loop.mp4",
        "film/filmLoop.webm",
        "film/film.webm",
        "film/loop.webm",
      ],
      "canplaythrough",
      false, // asBlob
      true // noAudio
    );

    // GIF fallback per lo schermo
    this.load.image("filmGif", "film/loop1.gif");
    this.load.image("filmLoop2", "film/loop2.gif");
  }

  create() {
    // fallback textures se gli asset non sono presenti
    const W = 1462;
    const H = 849;
    if (!this.textures.exists("cinemaUnder")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x111111, 1);
      g.fillRect(0, 0, W, H);
      g.generateTexture("cinemaUnder", W, H);
      g.destroy();
    }
    if (!this.textures.exists("cinemaOver")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, W, H);
      g.fillStyle(0x000000, 0.5);
      g.fillRect(0, H - 220, W, 220); // barra inferiore
      g.generateTexture("cinemaOver", W, H);
      g.destroy();
    }

    this.scene.start("Menu");
  }
}
