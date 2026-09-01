import { Scene } from 'phaser';

export class PreloadScene extends Scene
{
    constructor()
    {
        super('PreloadScene');
    }

    create(): void
    {
        this.createSolidTexture('ground-hitbox', 0xffffff);
        this.createSolidTexture('platform-hitbox', 0xffffff);
        this.createSolidTexture('letter-hitbox', 0xffffff, 70, 80);
        this.createSolidTexture('player-hitbox', 0xffffff, 38, 54);
        this.createParticleTextures();

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

    private createParticleTextures(): void
    {
        const spark = this.make.graphics({ x: 0, y: 0 });
        spark.fillStyle(0xffffff, 1);
        spark.fillCircle(6, 6, 5);
        spark.generateTexture('spark', 12, 12);
        spark.destroy();

        const leaf = this.make.graphics({ x: 0, y: 0 });
        leaf.fillStyle(0xffffff, 1);
        leaf.fillEllipse(7, 5, 13, 8);
        leaf.generateTexture('leaf', 14, 10);
        leaf.destroy();
    }
}
