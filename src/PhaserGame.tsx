import { useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';

type PhaserGameProps = {
    word: string;
    mode?: 'explore' | 'runner';
};

export function PhaserGame({ word, mode = 'explore' }: PhaserGameProps)
{
    const game = useRef<Phaser.Game | null>(null);

    useLayoutEffect(() => {
        let cancelled = false;
        let resizeObserver: ResizeObserver | undefined;
        void document.fonts.ready.then(() => {
            if (!cancelled && game.current === null)
            {
                game.current = StartGame('game-container', mode);
                const container = document.getElementById('game-container');
                if (mode === 'runner' && container && typeof ResizeObserver !== 'undefined')
                {
                    resizeObserver = new ResizeObserver(() => game.current?.scale.refresh());
                    resizeObserver.observe(container);
                }
            }
        });

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            game.current?.destroy(true);
            game.current = null;
        };
    }, [mode]);

    return (
        <div
            id="game-container"
            tabIndex={mode === 'runner' ? 0 : undefined}
            role="application"
            aria-label={mode === 'runner'
                ? `Pista de letras de ${word}. Use esquerda e direita para escolher um caminho e seta para cima para avançar. Na tela, toque na letra ou use os botões de direção e Avançar.`
                : `Cenário do jogo. Mova o personagem para encontrar as letras de ${word}.`}
        />
    );
}
