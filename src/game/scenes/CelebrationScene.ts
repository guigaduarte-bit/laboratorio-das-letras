import { Scene } from 'phaser';
import { getLevelById, type LevelDefinition } from '../content/levels';
import { EventBus } from '../EventBus';
import { drawForestLabBackground, drawPlatformVisual } from '../visuals/ForestLabArt';
import { ART_COLORS, PHASER_FONT } from '../visuals/palette';
import { PlayerAvatar } from '../visuals/PlayerAvatar';

export class CelebrationScene extends Scene
{
    private level: LevelDefinition = getLevelById();
    private avatar?: PlayerAvatar;

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
        drawForestLabBackground(this);
        drawPlatformVisual(this, this.level.platforms[0], true);

        const panel = this.add.graphics({ x: 480, y: 270 }).setDepth(3).setScale(0.86);
        panel.fillStyle(ART_COLORS.ink, 0.17);
        panel.fillRoundedRect(-298, -168, 610, 354, 30);
        panel.fillStyle(ART_COLORS.sand, 0.97);
        panel.fillRoundedRect(-305, -180, 610, 354, 30);
        panel.lineStyle(6, ART_COLORS.deepMoss, 1);
        panel.strokeRoundedRect(-305, -180, 610, 354, 30);

        const title = this.add.text(480, 132, 'PALAVRA COMPLETA!', {
            color: '#355F4B',
            fontFamily: PHASER_FONT,
            fontSize: '28px',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);
        const word = this.add.text(480, 205, this.level.word, {
            color: '#26383A',
            fontFamily: PHASER_FONT,
            fontSize: '70px',
            fontStyle: 'bold',
            letterSpacing: 10
        }).setOrigin(0.5).setDepth(5);

        this.drawWordImage(598, 342);
        this.avatar = new PlayerAvatar(this, 352, 374);
        this.avatar.playCelebrate();
        this.drawCelebrationParticles();

        this.tweens.add({
            targets: panel,
            scale: 1,
            duration: 460,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: title,
            y: 127,
            duration: 860,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.tweens.add({
            targets: word,
            scale: 1.035,
            duration: 620,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.cameras.main.fadeIn(260, 232, 220, 199);
        this.events.once('shutdown', () => this.avatar?.destroy());

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

        this.add.circle(x, y, 48, ART_COLORS.lagoon).setDepth(5);
    }

    private drawFrog(x: number, y: number): void
    {
        this.add.ellipse(x, y + 38, 132, 24, ART_COLORS.ink, 0.16).setDepth(4);
        this.add.ellipse(x - 47, y + 27, 55, 25, ART_COLORS.moss).setAngle(-18).setDepth(5);
        this.add.ellipse(x + 47, y + 27, 55, 25, ART_COLORS.moss).setAngle(18).setDepth(5);
        this.add.ellipse(x, y + 13, 118, 76, ART_COLORS.leafLight).setDepth(5);
        this.add.ellipse(x, y - 18, 105, 72, ART_COLORS.moss).setDepth(6);
        this.add.circle(x - 35, y - 47, 22, ART_COLORS.moss).setDepth(6);
        this.add.circle(x + 35, y - 47, 22, ART_COLORS.moss).setDepth(6);
        this.add.circle(x - 35, y - 48, 11, ART_COLORS.sand).setDepth(7);
        this.add.circle(x + 35, y - 48, 11, ART_COLORS.sand).setDepth(7);
        this.add.circle(x - 33, y - 47, 5, ART_COLORS.ink).setDepth(8);
        this.add.circle(x + 33, y - 47, 5, ART_COLORS.ink).setDepth(8);
        this.add.circle(x - 29, y - 6, 7, ART_COLORS.deepMoss, 0.42).setDepth(7);
        this.add.circle(x + 27, y + 3, 6, ART_COLORS.deepMoss, 0.42).setDepth(7);

        const smile = this.add.graphics().setDepth(8);
        smile.lineStyle(4, ART_COLORS.ink, 0.9);
        smile.beginPath();
        smile.arc(x, y - 17, 22, 0.2, Math.PI - 0.2);
        smile.strokePath();
    }

    private drawDuck(x: number, y: number): void
    {
        this.add.ellipse(x, y + 42, 144, 22, ART_COLORS.water, 0.48).setDepth(4);
        this.add.ellipse(x - 15, y + 12, 130, 82, ART_COLORS.sun).setDepth(5);
        this.add.circle(x + 42, y - 34, 43, ART_COLORS.sun).setDepth(6);
        this.add.ellipse(x + 82, y - 26, 55, 20, ART_COLORS.clay).setDepth(7);
        this.add.circle(x + 55, y - 46, 6, ART_COLORS.ink).setDepth(7);
        this.add.circle(x + 57, y - 48, 2, ART_COLORS.sand).setDepth(8);
        this.add.ellipse(x - 25, y + 8, 67, 42, ART_COLORS.ochre, 0.72)
            .setAngle(-8)
            .setDepth(6);
        this.add.ellipse(x - 74, y - 5, 37, 24, ART_COLORS.sun).setAngle(24).setDepth(5);

        const ripples = this.add.graphics().setDepth(5);
        ripples.lineStyle(3, ART_COLORS.deepMoss, 0.34);
        ripples.strokeEllipse(x, y + 43, 170, 28);
        ripples.strokeEllipse(x, y + 47, 208, 38);
    }

    private drawCelebrationParticles(): void
    {
        const sparkles = this.add.particles(0, 0, 'spark', {
            emitting: false,
            speed: { min: 90, max: 250 },
            lifespan: { min: 760, max: 1400 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 130,
            tint: [ART_COLORS.sun, ART_COLORS.sand, ART_COLORS.clay]
        }).setDepth(12);
        sparkles.explode(34, 480, 250);

        const leaves = this.add.particles(0, 0, 'leaf', {
            x: { min: 80, max: 880 },
            y: -10,
            speedX: { min: -22, max: 22 },
            speedY: { min: 45, max: 95 },
            lifespan: { min: 2600, max: 4200 },
            frequency: 170,
            quantity: 1,
            scale: { start: 0.78, end: 0.38 },
            alpha: { start: 0.72, end: 0 },
            rotate: { min: -100, max: 100 },
            tint: [ART_COLORS.moss, ART_COLORS.leafLight, ART_COLORS.ochre],
            stopAfter: 28
        }).setDepth(11);

        this.time.delayedCall(1700, () => sparkles.destroy());
        leaves.once('complete', () => leaves.destroy());
    }
}
