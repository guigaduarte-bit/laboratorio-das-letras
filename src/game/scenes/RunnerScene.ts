import { GameObjects, Geom, Input, Scene } from 'phaser';
import { getLevelById, type LevelDefinition } from '../content/levels';
import { lanePosition, makeRunnerChoices, type RunnerPhase, type RunnerSnapshot } from '../content/runner';
import { EventBus } from '../EventBus';
import { WordProgress } from '../systems/WordProgress';
import { PlayerAvatar } from '../visuals/PlayerAvatar';
import { RunnerWorld } from '../visuals/RunnerWorld';
import { ART_COLORS as C, PHASER_FONT } from '../visuals/palette';

type Gate = { root: GameObjects.Container; panel: GameObjects.Graphics; text: GameObjects.Text };

export class RunnerScene extends Scene
{
    private level: LevelDefinition = getLevelById();
    private progress!: WordProgress;
    private world!: RunnerWorld;
    private avatar!: PlayerAvatar;
    private gates: Gate[] = [];
    private phase: RunnerPhase = 'ready';
    private count = 0;
    private choices: string[] = [];
    private selectedLane = 0;
    private playerLane = 0;
    private distance = 0;
    private elapsed = 0;
    private paused = false;
    private hinted = false;
    private reduced = false;
    private pointerStart?: { x: number; y: number; id: number; gateIndex: number };

    constructor() { super('RunnerScene'); }

    create(): void
    {
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.world = new RunnerWorld(this);
        this.scale.on('resize', this.resizeViewport);
        this.resizeViewport();
        this.avatar = new PlayerAvatar(this, 0, 0);
        this.reset();
        EventBus.on('runner-start', this.startRun);
        EventBus.on('runner-state-request', this.publish);
        EventBus.on('runner-choose', this.choose);
        EventBus.on('runner-move', this.moveLane);
        EventBus.on('runner-advance', this.advance);
        EventBus.on('runner-hint', this.showHint);
        EventBus.on('runner-pause', this.setPaused);
        EventBus.on('runner-home', this.reset);
        this.input.keyboard?.on('keydown', this.handleKey);
        this.input.on('pointerdown', this.pointerDown);
        this.input.on('pointerup', this.pointerUp);
        this.input.on('pointerupoutside', this.pointerCancel);
        this.events.once('shutdown', this.cleanup, this);
        EventBus.emit('runner-ready');
        this.publish();
    }

    private readonly reset = (): void =>
    {
        this.phase = 'ready'; this.count = 0; this.elapsed = 0; this.distance = 0;
        this.pointerStart = undefined;
        this.paused = false; this.hinted = false; this.playerLane = 0; this.selectedLane = 0;
        this.tweens.resumeAll();
        this.level = getLevelById();
        this.progress = new WordProgress(this.level.word);
        this.avatar?.destroy();
        this.avatar = new PlayerAvatar(this, 0, 0);
        this.createChoices();
        this.publish();
    };

    private readonly startRun = (): void =>
    {
        if (this.phase !== 'ready' && this.phase !== 'celebrate') return;
        this.reset();
        this.phase = 'travel';
        EventBus.emit('level-started', {
            levelId: this.level.id, word: this.level.word, display: this.level.word[0] + ' _ _ _'
        });
        this.publish();
    };

    private createChoices(): void
    {
        this.gates.forEach(({ root }) => root.destroy(true));
        this.gates = [];
        this.choices = makeRunnerChoices(this.level, this.count);
        this.selectedLane = 0;
        this.hinted = false;
        this.choices.forEach((letter) => {
            const panel = this.add.graphics();
            const text = this.add.text(0, -56, letter, {
                fontFamily: PHASER_FONT, fontSize: '55px', fontStyle: 'bold', color: '#26383a'
            }).setOrigin(0.5);
            const root = this.add.container(0, 0, [panel, text]).setDepth(25);
            root.setSize(106, 130);
            // Phaser soma displayOrigin ao testar o toque em um Container.
            // Compensar a origem mantém a área de toque sobre o cartão desenhado.
            root.setInteractive(new Geom.Rectangle(root.displayOriginX - 55, root.displayOriginY - 112, 110, 130), Geom.Rectangle.Contains);
            this.gates.push({ root, panel, text });
        });
    }

    private readonly choose = (index: number): void =>
    {
        if (this.paused || this.phase !== 'choose' || !Number.isInteger(index) || !this.choices[index]) return;
        this.selectedLane = index;
        // Uma intenção inicia um avanço. A letra só é avaliada quando o personagem chega.
        this.phase = 'approach'; this.elapsed = 0; this.pointerStart = undefined;
        this.publish();
    };

    private readonly moveLane = (direction: number): void =>
    {
        if (this.paused || this.phase !== 'choose' || (direction !== -1 && direction !== 1)) return;
        this.selectedLane = Math.max(0, Math.min(this.choices.length - 1, this.selectedLane + direction));
        this.publish();
    };

    private readonly advance = (): void => this.choose(this.selectedLane);

    private resolveChoice(): void
    {
        const found = this.choices[this.selectedLane];
        if (found !== this.progress.expectedLetter)
        {
            this.hinted = true; this.phase = 'retry'; this.elapsed = 0;
            EventBus.emit('letter-mismatch', { expected: this.progress.expectedLetter, found });
            this.publish();
            return;
        }
        // O bloqueio acontece antes de emitir os eventos: toques repetidos não duplicam coleta.
        this.phase = 'collect'; this.elapsed = 0;
        const result = this.progress.tryCollect(found);
        if (result.accepted)
        {
            this.count += 1;
            if (!this.reduced) this.avatar.playCollect();
        }
        this.publish();
    }

    private readonly showHint = (): void =>
    {
        if (this.paused || this.phase !== 'choose' || this.hinted) return;
        this.hinted = true;
        EventBus.emit('runner-hint-used', { expected: this.progress.expectedLetter });
        this.publish();
    };

    private readonly setPaused = (paused: boolean): void =>
    {
        this.paused = paused;
        this.pointerStart = undefined;
        if (paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
        this.publish();
    };

    private readonly handleKey = (event: KeyboardEvent): void =>
    {
        if (this.paused || this.phase === 'ready' || this.phase === 'celebrate'
            || event.altKey || event.ctrlKey || event.metaKey) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('input, select, textarea, dialog, a, [contenteditable]:not([contenteditable="false"])')) return;
        // Setas continuam funcionando após clicar em Dica, som ou outro botão.
        // Espaço/Enter preservam a ativação nativa do botão que estiver em foco.
        if ((event.code === 'Space' || event.key === 'Enter') && target?.closest('button')) return;
        const left = ['ArrowLeft', 'a', 'A'].includes(event.key);
        const right = ['ArrowRight', 'd', 'D'].includes(event.key);
        const forward = ['ArrowUp', 'w', 'W', 'Enter'].includes(event.key) || event.code === 'Space';
        if (left || right || forward || event.key === 'ArrowDown')
        {
            event.preventDefault();
            if (event.repeat || this.phase !== 'choose') return;
            if (left || right) this.moveLane(left ? -1 : 1);
            else if (forward) this.advance();
        }
    };

    private readonly pointerDown = (pointer: Input.Pointer, objects: GameObjects.GameObject[]): void =>
    {
        if (this.paused || this.phase !== 'choose' || this.pointerStart) return;
        this.pointerStart = {
            x: pointer.x, y: pointer.y, id: pointer.id,
            gateIndex: this.gates.findIndex(({ root }) => objects.includes(root))
        };
    };

    private readonly pointerUp = (pointer: Input.Pointer, objects: GameObjects.GameObject[]): void =>
    {
        const start = this.pointerStart;
        if (!start || start.id !== pointer.id) return;
        this.pointerStart = undefined;
        if (this.phase !== 'choose' || this.paused) return;
        const dx = pointer.x - start.x, dy = pointer.y - start.y;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy))
        {
            this.moveLane(Math.sign(dx));
        }
        else if (dy < -40 && Math.abs(dy) > Math.abs(dx)) this.advance();
        else if (Math.hypot(dx, dy) < 18 && start.gateIndex >= 0
            && objects.includes(this.gates[start.gateIndex]?.root)) this.choose(start.gateIndex);
    };

    private readonly pointerCancel = (pointer: Input.Pointer): void =>
    {
        if (this.pointerStart?.id === pointer.id) this.pointerStart = undefined;
    };

    private readonly resizeViewport = (): void =>
    {
        // A câmera acompanha o canvas mesmo se o tamanho anterior veio do menu.
        this.cameras.resize(this.scale.width, this.scale.height);
        this.world.resize();
    };

    update(_time: number, delta: number): void
    {
        if (!this.world) return;
        const dt = this.paused ? 0 : Math.min(delta, 50);
        this.elapsed += dt;
        const moving = ['travel', 'approach', 'retry', 'collect', 'finish'].includes(this.phase) && !this.paused;
        if (['travel', 'finish'].includes(this.phase) && !this.paused) this.distance += dt / 2600;
        if (this.phase === 'travel' && this.elapsed >= 2700)
        {
            this.phase = 'choose'; this.elapsed = 0; this.publish();
        }
        else if (this.phase === 'approach' && this.elapsed >= 650) this.resolveChoice();
        else if (this.phase === 'retry' && this.elapsed >= 500)
        {
            this.phase = 'choose'; this.elapsed = 0; this.publish();
        }
        else if (this.phase === 'collect' && this.elapsed >= 1300)
        {
            this.elapsed = 0;
            if (this.count === this.level.word.length)
            {
                this.phase = 'finish';
                this.gates.forEach(({ root }) => root.setVisible(false));
            }
            else
            {
                this.phase = 'travel'; this.createChoices();
            }
            this.publish();
        }
        else if (this.phase === 'finish' && this.elapsed >= 3300)
        {
            this.phase = 'celebrate'; this.elapsed = 0;
            if (!this.reduced) this.avatar.playCelebrate();
            EventBus.emit('celebration-ready', { levelId: this.level.id, word: this.level.word });
            this.publish();
        }
        const lane = ['choose', 'approach', 'retry', 'collect'].includes(this.phase)
            ? lanePosition(this.selectedLane, this.choices.length) : 0;
        if (!this.paused) this.playerLane += (lane - this.playerLane) * (this.reduced ? 1 : Math.min(1, dt/150));
        // Inicializa as dimensões antes de calcular a posição do personagem.
        this.world.resize();
        const approach = this.phase === 'approach' ? Math.min(1, this.elapsed/650)
            : this.phase === 'retry' || this.phase === 'collect' ? 1 - Math.min(1, this.elapsed/500) : 0;
        const p = this.world.project(this.playerLane, 0.16 + approach * 0.17);
        const playerScale = Math.min(1.4, Math.max(0.82, this.scale.width/740)) * (1 - approach * 0.16);
        const py = p.y - 35 * playerScale;
        const finish = this.phase === 'celebrate' ? 1 : this.phase === 'finish' ? Math.min(1, this.elapsed/3300) : 0;
        this.world.render(this.distance, this.count, p.x, py, this.reduced, finish);
        this.avatar.syncPosition(p.x, py);
        this.avatar.setRunnerPose(moving, playerScale, this.reduced);
        this.drawGates();
    }

    private drawGates(): void
    {
        if (this.phase === 'finish' || this.phase === 'celebrate') return;
        const depth = this.phase === 'travel' ? 0.76 - Math.min(1, this.elapsed/2700)*0.43
            : this.phase === 'ready' ? 0.27 : 0.33;
        const spacing = Math.abs(this.world.project(lanePosition(1, this.choices.length), 0.33).x
            - this.world.project(lanePosition(0, this.choices.length), 0.33).x);
        // Preserva um espaço entre as áreas de toque, inclusive em telas estreitas.
        const base = Math.min(1.22, Math.max(0.52, this.scale.width / 860), spacing / 118);
        this.gates.forEach(({ root, panel }, index) => {
            const p = this.world.project(lanePosition(index, this.choices.length), depth);
            const scale = base * (this.phase === 'travel' ? 0.48 + 0.52 * Math.min(1, this.elapsed/2700) : 1);
            const collected = this.phase === 'collect' && index === this.selectedLane;
            const t = collected ? Math.min(1, this.elapsed/950) : 0;
            root.setPosition(p.x, p.y - (this.reduced ? 0 : t*55)).setScale(scale).setAlpha(1-t).setVisible(true);
            panel.clear();
            panel.fillStyle(C.ink, 0.12);
            panel.fillEllipse(0, 10, 111, 24);
            panel.fillStyle(C.ochre, 1);
            panel.fillRoundedRect(-49, -98, 98, 104, 21);
            panel.fillStyle(C.sand, 1);
            panel.fillRoundedRect(-49, -106, 98, 102, 20);
            const cue = this.hinted && this.choices[index] === this.progress.expectedLetter;
            panel.lineStyle(cue ? 5 : 2.5, cue ? C.deepMoss : C.oat, 1);
            panel.strokeRoundedRect(-49, -106, 98, 102, 20);
            if (this.phase === 'choose' && index === this.selectedLane)
            {
                panel.lineStyle(4, C.deepMoss, 0.65);
                panel.strokeEllipse(0, 13, 84, 17);
            }
            if (cue)
            {
                panel.fillStyle(C.sun, 1);
                panel.fillCircle(38, -103, 12);
                panel.lineStyle(3, C.ink, 1);
                panel.lineBetween(33, -103, 37, -99);
                panel.lineBetween(37, -99, 43, -107);
            }
        });
    }

    private readonly publish = (): void =>
    {
        const state: RunnerSnapshot = {
            phase: this.phase, count: this.count, choices: [...this.choices],
            lane: this.selectedLane, hinted: this.hinted, paused: this.paused
        };
        EventBus.emit('runner-state', state);
    };

    private cleanup(): void
    {
        this.scale.off('resize', this.resizeViewport);
        EventBus.off('runner-start', this.startRun);
        EventBus.off('runner-state-request', this.publish);
        EventBus.off('runner-choose', this.choose);
        EventBus.off('runner-move', this.moveLane);
        EventBus.off('runner-advance', this.advance);
        EventBus.off('runner-hint', this.showHint);
        EventBus.off('runner-pause', this.setPaused);
        EventBus.off('runner-home', this.reset);
        this.input.keyboard?.off('keydown', this.handleKey);
        this.input.off('pointerdown', this.pointerDown);
        this.input.off('pointerup', this.pointerUp);
        this.input.off('pointerupoutside', this.pointerCancel);
        this.pointerStart = undefined;
        this.avatar?.destroy();
    }
}
