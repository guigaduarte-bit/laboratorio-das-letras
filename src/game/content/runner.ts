import type { LevelDefinition } from './levels';

export type RunnerPhase = 'ready' | 'travel' | 'choose' | 'collect' | 'finish' | 'celebrate';
export type RunnerSnapshot = {
    phase: RunnerPhase;
    count: number;
    choices: string[];
    lane: number;
    hinted: boolean;
    paused: boolean;
};

/** Uma alternativa simples no início; três alternativas depois da primeira descoberta.
 * As posições mudam, mas nunca há dois alvos iguais na mesma escolha. */
export function makeRunnerChoices(level: LevelDefinition, index: number, random = Math.random): string[]
{
    const target = [...level.word][index];
    if (!target) return [];
    const alternatives = [...new Set([...level.word, 'M', 'E', 'U'])]
        .filter((letter) => letter !== target);
    const offset = Math.floor(random() * alternatives.length);
    const choices = [target, alternatives[offset]];
    if (index > 0) choices.push(alternatives[(offset + 1) % alternatives.length]);
    for (let i = choices.length - 1; i > 0; i--)
    {
        const j = Math.floor(random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
}

export const lanePosition = (index: number, count: number): number =>
    count === 2 ? (index === 0 ? -0.72 : 0.72) : index - 1;
