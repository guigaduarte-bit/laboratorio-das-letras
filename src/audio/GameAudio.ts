import { Howl, Howler } from 'howler';
import { EventBus } from '../game/EventBus';

type Letter = 'S' | 'A' | 'P' | 'O';

type AudioQueueItem = {
    sound: Howl;
    after?: () => void;
};

const AUDIO_ROOT = '/assets/audio';

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
    private audioQueue: AudioQueueItem[] = [];
    private activeSound?: Howl;
    private queueRunning = false;
    private fallbackTimer?: ReturnType<typeof setTimeout>;

    unlock(): void
    {
        Howler.autoUnlock = true;
        this.unlocked = true;

        if (Howler.ctx?.state === 'suspended')
        {
            void Howler.ctx.resume().catch(() => undefined);
        }
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
            EventBus.emit('word-audio-completed', { word });
            return;
        }

        if (this.music.playing())
        {
            this.music.fade(this.music.volume(), 0.04, 450);
        }

        this.enqueueAudio({ sound: this.wordSapo });
        this.enqueueAudio({
            sound: this.sfx.complete,
            after: () => {
                EventBus.emit('word-audio-completed', { word });
            }
        });
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
        if (this.fallbackTimer)
        {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = undefined;
        }

        this.activeSound?.stop();
        this.activeSound = undefined;
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
        this.activeSound = next.sound;
        let finished = false;

        const finish = (): void =>
        {
            if (finished)
            {
                return;
            }

            finished = true;
            next.sound.off('end', finish, soundId);
            next.sound.off('loaderror', finish, soundId);
            next.sound.off('playerror', finish, soundId);
            if (this.fallbackTimer)
            {
                clearTimeout(this.fallbackTimer);
                this.fallbackTimer = undefined;
            }

            next.after?.();
            this.activeSound = undefined;
            this.queueRunning = false;
            this.playNextAudio();
        };

        const soundId = next.sound.play();
        next.sound.once('end', finish, soundId);
        next.sound.once('loaderror', finish, soundId);
        next.sound.once('playerror', finish, soundId);

        const durationMs = Math.max(1800, next.sound.duration() * 1000 + 900);
        this.fallbackTimer = setTimeout(() => {
            if (next.sound.playing(soundId))
            {
                next.sound.stop(soundId);
            }
            finish();
        }, durationMs);
    }
}

export const gameAudio = new GameAudio();
