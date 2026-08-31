import { EventBus } from '../EventBus';

export type CollectionResult = {
    accepted: boolean;
    complete: boolean;
};

export class WordProgress
{
    private collectedCount = 0;

    constructor(private readonly word: string) {}

    get expectedLetter(): string | undefined
    {
        return this.word[this.collectedCount];
    }

    tryCollect(letter: string): CollectionResult
    {
        if (letter !== this.expectedLetter)
        {
            return { accepted: false, complete: false };
        }

        const collectedIndex = this.collectedCount;
        this.collectedCount += 1;

        const complete = this.collectedCount === this.word.length;
        const payload = {
            letter,
            index: collectedIndex,
            count: this.collectedCount,
            total: this.word.length,
            word: this.word,
            display: this.getDisplay()
        };

        EventBus.emit('letter-collected', payload);

        if (complete)
        {
            EventBus.emit('word-completed', { word: this.word });
        }

        return { accepted: true, complete };
    }

    private getDisplay(): string
    {
        return [...this.word]
            .map((letter, index) => (index < this.collectedCount || index === 0 ? letter : '_'))
            .join(' ');
    }
}
