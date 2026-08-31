import { Scene } from 'phaser';
import { getLevelById, type LevelDefinition } from '../content/levels';
import { EventBus } from '../EventBus';

export class CelebrationScene extends Scene
{
    private level: LevelDefinition = getLevelById();

    constructor()
    {
        super('CelebrationScene');
    }

    init(data: { levelId?: string }): void
    {
        this.level = getLevelById(data.levelId);
    }

    create(): void
    {
        this.cameras.main.setBackgroundColor('#A8D8C0');
        this.add.rectangle(480, 270, 960, 540, 0xa8d8c0);
        this.add.circle(150, 115, 92, 0xffe49a, 0.72);
        this.add.circle(820, 430, 140, 0x76b88a, 0.54);

        const panel = this.add.rectangle(480, 270, 590, 350, 0xfff7dd, 0.96)
            .setStrokeStyle(5, 0x547c59)
            .setScale(0.85);
        const title = this.add.text(480, 145, 'PALAVRA COMPLETA!', {
            color: '#385B46',
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '29px',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const word = this.add.text(480, 222, this.level.word, {
            color: '#24344A',
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '72px',
            fontStyle: 'bold',
            letterSpacing: 10
        }).setOrigin(0.5);

        this.drawWordImage(480, 355);
        this.drawConfetti();

        this.tweens.add({
            targets: panel,
            scale: 1,
            duration: 420,
            ease: 'Back.Out'
        });
        this.tweens.add({
            targets: [title, word],
            y: '-=8',
            duration: 850,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        EventBus.emit('celebration-ready', {
            levelId: this.level.id,
            word: this.level.word,
            displayName: this.level.displayName
        });
    }

    private drawWordImage(x: number, y: number): void
    {
        if (this.level.imageKey === 'sapo')
        {
            this.drawFrog(x, y);
            return;
        }

        if (this.level.imageKey === 'pato')
        {
            this.drawDuck(x, y);
            return;
        }

        this.add.circle(x, y, 48, 0x76b88a);
    }

    private drawFrog(x: number, y: number): void
    {
        this.add.ellipse(x, y + 16, 122, 72, 0x69b96e);
        this.add.circle(x - 39, y - 18, 25, 0x69b96e);
        this.add.circle(x + 39, y - 18, 25, 0x69b96e);
        this.add.circle(x - 39, y - 21, 9, 0xffffff);
        this.add.circle(x + 39, y - 21, 9, 0xffffff);
        this.add.circle(x - 38, y - 20, 4, 0x24344a);
        this.add.circle(x + 38, y - 20, 4, 0x24344a);
        this.add.ellipse(x, y + 21, 42, 8, 0x385b46);
    }

    private drawDuck(x: number, y: number): void
    {
        this.add.ellipse(x - 8, y + 14, 128, 78, 0xffd166);
        this.add.circle(x + 44, y - 23, 38, 0xffd166);
        this.add.ellipse(x + 80, y - 16, 48, 18, 0xf4a261);
        this.add.circle(x + 55, y - 32, 5, 0x24344a);
        this.add.ellipse(x - 18, y + 15, 58, 32, 0xf4b942, 0.86);
    }

    private drawConfetti(): void
    {
        const colors = [0xf4a261, 0xffd166, 0x547c59, 0x5a8fd8];

        for (let index = 0; index < 18; index += 1)
        {
            const piece = this.add.rectangle(
                90 + (index * 53) % 800,
                45 + (index * 37) % 410,
                12,
                22,
                colors[index % colors.length]
            ).setAngle(index * 19);

            this.tweens.add({
                targets: piece,
                y: '+=24',
                angle: '+=70',
                duration: 900 + (index % 4) * 120,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
}
