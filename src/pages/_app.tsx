import '@fontsource-variable/lexend';
import '@/styles/globals.css';
import '@/styles/expedition.css';
import type { AppProps } from 'next/app';

export default function RootApp({ Component, pageProps }: AppProps)
{
    return <Component {...pageProps} />;
}
