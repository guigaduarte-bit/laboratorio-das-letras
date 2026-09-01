import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/EventBus';

export type MascotState =
    | 'idle'
    | 'ouvindo'
    | 'pensando'
    | 'dando_dica'
    | 'feliz'
    | 'comemorando';

type MascotGuideProps = {
    phase: 'menu' | 'playing' | 'celebrating';
};

const RIVE_ASSET_READY = true;
const RiveMascot = dynamic(
    () => import('./RiveMascot').then(({ RiveMascot: Component }) => Component),
    { ssr: false }
);

export function MascotGuide({ phase }: MascotGuideProps)
{
    const [state, setState] = useState<MascotState>('idle');
    const [riveFailed, setRiveFailed] = useState(false);
    const returnTimer = useRef<number | null>(null);

    useEffect(() => {
        const clearReturnTimer = (): void =>
        {
            if (returnTimer.current !== null)
            {
                window.clearTimeout(returnTimer.current);
                returnTimer.current = null;
            }
        };

        const showState = (nextState: MascotState, duration?: number): void =>
        {
            clearReturnTimer();
            setState(nextState);

            if (duration !== undefined)
            {
                returnTimer.current = window.setTimeout(() => {
                    setState('idle');
                    returnTimer.current = null;
                }, duration);
            }
        };

        const handleMenuReady = (): void => showState('idle');
        const handleLevelStarted = (): void => showState('ouvindo', 1500);
        const handleLetterCollected = (): void => showState('feliz', 850);
        const handleLetterMismatch = (): void =>
        {
            showState('pensando');
            returnTimer.current = window.setTimeout(() => {
                setState('dando_dica');
                returnTimer.current = window.setTimeout(() => {
                    setState('idle');
                    returnTimer.current = null;
                }, 900);
            }, 650);
        };
        const handleWordCompleted = (): void => showState('comemorando');

        EventBus.on('menu-ready', handleMenuReady);
        EventBus.on('level-started', handleLevelStarted);
        EventBus.on('letter-collected', handleLetterCollected);
        EventBus.on('letter-mismatch', handleLetterMismatch);
        EventBus.on('word-completed', handleWordCompleted);

        return () => {
            clearReturnTimer();
            EventBus.off('menu-ready', handleMenuReady);
            EventBus.off('level-started', handleLevelStarted);
            EventBus.off('letter-collected', handleLetterCollected);
            EventBus.off('letter-mismatch', handleLetterMismatch);
            EventBus.off('word-completed', handleWordCompleted);
        };
    }, []);

    const renderRive = RIVE_ASSET_READY && !riveFailed;

    return (
        <aside
            className="mascot-guide"
            data-phase={phase}
            data-state={state}
            aria-hidden="true"
        >
            <div className="mascot-guide__halo" />
            <div className="mascot-guide__visual">
                {renderRive ? (
                    <RiveMascot
                        state={state}
                        onLoadError={() => setRiveFailed(true)}
                    />
                ) : (
                    <Image
                        src="/assets/rive/pisco-fallback.svg"
                        alt=""
                        width={300}
                        height={320}
                        priority
                        draggable={false}
                    />
                )}
            </div>
            <span className="mascot-guide__name">Pisco</span>
        </aside>
    );
}
