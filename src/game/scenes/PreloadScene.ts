import { Scene } from 'phaser';

export class PreloadScene extends Scene
{
    constructor()
    {
        super('PreloadScene');
    }

    create(): void
    {
        this.createSolidTexture('ground', 0x385b46);
        this.createSolidTexture('platform', 0x547c59);
        this.createSolidTexture('letter-card', 0xfff7dd);
        this.createSolidTexture('player', 0xf4a261, 38, 54);

        this.scene.start('MenuScene');
    }

    private createSolidTexture(key: string, color: number, width = 8, height = 8): void
    {
        const texture = this.make.graphics({ x: 0, y: 0 });
        texture.fillStyle(color, 1);
        texture.fillRect(0, 0, width, height);
        texture.generateTexture(key, width, height);
        texture.destroy();
    }
}
