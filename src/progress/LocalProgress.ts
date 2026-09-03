export type LetterProgressStats = {
    correct: number;
    hints: number;
};

export type LocalProgress = {
    completedLevels: string[];
    sessionCount: number;
    lastPlayedAt: string;
    letterStats: Record<string, LetterProgressStats>;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

type LocalProgressDependencies = {
    getStorage?: () => StorageLike | undefined;
    now?: () => Date;
};

export const LOCAL_PROGRESS_STORAGE_KEY = 'laboratorio-das-letras:progress:v1';

const createEmptyProgress = (): LocalProgress => ({
    completedLevels: [],
    sessionCount: 0,
    lastPlayedAt: '',
    letterStats: {}
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const asCount = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : 0;

const asLastPlayedAt = (value: unknown): string =>
    typeof value === 'string' && value !== '' && !Number.isNaN(Date.parse(value))
        ? value
        : '';

const sanitizeLetterStats = (value: unknown): Record<string, LetterProgressStats> =>
{
    if (!isRecord(value))
    {
        return {};
    }

    return Object.entries(value).reduce<Record<string, LetterProgressStats>>(
        (stats, [letter, rawStats]) => {
            const normalizedLetter = normalizeIdentifier(letter);

            if (!normalizedLetter || !isRecord(rawStats))
            {
                return stats;
            }

            stats[normalizedLetter] = {
                correct: asCount(rawStats.correct),
                hints: asCount(rawStats.hints)
            };
            return stats;
        },
        {}
    );
};

const sanitizeProgress = (value: unknown): LocalProgress =>
{
    if (!isRecord(value))
    {
        return createEmptyProgress();
    }

    const completedLevels = Array.isArray(value.completedLevels)
        ? [...new Set(
            value.completedLevels
                .map((levelId) => typeof levelId === 'string' ? levelId.trim() : '')
                .filter(Boolean)
        )]
        : [];

    return {
        completedLevels,
        sessionCount: asCount(value.sessionCount),
        lastPlayedAt: asLastPlayedAt(value.lastPlayedAt),
        letterStats: sanitizeLetterStats(value.letterStats)
    };
};

const cloneProgress = (progress: LocalProgress): LocalProgress => ({
    ...progress,
    completedLevels: [...progress.completedLevels],
    letterStats: Object.fromEntries(
        Object.entries(progress.letterStats).map(([letter, stats]) => [
            letter,
            { ...stats }
        ])
    )
});

const normalizeIdentifier = (value: string): string =>
    value.trim().toLocaleUpperCase('pt-BR');

const getBrowserStorage = (): StorageLike | undefined =>
{
    if (typeof window === 'undefined')
    {
        return undefined;
    }

    try
    {
        return window.localStorage;
    }
    catch
    {
        return undefined;
    }
};

export class LocalProgressStore
{
    private readonly getStorage: () => StorageLike | undefined;
    private readonly now: () => Date;
    private volatileProgress = createEmptyProgress();
    private storageUnavailable = false;

    constructor({
        getStorage = getBrowserStorage,
        now = () => new Date()
    }: LocalProgressDependencies = {})
    {
        this.getStorage = getStorage;
        this.now = now;
    }

    read(): LocalProgress
    {
        const storage = this.getAvailableStorage();

        if (!storage)
        {
            return cloneProgress(this.volatileProgress);
        }

        let storedValue: string | null;

        try
        {
            storedValue = storage.getItem(LOCAL_PROGRESS_STORAGE_KEY);
        }
        catch
        {
            this.storageUnavailable = true;
            return cloneProgress(this.volatileProgress);
        }

        let progress = createEmptyProgress();
        if (storedValue)
        {
            try
            {
                progress = sanitizeProgress(JSON.parse(storedValue) as unknown);
            }
            catch
            {
                progress = createEmptyProgress();
            }
        }

        this.volatileProgress = progress;
        return cloneProgress(progress);
    }

    recordSessionStarted(): LocalProgress
    {
        return this.update((progress) => {
            progress.sessionCount += 1;
        });
    }

    recordCorrectLetter(letter: string): LocalProgress
    {
        return this.updateLetter(letter, 'correct');
    }

    recordHintAttempt(expectedLetter: string): LocalProgress
    {
        return this.updateLetter(expectedLetter, 'hints');
    }

    recordLevelCompleted(levelId: string): LocalProgress
    {
        const normalizedLevelId = levelId.trim();

        return this.update((progress) => {
            if (normalizedLevelId && !progress.completedLevels.includes(normalizedLevelId))
            {
                progress.completedLevels.push(normalizedLevelId);
            }
        });
    }

    private updateLetter(letter: string, field: keyof LetterProgressStats): LocalProgress
    {
        const normalizedLetter = normalizeIdentifier(letter);

        return this.update((progress) => {
            if (!normalizedLetter)
            {
                return;
            }

            const stats = progress.letterStats[normalizedLetter] ?? { correct: 0, hints: 0 };
            stats[field] += 1;
            progress.letterStats[normalizedLetter] = stats;
        });
    }

    private update(change: (progress: LocalProgress) => void): LocalProgress
    {
        const progress = this.read();
        change(progress);
        progress.lastPlayedAt = this.now().toISOString();
        this.volatileProgress = cloneProgress(progress);

        const storage = this.getAvailableStorage();
        if (storage)
        {
            try
            {
                storage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
            }
            catch
            {
                this.storageUnavailable = true;
                // O jogo continua com o progresso em memória se o navegador bloquear a gravação.
            }
        }

        return cloneProgress(progress);
    }

    private getAvailableStorage(): StorageLike | undefined
    {
        if (this.storageUnavailable)
        {
            return undefined;
        }

        try
        {
            return this.getStorage();
        }
        catch
        {
            this.storageUnavailable = true;
            return undefined;
        }
    }
}

export const localProgress = new LocalProgressStore();
