import type { GameObjects, Scene } from 'phaser';
import { ART_COLORS, PHASER_FONT } from './palette';

export class LetterCardView
{
    readonly root: GameObjects.Container;

    private readonly glow: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private readonly baseY: number;
    private destroyed = false;

    constructor(
        private readonly scene: Scene,
        x: number,
        y: number,
        letter: string
    )
    {
        this.baseY = y;
        this.root = scene.add.container(x, y).setDepth(8);

        const shadow = scene.add.graphics({ x: 4, y: 7 });
        shadow.fillStyle(ART_COLORS.ink, 0.2);
        shadow.fillRoundedRect(-35, -40, 70, 80, 15);

        this.glow = scene.add.graphics();
        this.glow.fillStyle(ART_COLORS.sun, 0.56);
        this.glow.fillRoundedRect(-39, -44, 78, 88, 18);
        this.glow.setAlpha(0.22);

        const surface = scene.add.graphics();
        surface.fillStyle(ART_COLORS.sand, 1);
        surface.fillRoundedRect(-35, -40, 70, 80, 15);
        surface.lineStyle(4, ART_COLORS.deepMoss, 1);
        surface.strokeRoundedRect(-35, -40, 70, 80, 15);

        const leafTab = scene.add.ellipse(0, -39, 23, 10, ART_COLORS.moss);
        const leftBolt = scene.add.circle(-24, -28, 3, ART_COLORS.ochre);
        const rightBolt = scene.add.circle(24, -28, 3, ART_COLORS.ochre);

        this.label = scene.add.text(0, 4, letter, {
            color: '#26383A',
            fontFamily: PHASER_FONT,
            fontSize: '40px',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.root.add([
            this.glow,
            shadow,
            surface,
            leafTab,
            leftBolt,
            rightBolt,
            this.label
        ]);
        this.startIdle();
    }

    showMismatch(): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.scene.tweens.killTweensOf(this.root);
        this.scene.tweens.killTweensOf(this.glow);
        this.root.setAngle(0).setPosition(this.root.x, this.baseY).setScale(1);
        this.glow.setAlpha(0.78).setScale(1);

        this.scene.tweens.chain({
            targets: this.root,
            tweens: [
                { scale: 1.055, y: this.baseY - 4, duration: 120, ease: 'Cubic.easeOut' },
                { scale: 1, y: this.baseY, duration: 170, ease: 'Back.easeOut' }
            ],
            onComplete: () => this.startIdle()
        });
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.22,
            scale: 1.08,
            duration: 360,
            ease: 'Sine.easeOut'
        });
    }

    showExpectedHint(): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.scene.tweens.killTweensOf(this.glow);
        this.glow.setAlpha(0.34).setScale(1);
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.86,
            scale: 1.12,
            duration: 260,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => this.glow.setAlpha(0.22).setScale(1)
        });
    }

    collect(): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.destroyed = true;
        this.scene.tweens.killTweensOf(this.root);
        this.scene.tweens.killTweensOf(this.glow);
        this.emitParticles();
        this.glow.setAlpha(0.92);

        this.scene.tweens.add({
            targets: this.root,
            alpha: 0,
            scale: 1.12,
            y: this.baseY - 10,
            duration: 340,
            ease: 'Cubic.easeOut',
            onComplete: () => this.root.destroy(true)
        });
    }

    destroy(): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.destroyed = true;
        this.scene.tweens.killTweensOf(this.root);
        this.scene.tweens.killTweensOf(this.glow);
        this.root.destroy(true);
    }

    private startIdle(): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.scene.tweens.killTweensOf(this.root);
        this.root.setPosition(this.root.x, this.baseY).setScale(1).setAngle(-1.2);
        this.scene.tweens.add({
            targets: this.root,
            y: this.baseY - 3,
            angle: 1.2,
            duration: 980,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.35,
            scale: 1.035,
            duration: 1100,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private emitParticles(): void
    {
        const emitter = this.scene.add.particles(0, 0, 'spark', {
            emitting: false,
            speed: { min: 65, max: 180 },
            lifespan: { min: 460, max: 780 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 95,
            tint: [ART_COLORS.sun, ART_COLORS.leafLight, ART_COLORS.clay]
        }).setDepth(11);
        emitter.explode(14, this.root.x, this.baseY);
        this.scene.time.delayedCall(900, () => emitter.destroy());
    }
}
