/** Nomes das letras, não fonemas isolados. */
export const VOICE_SCRIPT = [
    { id: 'prompt', label: 'Convite', text: 'Encontre a letra' },
    ...Object.entries({ A: 'á', C: 'cê', Ç: 'cê cedilha', M: 'eme', N: 'ene', O: 'ó', P: 'pê', S: 'esse', T: 'tê', U: 'u' })
        .map(([letter, text]) => ({ id: `letter-${letter}`, label: letter, text })),
    ...['SAPO', 'ONÇA', 'TUCANO', 'MACACO'].map((word) => ({ id: `word-${word}`, label: word, text: word.toLocaleLowerCase('pt-BR') })),
    { id: 'complete', label: 'Comemoração', text: 'Você encontrou todas as letras!' }
];

export function voiceFormat(type: string): string | undefined
{
    const mime = type.split(';')[0].toLowerCase();
    return ({ 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
        'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg',
        'audio/webm': 'webm', 'video/webm': 'webm' } as Record<string, string>)[mime];
}

export const MAX_VOICE_BYTES = 2 * 1024 * 1024;

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

    has(id: string): boolean { return this.clips.has(id); }
    get count(): number { return this.clips.size; }
    get(id: string): { src: string; format: string } | undefined
    {
        const blob = this.clips.get(id);
        if (!blob) return undefined;
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
                    if (VOICE_SCRIPT.some((line) => line.id === id) && blob instanceof Blob && voiceFormat(blob.type)) this.clips.set(id, blob);
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
        await this.init();
        const db = await this.open();
        try {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction('clips', 'readwrite');
                if (blob) tx.objectStore('clips').put({ id, blob }); else tx.objectStore('clips').delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = tx.onabort = () => reject(new Error('Não foi possível salvar neste navegador. Libere espaço e tente novamente.'));
            });
            const previous = this.urls.get(id);
            if (previous) URL.revokeObjectURL(previous);
            this.urls.delete(id);
            if (blob) this.clips.set(id, blob); else this.clips.delete(id);
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
