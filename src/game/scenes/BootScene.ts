import { Scene } from 'phaser';

export class BootScene extends Scene
{
    constructor()
    {
        super('BootScene');
    }

    create(): void
    {
        this.scene.start('PreloadScene');
    }
}
