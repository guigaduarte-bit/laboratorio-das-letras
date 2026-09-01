import { Scene } from 'phaser';
import {
    getInitialWordDisplay,
    getLevelById,
    type LevelDefinition
} from '../content/levels';
import { EventBus } from '../EventBus';
import { LetterCollector } from '../systems/LetterCollector';
import { PlayerController } from '../systems/PlayerController';
import { WordProgress } from '../systems/WordProgress';
import { drawForestLabBackground, drawPlatformVisual } from '../visuals/ForestLabArt';
import { PlayerAvatar } from '../visuals/PlayerAvatar';

type LevelSceneData = {
    levelId?: string;
};

type WordCompletedEvent = {
    word: string;
};

type LetterCollectedEvent = {
    letter: string;
    word: string;
};

export class LevelScene extends Scene
{
    private level: LevelDefinition = getLevelById();
    private player!: Phaser.Physics.Arcade.Sprite;
    private playerAvatar!: PlayerAvatar;
    private playerController!: PlayerController;
    private letterCollector!: LetterCollector;
    private celebrationTimer?: Phaser.Time.TimerEvent;
    private completed = false;

    constructor()
    {
        super('LevelScene');
    }

    init(data: LevelSceneData): void
    {
        this.level = getLevelById(data.levelId);
        this.completed = false;
        this.celebrationTimer = undefined;
    }

    create(): void
    {
        drawForestLabBackground(this);

        const platforms = this.physics.add.staticGroup();
        this.level.platforms.forEach((placement, index) => {
            const isGround = index === 0;
            const texture = isGround ? 'ground-hitbox' : 'platform-hitbox';
            const platform = platforms.create(
                placement.x,
                placement.y,
                texture
            ) as Phaser.Physics.Arcade.Image;
            platform
                .setDisplaySize(placement.width, placement.height)
                .setVisible(false)
                .refreshBody();
            drawPlatformVisual(this, placement, isGround);
        });

        this.player = this.physics.add.sprite(
            this.level.playerStart.x,
            this.level.playerStart.y,
            'player-hitbox'
        )
            .setVisible(false)
            .setCollideWorldBounds(true);

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setSize(38, 54);
        playerBody.setMaxVelocity(280, 700);

        this.physics.add.collider(this.player, platforms);
        this.playerAvatar = new PlayerAvatar(
            this,
            this.level.playerStart.x,
            this.level.playerStart.y
        );

        const progress = new WordProgress(this.level.word);
        this.letterCollector = new LetterCollector(
            this,
            this.player,
            this.level.letters,
            progress
        );
        this.playerController = new PlayerController(this, this.player, this.playerAvatar);

        EventBus.on('letter-collected', this.handleLetterCollected);
        EventBus.on('word-completed', this.handleWordCompleted);
        EventBus.on('word-audio-completed', this.handleWordAudioCompleted);
        this.events.once('shutdown', this.cleanup, this);
        EventBus.emit('level-started', {
            levelId: this.level.id,
            word: this.level.word,
            displayName: this.level.displayName,
            display: getInitialWordDisplay(this.level.word)
        });
    }

    update(): void
    {
        this.playerController.update();
    }

    private readonly handleWordCompleted = ({ word }: WordCompletedEvent): void =>
    {
        if (this.completed || word !== this.level.word)
        {
            return;
        }

        this.completed = true;
        this.playerController.setEnabled(false);
        this.playerAvatar.playCelebrate();
        this.celebrationTimer = this.time.delayedCall(
            4200,
            () => this.startCelebration()
        );
    };

    private readonly handleLetterCollected = ({ word }: LetterCollectedEvent): void =>
    {
        if (!this.completed && word === this.level.word)
        {
            this.playerAvatar.playCollect();
        }
    };

    private readonly handleWordAudioCompleted = ({ word }: WordCompletedEvent): void =>
    {
        if (this.completed && word === this.level.word)
        {
            this.startCelebration();
        }
    };

    private startCelebration(): void
    {
        this.celebrationTimer?.remove(false);
        this.celebrationTimer = undefined;
        this.scene.start('CelebrationScene', { levelId: this.level.id });
    }

    private cleanup(): void
    {
        EventBus.off('word-completed', this.handleWordCompleted);
        EventBus.off('letter-collected', this.handleLetterCollected);
        EventBus.off('word-audio-completed', this.handleWordAudioCompleted);
        this.playerController?.destroy();
        this.letterCollector?.destroy();
        this.playerAvatar?.destroy();
    }
}
