import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import CinemaHandScene from "./scenes/CinemaHandScene";
import Level2RunnerScene from "./scenes/Level2RunnerScene";

// Dimensioni native in base a under.png (1462 x 849)
export const GAME_W = 1462;
export const GAME_H = 849;

export const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
  scene: [BootScene, MenuScene, CinemaHandScene, Level2RunnerScene],
};
