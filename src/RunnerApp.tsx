import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { runnerAudio, DEFAULT_AUDIO_MIX, type AudioMix } from './audio/RunnerAudio';
import { humanVoice, VOICE_SCRIPT } from './audio/HumanVoice';
import { getSchoolLevel, schoolLevels } from './game/content/levels';
import { getBiomeForLevel } from './game/content/biomes';
import { AnimalPortrait } from './ui/AnimalPortrait';
import { VoiceStudio } from './ui/VoiceStudio';
import { RunnerGame3D } from './RunnerGame3D';
import { EventBus } from './game/EventBus';
import type { RunnerSnapshot } from './game/content/runner';
import { localProgress, type LocalProgress } from './progress/LocalProgress';
import { MascotGuide } from './ui/MascotGuide';
import { RunnerIcon } from './ui/RunnerIcon';

const EMPTY: RunnerSnapshot = { levelId: 'forest-sapo', word: 'SAPO', phase: 'ready', count: 0, choices: [], lane: 0, hinted: false, paused: false };

export default function RunnerApp()
{
    const [state, setState] = useState<RunnerSnapshot>(EMPTY);
    const [ready, setReady] = useState(false);
    const [sound, setSound] = useState(true);
    const [audioMix, setAudioMix] = useState<AudioMix>(DEFAULT_AUDIO_MIX);
    const [voice, setVoice] = useState(0);
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
    const level = getSchoolLevel(state.levelId);
    const biome = getBiomeForLevel(state.levelId);
    const WORD = state.word;
    const total = [...WORD].length;
    const nextLevel = schoolLevels[schoolLevels.findIndex(({ id }) => id === level.id) + 1];
    const isPlaying = phase !== 'ready' && phase !== 'celebrate';
    const canChoose = phase === 'choose' && !state.paused;
    const target = WORD[state.count] ?? '';

    useEffect(() => {
        let lastPhase = 'ready';
        setAudioMix(runnerAudio.loadMix());
        const sync = (next: RunnerSnapshot) => {
            snapshot.current = next; setState(next); setReady(true);
            runnerAudio.setActive(next.phase !== 'ready' && !next.paused && !document.hidden && !parentDialog.current?.open);
            if (next.phase === 'choose' && lastPhase !== 'choose' && !next.paused)
            {
                const letter = next.word[next.count];
                setAnnouncement(`Encontre a letra ${letter}. Escolha um caminho com esquerda e direita e avance com a seta para cima. Você também pode tocar na letra.`);
                if (lastPhase !== 'retry') runnerAudio.prompt(letter);
            }
            if (next.phase === 'ready' || next.phase === 'celebrate') startGuard.current = false;
            lastPhase = next.phase;
        };
        const started = ({ word }: { word: string }) => { setProgress(localProgress.recordSessionStarted()); runnerAudio.setActive(true); runnerAudio.introduction(word); };
        const collected = ({ letter, count, total }: { letter: string; count: number; total: number; word: string }) => {
            setProgress(localProgress.recordCorrectLetter(letter));
            setAnnouncement(`${letter} encontrada. ${count} de ${total} letras.`);
            runnerAudio.collected(letter);
        };
        const support = (expected: string) => {
            setProgress(localProgress.recordHintAttempt(expected));
            setAnnouncement(`Vamos procurar ${expected}. O Pisco iluminou essa letra.`);
        };
        const mismatch = ({ expected }: { expected: string }) => { support(expected); runnerAudio.retry(expected); };
        const hint = ({ expected }: { expected: string }) => { support(expected); runnerAudio.help(expected); };
        const complete = ({ word }: { word: string }) => {
            setProgress(localProgress.recordLevelCompleted(snapshot.current.levelId));
            setAnnouncement(`Você formou ${word}!`);
        };
        const celebrate = ({ word }: { word: string }) => runnerAudio.celebrate(word);
        const unavailable = () => { setReady(false); startGuard.current = false; runnerAudio.stop(); };
        const available = () => setReady(true);
        const voiceChanged = () => setVoice(humanVoice.availableCount);
        const visibility = () => {
            if (document.hidden) {
                if (!['ready', 'celebrate'].includes(snapshot.current.phase)) EventBus.emit('runner-pause', true);
                runnerAudio.setActive(false);
            } else if (snapshot.current.phase === 'celebrate' && !parentDialog.current?.open) {
                runnerAudio.setActive(true);
            }
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !parentDialog.current?.open && !pauseDialog.current?.open
                && !['ready', 'celebrate'].includes(snapshot.current.phase))
            {
                EventBus.emit('runner-pause', true); runnerAudio.setActive(false);
            }
        };
        EventBus.on('runner-state', sync);
        EventBus.on('level-started', started);
        EventBus.on('letter-collected', collected);
        EventBus.on('letter-mismatch', mismatch);
        EventBus.on('runner-hint-used', hint);
        EventBus.on('word-completed', complete);
        EventBus.on('celebration-ready', celebrate);
        EventBus.on('runner-unavailable', unavailable);
        EventBus.on('runner-ready', available);
        EventBus.emit('runner-state-request');
        voiceChanged();
        const unsubscribeVoice = humanVoice.subscribe(voiceChanged);
        void humanVoice.init().catch(voiceChanged);
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('keydown', escape);
        return () => {
            EventBus.off('runner-state', sync); EventBus.off('level-started', started);
            EventBus.off('letter-collected', collected); EventBus.off('letter-mismatch', mismatch);
            EventBus.off('runner-hint-used', hint); EventBus.off('word-completed', complete);
            EventBus.off('celebration-ready', celebrate);
            EventBus.off('runner-unavailable', unavailable); EventBus.off('runner-ready', available);
            unsubscribeVoice();
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

    const start = (levelId = state.levelId) => {
        if (!ready || startGuard.current) return;
        startGuard.current = true;
        runnerAudio.unlock(); runnerAudio.setEnabled(soundRef.current);
        setVoice(humanVoice.availableCount);
        EventBus.emit('runner-start', levelId);
        document.getElementById('game-container')?.focus({ preventScroll: true });
    };
    const toggleSound = () => {
        const enabled = !soundRef.current;
        soundRef.current = enabled; setSound(enabled); runnerAudio.unlock(); runnerAudio.setEnabled(enabled);
        if (enabled && canChoose && !parentOpen) runnerAudio.prompt(target);
    };
    const changeVolume = (channel: keyof AudioMix, value: number) => {
        runnerAudio.setVolume(channel, value / 100); setAudioMix(runnerAudio.getMix());
    };
    const openParent = () => {
        runnerAudio.setActive(false);
        wasPaused.current = state.paused;
        if (isPlaying) EventBus.emit('runner-pause', true);
        setProgress(localProgress.read()); setParentOpen(true); parentDialog.current?.showModal();
    };
    const closeParent = () => {
        parentDialog.current?.close(); setParentOpen(false);
        if (isPlaying && !wasPaused.current) {
            EventBus.emit('runner-pause', false);
            if (phase === 'choose') runnerAudio.prompt(target);
        } else if (phase === 'celebrate') runnerAudio.setActive(true);
    };
    const home = () => { runnerAudio.stop(); EventBus.emit('runner-home'); pauseDialog.current?.close(); };
    const chooseLevel = (levelId: string) => { runnerAudio.stop(); EventBus.emit('runner-home', levelId); };
    const resume = () => {
        runnerAudio.unlock(); EventBus.emit('runner-pause', false);
        pauseDialog.current?.close();
        document.getElementById('game-container')?.focus({ preventScroll: true });
        if (phase === 'choose') runnerAudio.prompt(target);
    };
    const mission = phase === 'collect' ? (state.count === total ? `Você formou ${WORD}!` : 'Encontrou! Vamos em frente.')
        : phase === 'finish' ? 'Vamos levar a palavra ao laboratório!'
        : phase === 'approach' ? `Vamos até a letra ${state.choices[state.lane]}!`
        : state.hinted ? `Vamos juntos. Procure ${target}.`
        : phase === 'travel' ? `A próxima descoberta é ${target}.` : `Encontre a letra ${target}`;
    const hintTotal = Object.values(progress.letterStats).reduce((sum, item) => sum + item.hints, 0);

    return <MotionConfig reducedMotion="user">
        <main className="expedition-shell" data-playing={isPlaying}>
            <header className="expedition-header">
                <button className="expedition-brand" aria-label="Laboratório das Letras, início" onClick={home}>
                    <span className="brand-mark"><RunnerIcon name="flask" size={27} /></span>
                    <span>laboratório<span>das letras</span></span>
                </button>
                <div className="header-actions">
                    {isPlaying && <button className="icon-button" aria-label="Pausar jogo" onClick={() => { EventBus.emit('runner-pause', true); runnerAudio.setActive(false); }}><RunnerIcon name="pause" /></button>}
                    <button className="icon-button" aria-label={sound ? 'Desligar som' : 'Ligar som'} aria-pressed={sound} onClick={toggleSound}><RunnerIcon name={sound ? 'sound' : 'muted'} /></button>
                    <button className="parent-button" onClick={openParent}>Para quem acompanha</button>
                </div>
            </header>

            <section className="expedition-stage" aria-label="Expedição das Letras" data-phase={phase}>
                <RunnerGame3D word={WORD} />
                <div className="world-label"><RunnerIcon name="leaf" size={17} /> {biome.name}</div>
                <AnimatePresence>
                    {phase === 'ready' && <motion.div className="expedition-start" key="start" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <p className="expedition-eyebrow">UMA DESCOBERTA POR VEZ</p>
                        <h1>Expedição<br />das <span>letras.</span></h1>
                        <p className="expedition-intro">Escolha um animal. Vamos encontrar<br className="desktop-break" /> suas letras pelo caminho!</p>
                        <button className="expedition-primary start-button" onClick={() => start()} disabled={!ready}><RunnerIcon name="play" /> {ready ? `JOGAR · ${WORD}` : 'PREPARANDO…'}</button>
                        <p className="start-note">Jogue com as setas do teclado ou tocando na tela.</p>
                    </motion.div>}
                </AnimatePresence>

                {phase === 'ready' && <div className="mission-picker" role="group" aria-label="Escolha um animal para a aventura">
                    {schoolLevels.map((item, index) => <button key={item.id} disabled={!ready} className="mission-choice" aria-pressed={item.id === state.levelId} onClick={() => chooseLevel(item.id)}>
                        <span className="mission-number">{String(index + 1).padStart(2, '0')}</span>
                        <AnimalPortrait animal={item.imageKey} />
                        <strong>{item.word}</strong>
                        <span className="mission-biome">{getBiomeForLevel(item.id).name}</span>
                        <span className="mission-meta">{progress.completedLevels.includes(item.id) ? <><RunnerIcon name="check" size={14} /> Descoberto</> : `${item.word.length} letras`}</span>
                    </button>)}
                </div>}

                {isPlaying && <div className="expedition-hud" style={{ '--letter-count': total } as CSSProperties}>
                    <div className="word-heading"><span>VAMOS FORMAR</span><span>{state.count} de {total}</span></div>
                    <div className="expedition-word" aria-label={`Palavra ${WORD}. ${state.count} letras encontradas.`}>
                        {[...WORD].map((letter, index) => <span className={index < state.count ? 'found' : index === state.count ? 'next' : ''} key={index} aria-label={`${letter}${index < state.count ? ', encontrada' : index === state.count ? ', próxima letra' : ''}`}>
                            {letter}{index < state.count && <RunnerIcon name="check" size={13} />}
                        </span>)}
                    </div>
                </div>}

                <div className="expedition-pisco" data-phase={phase}>
                    <MascotGuide phase={phase === 'ready' ? 'menu' : phase === 'celebrate' ? 'celebrating' : 'playing'} />
                    <div className="pisco-speech"><span>PISCO</span><p>{phase === 'ready' ? 'Eu vou com você!' : phase === 'celebrate' ? 'Olha o que você descobriu!' : mission}</p></div>
                </div>

                {isPlaying && <div className="equipment-note"><RunnerIcon name="flask" size={18} /><span>{state.count === 0 ? 'Sua invenção começa aqui' : `${state.count * 3} anéis no explorador`}</span></div>}

                <AnimatePresence>
                    {phase === 'celebrate' && <motion.div className="expedition-complete" key="complete" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <AnimalPortrait animal={level.imageKey} />
                        <p className="expedition-eyebrow">DESCOBERTA COMPLETA</p>
                        <h2 ref={completeFocus} tabIndex={-1}>Você formou <strong>{WORD}!</strong></h2>
                        <p>{total} letras. Um novo amigo!</p>
                        <p className="completion-habitat"><RunnerIcon name="leaf" size={15} /> {biome.name}</p>
                        <button className="word-listen" disabled={!runnerAudio.hasWord(WORD) || !sound} onClick={() => runnerAudio.word(WORD)}><RunnerIcon name="sound" size={19} /> Ouvir a palavra</button>
                        {nextLevel ? <button className="expedition-primary" onClick={() => start(nextLevel.id)}><RunnerIcon name="right" /> DESCOBRIR {nextLevel.word}</button>
                            : <button className="expedition-primary" onClick={home}><RunnerIcon name="leaf" /> ESCOLHER OUTRO ANIMAL</button>}
                        <button className="text-button" onClick={() => start()}>Brincar de novo com {WORD}</button>
                        <button className="text-button" onClick={home}>Por hoje, terminamos</button>
                    </motion.div>}
                </AnimatePresence>
            </section>

            <div className="expedition-controls" data-phase={phase}>
                {isPlaying ? <>
                    <div className="control-prompt"><span>{phase === 'choose' || phase === 'retry' ? 'QUAL CAMINHO?' : phase === 'approach' ? 'VAMOS EM FRENTE' : phase === 'collect' ? 'LETRA ENCONTRADA' : phase === 'finish' ? 'PALAVRA COMPLETA' : 'VAMOS EXPLORAR'}</span>
                        <p>{phase === 'choose' || phase === 'retry' ? <>Procure <strong>{target}</strong></> : phase === 'approach' ? 'Indo até a letra…' : phase === 'collect' ? 'Muito bem!' : phase === 'finish' ? `${WORD}!` : 'A pista espera por você.'}</p>
                    </div>
                    <div className="runner-inputs">
                        <div className="lane-buttons" role="group" aria-label="Toque em uma letra para avançar até ela">
                            {state.choices.map((letter, index) => <button key={`lane-${index}`} aria-label={`Avançar até a letra ${letter}`} aria-pressed={state.lane === index} disabled={!canChoose}
                                className={`${state.lane === index ? 'selected' : ''} ${state.hinted && letter === target ? 'hinted' : ''}`}
                                onClick={() => EventBus.emit('runner-choose', index)}>{letter}</button>)}
                        </div>
                        <div className="direction-controls" role="group" aria-label="Mover o personagem" aria-describedby="runner-control-help">
                            <button className="direction-button" aria-label="Mover para a esquerda" disabled={!canChoose || state.lane === 0} onClick={() => EventBus.emit('runner-move', -1)}><RunnerIcon name="left" size={28} /></button>
                            <button className="direction-button advance-button" aria-label="Avançar até a letra selecionada" disabled={!canChoose} onClick={() => EventBus.emit('runner-advance')}><RunnerIcon name="up" size={28} /><span>AVANÇAR</span></button>
                            <button className="direction-button" aria-label="Mover para a direita" disabled={!canChoose || state.lane === state.choices.length - 1} onClick={() => EventBus.emit('runner-move', 1)}><RunnerIcon name="right" size={28} /></button>
                        </div>
                    </div>
                    <div className="learning-actions">
                        <button className="small-action" disabled={!runnerAudio.hasVoice(target) || !sound || !canChoose} onClick={() => runnerAudio.prompt(target)} aria-label="Ouvir a letra procurada"><RunnerIcon name="sound" size={22} /><span>Ouvir</span></button>
                        <button className="small-action" disabled={!canChoose || state.hinted} onClick={() => EventBus.emit('runner-hint')}><RunnerIcon name="help" size={22} /><span>Dica</span></button>
                    </div>
                    <p className="runner-control-help" id="runner-control-help"><span className="keyboard-help">← → escolhem o caminho · ↑ avança.</span><span className="touch-help">Toque nas setas e em AVANÇAR, ou toque na letra.</span></p>
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
                <p>Convide o Ben a dizer o nome da letra e a encontrá-la. Depois de formar cada palavra, procurem juntos as mesmas letras na tarefa da escola.</p>
                <div className="progress-summary"><div><strong>{progress.sessionCount}</strong><span>Sessões iniciadas</span></div><div><strong>{progress.completedLevels.length}</strong><span>Palavras concluídas</span></div><div><strong>{hintTotal}</strong><span>Dicas usadas</span></div></div>
                {Object.keys(progress.letterStats).length > 0 && <table><caption>Letras praticadas</caption><thead><tr><th>Letra</th><th>Coletas</th><th>Com dica</th></tr></thead><tbody>{Object.entries(progress.letterStats).sort(([a], [b]) => a.localeCompare(b)).map(([letter, stats]) => <tr key={letter}><th>{letter}</th><td>{stats.correct}</td><td>{stats.hints}</td></tr>)}</tbody></table>}
                <p className="parent-detail">{progress.lastPlayedAt ? `Última atividade: ${new Date(progress.lastPlayedAt).toLocaleString('pt-BR')}. ` : 'As descobertas aparecerão depois da primeira brincadeira. '}O progresso fica neste navegador. Coletas e dicas ajudam a observar a prática; não medem domínio de leitura.</p>
                <fieldset className="audio-mixer">
                    <legend>Som da aventura</legend>
                    <p>A música baixa durante as falas para destacar cada letra.</p>
                    {([['music', 'Música de fundo'], ['effects', 'Acertos e efeitos'], ['voice', 'Voz humana']] as const).map(([channel, label]) => <label key={channel}>
                        <span>{label}<output>{Math.round(audioMix[channel] * 100)}%</output></span>
                        <input type="range" min="0" max="100" step="1" value={Math.round(audioMix[channel] * 100)} aria-label={`Volume: ${label}`} aria-valuetext={`${Math.round(audioMix[channel] * 100)} por cento`} onChange={(event) => changeVolume(channel, Number(event.target.value))} />
                    </label>)}
                </fieldset>
                <div className="voice-status"><RunnerIcon name="sound" size={20} /><p>{voice === VOICE_SCRIPT.length ? 'A narração humana já está incluída: letras, instruções e as quatro palavras. Você pode personalizar as falas abaixo.' : `${voice} de ${VOICE_SCRIPT.length} trechos gravados. Prepare as falas abaixo para completar a narração humana. Enquanto isso, leia as letras junto com o Ben; a música e os efeitos já estão disponíveis.`}</p></div>
                {parentOpen && <VoiceStudio />}
                <button className="expedition-primary" onClick={closeParent}>VOLTAR À AVENTURA</button>
            </dialog>
        </main>
    </MotionConfig>;
}
