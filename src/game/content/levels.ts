export type LetterPlacement = {
    letter: string;
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
    key: string;
    word: string;
    playerStart: { x: number; y: number };
    platforms: PlatformPlacement[];
    letters: LetterPlacement[];
};

export const LEVEL_SAPO: LevelDefinition = {
    key: 'sapo',
    word: 'SAPO',
    playerStart: { x: 88, y: 420 },
    platforms: [
        { x: 480, y: 516, width: 960, height: 48 },
        { x: 350, y: 420, width: 180, height: 24 },
        { x: 590, y: 340, width: 180, height: 24 },
        { x: 810, y: 420, width: 180, height: 24 }
    ],
    letters: [
        { letter: 'S', x: 190, y: 445 },
        { letter: 'A', x: 350, y: 371 },
        { letter: 'P', x: 590, y: 291 },
        { letter: 'O', x: 810, y: 371 }
    ]
};
