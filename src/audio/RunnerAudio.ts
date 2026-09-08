import { Howl, Howler } from 'howler';
import { humanVoice } from './HumanVoice';

/** Somente gravações fornecidas pelo responsável; sem síntese automática. */
export class RunnerAudio
{
    private enabled = true;
    private unlocked = false;
    private generation = 0;
    private timeout?: ReturnType<typeof setTimeout>;
    private current?: Howl;
    private readonly collect = new Howl({ src: ['/assets/audio/sfx/collect.mp3'], volume: 0.22 });
    private readonly hint = new Howl({ src: ['/assets/audio/sfx/hint.mp3'], volume: 0.16 });
    private readonly complete = new Howl({ src: ['/assets/audio/sfx/complete.mp3'], volume: 0.24 });

    hasVoice(letter?: string): boolean { return letter ? humanVoice.has(`letter-${letter}`) : humanVoice.count > 0; }
    hasWord(word: string): boolean { return humanVoice.has(`word-${word}`); }
    unlock(): void
    {
        this.unlocked = true;
        if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(() => undefined);
    }
    setEnabled(enabled: boolean): void { this.enabled = enabled; if (!enabled) this.stop(); }
    prompt(letter: string): void { this.say(['prompt', `letter-${letter}`]); }
    letter(letter: string): void { this.say([`letter-${letter}`]); }
    introduction(word: string): void { this.say([`word-${word}`]); }
    word(word: string): void { this.say([`word-${word}`, 'complete']); }
    collected(letter: string, final: boolean, word: string): void
    {
        if (this.enabled && this.unlocked) this.collect.play();
        this.say(final ? [`letter-${letter}`, `word-${word}`] : [`letter-${letter}`]);
    }
    help(letter: string): void
    {
        if (this.enabled && this.unlocked) this.hint.play();
        this.prompt(letter);
    }
    celebrate(): void { if (this.enabled && this.unlocked) this.complete.play(); }
    stop(): void
    {
        this.stopVoice();
        this.collect.stop(); this.hint.stop(); this.complete.stop();
    }
    private stopVoice(): void
    {
        this.generation += 1;
        clearTimeout(this.timeout);
        this.current?.unload(); this.current = undefined;
    }
    private say(ids: string[]): void
    {
        this.stopVoice();
        if (!this.enabled || !this.unlocked) return;
        const token = this.generation;
        if (ids[0] === 'prompt' && !humanVoice.has(ids[1])) return;
        const queue = ids.flatMap((id) => { const clip = humanVoice.get(id); return clip ? [clip] : []; });
        const next = () => {
            if (token !== this.generation) return;
            const clip = queue.shift();
            if (!clip) return;
            let finished = false;
            const finish = () => {
                if (finished || token !== this.generation) return;
                finished = true; clearTimeout(this.timeout);
                voice.unload(); this.current = undefined; next();
            };
            const voice = new Howl({
                src: [clip.src], format: [clip.format], volume: 0.85,
                onend: finish, onloaderror: finish, onplayerror: finish
            });
            this.current = voice;
            this.timeout = setTimeout(finish, 12000);
            voice.play();
        };
        next();
    }
}
export const runnerAudio = new RunnerAudio();
