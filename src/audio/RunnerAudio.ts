import { Howl, Howler } from 'howler';
import { humanVoice } from './HumanVoice';

export type AudioMix = { music: number; effects: number; voice: number };
export const DEFAULT_AUDIO_MIX: AudioMix = { music: 0.24, effects: 0.85, voice: 1 };
const MIX_KEY = 'laboratorio-das-letras:audio:v1';
type Speech = { ids: string[]; kind: 'prompt' | 'feedback' | 'introduction' | 'word' };

/** Música e efeitos originais; a fala usa exclusivamente gravações humanas. */
export class RunnerAudio
{
    private enabled = true;
    private unlocked = false;
    private active = false;
    private mix: AudioMix = { ...DEFAULT_AUDIO_MIX };
    private music?: Howl;
    private musicId?: number;
    private musicRunning = false;
    private musicFailed = false;
    private musicTarget = -1;
    private generation = 0;
    private timeout?: ReturnType<typeof setTimeout>;
    private delay?: ReturnType<typeof setTimeout>;
    private effectTimeout?: ReturnType<typeof setTimeout>;
    private current?: Howl;
    private speech?: Speech;
    private pending?: Speech;
    private speaking = false;
    private effectActive = false;
    private readonly effects = {
        collect: new Howl({ src: ['/assets/audio/expedition/collect-chime.mp3'], volume: 0 }),
        retry: new Howl({ src: ['/assets/audio/expedition/retry-cue.mp3'], volume: 0 }),
        complete: new Howl({ src: ['/assets/audio/expedition/discovery-fanfare.mp3'], volume: 0 })
    };

    hasVoice(letter?: string): boolean { return letter ? humanVoice.has(`letter-${letter}`) : humanVoice.count > 0; }
    hasWord(word: string): boolean { return humanVoice.has(`word-${word}`); }
    getMix(): AudioMix { return { ...this.mix }; }
    loadMix(): AudioMix
    {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(MIX_KEY) ?? 'null');
            if (saved && typeof saved === 'object') for (const key of ['music', 'effects', 'voice'] as const) {
                const value = (saved as Record<string, unknown>)[key];
                if (typeof value === 'number' && Number.isFinite(value)) this.mix[key] = Math.max(0, Math.min(1, value));
            }
        } catch { /* O jogo também funciona sem armazenamento local. */ }
        this.updateMix();
        return this.getMix();
    }
    setVolume(channel: keyof AudioMix, value: number): void
    {
        if (!Number.isFinite(value)) return;
        this.mix[channel] = Math.max(0, Math.min(1, value));
        try { localStorage.setItem(MIX_KEY, JSON.stringify(this.mix)); } catch { /* Preferência mantida em memória. */ }
        this.updateMix();
    }
    unlock(): void
    {
        this.unlocked = true; this.musicFailed = false;
        if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(() => undefined);
        this.startMusic();
    }
    setEnabled(enabled: boolean): void
    {
        this.enabled = enabled;
        if (!enabled) this.silence(); else this.startMusic();
    }
    setActive(active: boolean): void
    {
        this.active = active;
        if (active) this.startMusic(); else this.silence();
    }
    prompt(letter: string): void
    {
        if (!humanVoice.has(`letter-${letter}`)) return;
        const request: Speech = { ids: ['prompt', `letter-${letter}`], kind: 'prompt' };
        // Chegar às alternativas não corta a apresentação nem o reforço anterior.
        if (this.speech && this.speech.kind !== 'prompt') this.pending = request;
        else this.say(request);
    }
    letter(letter: string): void { this.say({ ids: [`letter-${letter}`], kind: 'prompt' }); }
    introduction(word: string): void
    {
        this.say({ ids: humanVoice.has(`word-${word}`) ? ['introduction', `word-${word}`] : [], kind: 'introduction' });
    }
    word(word: string): void { this.say({ ids: [`word-${word}`, 'complete'], kind: 'word' }); }
    collected(letter: string): void
    {
        this.playEffect('collect', 820);
        this.say({ ids: [`letter-${letter}`], kind: 'feedback' }, 210);
    }
    retry(letter: string): void
    {
        this.playEffect('retry', 600);
        this.say({ ids: ['retry', ...(humanVoice.has(`letter-${letter}`) ? ['prompt', `letter-${letter}`] : [])], kind: 'feedback' }, 240);
    }
    help(letter: string): void { this.prompt(letter); }
    celebrate(word: string): void
    {
        this.playEffect('complete', 2120);
        this.say({ ids: [`word-${word}`, 'complete'], kind: 'word' }, 650);
    }
    stop(): void
    {
        this.active = false; this.silence();
        this.music?.stop(); this.musicId = undefined;
    }
    private get audible(): boolean { return this.enabled && this.unlocked; }
    private startMusic(): void
    {
        if (!this.audible || !this.active || this.musicFailed || this.musicRunning) return;
        if (!this.music) {
            const music = new Howl({
                src: ['/assets/audio/expedition/adventure-loop.mp3'], loop: true, volume: 0,
                onplay: () => {
                    if (this.music !== music) return;
                    if (!this.audible || !this.active) { music.pause(); this.musicRunning = false; return; }
                    this.musicTarget = -1; this.updateMix();
                },
                onloaderror: () => {
                    if (this.music !== music) return;
                    this.musicFailed = true; this.musicRunning = false;
                    music.unload(); this.music = undefined; this.musicId = undefined;
                },
                onplayerror: () => {
                    if (this.music !== music) return;
                    // Uma nova interação poderá tentar novamente, sem plays acumulados.
                    this.musicFailed = true; this.musicRunning = false;
                    music.unload(); this.music = undefined; this.musicId = undefined;
                }
            });
            this.music = music;
        }
        this.musicRunning = true;
        this.musicId = this.music.play(this.musicId);
        this.musicTarget = -1; this.updateMix();
    }
    private silence(): void
    {
        this.stopVoice();
        clearTimeout(this.effectTimeout); this.effectActive = false;
        Object.values(this.effects).forEach((effect) => { effect.volume(0); effect.stop(); });
        this.musicRunning = false; this.musicTarget = -1;
        if (this.music?.state() === 'loaded') {
            this.music.volume(0); this.music.pause(this.musicId);
        } else if (this.music) {
            // Unload cancela um play ainda aguardando download/decodificação.
            this.music.unload(); this.music = undefined; this.musicId = undefined;
        }
    }
    private playEffect(name: keyof RunnerAudio['effects'], duration: number): void
    {
        // Feedback atrasado confunde a escolha: não enfileirar efeitos enquanto baixam.
        if (!this.audible || this.effects[name].state() !== 'loaded') return;
        Object.values(this.effects).forEach((effect) => effect.stop());
        clearTimeout(this.effectTimeout); this.effectActive = true;
        this.updateMix(); this.effects[name].play();
        this.effectTimeout = setTimeout(() => { this.effectActive = false; this.updateMix(); }, duration);
    }
    private updateMix(): void
    {
        this.current?.volume(this.mix.voice);
        const voiceFactor = this.speaking && this.mix.voice > 0 ? 0.45 : 1;
        this.effects.collect.volume(this.mix.effects * voiceFactor);
        this.effects.retry.volume(this.mix.effects * 0.65 * voiceFactor);
        this.effects.complete.volume(this.mix.effects * 0.85 * voiceFactor);
        const target = this.mix.music * (this.speaking && this.mix.voice > 0 ? 0.18 : this.effectActive && this.mix.effects > 0 ? 0.45 : 1);
        if (!this.musicRunning || !this.music || this.music.state() !== 'loaded' || target === this.musicTarget) return;
        this.musicTarget = target;
        const current = this.music.volume();
        this.music.fade(current, target, target < current ? 100 : 450);
    }
    private stopVoice(): void
    {
        this.generation += 1;
        clearTimeout(this.timeout); clearTimeout(this.delay);
        this.current?.unload(); this.current = undefined;
        this.speech = undefined; this.pending = undefined; this.speaking = false;
    }
    private say(request: Speech, wait = 0): void
    {
        this.stopVoice();
        if (!this.audible) return;
        const queue = request.ids.flatMap((id) => { const clip = humanVoice.get(id); return clip ? [clip] : []; });
        if (!queue.length) { this.updateMix(); return; }
        this.speech = request;
        const token = this.generation;
        const next = () => {
            if (token !== this.generation) return;
            const clip = queue.shift();
            if (!clip) {
                const pending = this.pending;
                this.speech = undefined; this.pending = undefined; this.speaking = false;
                if (pending) this.say(pending); else this.updateMix();
                return;
            }
            this.speaking = true; this.updateMix();
            let finished = false;
            const finish = () => {
                if (finished || token !== this.generation) return;
                finished = true; clearTimeout(this.timeout);
                voice.unload(); this.current = undefined; next();
            };
            const voice = new Howl({
                src: [clip.src], format: [clip.format], volume: this.mix.voice,
                onend: finish, onloaderror: finish, onplayerror: finish
            });
            this.current = voice;
            this.timeout = setTimeout(finish, 12000);
            voice.play();
        };
        this.updateMix();
        if (wait) this.delay = setTimeout(next, wait); else next();
    }
}
export const runnerAudio = new RunnerAudio();
