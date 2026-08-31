import type { Physics, Scene } from 'phaser';
import { Input } from 'phaser';
import { EventBus } from '../EventBus';

type MovementKeys = {
    left: Input.Keyboard.Key;
    right: Input.Keyboard.Key;
    jump: Input.Keyboard.Key;
    jumpAlt: Input.Keyboard.Key;
};

type CursorKeys = {
    left: Input.Keyboard.Key;
    right: Input.Keyboard.Key;
    up: Input.Keyboard.Key;
    down: Input.Keyboard.Key;
    space: Input.Keyboard.Key;
    shift: Input.Keyboard.Key;
};

export class PlayerController
{
    private readonly body: Physics.Arcade.Body;
    private readonly cursors?: CursorKeys;
    private readonly keys?: MovementKeys;
    private touchLeft = false;
    private touchRight = false;
    private touchJumpQueued = false;
    private enabled = true;

    constructor(
        private readonly scene: Scene,
        private readonly player: Physics.Arcade.Sprite
    )
    {
        this.body = player.body as Physics.Arcade.Body;

        if (scene.input.keyboard)
        {
            this.cursors = scene.input.keyboard.createCursorKeys() as CursorKeys;
            this.keys = scene.input.keyboard.addKeys({
                left: Input.Keyboard.KeyCodes.A,
                right: Input.Keyboard.KeyCodes.D,
                jump: Input.Keyboard.KeyCodes.W,
                jumpAlt: Input.Keyboard.KeyCodes.SPACE
            }) as MovementKeys;
        }

        EventBus.on('control-left', this.handleTouchLeft);
        EventBus.on('control-right', this.handleTouchRight);
        EventBus.on('control-jump', this.handleTouchJump);
    }

    update(): void
    {
        if (!this.enabled)
        {
            this.player.setVelocityX(0);
            return;
        }

        const movingLeft = this.touchLeft || this.cursors?.left.isDown || this.keys?.left.isDown;
        const movingRight = this.touchRight || this.cursors?.right.isDown || this.keys?.right.isDown;

        if (movingLeft === movingRight)
        {
            this.player.setVelocityX(0);
        }
        else
        {
            this.player.setVelocityX(movingLeft ? -260 : 260);
        }

        const keyboardJump = Boolean(
            (this.cursors?.up && Input.Keyboard.JustDown(this.cursors.up)) ||
            (this.keys?.jump && Input.Keyboard.JustDown(this.keys.jump)) ||
            (this.keys?.jumpAlt && Input.Keyboard.JustDown(this.keys.jumpAlt))
        );
        const wantsToJump = this.touchJumpQueued || keyboardJump;
        const isGrounded = this.body.blocked.down || this.body.touching.down;

        if (wantsToJump && isGrounded)
        {
            this.player.setVelocityY(-575);
        }

        this.touchJumpQueued = false;
    }

    setEnabled(enabled: boolean): void
    {
        this.enabled = enabled;
        this.touchLeft = false;
        this.touchRight = false;
    }

    destroy(): void
    {
        EventBus.off('control-left', this.handleTouchLeft);
        EventBus.off('control-right', this.handleTouchRight);
        EventBus.off('control-jump', this.handleTouchJump);
    }

    private readonly handleTouchLeft = (isPressed: boolean): void =>
    {
        this.touchLeft = isPressed;
    };

    private readonly handleTouchRight = (isPressed: boolean): void =>
    {
        this.touchRight = isPressed;
    };

    private readonly handleTouchJump = (): void =>
    {
        this.touchJumpQueued = true;
    };
}
