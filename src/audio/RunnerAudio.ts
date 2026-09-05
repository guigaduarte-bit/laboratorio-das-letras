import { Howl, Howler } from 'howler';

const LETTER_NAMES: Record<string, string> = { S: 'ésse', A: 'á', P: 'pê', O: 'ó' };

/** Efeitos via Howler. Para esta experiência de reconhecimento, a narração usa
 * somente uma voz pt-BR do dispositivo; os MP3 de voz provisórios não são usados.
 * Nomes de letras não são apresentados como fonemas. */
class RunnerAudio
{
    private enabled = true;
    private unlocked = false;
    private generation = 0;
    private finishTimer?: ReturnType<typeof setTimeout>;
    private currentUtterance?: SpeechSynthesisUtterance;
    private readonly collect = new Howl({ src: ['/assets/audio/sfx/collect.mp3'], volume: 0.28 });
    private readonly hint = new Howl({ src: ['/assets/audio/sfx/hint.mp3'], volume: 0.18 });
    private readonly complete = new Howl({ src: ['/assets/audio/sfx/complete.mp3'], volume: 0.28 });

    hasVoice(): boolean { return Boolean(this.voice()); }

    unlock(): void
    {
        this.unlocked = true;
        if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(() => undefined);
        this.voice();
    }

    setEnabled(enabled: boolean): void
    {
        this.enabled = enabled;
        if (!enabled) this.stop();
    }

    prompt(letter: string): void { this.say(`Encontre a letra ${LETTER_NAMES[letter] ?? letter}.`); }
    letter(letter: string): void { this.say(LETTER_NAMES[letter] ?? letter); }
    introduction(): void { this.say('Vamos formar a palavra sapo. Encontre a letra ésse.'); }
    word(): void { this.say('Sapo. Você encontrou todas as letras!'); }

    collected(letter: string, final: boolean): void
    {
        if (this.enabled && this.unlocked) this.collect.play();
        this.say(final ? `${LETTER_NAMES[letter] ?? letter}. Sapo!` : LETTER_NAMES[letter] ?? letter);
    }

    help(letter: string): void
    {
        if (this.enabled && this.unlocked) this.hint.play();
        this.prompt(letter);
    }

    celebrate(): void
    {
        if (this.enabled && this.unlocked) this.complete.play();
    }

    stop(): void
    {
        this.generation += 1;
        clearTimeout(this.finishTimer);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        this.currentUtterance = undefined;
        this.collect.stop(); this.hint.stop(); this.complete.stop();
    }

    private voice(): SpeechSynthesisVoice | undefined
    {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
        const voices = window.speechSynthesis.getVoices().filter(({ lang }) => /^pt[-_]BR$/i.test(lang));
        return voices.find(({ localService }) => localService) ?? voices[0];
    }

    private say(text: string): void
    {
        if (!this.unlocked || !this.enabled) return;
        const voice = this.voice();
        if (!voice) return;
        const token = ++this.generation;
        clearTimeout(this.finishTimer);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice; utterance.lang = 'pt-BR';
        utterance.rate = 0.82; utterance.pitch = 1.06; utterance.volume = 0.85;
        this.currentUtterance = utterance;
        utterance.onend = utterance.onerror = () => {
            if (token === this.generation) { clearTimeout(this.finishTimer); this.currentUtterance = undefined; }
        };
        window.speechSynthesis.speak(utterance);
        this.finishTimer = setTimeout(() => {
            if (token === this.generation) { window.speechSynthesis.cancel(); this.currentUtterance = undefined; }
        }, 10000);
    }
}

export const runnerAudio = new RunnerAudio();
