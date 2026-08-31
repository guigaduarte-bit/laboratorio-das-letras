import { Display, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MenuScene extends Scene
{
    constructor()
    {
        super('MenuScene');
    }

    create(): void
    {
        this.drawGradient(0x7ec8d9, 0xdff2dc);
        EventBus.on('start-game', this.handleStart);
        EventBus.on('request-menu-ready', this.handleReadyRequest);
        this.events.once('shutdown', this.cleanup, this);
        EventBus.emit('menu-ready');
    }

    private readonly handleStart = (): void =>
    {
        EventBus.off('start-game', this.handleStart);
        EventBus.off('request-menu-ready', this.handleReadyRequest);
        this.scene.start('LevelSapoScene');
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

    private drawGradient(topColor: number, bottomColor: number): void
    {
        const bands = 24;
        const top = Display.Color.IntegerToColor(topColor);
        const bottom = Display.Color.IntegerToColor(bottomColor);

        for (let index = 0; index < bands; index += 1)
        {
            const color = Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, index);
            this.add.rectangle(
                480,
                (540 / bands) * index + 540 / bands / 2,
                960,
                540 / bands + 1,
                Display.Color.GetColor(color.r, color.g, color.b)
            );
        }
    }
}
