export type BiomeId = 'mata-atlantica' | 'pantanal' | 'cerrado' | 'amazonia';

export type BiomeDefinition = Readonly<{
    id: BiomeId;
    name: string;
    habitat: string;
    sky: number;
    ground: number;
    sunlight: number;
    fogNear: number;
    fogFar: number;
    water: number;
    path: number;
    trunk: number;
    foliage: readonly [number, number, number];
    accent: number;
}>;

/** Destinations for this expedition, not an exclusive distribution of each animal. */
const BIOMES: Record<BiomeId, BiomeDefinition> = {
    'mata-atlantica': {
        id: 'mata-atlantica', name: 'Mata Atlântica', habitat: 'Lagoa da mata',
        sky: 0xc4dfd9, ground: 0x91b281, sunlight: 0xffefd0, fogNear: 33, fogFar: 91,
        water: 0x6daaa4, path: 0xe8dcc7, trunk: 0x9d8261,
        foliage: [0x376950, 0x659467, 0x8caf77], accent: 0xd99776
    },
    pantanal: {
        id: 'pantanal', name: 'Pantanal', habitat: 'Margens alagadas',
        sky: 0xd2e3df, ground: 0xb0bc87, sunlight: 0xffe3b0, fogNear: 40, fogFar: 108,
        water: 0x8fc5c0, path: 0xe7d5b5, trunk: 0xa1885d,
        foliage: [0x647e45, 0x8da661, 0xb0bc74], accent: 0xe7c46b
    },
    cerrado: {
        id: 'cerrado', name: 'Cerrado', habitat: 'Veredas do cerrado',
        sky: 0xd9e6e5, ground: 0xc59b65, sunlight: 0xffe4b3, fogNear: 41, fogFar: 109,
        water: 0x8ab9aa, path: 0xe8d2a9, trunk: 0x856647,
        foliage: [0x607749, 0x84975d, 0xa5ad68], accent: 0xdfb850
    },
    amazonia: {
        id: 'amazonia', name: 'Amazônia', habitat: 'Floresta e igarapés',
        sky: 0xbad4ca, ground: 0x719c73, sunlight: 0xedf2ce, fogNear: 27, fogFar: 82,
        water: 0x5d9c91, path: 0xdfd8ba, trunk: 0x927557,
        foliage: [0x2f6049, 0x4f8154, 0x78a067], accent: 0xd1b767
    }
};

const LEVEL_BIOMES: Record<string, BiomeId> = {
    'forest-sapo': 'mata-atlantica',
    'forest-onca': 'pantanal',
    'forest-tucano': 'cerrado',
    'forest-macaco': 'amazonia',
    'forest-preguica': 'mata-atlantica',
    'forest-sucuri': 'pantanal',
    'forest-capivara': 'pantanal',
    'forest-arara': 'cerrado'
};

export function getBiomeForLevel(levelId: string): BiomeDefinition {
    return BIOMES[LEVEL_BIOMES[levelId] ?? 'mata-atlantica'];
}
