import { getInitialWordDisplay, getSchoolLevel, type LevelDefinition } from '../content/levels';
import { lanePosition, makeRunnerChoices, type RunnerPhase, type RunnerSnapshot } from '../content/runner';
import { EventBus } from '../EventBus';
import { WordProgress } from './WordProgress';

export const RUNNER_TIMINGS = {
    travel: 2400,
    approach: 700,
    retry: 650,
    collect: 1000,
    finish: 2800
} as const;

/** Dados de animação consultados pelo renderizador; elapsed usa ms e distance usa segundos. */
export type RunnerFrame = {
    phase: RunnerPhase;
    elapsed: number;
    distance: number;
    lane: number;
    count: number;
    choices: string[];
    selectedLane: number;
    paused: boolean;
    hinted: boolean;
    levelId: string;
    word: string;
};

/** Regras da expedição, sem dependência de câmera, cena, canvas ou objetos visuais. */
export class RunnerController
{
    private level: LevelDefinition = getSchoolLevel();
    private progress = new WordProgress(this.level.word);
    private phase: RunnerPhase = 'ready';
    private count = 0;
    private choices: string[] = [];
    private selectedLane = 0;
    private playerLane = 0;
    private elapsed = 0;
    private distance = 0;
    private paused = false;
    private hinted = false;
    private destroyed = false;

    constructor()
    {
        EventBus.on('runner-start', this.startRun);
        EventBus.on('runner-state-request', this.publish);
        EventBus.on('runner-choose', this.choose);
        EventBus.on('runner-move', this.moveLane);
        EventBus.on('runner-advance', this.advance);
        EventBus.on('runner-hint', this.showHint);
        EventBus.on('runner-pause', this.setPaused);
        EventBus.on('runner-home', this.reset);
        this.reset();
    }

    get snapshot(): RunnerSnapshot
    {
        return {
            levelId: this.level.id, word: this.level.word,
            phase: this.phase, count: this.count, choices: [...this.choices],
            lane: this.selectedLane, hinted: this.hinted, paused: this.paused
        };
    }

    get frame(): RunnerFrame
    {
        return {
            levelId: this.level.id, word: this.level.word,
            phase: this.phase, elapsed: this.elapsed, distance: this.distance,
            lane: this.playerLane, count: this.count, choices: [...this.choices],
            selectedLane: this.selectedLane, paused: this.paused, hinted: this.hinted
        };
    }

    private initialize(levelId?: string): void
    {
        this.level = getSchoolLevel(levelId ?? this.level.id);
        this.progress = new WordProgress(this.level.word);
        this.phase = 'ready';
        this.count = 0;
        this.elapsed = 0;
        this.distance = 0;
        this.playerLane = 0;
        this.paused = false;
        this.createChoices();
    }

    private readonly reset = (levelId?: string): void =>
    {
        if (this.destroyed) return;
        this.initialize(levelId);
        this.publish();
    };

    private readonly startRun = (levelId?: string): void =>
    {
        if (this.destroyed || (this.phase !== 'ready' && this.phase !== 'celebrate')) return;
        this.initialize(levelId);
        this.phase = 'travel';
        EventBus.emit('level-started', {
            levelId: this.level.id, word: this.level.word, display: getInitialWordDisplay(this.level.word)
        });
        this.publish();
    };

    private createChoices(): void
    {
        this.choices = makeRunnerChoices(this.level, this.count);
        this.selectedLane = 0;
        this.hinted = false;
    }

    private readonly choose = (index: number): void =>
    {
        if (this.destroyed || this.paused || this.phase !== 'choose'
            || !Number.isInteger(index) || !this.choices[index]) return;
        this.selectedLane = index;
        this.phase = 'approach';
        this.elapsed = 0;
        this.publish();
    };

    private readonly moveLane = (direction: number): void =>
    {
        if (this.destroyed || this.paused || this.phase !== 'choose'
            || (direction !== -1 && direction !== 1)) return;
        const lane = Math.max(0, Math.min(this.choices.length - 1, this.selectedLane + direction));
        if (lane === this.selectedLane) return;
        this.selectedLane = lane;
        this.publish();
    };

    private readonly advance = (): void => this.choose(this.selectedLane);

    private resolveChoice(): void
    {
        const found = this.choices[this.selectedLane];
        this.elapsed = 0;
        if (found !== this.progress.expectedLetter)
        {
            this.hinted = true;
            this.phase = 'retry';
            EventBus.emit('letter-mismatch', { expected: this.progress.expectedLetter, found });
        }
        else
        {
            // Bloqueia a entrada antes dos eventos síncronos, inclusive no último acerto.
            this.phase = 'collect';
            this.count += 1;
            this.progress.tryCollect(found);
        }
        this.publish();
    }

    private readonly showHint = (): void =>
    {
        if (this.destroyed || this.paused || this.phase !== 'choose' || this.hinted) return;
        this.hinted = true;
        EventBus.emit('runner-hint-used', { expected: this.progress.expectedLetter });
        this.publish();
    };

    private readonly setPaused = (paused: boolean): void =>
    {
        if (this.destroyed || typeof paused !== 'boolean' || paused === this.paused) return;
        this.paused = paused;
        this.publish();
    };

    update(deltaMs: number): void
    {
        if (this.destroyed || this.paused || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
        // Voltar de outra aba não pode saltar a aproximação ou a celebração.
        const dt = Math.min(deltaMs, 50);
        this.elapsed += dt;
        if (this.phase === 'travel' || this.phase === 'finish') this.distance += dt / 1000;

        if (this.phase === 'travel' && this.elapsed >= RUNNER_TIMINGS.travel)
        {
            this.phase = 'choose';
            this.elapsed = 0;
            this.publish();
        }
        else if (this.phase === 'approach' && this.elapsed >= RUNNER_TIMINGS.approach) this.resolveChoice();
        else if (this.phase === 'retry' && this.elapsed >= RUNNER_TIMINGS.retry)
        {
            this.phase = 'choose';
            this.elapsed = 0;
            this.publish();
        }
        else if (this.phase === 'collect' && this.elapsed >= RUNNER_TIMINGS.collect)
        {
            this.elapsed = 0;
            if (this.count === this.level.word.length) this.phase = 'finish';
            else
            {
                this.phase = 'travel';
                this.createChoices();
            }
            this.publish();
        }
        else if (this.phase === 'finish' && this.elapsed >= RUNNER_TIMINGS.finish)
        {
            this.phase = 'celebrate';
            this.elapsed = 0;
            EventBus.emit('celebration-ready', { levelId: this.level.id, word: this.level.word });
            this.publish();
        }

        const target = ['choose', 'approach', 'retry', 'collect'].includes(this.phase)
            ? lanePosition(this.selectedLane, this.choices.length) : 0;
        // Amortecimento exponencial mantém a troca de caminho suave em diferentes taxas de quadros.
        this.playerLane += (target - this.playerLane) * (1 - Math.exp(-dt / 140));
    }

    private readonly publish = (): void =>
    {
        if (!this.destroyed) EventBus.emit('runner-state', this.snapshot);
    };

    destroy(): void
    {
        if (this.destroyed) return;
        this.destroyed = true;
        EventBus.off('runner-start', this.startRun);
        EventBus.off('runner-state-request', this.publish);
        EventBus.off('runner-choose', this.choose);
        EventBus.off('runner-move', this.moveLane);
        EventBus.off('runner-advance', this.advance);
        EventBus.off('runner-hint', this.showHint);
        EventBus.off('runner-pause', this.setPaused);
        EventBus.off('runner-home', this.reset);
    }
}
