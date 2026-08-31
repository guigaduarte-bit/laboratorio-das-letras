import { Howl, Howler } from 'howler';
import { EventBus } from '../game/EventBus';

type Letter = 'S' | 'A' | 'P' | 'O';

type AudioQueueItem = {
    before?: () => void;
    sound: Howl;
    after?: () => void;
};

const AUDIO_ROOT = '/assets/audio';
const AUDIO_LOAD_TIMEOUT_MS = 6000;
const AUDIO_UNLOCK_TIMEOUT_MS = 2000;
const MIN_PLAYBACK_TIMEOUT_MS = 1800;

const createSound = (path: string, volume: number): Howl => new Howl({
    src: [`${AUDIO_ROOT}/${path}`],
    preload: true,
    volume
});

class GameAudio
{
    private readonly instructions = {
        findS: createSound('voice/instructions/encontre-s.mp3', 0.88),
        formSapo: createSound('voice/instructions/forme-sapo.mp3', 0.88)
    };

    private readonly letters: Record<Letter, Howl> = {
        S: createSound('voice/letters/s.mp3', 0.92),
        A: createSound('voice/letters/a.mp3', 0.92),
        P: createSound('voice/letters/p.mp3', 0.92),
        O: createSound('voice/letters/o.mp3', 0.92)
    };

    private readonly wordSapo = createSound('voice/words/sapo.mp3', 0.94);

    private readonly sfx = {
        collect: createSound('sfx/collect.mp3', 0.45),
        correct: createSound('sfx/correct.mp3', 0.3),
        hint: createSound('sfx/hint.mp3', 0.36),
        complete: createSound('sfx/complete.mp3', 0.42)
    };

    private readonly music = new Howl({
        src: [`${AUDIO_ROOT}/music/forest-loop.mp3`],
        loop: true,
        preload: true,
        volume: 0.13
    });

    private unlocked = false;
    private unlockAttempt?: Promise<boolean>;
    private audioQueue: AudioQueueItem[] = [];
    private cancelActiveAudio?: () => void;
    private queueRunning = false;

    unlock(): Promise<boolean>
    {
        if (this.unlocked)
        {
            return Promise.resolve(true);
        }

        if (this.unlockAttempt)
        {
            return this.unlockAttempt;
        }

        Howler.autoUnlock = true;
        const attempt = this.confirmAudioUnlock();

        this.unlockAttempt = attempt.then((confirmed) => {
            if (confirmed)
            {
                this.unlocked = true;
            }

            return confirmed;
        }).catch(() => false).finally(() => {
            this.unlockAttempt = undefined;
        });

        return this.unlockAttempt;
    }

    private async confirmAudioUnlock(): Promise<boolean>
    {
        if (Howler.noAudio)
        {
            return false;
        }

        if (!Howler.usingWebAudio)
        {
            return false;
        }

        const context = Howler.ctx;
        if (context.state === 'running')
        {
            return true;
        }

        if (context.state === 'closed')
        {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            let settled = false;
            const finish = (confirmed: boolean): void =>
            {
                if (settled)
                {
                    return;
                }

                settled = true;
                clearTimeout(timeout);
                resolve(confirmed);
            };
            const timeout = setTimeout(() => finish(false), AUDIO_UNLOCK_TIMEOUT_MS);

            void context.resume().then(
                () => finish(Howler.ctx.state === 'running'),
                () => finish(false)
            );
        });
    }

    startLevel(): void
    {
        if (!this.unlocked)
        {
            return;
        }

        if (!this.music.playing())
        {
            this.music.volume(0.13);
            this.music.play();
        }

        this.replaceAudioQueue([
            { sound: this.instructions.formSapo },
            { sound: this.instructions.findS }
        ]);
    }

    playLetter(letter: string): void
    {
        if (!this.unlocked || !this.isLetter(letter))
        {
            return;
        }

        this.replaceAudioQueue([
            { sound: this.letters[letter] },
            { sound: this.sfx.collect }
        ]);
    }

    playHint(expected: string): void
    {
        if (!this.unlocked)
        {
            return;
        }

        this.sfx.hint.play();

        if (expected === 'S' && !this.queueRunning)
        {
            this.enqueueAudio({ sound: this.instructions.findS });
        }
    }

    completeWord(word: string): void
    {
        if (!this.unlocked)
        {
            queueMicrotask(() => EventBus.emit('word-audio-completed', { word }));
            return;
        }

        this.enqueueAudio({
            sound: this.wordSapo,
            before: () => {
                if (this.music.playing())
                {
                    this.music.fade(this.music.volume(), 0.04, 450);
                }
            }
        });
        this.enqueueAudio({
            sound: this.sfx.complete,
            after: () => {
                EventBus.emit('word-audio-completed', { word });
            }
        });
    }

    finishCelebration(): void
    {
        this.clearAudioQueue();
    }

    stopAll(): void
    {
        this.clearAudioQueue();
        this.music.stop();
        Howler.stop();
    }

    private isLetter(letter: string): letter is Letter
    {
        return letter === 'S' || letter === 'A' || letter === 'P' || letter === 'O';
    }

    private replaceAudioQueue(items: AudioQueueItem[]): void
    {
        this.clearAudioQueue();
        this.audioQueue = [...items];
        this.playNextAudio();
    }

    private enqueueAudio(item: AudioQueueItem): void
    {
        this.audioQueue.push(item);
        this.playNextAudio();
    }

    private clearAudioQueue(): void
    {
        this.cancelActiveAudio?.();
        this.cancelActiveAudio = undefined;
        this.audioQueue = [];
        this.queueRunning = false;
    }

    private playNextAudio(): void
    {
        if (this.queueRunning)
        {
            return;
        }

        const next = this.audioQueue.shift();
        if (!next)
        {
            return;
        }

        this.queueRunning = true;
        let finished = false;
        let cancelled = false;
        let soundId: number | undefined;
        let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

        const clearFallback = (): void =>
        {
            if (fallbackTimer)
            {
                clearTimeout(fallbackTimer);
                fallbackTimer = undefined;
            }
        };

        const handleLoad = (): void => startPlayback();
        const handleLoadError = (): void => finish();
        const handleEnd = (): void => finish();
        const handlePlayError = (): void => finish(true);

        const removeListeners = (): void =>
        {
            next.sound.off('load', handleLoad);
            next.sound.off('loaderror', handleLoadError);

            if (soundId !== undefined)
            {
                next.sound.off('end', handleEnd, soundId);
                next.sound.off('playerror', handlePlayError, soundId);
            }
        };

        const finish = (stopSound = false): void =>
        {
            if (finished || cancelled)
            {
                return;
            }

            finished = true;
            clearFallback();
            removeListeners();

            if (stopSound)
            {
                soundId === undefined
                    ? next.sound.stop()
                    : next.sound.stop(soundId);
            }

            this.cancelActiveAudio = undefined;
            this.queueRunning = false;
            next.after?.();
            this.playNextAudio();
        };

        const startPlayback = (): void =>
        {
            if (finished || cancelled)
            {
                return;
            }

            clearFallback();
            next.sound.off('load', handleLoad);
            next.sound.off('loaderror', handleLoadError);
            next.before?.();

            soundId = next.sound.play();
            next.sound.once('end', handleEnd, soundId);
            next.sound.once('playerror', handlePlayError, soundId);

            const durationMs = Math.max(
                MIN_PLAYBACK_TIMEOUT_MS,
                next.sound.duration() * 1000 + 900
            );
            fallbackTimer = setTimeout(() => finish(true), durationMs);
        };

        this.cancelActiveAudio = (): void =>
        {
            if (finished || cancelled)
            {
                return;
            }

            cancelled = true;
            clearFallback();
            removeListeners();
            soundId === undefined
                ? next.sound.stop()
                : next.sound.stop(soundId);
        };

        if (next.sound.state() === 'loaded')
        {
            startPlayback();
            return;
        }

        next.sound.once('load', handleLoad);
        next.sound.once('loaderror', handleLoadError);
        fallbackTimer = setTimeout(() => finish(true), AUDIO_LOAD_TIMEOUT_MS);

        if (next.sound.state() === 'unloaded')
        {
            next.sound.load();
        }
    }
}

export const gameAudio = new GameAudio();
