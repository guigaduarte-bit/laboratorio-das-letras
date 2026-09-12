import type { GameObjects, Physics, Scene } from 'phaser';
import type { CharacterId } from '../content/characters';
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
    private readonly upper: GameObjects.Container;
    private readonly ringBack: GameObjects.Graphics;
    private readonly ringFront: GameObjects.Graphics;
    private readonly neck: GameObjects.Graphics;
    private readonly robotParts: Array<GameObjects.Graphics | GameObjects.Arc | GameObjects.Ellipse | GameObjects.Rectangle>;
    private readonly animalBody: GameObjects.Graphics;
    private readonly animalFace: GameObjects.Graphics;
    private readonly tail: GameObjects.Graphics;
    private character: CharacterId = 'lumi';
    private ringCount = -1;
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

        this.ringBack = scene.add.graphics();
        this.ringFront = scene.add.graphics();
        this.neck = scene.add.graphics();
        this.animalBody = scene.add.graphics();
        this.animalFace = scene.add.graphics();
        this.tail = scene.add.graphics({ x: 20, y: 12 });
        this.robotParts = [body, bodyPanel, badge, footLeft, footRight,
            antennaStem, this.antennaGlow, this.head, visor, leftEye, rightEye];
        this.upper = scene.add.container(0, 0, [antennaStem, this.antennaGlow, this.head, visor, leftEye, rightEye, this.animalFace]);

        this.rig.add([
            shadow,
            this.tail,
            this.leftLeg,
            this.rightLeg,
            footLeft,
            footRight,
            this.ringBack,
            this.neck,
            this.leftArm,
            this.rightArm,
            body,
            bodyPanel,
            badge,
            this.animalBody,
            this.ringFront,
            this.upper
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

    /** The platform prototype keeps Lumi; the expedition selects its own original rig. */
    setCharacter(character: CharacterId): void
    {
        if (!['lumi', 'unicorn', 'dog'].includes(character) || character === this.character) return;
        this.clearTweens();
        this.character = character;
        const robot = character === 'lumi';
        for (const part of this.robotParts) part.setVisible(robot);
        this.animalBody.clear(); this.animalFace.clear(); this.tail.clear();
        const fur = character === 'unicorn' ? 0xfff6ec : 0xc68b56;
        for (const [part, width, height, color] of [
            [this.leftArm, 11, 31, robot ? ART_COLORS.clay : fur],
            [this.rightArm, 11, 31, robot ? ART_COLORS.clay : fur],
            [this.leftLeg, 12, 25, robot ? ART_COLORS.deepMoss : fur],
            [this.rightLeg, 12, 25, robot ? ART_COLORS.deepMoss : fur]
        ] as const)
        {
            part.clear().fillStyle(color, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 6);
        }
        if (!robot) this.drawAnimal(character, fur);
        const rings = this.ringCount;
        this.ringCount = -1;
        this.setRingCount(Math.max(0, rings));
        const state = this.currentState ?? 'idle';
        this.currentState = undefined;
        this.applyState(state);
    }

    private drawAnimal(character: 'unicorn' | 'dog', fur: number): void
    {
        const body = this.animalBody, face = this.animalFace, tail = this.tail;
        const accent = character === 'unicorn' ? 0xb8a5df : 0x73503b;
        body.fillStyle(fur, 1).fillEllipse(0, 3, 42, 44);
        body.fillStyle(0xfff6ec, 1).fillEllipse(0, 8, 26, 27);
        body.fillStyle(accent, 1).fillEllipse(-11, 32, 18, 8).fillEllipse(11, 32, 18, 8);
        // Small field scarf preserves the explorer identity without hiding animal anatomy.
        body.fillStyle(ART_COLORS.lagoon, 1).fillRoundedRect(-18, -16, 36, 9, 4);
        body.fillTriangle(9, -9, 18, -9, 20, 5);
        if (character === 'unicorn')
        {
            tail.fillStyle(0xb8a5df, 1).fillEllipse(11, 3, 17, 31);
            tail.fillStyle(0xeaa9b7, 1).fillEllipse(16, 7, 10, 26);
            face.fillStyle(accent, 1).fillEllipse(18, -24, 19, 41);
            face.fillStyle(fur, 1).fillTriangle(-22, -42, -20, -61, -8, -43);
            face.fillTriangle(9, -43, 20, -61, 23, -42);
            face.fillStyle(0xeaa9b7, 1).fillTriangle(-19, -43, -18, -55, -12, -43);
            face.fillTriangle(12, -43, 18, -55, 20, -43);
            face.fillStyle(fur, 1).fillEllipse(0, -29, 42, 42);
            face.fillStyle(ART_COLORS.sun, 1).fillTriangle(-6, -46, 0, -68, 7, -46);
            face.lineStyle(1.4, ART_COLORS.ochre, 1).lineBetween(-3, -56, 4, -53);
            face.fillStyle(accent, 1).fillEllipse(7, -44, 22, 11);
            face.fillStyle(0xf0d2d4, 1).fillEllipse(0, -18, 31, 18);
            face.fillStyle(ART_COLORS.ink, 1).fillEllipse(-6, -17, 2, 3).fillEllipse(6, -17, 2, 3);
        }
        else
        {
            tail.lineStyle(10, accent, 1).beginPath().moveTo(0, 0).lineTo(14, -7).lineTo(18, -20).strokePath();
            face.fillStyle(accent, 1).fillEllipse(-23, -32, 16, 35).fillEllipse(23, -32, 16, 35);
            face.fillStyle(fur, 1).fillEllipse(0, -28, 44, 41);
            face.fillStyle(accent, 1).fillEllipse(10, -33, 16, 19);
            face.fillStyle(0xffedcf, 1).fillEllipse(0, -18, 29, 19);
            face.fillStyle(0xeaa9b7, 1).fillRoundedRect(-4, -13, 8, 9, 4);
            face.fillStyle(ART_COLORS.ink, 1).fillEllipse(0, -21, 9, 6);
        }
        face.fillStyle(ART_COLORS.ink, 1).fillEllipse(-8, -32, 5, 7).fillEllipse(8, -32, 5, 7);
        face.fillStyle(0xffffff, 1).fillCircle(-9, -34, 1.2).fillCircle(7, -34, 1.2);
    }

    /** Metades atrás e à frente do tronco pertencem ao mesmo rig: nunca ficam ao lado. */
    setRingCount(count: number): void
    {
        const rings = Math.max(0, Math.min(24, Math.floor(Number.isFinite(count) ? count : 0)));
        if (rings === this.ringCount) return;
        this.ringCount = rings;
        const growth = Math.max(0, rings - 6) * 3.2;
        this.upper.setY(-growth);
        this.neck.clear();
        this.neck.fillStyle(this.character === 'lumi' ? ART_COLORS.deepMoss
            : this.character === 'unicorn' ? 0xfff6ec : 0xc68b56, 1);
        this.neck.fillRoundedRect(-8, -19-growth, 16, 30+growth, 6);
        this.ringBack.clear(); this.ringFront.clear();
        for (let index = 0; index < rings; index++)
        {
            const y = 19 - index * 3.2;
            const color = [ART_COLORS.sun, ART_COLORS.clay, ART_COLORS.lagoon, ART_COLORS.leafLight][Math.floor(index / 3) % 4];
            for (const [g, start] of [[this.ringBack, Math.PI], [this.ringFront, 0]] as const)
            {
                g.lineStyle(3.6, color, 1);
                g.beginPath();
                for (let step = 0; step <= 20; step++)
                {
                    const angle = start + step * Math.PI / 20;
                    const x = Math.cos(angle) * 30;
                    const py = y + Math.sin(angle) * 7;
                    if (step === 0) g.moveTo(x, py); else g.lineTo(x, py);
                }
                g.strokePath();
            }
        }
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

    getRunnerScale(width: number, height: number, approach: number): number
    {
        const growth = Math.max(0, this.ringCount - 6) * 3.2;
        // Reserva espaço sob as letras quando a pilha cresce em uma tela baixa.
        const belowLetters = (height * 0.264 + 6) / (this.character === 'unicorn' ? 93 + growth : 79 + growth);
        return Math.min(1.4, Math.max(0.82, width / 740), belowLetters) * (1 - approach * 0.16);
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

        if (this.character !== 'lumi')
        {
            this.tail.setAngle(-8);
            this.scene.tweens.add({
                targets: this.tail, angle: 12,
                duration: state === 'walk' ? 180 : state === 'celebrate' ? 220 : 680,
                ease: 'Sine.easeInOut', yoyo: true, repeat: -1
            });
        }

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
        this.tail.setAngle(0);
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
            this.antennaGlow,
            this.tail
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
