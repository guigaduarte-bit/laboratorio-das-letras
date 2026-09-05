import { Scene } from 'phaser';
import { DEFAULT_LEVEL_ID } from '../content/levels';
import { EventBus } from '../EventBus';
import { drawForestLabBackground } from '../visuals/ForestLabArt';

type StartGameEvent = {
    levelId?: string;
};

export class MenuScene extends Scene
{
    constructor()
    {
        super('MenuScene');
    }

    create(): void
    {
        if (this.registry.get('game-mode') === 'runner')
        {
            this.scene.start('RunnerScene');
            return;
        }
        drawForestLabBackground(this, { menu: true });
        EventBus.on('start-game', this.handleStart);
        EventBus.on('request-menu-ready', this.handleReadyRequest);
        this.events.once('shutdown', this.cleanup, this);
        EventBus.emit('menu-ready');
    }

    private readonly handleStart = ({ levelId }: StartGameEvent = {}): void =>
    {
        EventBus.off('start-game', this.handleStart);
        EventBus.off('request-menu-ready', this.handleReadyRequest);
        this.scene.start('LevelScene', { levelId: levelId ?? DEFAULT_LEVEL_ID });
    };

    private readonly handleReadyRequest = (): void =>
    {
        EventBus.emit('menu-ready');
    };

    private cleanup(): void
    {
        EventBus.off('start-game', this.handleStart);
        EventBus.off('request-menu-ready', this.handleReadyRequest);
    }
}
