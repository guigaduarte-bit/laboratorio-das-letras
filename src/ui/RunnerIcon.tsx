export type RunnerIconName = 'flask' | 'play' | 'pause' | 'sound' | 'muted' | 'help' | 'close' | 'back' | 'leaf' | 'check' | 'replay';

export function RunnerIcon({ name, size = 24 }: { name: RunnerIconName; size?: number })
{
    const paths: Record<RunnerIconName, React.ReactNode> = {
        flask: <><path d="M9 3h6M10 3v7L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8" /><circle cx="11" cy="18" r=".7" /></>,
        play: <path d="m9 5 11 7-11 7Z" fill="currentColor" strokeLinejoin="round" />,
        pause: <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>,
        sound: <><path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
        muted: <><path d="M11 5 6 9H3v6h3l5 4ZM16 9l6 6m0-6-6 6" /></>,
        help: <><path d="M8 9a4 4 0 1 1 6 3.5c-1.6.9-2 1.5-2 3M12 19v.1" /><circle cx="12" cy="12" r="10" /></>,
        close: <path d="m6 6 12 12M6 18 18 6" />,
        back: <path d="m10 5-7 7 7 7M3 12h18" />,
        leaf: <><path d="M20 3C7 2 2 8 6 15s14 3 14-12ZM5 21 15 9" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        replay: <><path d="M4 10a8 8 0 1 1 .8 7M4 3v7h7" /></>
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
