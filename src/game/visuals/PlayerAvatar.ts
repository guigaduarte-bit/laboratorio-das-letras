import type { GameObjects, Physics, Scene } from 'phaser';
import { ART_COLORS } from './palette';

export type PlayerVisualState =
    | 'idle'
    | 'walk'
    | 'jump'
    | 'land'
    | 'collect'
    | 'celebrate';

export class PlayerAvatar
{
    private readonly root: GameObjects.Container;
    private readonly rig: GameObjects.Container;
    private readonly head: GameObjects.Graphics;
    private readonly leftArm: GameObjects.Graphics;
    private readonly rightArm: GameObjects.Graphics;
    private readonly leftLeg: GameObjects.Graphics;
    private readonly rightLeg: GameObjects.Graphics;
    private readonly antennaGlow: GameObjects.Arc;
    private currentState?: PlayerVisualState;
    private facing: -1 | 1 = 1;
    private lockedUntil = 0;
    private celebrationLocked = false;
    private wasGrounded = false;

    constructor(
        private readonly scene: Scene,
        x: number,
        y: number
    )
    {
        this.root = scene.add.container(x, y).setDepth(7);
        this.rig = scene.add.container(0, 0);

        const shadow = scene.add.ellipse(0, 31, 48, 13, ART_COLORS.ink, 0.18);
        this.leftLeg = this.makeRoundedPart(-10, 20, 12, 25, 6, ART_COLORS.deepMoss);
        this.rightLeg = this.makeRoundedPart(10, 20, 12, 25, 6, ART_COLORS.deepMoss);
        this.leftArm = this.makeRoundedPart(-25, 1, 11, 31, 6, ART_COLORS.clay);
        this.rightArm = this.makeRoundedPart(25, 1, 11, 31, 6, ART_COLORS.clay);
        const body = this.makeRoundedPart(0, 2, 43, 42, 14, ART_COLORS.sand, ART_COLORS.ink, 3);
        const bodyPanel = this.makeRoundedPart(0, 5, 26, 19, 8, ART_COLORS.lagoon);
        const badge = scene.add.circle(0, 5, 5, ART_COLORS.sun);
        const antennaStem = scene.add.rectangle(0, -42, 4, 14, ART_COLORS.ink);
        this.antennaGlow = scene.add.circle(0, -51, 7, ART_COLORS.sun, 0.94);
        this.head = this.makeRoundedPart(0, -27, 49, 34, 13, ART_COLORS.oat, ART_COLORS.ink, 3);
        const visor = this.makeRoundedPart(0, -27, 35, 20, 9, ART_COLORS.ink);
        const leftEye = scene.add.circle(-8, -27, 3.5, ART_COLORS.sun);
        const rightEye = scene.add.circle(8, -27, 3.5, ART_COLORS.sun);
        const footLeft = scene.add.ellipse(-11, 32, 18, 8, ART_COLORS.ink);
        const footRight = scene.add.ellipse(11, 32, 18, 8, ART_COLORS.ink);

        this.rig.add([
            shadow,
            this.leftLeg,
            this.rightLeg,
            footLeft,
            footRight,
            this.leftArm,
            this.rightArm,
            body,
            bodyPanel,
            badge,
            antennaStem,
            this.antennaGlow,
            this.head,
            visor,
            leftEye,
            rightEye
        ]);
        this.root.add(this.rig);
        this.applyState('idle');
    }

    updateFromBody(body: Physics.Arcade.Body): void
    {
        this.root.setPosition(body.center.x, body.center.y - 2);

        if (body.velocity.x > 8)
        {
            this.setFacing(1);
        }
        else if (body.velocity.x < -8)
        {
            this.setFacing(-1);
        }

        if (this.celebrationLocked || this.scene.time.now < this.lockedUntil)
        {
            return;
        }

        const grounded = body.blocked.down || body.touching.down;

        if (grounded && !this.wasGrounded)
        {
            this.wasGrounded = true;
            this.playLand();
            return;
        }

        this.wasGrounded = grounded;

        if (!grounded)
        {
            this.applyState('jump');
        }
        else if (Math.abs(body.velocity.x) > 8)
        {
            this.applyState('walk');
        }
        else
        {
            this.applyState('idle');
        }
    }

    syncPosition(x: number, y: number): void
    {
        this.root.setPosition(x, y);
    }

    setRunnerPose(moving: boolean, scale: number, reducedMotion: boolean): void
    {
        this.root.setScale(scale).setDepth(70);
        if (reducedMotion)
        {
            this.clearTweens();
            this.resetPose();
            return;
        }
        if (!this.celebrationLocked && this.scene.time.now >= this.lockedUntil)
        {
            this.applyState(moving ? 'walk' : 'idle');
        }
    }

    playCollect(): void
    {
        if (this.celebrationLocked)
        {
            return;
        }

        this.lockedUntil = this.scene.time.now + 430;
        this.applyState('collect');
        this.emitDiscoveryBurst(this.root.x, this.root.y - 34, 10);
    }

    playCelebrate(): void
    {
        this.celebrationLocked = true;
        this.applyState('celebrate');
        this.emitDiscoveryBurst(this.root.x, this.root.y - 28, 20);
    }

    destroy(): void
    {
        this.clearTweens();
        this.root.destroy(true);
    }

    private playLand(): void
    {
        this.lockedUntil = this.scene.time.now + 220;
        this.applyState('land');
        this.emitLandingLeaves();
    }

    private applyState(state: PlayerVisualState): void
    {
        if (this.currentState === state)
        {
            return;
        }

        this.currentState = state;
        this.clearTweens();
        this.resetPose();

        if (state === 'idle')
        {
            this.scene.tweens.add({
                targets: this.rig,
                y: -1.5,
                scaleY: 1.018,
                duration: 820,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            this.scene.tweens.add({
                targets: this.antennaGlow,
                alpha: 0.62,
                scale: 1.12,
                duration: 920,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            return;
        }

        if (state === 'walk')
        {
            this.leftArm.setAngle(13);
            this.rightArm.setAngle(-13);
            this.leftLeg.setAngle(-10);
            this.rightLeg.setAngle(10);
            this.scene.tweens.add({
                targets: [this.leftArm, this.rightLeg],
                angle: '-=26',
                duration: 180,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            this.scene.tweens.add({
                targets: [this.rightArm, this.leftLeg],
                angle: '+=26',
                duration: 180,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            this.scene.tweens.add({
                targets: this.rig,
                y: -2,
                duration: 180,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            return;
        }

        if (state === 'jump')
        {
            this.leftArm.setAngle(-30);
            this.rightArm.setAngle(30);
            this.leftLeg.setAngle(12);
            this.rightLeg.setAngle(-12);
            this.rig.setScale(0.98, 1.03);
            this.antennaGlow.setScale(1.22).setAlpha(1);
            return;
        }

        if (state === 'land')
        {
            this.scene.tweens.chain({
                targets: this.rig,
                tweens: [
                    {
                        scaleX: 1.06,
                        scaleY: 0.9,
                        y: 3,
                        duration: 90,
                        ease: 'Cubic.easeOut'
                    },
                    {
                        scaleX: 1,
                        scaleY: 1,
                        y: 0,
                        duration: 120,
                        ease: 'Back.easeOut'
                    }
                ]
            });
            return;
        }

        if (state === 'collect')
        {
            this.leftArm.setAngle(-44);
            this.rightArm.setAngle(44);
            this.scene.tweens.chain({
                targets: this.rig,
                tweens: [
                    { scale: 1.08, y: -5, duration: 180, ease: 'Back.easeOut' },
                    { scale: 1, y: 0, duration: 220, ease: 'Sine.easeInOut' }
                ]
            });
            this.scene.tweens.add({
                targets: this.antennaGlow,
                scale: 1.9,
                alpha: 1,
                duration: 180,
                ease: 'Cubic.easeOut',
                yoyo: true
            });
            return;
        }

        this.leftArm.setAngle(-62);
        this.rightArm.setAngle(62);
        this.scene.tweens.add({
            targets: this.rig,
            y: -8,
            scale: 1.05,
            duration: 330,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.scene.tweens.add({
            targets: this.antennaGlow,
            scale: 2.1,
            alpha: 0.7,
            duration: 360,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private setFacing(direction: -1 | 1): void
    {
        if (this.facing === direction)
        {
            return;
        }

        this.facing = direction;
        this.root.setScale(direction, 1);
    }

    private resetPose(): void
    {
        this.rig.setPosition(0, 0).setScale(1).setAngle(0);
        this.head.setAngle(0).setScale(1);
        this.leftArm.setAngle(0).setScale(1);
        this.rightArm.setAngle(0).setScale(1);
        this.leftLeg.setAngle(0).setScale(1);
        this.rightLeg.setAngle(0).setScale(1);
        this.antennaGlow.setScale(1).setAlpha(0.94);
    }

    private clearTweens(): void
    {
        [
            this.rig,
            this.head,
            this.leftArm,
            this.rightArm,
            this.leftLeg,
            this.rightLeg,
            this.antennaGlow
        ].forEach((target) => this.scene.tweens.killTweensOf(target));
    }

    private makeRoundedPart(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fill: number,
        stroke?: number,
        strokeWidth = 0
    ): GameObjects.Graphics
    {
        const part = this.scene.add.graphics({ x, y });
        part.fillStyle(fill, 1);
        part.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

        if (stroke !== undefined && strokeWidth > 0)
        {
            part.lineStyle(strokeWidth, stroke, 1);
            part.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
        }

        return part;
    }

    private emitDiscoveryBurst(x: number, y: number, count: number): void
    {
        const emitter = this.scene.add.particles(0, 0, 'spark', {
            emitting: false,
            speed: { min: 55, max: 150 },
            lifespan: { min: 420, max: 720 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 80,
            tint: [ART_COLORS.sun, ART_COLORS.sand, ART_COLORS.leafLight]
        }).setDepth(12);
        emitter.explode(count, x, y);
        this.scene.time.delayedCall(850, () => emitter.destroy());
    }

    private emitLandingLeaves(): void
    {
        const emitter = this.scene.add.particles(0, 0, 'leaf', {
            emitting: false,
            speedX: { min: -75, max: 75 },
            speedY: { min: -90, max: -35 },
            lifespan: { min: 360, max: 560 },
            scale: { start: 0.72, end: 0 },
            alpha: { start: 0.72, end: 0 },
            rotate: { min: -80, max: 80 },
            gravityY: 180,
            tint: [ART_COLORS.moss, ART_COLORS.leafLight, ART_COLORS.ochre]
        }).setDepth(6);
        emitter.explode(6, this.root.x, this.root.y + 29);
        this.scene.time.delayedCall(680, () => emitter.destroy());
    }
}
