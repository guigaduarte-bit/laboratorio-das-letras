import dynamic from 'next/dynamic';
import Head from 'next/head';

const GameApp = dynamic(() => import('@/App'), { ssr: false });

export default function Home()
{
    return (
        <>
            <Head>
                <title>Laboratório das Letras</title>
                <meta
                    name="description"
                    content="Jogo curto de exploração para o início da alfabetização."
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#E8DCC7" />
            </Head>
            <GameApp />
        </>
    );
}
