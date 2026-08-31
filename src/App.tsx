import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { gameAudio } from './audio/GameAudio';
import { PhaserGame } from './PhaserGame';
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

const INITIAL_DISPLAY = 'S _ _ _';
const INITIAL_MISSION = 'Procure a letra S.';

export default function App()
{
    const [phase, setPhase] = useState<GamePhase>('menu');
    const [menuReady, setMenuReady] = useState(false);
    const [display, setDisplay] = useState(INITIAL_DISPLAY);
    const [collectedCount, setCollectedCount] = useState(0);
    const [mission, setMission] = useState(INITIAL_MISSION);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const handleMenuReady = (): void => setMenuReady(true);

        const handleLevelStarted = (): void =>
        {
            setMenuReady(false);
            setPhase('playing');
            setMission(INITIAL_MISSION);
            gameAudio.startLevel();
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
            gameAudio.playHint(expected);
        };

        const handleWordCompleted = ({ word }: WordCompletedEvent): void =>
        {
            setMission(`Você formou ${word}!`);
            setAnnouncement(`Palavra completa: ${word}.`);
            gameAudio.completeWord(word);
        };

        const handleCelebrationReady = (): void => setPhase('celebrating');

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

    const startGame = (): void =>
    {
        if (!menuReady)
        {
            return;
        }

        gameAudio.unlock();
        setMenuReady(false);
        setDisplay(INITIAL_DISPLAY);
        setCollectedCount(0);
        setMission(INITIAL_MISSION);
        setAnnouncement('Palavra: S, espaço, espaço, espaço.');
        setPhase('playing');
        EventBus.emit('start-game');
    };

    return (
        <MotionConfig reducedMotion="user">
            <main className="lab-shell">
                <section className="game-stage" aria-label="Laboratório das Letras">
                    <div className="game-frame">
                        <PhaserGame />

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
