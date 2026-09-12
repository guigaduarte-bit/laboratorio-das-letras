/** Nomes das letras, não fonemas isolados. */
const RECORDED_SCRIPT = [
    { id: 'introduction', label: 'Início da missão', text: 'Vamos encontrar as letras da palavra' },
    { id: 'prompt', label: 'Convite', text: 'Encontre a letra' },
    ...Object.entries({ A: 'á', C: 'cê', Ç: 'cê cedilha', E: 'é', M: 'eme', N: 'ene', O: 'ó', P: 'pê', S: 'esse', T: 'tê', U: 'u' })
        .map(([letter, text]) => ({ id: `letter-${letter}`, label: letter, text })),
    ...['SAPO', 'ONÇA', 'TUCANO', 'MACACO'].map((word) => ({ id: `word-${word}`, label: word, text: word.toLocaleLowerCase('pt-BR') })),
    { id: 'retry', label: 'Outra tentativa', text: 'Vamos tentar outra vez' },
    { id: 'complete', label: 'Comemoração', text: 'Você encontrou todas as letras!' }
];

export const VOICE_SCRIPT = [
    ...RECORDED_SCRIPT,
    ...Object.entries({ G: 'gê', I: 'i', R: 'erre', V: 'vê' })
        .map(([letter, text]) => ({ id: `letter-${letter}`, label: letter, text })),
    ...['PREGUIÇA', 'SUCURI', 'CAPIVARA', 'ARARA'].map((word) => ({ id: `word-${word}`, label: word, text: word.toLocaleLowerCase('pt-BR') }))
];

/** Gravação do roteiro enviada para o jogo em 12/09/2026. */
export const BUNDLED_VOICE: Readonly<Record<string, string>> = Object.fromEntries(RECORDED_SCRIPT.map(({ id }) => {
    const filename = id === 'letter-Ç' ? 'letter-cedilha' : id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return [id, `/assets/audio/narration/recorded-v1/${filename}.mp3`];
}));

export function voiceFormat(type: string): string | undefined
{
    const mime = type.split(';')[0].toLowerCase();
    return ({ 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
        'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg',
        'audio/webm': 'webm', 'video/webm': 'webm' } as Record<string, string>)[mime];
}

export const MAX_VOICE_BYTES = 2 * 1024 * 1024;
export const MAX_VOICE_PACK_BYTES = 50 * 1024 * 1024;
const PACK_FORMAT = 'laboratorio-das-letras-human-voice';
type VoiceRecord = { id: string; blob: Blob };

function hasExactKeys(value: unknown, keys: string[]): value is Record<string, unknown>
{
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

/** O pacote contém somente gravações; nunca URLs, scripts ou configurações do jogo. */
export function parseVoicePack(text: string): VoiceRecord[]
{
    if (!text.length || text.length > MAX_VOICE_PACK_BYTES) throw new Error('O pacote de vozes deve ter até 50 MB.');
    let pack: unknown;
    try { pack = JSON.parse(text); } catch { throw new Error('Este arquivo não é um pacote de vozes válido.'); }
    if (!hasExactKeys(pack, ['format', 'version', 'clips']) || pack.format !== PACK_FORMAT || pack.version !== 1
        || !Array.isArray(pack.clips) || !pack.clips.length || pack.clips.length > VOICE_SCRIPT.length) {
        throw new Error('Use um pacote de vozes baixado deste jogo.');
    }
    const seen = new Set<string>();
    return pack.clips.map((clip: unknown) => {
        if (!hasExactKeys(clip, ['id', 'mime', 'audio']) || typeof clip.id !== 'string'
            || !VOICE_SCRIPT.some((line) => line.id === clip.id) || seen.has(clip.id)
            || typeof clip.mime !== 'string' || !voiceFormat(clip.mime)
            || typeof clip.audio !== 'string' || !clip.audio.length
            || clip.audio.length > Math.ceil(MAX_VOICE_BYTES / 3) * 4
            || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clip.audio)) {
            throw new Error('O pacote contém um trecho inválido, repetido ou maior que 2 MB.');
        }
        let binary: string;
        try { binary = atob(clip.audio); } catch { throw new Error('O pacote contém um áudio inválido.'); }
        if (!binary.length || binary.length > MAX_VOICE_BYTES || btoa(binary) !== clip.audio) {
            throw new Error('O pacote contém um áudio inválido ou maior que 2 MB.');
        }
        seen.add(clip.id);
        return { id: clip.id, blob: new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: clip.mime }) };
    });
}

/** Áudios ficam apenas neste navegador. Não envia voz a nenhum serviço. */
class HumanVoice
{
    private clips = new Map<string, Blob>();
    private urls = new Map<string, string>();
    private listeners = new Set<() => void>();
    private loading?: Promise<void>;

    subscribe(listener: () => void): () => void
    {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    hasCustom(id: string): boolean { return this.clips.has(id); }
    has(id: string): boolean { return this.clips.has(id) || Object.prototype.hasOwnProperty.call(BUNDLED_VOICE, id); }
    get count(): number { return this.clips.size; }
    get availableCount(): number { return VOICE_SCRIPT.filter(({ id }) => this.has(id)).length; }
    get(id: string): { src: string; format: string } | undefined
    {
        const blob = this.clips.get(id);
        if (!blob) return Object.prototype.hasOwnProperty.call(BUNDLED_VOICE, id) ? { src: BUNDLED_VOICE[id], format: 'mp3' } : undefined;
        if (!this.urls.has(id)) this.urls.set(id, URL.createObjectURL(blob));
        return { src: this.urls.get(id)!, format: voiceFormat(blob.type)! };
    }

    async init(): Promise<void>
    {
        if (this.loading) return this.loading;
        this.loading = (async () => {
            const db = await this.open();
            try {
                const records = await new Promise<{ id: string; blob: Blob }[]>((resolve, reject) => {
                    const request = db.transaction('clips').objectStore('clips').getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                for (const { id, blob } of records) {
                    if (VOICE_SCRIPT.some((line) => line.id === id) && blob instanceof Blob && voiceFormat(blob.type)
                        && blob.size > 0 && blob.size <= MAX_VOICE_BYTES) this.clips.set(id, blob);
                }
                this.listeners.forEach((listener) => listener());
            } finally { db.close(); }
        })();
        try { await this.loading; } catch (error) { this.loading = undefined; throw error; }
    }

    async save(id: string, blob?: Blob): Promise<void>
    {
        if (!VOICE_SCRIPT.some((line) => line.id === id)) throw new Error('Trecho desconhecido.');
        if (blob && (!voiceFormat(blob.type) || !blob.size || blob.size > MAX_VOICE_BYTES)) throw new Error('Use um áudio curto em MP3, M4A, WAV, OGG ou WebM, de até 2 MB.');
        await this.write([{ id, blob }]);
    }

    async exportPack(): Promise<Blob>
    {
        await this.init();
        if (!this.count) throw new Error('Prepare pelo menos um trecho antes de baixar as vozes.');
        const clips = [];
        for (const { id } of VOICE_SCRIPT) {
            const blob = this.clips.get(id);
            if (!blob) continue;
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let binary = '';
            for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
            clips.push({ id, mime: blob.type, audio: btoa(binary) });
        }
        const pack = new Blob([JSON.stringify({ format: PACK_FORMAT, version: 1, clips })], { type: 'application/json' });
        if (pack.size > MAX_VOICE_PACK_BYTES) throw new Error('As gravações ultrapassam 50 MB. Use trechos menores para levar as vozes.');
        return pack;
    }

    /** Valida todos os áudios antes de substituir qualquer gravação existente. */
    async importPack(file: Blob, validateClip: (blob: Blob) => Promise<void>): Promise<number>
    {
        if (!(file instanceof Blob) || !file.size || file.size > MAX_VOICE_PACK_BYTES) throw new Error('Escolha um pacote de vozes de até 50 MB.');
        if (typeof validateClip !== 'function') throw new Error('Não foi possível conferir os áudios deste pacote.');
        const records = parseVoicePack(await file.text());
        for (const { id, blob } of records) {
            try { await validateClip(blob); }
            catch { throw new Error(`O trecho “${VOICE_SCRIPT.find((line) => line.id === id)!.label}” não abriu ou passou de 10 segundos. Nenhuma gravação foi substituída.`); }
        }
        await this.write(records);
        return records.length;
    }

    private async write(records: { id: string; blob?: Blob }[]): Promise<void>
    {
        await this.init();
        const db = await this.open();
        try {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction('clips', 'readwrite');
                tx.oncomplete = () => resolve();
                tx.onerror = tx.onabort = () => reject(new Error('Não foi possível salvar neste navegador. Libere espaço e tente novamente.'));
                try {
                    for (const { id, blob } of records) {
                        if (blob) tx.objectStore('clips').put({ id, blob }); else tx.objectStore('clips').delete(id);
                    }
                } catch {
                    tx.abort();
                    reject(new Error('Não foi possível salvar neste navegador. Nenhuma gravação foi substituída.'));
                }
            });
            for (const { id, blob } of records) {
                const previous = this.urls.get(id);
                if (previous) URL.revokeObjectURL(previous);
                this.urls.delete(id);
                if (blob) this.clips.set(id, blob); else this.clips.delete(id);
            }
            this.listeners.forEach((listener) => listener());
        } finally { db.close(); }
    }

    private open(): Promise<IDBDatabase>
    {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') { reject(new Error('Este navegador não permite salvar gravações.')); return; }
            const request = indexedDB.open('laboratorio-human-voice', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('clips', { keyPath: 'id' });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Não foi possível abrir as gravações deste navegador.'));
            request.onblocked = () => reject(new Error('Feche as outras abas do jogo e tente novamente.'));
        });
    }
}

export const humanVoice = new HumanVoice();
