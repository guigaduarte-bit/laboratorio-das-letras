import { Display, Scene } from 'phaser';
import { LEVEL_SAPO } from '../content/levels';
import { EventBus } from '../EventBus';
import { LetterCollector } from '../systems/LetterCollector';
import { PlayerController } from '../systems/PlayerController';
import { WordProgress } from '../systems/WordProgress';

type WordCompletedEvent = {
    word: string;
};

export class LevelSapoScene extends Scene
{
    private player!: Phaser.Physics.Arcade.Sprite;
    private playerController!: PlayerController;
    private letterCollector!: LetterCollector;
    private celebrationTimer?: Phaser.Time.TimerEvent;
    private completed = false;

    constructor()
    {
        super('LevelSapoScene');
    }

    init(): void
    {
        this.completed = false;
        this.celebrationTimer = undefined;
    }

    create(): void
    {
        this.drawBackground();

        const platforms = this.physics.add.staticGroup();
        LEVEL_SAPO.platforms.forEach((placement, index) => {
            const texture = index === 0 ? 'ground' : 'platform';
            const platform = platforms.create(placement.x, placement.y, texture) as Phaser.Physics.Arcade.Image;
            platform
                .setDisplaySize(placement.width, placement.height)
                .refreshBody();
        });

        this.player = this.physics.add.sprite(
            LEVEL_SAPO.playerStart.x,
            LEVEL_SAPO.playerStart.y,
            'player'
        )
            .setCollideWorldBounds(true);

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setSize(38, 54);
        playerBody.setMaxVelocity(280, 700);

        this.physics.add.collider(this.player, platforms);

        const progress = new WordProgress(LEVEL_SAPO.word);
        this.letterCollector = new LetterCollector(
            this,
            this.player,
            LEVEL_SAPO.letters,
            progress
        );
        this.playerController = new PlayerController(this, this.player);

        EventBus.on('word-completed', this.handleWordCompleted);
        EventBus.on('word-audio-completed', this.handleWordAudioCompleted);
        this.events.once('shutdown', this.cleanup, this);
        EventBus.emit('level-started', { word: LEVEL_SAPO.word });
    }

    update(): void
    {
        this.playerController.update();
    }

    private readonly handleWordCompleted = ({ word }: WordCompletedEvent): void =>
    {
        if (this.completed)
        {
            return;
        }

        this.completed = true;
        this.playerController.setEnabled(false);
        this.celebrationTimer = this.time.delayedCall(
            4200,
            () => this.startCelebration(word)
        );
    };

    private readonly handleWordAudioCompleted = ({ word }: WordCompletedEvent): void =>
    {
        if (this.completed)
        {
            this.startCelebration(word);
        }
    };

    private startCelebration(word: string): void
    {
        this.celebrationTimer?.remove(false);
        this.celebrationTimer = undefined;
        this.scene.start('CelebrationScene', { word });
    }

    private cleanup(): void
    {
        EventBus.off('word-completed', this.handleWordCompleted);
        EventBus.off('word-audio-completed', this.handleWordAudioCompleted);
        this.playerController?.destroy();
        this.letterCollector?.destroy();
    }

    private drawBackground(): void
    {
        const bands = 24;
        const top = Display.Color.IntegerToColor(0x78c6d0);
        const bottom = Display.Color.IntegerToColor(0xe6f2c8);

        for (let index = 0; index < bands; index += 1)
        {
            const color = Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, index);
            this.add.rectangle(
                480,
                (480 / bands) * index + 480 / bands / 2,
                960,
                480 / bands + 1,
                Display.Color.GetColor(color.r, color.g, color.b)
            );
        }

        this.add.circle(850, 105, 48, 0xffe49a, 0.9);
        this.add.ellipse(155, 464, 300, 80, 0x8fbd6a, 0.72);
        this.add.ellipse(710, 470, 460, 100, 0x8fbd6a, 0.68);
    }
}
