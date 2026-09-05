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
        void document.fonts.ready.then(() => {
            if (!cancelled && game.current === null)
            {
                game.current = StartGame('game-container', mode);
            }
        });

        return () => {
            cancelled = true;
            game.current?.destroy(true);
            game.current = null;
        };
    }, [mode]);

    return (
        <div
            id="game-container"
            role="application"
            aria-label={mode === 'runner'
                ? `Pista de letras de ${word}. Use as setas para escolher um caminho e espaço para coletar, ou os botões abaixo da pista.`
                : `Cenário do jogo. Mova o personagem para encontrar as letras de ${word}.`}
        />
    );
}
