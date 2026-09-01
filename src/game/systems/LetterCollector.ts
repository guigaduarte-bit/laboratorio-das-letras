import type { Physics, Scene } from 'phaser';
import type { LetterDefinition } from '../content/levels';
import { EventBus } from '../EventBus';
import { LetterCardView } from '../visuals/LetterCardView';
import type { WordProgress } from './WordProgress';

type LetterCard = {
    card: Physics.Arcade.Image;
    view: LetterCardView;
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
        placements: LetterDefinition[],
        private readonly progress: WordProgress
    )
    {
        placements.forEach((placement) => {
            const card = scene.physics.add.staticImage(placement.x, placement.y, 'letter-hitbox')
                .setDisplaySize(70, 80)
                .setVisible(false)
                .refreshBody();
            card.setData('letter', placement.value);
            const view = new LetterCardView(
                scene,
                placement.x,
                placement.y,
                placement.value
            );

            const entry: LetterCard = {
                card,
                view,
                letter: placement.value,
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
        this.cards.forEach(({ card, view }) => {
            if (card.active)
            {
                card.destroy();
            }
            view.destroy();
        });
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
                entry.view.showMismatch();
                this.cards.find(({ card, letter }) => card.active && letter === expected)
                    ?.view.showExpectedHint();
            }
            return;
        }

        (entry.card.body as Physics.Arcade.StaticBody).enable = false;
        entry.card.destroy();
        entry.view.collect();
    }
}
