export type CharacterId = 'lumi' | 'unicorn' | 'dog';

export type CharacterDefinition = Readonly<{ id: CharacterId; name: string }>;

/** Original, freely selectable explorers. This preference is separate from learning progress. */
export const characters: readonly CharacterDefinition[] = [
    { id: 'lumi', name: 'Lumi' },
    { id: 'unicorn', name: 'Unicórnio' },
    { id: 'dog', name: 'Cachorro' },
];

export function getCharacter(id?: unknown): CharacterDefinition {
    return characters.find((character) => character.id === id) ?? characters[0];
}

const STORAGE_KEY = 'laboratorio-das-letras:character:v1';
let memory: CharacterId = 'lumi';

export function readCharacter(): CharacterId {
    if (typeof window === 'undefined') return 'lumi';
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved !== null) memory = getCharacter(saved).id;
    } catch { /* A blocked store does not prevent choosing an explorer. */ }
    return memory;
}

export function writeCharacter(id: CharacterId): CharacterId {
    memory = getCharacter(id).id;
    if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(STORAGE_KEY, memory); } catch { /* Keep this session's preference. */ }
    }
    return memory;
}
