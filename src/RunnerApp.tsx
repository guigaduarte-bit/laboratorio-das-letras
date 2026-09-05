import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { runnerAudio } from './audio/RunnerAudio';
import { PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';
import type { RunnerSnapshot } from './game/content/runner';
import { localProgress, type LocalProgress } from './progress/LocalProgress';
import { MascotGuide } from './ui/MascotGuide';
import { RunnerIcon } from './ui/RunnerIcon';

const EMPTY: RunnerSnapshot = { phase: 'ready', count: 0, choices: [], lane: 0, hinted: false, paused: false };
const WORD = 'SAPO';

export default function RunnerApp()
{
    const [state, setState] = useState<RunnerSnapshot>(EMPTY);
    const [ready, setReady] = useState(false);
    const [sound, setSound] = useState(true);
    const [voice, setVoice] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [parentOpen, setParentOpen] = useState(false);
    const [progress, setProgress] = useState<LocalProgress>(() => localProgress.read());
    const parentDialog = useRef<HTMLDialogElement>(null);
    const pauseDialog = useRef<HTMLDialogElement>(null);
    const snapshot = useRef(state);
    const wasPaused = useRef(false);
    const startGuard = useRef(false);
    const soundRef = useRef(true);
    const completeFocus = useRef<HTMLHeadingElement>(null);
    const phase = state.phase;
    const isPlaying = phase !== 'ready' && phase !== 'celebrate';
    const target = WORD[state.count] ?? '';

    useEffect(() => {
        let lastPhase = 'ready';
        const sync = (next: RunnerSnapshot) => {
            snapshot.current = next; setState(next); setReady(true);
            if (next.phase === 'choose' && lastPhase !== 'choose')
            {
                const letter = WORD[next.count];
                setAnnouncement(`Encontre a letra ${letter}. Escolha um caminho.`);
                runnerAudio.prompt(letter);
            }
            if (next.phase === 'ready' || next.phase === 'celebrate') startGuard.current = false;
            lastPhase = next.phase;
        };
        const started = () => { setProgress(localProgress.recordSessionStarted()); runnerAudio.introduction(); };
        const collected = ({ letter, count }: { letter: string; count: number }) => {
            setProgress(localProgress.recordCorrectLetter(letter));
            setAnnouncement(`${letter} encontrada. ${count} de 4 letras.`);
            runnerAudio.collected(letter, count === 4);
        };
        const hint = ({ expected }: { expected: string }) => {
            setProgress(localProgress.recordHintAttempt(expected));
            setAnnouncement(`Vamos procurar ${expected}. O Pisco iluminou essa letra.`);
            runnerAudio.help(expected);
        };
        const complete = () => {
            setProgress(localProgress.recordLevelCompleted('forest-sapo'));
            setAnnouncement('Você formou SAPO!');
        };
        const celebrate = () => runnerAudio.celebrate();
        const voiceChanged = () => setVoice(runnerAudio.hasVoice());
        const visibility = () => {
            if (document.hidden && !['ready', 'celebrate'].includes(snapshot.current.phase))
            {
                EventBus.emit('runner-pause', true); runnerAudio.stop();
            }
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !parentDialog.current?.open && !pauseDialog.current?.open
                && !['ready', 'celebrate'].includes(snapshot.current.phase))
            {
                EventBus.emit('runner-pause', true); runnerAudio.stop();
            }
        };
        EventBus.on('runner-state', sync);
        EventBus.on('level-started', started);
        EventBus.on('letter-collected', collected);
        EventBus.on('letter-mismatch', hint);
        EventBus.on('runner-hint-used', hint);
        EventBus.on('word-completed', complete);
        EventBus.on('celebration-ready', celebrate);
        EventBus.emit('runner-state-request');
        voiceChanged();
        window.speechSynthesis?.addEventListener('voiceschanged', voiceChanged);
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('keydown', escape);
        return () => {
            EventBus.off('runner-state', sync); EventBus.off('level-started', started);
            EventBus.off('letter-collected', collected); EventBus.off('letter-mismatch', hint);
            EventBus.off('runner-hint-used', hint); EventBus.off('word-completed', complete);
            EventBus.off('celebration-ready', celebrate);
            window.speechSynthesis?.removeEventListener('voiceschanged', voiceChanged);
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('keydown', escape);
            runnerAudio.stop();
        };
    }, []);

    useEffect(() => {
        if (state.paused && !parentOpen && isPlaying) pauseDialog.current?.showModal();
        else pauseDialog.current?.close();
    }, [state.paused, parentOpen, isPlaying]);

    useEffect(() => {
        if (phase === 'celebrate') completeFocus.current?.focus();
    }, [phase]);

    const start = () => {
        if (!ready || startGuard.current) return;
        startGuard.current = true;
        runnerAudio.unlock(); runnerAudio.setEnabled(soundRef.current);
        setVoice(runnerAudio.hasVoice());
        EventBus.emit('runner-start');
        // O canvas pode receber setas/espaço depois do botão inicial.
        (document.activeElement as HTMLElement | null)?.blur();
    };
    const toggleSound = () => {
        const enabled = !soundRef.current;
        soundRef.current = enabled; setSound(enabled); runnerAudio.unlock(); runnerAudio.setEnabled(enabled);
        if (enabled && phase === 'choose') runnerAudio.prompt(target);
    };
    const openParent = () => {
        wasPaused.current = state.paused;
        if (isPlaying) { EventBus.emit('runner-pause', true); runnerAudio.stop(); }
        setProgress(localProgress.read()); setParentOpen(true); parentDialog.current?.showModal();
    };
    const closeParent = () => {
        parentDialog.current?.close(); setParentOpen(false);
        if (isPlaying && !wasPaused.current) EventBus.emit('runner-pause', false);
    };
    const home = () => { runnerAudio.stop(); EventBus.emit('runner-home'); pauseDialog.current?.close(); };
    const resume = () => {
        runnerAudio.unlock(); EventBus.emit('runner-pause', false);
        if (phase === 'choose') runnerAudio.prompt(target);
    };
    const mission = phase === 'collect' ? (state.count === 4 ? 'Você formou SAPO!' : 'Encontrou! Vamos em frente.')
        : phase === 'finish' ? 'Vamos levar a palavra ao laboratório!'
        : state.hinted ? `Vamos juntos. Procure ${target}.`
        : phase === 'travel' ? `A próxima descoberta é ${target}.` : `Encontre a letra ${target}`;
    const hintTotal = Object.values(progress.letterStats).reduce((sum, item) => sum + item.hints, 0);

    return <MotionConfig reducedMotion="user">
        <main className="expedition-shell">
            <header className="expedition-header">
                <button className="expedition-brand" aria-label="Laboratório das Letras, início" onClick={home}>
                    <span className="brand-mark"><RunnerIcon name="flask" size={27} /></span>
                    <span>laboratório<span>das letras</span></span>
                </button>
                <div className="header-actions">
                    {isPlaying && <button className="icon-button" aria-label="Pausar jogo" onClick={() => { EventBus.emit('runner-pause', true); runnerAudio.stop(); }}><RunnerIcon name="pause" /></button>}
                    <button className="icon-button" aria-label={sound ? 'Desligar som' : 'Ligar som'} aria-pressed={sound} onClick={toggleSound}><RunnerIcon name={sound ? 'sound' : 'muted'} /></button>
                    <button className="parent-button" onClick={openParent}>Para quem acompanha</button>
                </div>
            </header>

            <section className="expedition-stage" aria-label="Expedição das Letras" data-phase={phase}>
                <PhaserGame word={WORD} mode="runner" />
                <div className="world-label"><RunnerIcon name="leaf" size={17} /> Bosque-laboratório</div>
                <AnimatePresence>
                    {phase === 'ready' && <motion.div className="expedition-start" key="start" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <p className="expedition-eyebrow">UMA DESCOBERTA POR VEZ</p>
                        <h1>Expedição<br />das <span>letras.</span></h1>
                        <p className="expedition-intro">Vamos encontrar letras<br className="desktop-break" /> e construir uma invenção?</p>
                        <button className="expedition-primary start-button" onClick={start} disabled={!ready}><RunnerIcon name="play" /> {ready ? 'COMEÇAR' : 'PREPARANDO…'}</button>
                        <p className="start-note">Toque para escolher. Explore no seu ritmo.</p>
                    </motion.div>}
                </AnimatePresence>

                {isPlaying && <div className="expedition-hud">
                    <div className="word-heading"><span>VAMOS FORMAR</span><span>{state.count} de 4</span></div>
                    <div className="expedition-word" aria-label={`Palavra SAPO. ${state.count} letras encontradas.`}>
                        {[...WORD].map((letter, index) => <span className={index < state.count ? 'found' : index === state.count ? 'next' : ''} key={index} aria-label={`${letter}${index < state.count ? ', encontrada' : index === state.count ? ', próxima letra' : ''}`}>
                            {letter}{index < state.count && <RunnerIcon name="check" size={13} />}
                        </span>)}
                    </div>
                </div>}

                <div className="expedition-pisco" data-phase={phase}>
                    <MascotGuide phase={phase === 'ready' ? 'menu' : phase === 'celebrate' ? 'celebrating' : 'playing'} />
                    <div className="pisco-speech"><span>PISCO</span><p>{phase === 'ready' ? 'Eu vou com você!' : phase === 'celebrate' ? 'Olha o que você descobriu!' : mission}</p></div>
                </div>

                {isPlaying && <div className="equipment-note"><RunnerIcon name="flask" size={18} /><span>{state.count === 0 ? 'Sua invenção começa aqui' : `${state.count} de 4 partes da invenção`}</span></div>}

                <AnimatePresence>
                    {phase === 'celebrate' && <motion.div className="expedition-complete" key="complete" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="completion-badge"><RunnerIcon name="check" size={34} /></div>
                        <p className="expedition-eyebrow">DESCOBERTA COMPLETA</p>
                        <h2 ref={completeFocus} tabIndex={-1}>Você formou <strong>SAPO!</strong></h2>
                        <p>Quatro letras. Uma nova descoberta.</p>
                        <button className="word-listen" disabled={!voice || !sound} onClick={() => runnerAudio.word()}><RunnerIcon name="sound" size={19} /> Ouvir a palavra</button>
                        <button className="expedition-primary" onClick={start}><RunnerIcon name="replay" /> BRINCAR DE NOVO</button>
                        <button className="text-button" onClick={home}>Por hoje, terminamos</button>
                    </motion.div>}
                </AnimatePresence>
            </section>

            <div className="expedition-controls" data-phase={phase}>
                {isPlaying ? <>
                    <div className="control-prompt"><span>{phase === 'choose' ? 'QUAL CAMINHO?' : phase === 'collect' ? 'LETRA ENCONTRADA' : phase === 'finish' ? 'PALAVRA COMPLETA' : 'VAMOS EXPLORAR'}</span>
                        <p>{phase === 'choose' ? <>Procure <strong>{target}</strong></> : phase === 'collect' ? 'Muito bem!' : phase === 'finish' ? 'SAPO!' : 'A pista espera por você.'}</p>
                    </div>
                    <div className="lane-buttons" role="group" aria-label="Escolha uma letra">
                        {state.choices.map((letter, index) => <button key={`${state.count}-${index}`} aria-label={`Coletar letra ${letter}`} disabled={phase !== 'choose' || state.paused}
                            className={`${state.lane === index ? 'selected' : ''} ${state.hinted && letter === target ? 'hinted' : ''}`}
                            onClick={() => EventBus.emit('runner-choose', index)}>{letter}</button>)}
                    </div>
                    <div className="learning-actions">
                        <button className="small-action" disabled={!voice || !sound || phase !== 'choose'} onClick={() => runnerAudio.prompt(target)} aria-label="Ouvir a letra procurada"><RunnerIcon name="sound" size={22} /><span>Ouvir</span></button>
                        <button className="small-action" disabled={phase !== 'choose' || state.hinted} onClick={() => EventBus.emit('runner-hint')}><RunnerIcon name="help" size={22} /><span>Dica</span></button>
                    </div>
                </> : <div className="expedition-footer"><span>Uma aventura com Lumi e Pisco</span><span>Reconhecer · Coletar · Descobrir</span></div>}
            </div>

            <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
            <dialog ref={pauseDialog} className="expedition-dialog pause-dialog" onCancel={(event) => { event.preventDefault(); resume(); }}>
                <div className="dialog-symbol"><RunnerIcon name="pause" size={28} /></div>
                <h2>Uma pausa na aventura</h2><p>Suas letras estão aqui, esperando por você.</p>
                <button className="expedition-primary" onClick={resume}><RunnerIcon name="play" /> CONTINUAR</button>
                <button className="text-button" onClick={home}>Voltar ao início</button>
            </dialog>
            <dialog ref={parentDialog} className="expedition-dialog parent-dialog" onCancel={(event) => { event.preventDefault(); closeParent(); }}>
                <button className="dialog-close icon-button" aria-label="Fechar acompanhamento" onClick={closeParent}><RunnerIcon name="close" /></button>
                <p className="expedition-eyebrow">PARA QUEM ACOMPANHA</p><h2>Pequenas descobertas</h2>
                <p>Convide o Ben a dizer o nome da letra e a encontrá-la. Depois de formar SAPO, procurem juntos as mesmas letras fora da tela.</p>
                <div className="progress-summary"><div><strong>{progress.sessionCount}</strong><span>Sessões iniciadas</span></div><div><strong>{progress.completedLevels.length}</strong><span>Palavras concluídas</span></div><div><strong>{hintTotal}</strong><span>Dicas usadas</span></div></div>
                {Object.keys(progress.letterStats).length > 0 && <table><caption>Letras praticadas</caption><thead><tr><th>Letra</th><th>Coletas</th><th>Com dica</th></tr></thead><tbody>{Object.entries(progress.letterStats).sort(([a], [b]) => a.localeCompare(b)).map(([letter, stats]) => <tr key={letter}><th>{letter}</th><td>{stats.correct}</td><td>{stats.hints}</td></tr>)}</tbody></table>}
                <p className="parent-detail">{progress.lastPlayedAt ? `Última atividade: ${new Date(progress.lastPlayedAt).toLocaleString('pt-BR')}. ` : 'As descobertas aparecerão depois da primeira brincadeira. '}O progresso fica neste navegador. Coletas e dicas ajudam a observar a prática; não medem domínio de leitura.</p>
                <div className="voice-status"><RunnerIcon name="sound" size={20} /><p>{voice ? 'Narração em português brasileiro pela voz do dispositivo. Confira a pronúncia antes de brincar; usamos nomes de letras, sem apresentar a síntese como fonemas.' : 'Este navegador não disponibilizou uma voz em português brasileiro. A pista funciona com pistas visuais; leia as letras junto com o Ben. O botão Ouvir será ativado se uma voz compatível ficar disponível.'}</p></div>
                <button className="expedition-primary" onClick={closeParent}>VOLTAR À AVENTURA</button>
            </dialog>
        </main>
    </MotionConfig>;
}
