import { AnimatePresence, motion } from 'motion/react';

type GameHudProps = {
    collectedCount: number;
    display: string;
    mission: string;
};

export function GameHud({ collectedCount, display, mission }: GameHudProps)
{
    const slots = display.split(' ');

    return (
        <motion.div
            className="game-hud"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
        >
            <motion.div
                className="word-bar"
                layout
                aria-label={`Palavra: ${display}`}
            >
                {slots.map((slot, index) => {
                    const collected = index < collectedCount;
                    const cue = index === 0 && !collected;

                    return (
                        <motion.span
                            className={collected ? 'is-collected' : cue ? 'is-cue' : undefined}
                            key={`${index}-${slot}-${collected}`}
                            initial={{ opacity: 0.4, scale: 0.72 }}
                            animate={{ opacity: 1, scale: collected ? [1, 1.24, 1] : 1 }}
                            transition={{ duration: 0.34, ease: 'easeOut' }}
                        >
                            {slot}
                        </motion.span>
                    );
                })}
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.p
                    className="mission-card"
                    key={mission}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.24 }}
                >
                    {mission}
                </motion.p>
            </AnimatePresence>
        </motion.div>
    );
}
