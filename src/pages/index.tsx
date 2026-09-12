import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const GameApp = dynamic(() => import('@/App'), { ssr: false });
const RunnerApp = dynamic(() => import('@/RunnerApp'), { ssr: false });

export default function Home()
{
    const [explore, setExplore] = useState<boolean | null>(null);
    useEffect(() => setExplore(new URLSearchParams(window.location.search).get('mode') === 'explore'), []);
    return (
        <>
            <Head>
                <title>Laboratório das Letras</title>
                <meta
                    name="description"
                    content="Uma expedição com Lumi e Pisco para reconhecer letras, formar palavras e descobrir no seu ritmo."
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#E8DCC7" />
            </Head>
            {explore === null ? <p className="game-loading">Preparando a aventura…</p> : explore ? <GameApp /> : <RunnerApp />}
        </>
    );
}
