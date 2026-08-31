import { useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';

export function PhaserGame()
{
    const game = useRef<Phaser.Game | null>(null);

    useLayoutEffect(() => {
        if (game.current === null)
        {
            game.current = StartGame('game-container');
        }

        return () => {
            game.current?.destroy(true);
            game.current = null;
        };
    }, []);

    return (
        <div
            id="game-container"
            role="application"
            aria-label="Cenário do jogo. Mova o personagem para encontrar as letras S, A, P e O."
        />
    );
}
