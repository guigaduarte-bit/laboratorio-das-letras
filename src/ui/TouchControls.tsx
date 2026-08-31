import { motion } from 'motion/react';
import { EventBus } from '../game/EventBus';

const setDirection = (direction: 'left' | 'right', isPressed: boolean): void =>
{
    EventBus.emit(`control-${direction}`, isPressed);
};

export function TouchControls()
{
    return (
        <motion.div
            className="touch-controls"
            aria-label="Controles de toque"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
        >
            <motion.button
                type="button"
                aria-label="Andar para a esquerda"
                whileTap={{ y: 4, scale: 0.97 }}
                onPointerDown={() => setDirection('left', true)}
                onPointerUp={() => setDirection('left', false)}
                onPointerCancel={() => setDirection('left', false)}
                onPointerLeave={() => setDirection('left', false)}
            >
                <span aria-hidden="true">←</span>
                ESQUERDA
            </motion.button>
            <motion.button
                type="button"
                className="jump-button"
                aria-label="Pular"
                whileTap={{ y: 4, scale: 0.97 }}
                onPointerDown={() => EventBus.emit('control-jump')}
            >
                <span aria-hidden="true">↑</span>
                PULAR
            </motion.button>
            <motion.button
                type="button"
                aria-label="Andar para a direita"
                whileTap={{ y: 4, scale: 0.97 }}
                onPointerDown={() => setDirection('right', true)}
                onPointerUp={() => setDirection('right', false)}
                onPointerCancel={() => setDirection('right', false)}
                onPointerLeave={() => setDirection('right', false)}
            >
                <span aria-hidden="true">→</span>
                DIREITA
            </motion.button>
        </motion.div>
    );
}
