export type LetterDefinition = {
    value: string;
    audio: string;
    x: number;
    y: number;
};

export type PlatformPlacement = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type LevelDefinition = {
    id: string;
    word: string;
    displayName: string;
    imageKey: string;
    wordAudio: string;
    instructionAudio: string;
    letters: LetterDefinition[];
    playerStart: { x: number; y: number };
    platforms: PlatformPlacement[];
};

const FOREST_PLATFORMS: PlatformPlacement[] = [
    { x: 480, y: 516, width: 960, height: 48 },
    { x: 350, y: 420, width: 180, height: 24 },
    { x: 590, y: 340, width: 180, height: 24 },
    { x: 810, y: 420, width: 180, height: 24 }
];

export const levels: LevelDefinition[] = [
    {
        id: 'forest-sapo',
        word: 'SAPO',
        displayName: 'Sapo',
        imageKey: 'sapo',
        wordAudio: '/assets/audio/voice/words/sapo.mp3',
        instructionAudio: '/assets/audio/voice/instructions/forme-sapo.mp3',
        playerStart: { x: 88, y: 420 },
        platforms: FOREST_PLATFORMS,
        letters: [
            {
                value: 'S',
                audio: '/assets/audio/voice/letters/s.mp3',
                x: 190,
                y: 445
            },
            {
                value: 'A',
                audio: '/assets/audio/voice/letters/a.mp3',
                x: 350,
                y: 371
            },
            {
                value: 'P',
                audio: '/assets/audio/voice/letters/p.mp3',
                x: 590,
                y: 291
            },
            {
                value: 'O',
                audio: '/assets/audio/voice/letters/o.mp3',
                x: 810,
                y: 371
            }
        ]
    },
    {
        id: 'forest-pato',
        word: 'PATO',
        displayName: 'Pato',
        imageKey: 'pato',
        wordAudio: '/assets/audio/voice/words/pato.mp3',
        instructionAudio: '/assets/audio/voice/instructions/forme-pato.mp3',
        playerStart: { x: 88, y: 420 },
        platforms: FOREST_PLATFORMS,
        letters: [
            {
                value: 'P',
                audio: '/assets/audio/voice/letters/p.mp3',
                x: 190,
                y: 445
            },
            {
                value: 'A',
                audio: '/assets/audio/voice/letters/a.mp3',
                x: 350,
                y: 371
            },
            {
                value: 'T',
                audio: '/assets/audio/voice/letters/t.mp3',
                x: 590,
                y: 291
            },
            {
                value: 'O',
                audio: '/assets/audio/voice/letters/o.mp3',
                x: 810,
                y: 371
            }
        ]
    }
];

export const DEFAULT_LEVEL_ID = levels[0].id;

export function getLevelById(levelId?: string | null): LevelDefinition
{
    return levels.find(({ id }) => id === levelId) ?? levels[0];
}

export function getInitialWordDisplay(word: string): string
{
    return [...word]
        .map((letter, index) => (index === 0 ? letter : '_'))
        .join(' ');
}
