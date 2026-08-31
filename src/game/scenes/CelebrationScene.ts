import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class CelebrationScene extends Scene
{
    private word = 'SAPO';

    constructor()
    {
        super('CelebrationScene');
    }

    init(data: { word?: string }): void
    {
        this.word = data.word ?? 'SAPO';
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
        const word = this.add.text(480, 222, this.word, {
            color: '#24344A',
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '72px',
            fontStyle: 'bold',
            letterSpacing: 10
        }).setOrigin(0.5);

        this.drawFrog(480, 355);
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

        EventBus.emit('celebration-ready', { word: this.word });
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
