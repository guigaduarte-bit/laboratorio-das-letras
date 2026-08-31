import { motion } from 'motion/react';

type StartMenuProps = {
    isReady: boolean;
    onStart: () => void;
};

export function StartMenu({ isReady, onStart }: StartMenuProps)
{
    return (
        <motion.div
            className="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.38 }}
        >
            <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.46, ease: 'easeOut' }}
            >
                LABORATÓRIO DAS LETRAS
            </motion.h1>
            <motion.button
                type="button"
                onClick={onStart}
                disabled={!isReady}
                aria-label={isReady ? 'Começar o jogo' : 'Preparando o jogo'}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 5, scale: 0.98 }}
                transition={{ delay: 0.16, duration: 0.28 }}
            >
                COMEÇAR
            </motion.button>
        </motion.div>
    );
}
