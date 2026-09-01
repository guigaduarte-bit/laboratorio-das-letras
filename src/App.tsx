import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { gameAudio } from './audio/GameAudio';
import { PhaserGame } from './PhaserGame';
import {
    DEFAULT_LEVEL_ID,
    getInitialWordDisplay,
    getLevelById
} from './game/content/levels';
import { EventBus } from './game/EventBus';
import { GameHud } from './ui/GameHud';
import { StartMenu } from './ui/StartMenu';
import { TouchControls } from './ui/TouchControls';

type GamePhase = 'menu' | 'playing' | 'celebrating';

type LetterCollectedEvent = {
    count: number;
    display: string;
    letter: string;
    total: number;
    word: string;
};

type LetterMismatchEvent = {
    expected: string;
    found: string;
};

type WordCompletedEvent = {
    word: string;
};

type LevelStartedEvent = {
    display: string;
    levelId: string;
    word: string;
};

const DEFAULT_LEVEL = getLevelById(DEFAULT_LEVEL_ID);
const getMission = (word: string): string => `Procure a letra ${word[0]}.`;
const getSpokenDisplay = (display: string): string => display
    .split(' ')
    .map((slot) => slot === '_' ? 'espaço' : slot)
    .join(', ');

const getRequestedLevel = () =>
{
    if (typeof window === 'undefined')
    {
        return DEFAULT_LEVEL;
    }

    const levelId = new URLSearchParams(window.location.search).get('level');
    return getLevelById(levelId);
};

export default function App()
{
    const [phase, setPhase] = useState<GamePhase>('menu');
    const [menuReady, setMenuReady] = useState(false);
    const [activeLevelId, setActiveLevelId] = useState(DEFAULT_LEVEL_ID);
    const [display, setDisplay] = useState(getInitialWordDisplay(DEFAULT_LEVEL.word));
    const [collectedCount, setCollectedCount] = useState(0);
    const [mission, setMission] = useState(getMission(DEFAULT_LEVEL.word));
    const [announcement, setAnnouncement] = useState('');
    const startInProgress = useRef(false);

    useEffect(() => {
        const requestedLevel = getRequestedLevel();
        setActiveLevelId(requestedLevel.id);
        setDisplay(getInitialWordDisplay(requestedLevel.word));
        setMission(getMission(requestedLevel.word));

        const handleMenuReady = (): void => setMenuReady(true);

        const handleLevelStarted = ({ display: initialDisplay, levelId, word }: LevelStartedEvent): void =>
        {
            const level = getLevelById(levelId);
            setMenuReady(false);
            setActiveLevelId(level.id);
            setDisplay(initialDisplay);
            setCollectedCount(0);
            setPhase('playing');
            setMission(getMission(word));
            gameAudio.startLevel(level);
        };

        const handleLetterCollected = ({
            count,
            display: nextDisplay,
            letter,
            total,
            word
        }: LetterCollectedEvent): void =>
        {
            setDisplay(nextDisplay);
            setCollectedCount(count);
            setAnnouncement(`Palavra: ${nextDisplay}`);
            setMission(
                count < total
                    ? `Muito bem! Agora procure a letra ${word[count]}.`
                    : `Você formou ${word}!`
            );
            gameAudio.playLetter(letter);
        };

        const handleLetterMismatch = ({ expected }: LetterMismatchEvent): void =>
        {
            setMission(`Quase! Agora procure a letra ${expected}.`);
            setAnnouncement(`Agora procure a letra ${expected}.`);
            gameAudio.playHint();
        };

        const handleWordCompleted = ({ word }: WordCompletedEvent): void =>
        {
            setMission(`Você formou ${word}!`);
            setAnnouncement(`Palavra completa: ${word}.`);
            gameAudio.completeWord(word);
        };

        const handleCelebrationReady = (): void =>
        {
            gameAudio.finishCelebration();
            setPhase('celebrating');
        };

        EventBus.on('level-started', handleLevelStarted);
        EventBus.on('menu-ready', handleMenuReady);
        EventBus.on('letter-collected', handleLetterCollected);
        EventBus.on('letter-mismatch', handleLetterMismatch);
        EventBus.on('word-completed', handleWordCompleted);
        EventBus.on('celebration-ready', handleCelebrationReady);
        EventBus.emit('request-menu-ready');

        return () => {
            EventBus.off('level-started', handleLevelStarted);
            EventBus.off('menu-ready', handleMenuReady);
            EventBus.off('letter-collected', handleLetterCollected);
            EventBus.off('letter-mismatch', handleLetterMismatch);
            EventBus.off('word-completed', handleWordCompleted);
            EventBus.off('celebration-ready', handleCelebrationReady);
            gameAudio.stopAll();
        };
    }, []);

    const startGame = async (): Promise<void> =>
    {
        if (!menuReady || startInProgress.current)
        {
            return;
        }

        startInProgress.current = true;
        setMenuReady(false);
        const level = getRequestedLevel();
        const audioReady = await gameAudio.unlock();
        const initialDisplay = getInitialWordDisplay(level.word);

        setActiveLevelId(level.id);
        setDisplay(initialDisplay);
        setCollectedCount(0);
        setMission(getMission(level.word));
        setAnnouncement(
            audioReady
                ? `Palavra: ${getSpokenDisplay(initialDisplay)}.`
                : `Áudio indisponível. Palavra: ${getSpokenDisplay(initialDisplay)}.`
        );
        setPhase('playing');
        EventBus.emit('start-game', { levelId: level.id });
    };

    return (
        <MotionConfig reducedMotion="user">
            <main className="lab-shell">
                <section className="game-stage" aria-label="Laboratório das Letras">
                    <div className="game-frame">
                        <PhaserGame word={getLevelById(activeLevelId).word} />

                        <AnimatePresence>
                            {phase === 'menu' && (
                                <StartMenu
                                    key="menu"
                                    isReady={menuReady}
                                    onStart={startGame}
                                />
                            )}
                            {phase === 'playing' && (
                                <GameHud
                                    key="hud"
                                    collectedCount={collectedCount}
                                    display={display}
                                    mission={mission}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {phase === 'playing' && <TouchControls key="controls" />}
                    </AnimatePresence>

                    <p className="sr-only" aria-live="polite">{announcement}</p>
                </section>
            </main>
        </MotionConfig>
    );
}
