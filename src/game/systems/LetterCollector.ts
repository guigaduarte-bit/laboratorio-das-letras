import type { GameObjects, Physics, Scene } from 'phaser';
import type { LetterPlacement } from '../content/levels';
import { EventBus } from '../EventBus';
import type { WordProgress } from './WordProgress';

type LetterCard = {
    card: Physics.Arcade.Image;
    label: GameObjects.Text;
    letter: string;
    lastWrongAt: number;
};

export class LetterCollector
{
    private readonly cards: LetterCard[] = [];
    private readonly overlaps: Physics.Arcade.Collider[] = [];

    constructor(
        private readonly scene: Scene,
        player: Physics.Arcade.Sprite,
        placements: LetterPlacement[],
        private readonly progress: WordProgress
    )
    {
        placements.forEach((placement) => {
            const card = scene.physics.add.staticImage(placement.x, placement.y, 'letter-card')
                .setDisplaySize(64, 70)
                .setDepth(8)
                .refreshBody();
            card.setData('letter', placement.letter);

            const label = scene.add.text(placement.x, placement.y, placement.letter, {
                color: '#24344A',
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: '38px',
                fontStyle: 'bold'
            })
                .setOrigin(0.5)
                .setDepth(9);

            const entry: LetterCard = {
                card,
                label,
                letter: placement.letter,
                lastWrongAt: -1000
            };
            const overlap = scene.physics.add.overlap(player, card, () => this.tryCollect(entry));

            this.cards.push(entry);
            this.overlaps.push(overlap);
        });
    }

    destroy(): void
    {
        this.overlaps.forEach((overlap) => overlap.destroy());
    }

    private tryCollect(entry: LetterCard): void
    {
        if (!entry.card.active)
        {
            return;
        }

        const expected = this.progress.expectedLetter;
        const result = this.progress.tryCollect(entry.letter);

        if (!result.accepted)
        {
            const now = this.scene.time.now;
            if (expected && now - entry.lastWrongAt >= 900)
            {
                entry.lastWrongAt = now;
                EventBus.emit('letter-mismatch', { found: entry.letter, expected });
                this.scene.tweens.add({
                    targets: [entry.card, entry.label],
                    angle: { from: -4, to: 4 },
                    duration: 80,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        entry.card.setAngle(0);
                        entry.label.setAngle(0);
                    }
                });
            }
            return;
        }

        (entry.card.body as Physics.Arcade.StaticBody).enable = false;
        this.scene.tweens.add({
            targets: [entry.card, entry.label],
            alpha: 0,
            scale: 1.3,
            duration: 240,
            ease: 'Back.In',
            onComplete: () => {
                entry.card.destroy();
                entry.label.destroy();
            }
        });
    }
}
