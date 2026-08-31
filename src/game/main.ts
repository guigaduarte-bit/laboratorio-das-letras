import { AUTO, Game, Scale } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CelebrationScene } from './scenes/CelebrationScene';
import { LevelScene } from './scenes/LevelScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#7EC8D9',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 960,
        height: 540
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        activePointers: 3
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 1100 },
            debug: false
        }
    },
    render: {
        antialias: true,
        roundPixels: true
    },
    scene: [BootScene, PreloadScene, MenuScene, LevelScene, CelebrationScene]
};

const StartGame = (parent: string) => new Game({ ...config, parent });

export default StartGame;
