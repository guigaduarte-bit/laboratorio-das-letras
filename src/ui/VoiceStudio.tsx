import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { humanVoice, MAX_VOICE_BYTES, VOICE_SCRIPT, voiceFormat } from '../audio/HumanVoice';

export function VoiceStudio()
{
    const [selected, setSelected] = useState(VOICE_SCRIPT[0].id);
    const [draft, setDraft] = useState<Blob>();
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [savedCount, setSavedCount] = useState(humanVoice.count);
    const recorder = useRef<MediaRecorder | undefined>(undefined);
    const stream = useRef<MediaStream | undefined>(undefined);
    const preview = useRef<Howl | undefined>(undefined);
    const previewUrl = useRef<string | undefined>(undefined);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const cancelValidation = useRef<(() => void) | undefined>(undefined);
    const active = useRef(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const packInput = useRef<HTMLInputElement>(null);
    const line = VOICE_SCRIPT.find(({ id }) => id === selected)!;

    const stopPreview = () => {
        cancelValidation.current?.();
        preview.current?.unload(); preview.current = undefined;
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = undefined;
    };

    useEffect(() => {
        active.current = true;
        const unsubscribe = humanVoice.subscribe(() => setSavedCount(humanVoice.count));
        void humanVoice.init().catch((error: Error) => { if (active.current) setMessage(error.message); });
        const visibility = () => { if (document.hidden) { recorder.current?.state === 'recording' && recorder.current.stop(); stopPreview(); } };
        document.addEventListener('visibilitychange', visibility);
        return () => {
            active.current = false;
            unsubscribe(); clearTimeout(timer.current);
            document.removeEventListener('visibilitychange', visibility);
            if (recorder.current) {
                recorder.current.onstop = null;
                if (recorder.current.state !== 'inactive') recorder.current.stop();
            }
            stream.current?.getTracks().forEach((track) => track.stop());
            stopPreview();
        };
    }, []);

    const checkClip = (blob: Blob): Promise<void> => new Promise((resolve, reject) => {
        const format = voiceFormat(blob.type);
        if (!format || !blob.size || blob.size > MAX_VOICE_BYTES) {
            reject(new Error('Escolha um áudio em MP3, M4A, WAV, OGG ou WebM de até 2 MB.')); return;
        }
        const src = URL.createObjectURL(blob);
        let finished = false;
        const finish = (error?: Error) => {
            if (finished) return;
            finished = true; clearTimeout(timeout);
            validation.unload(); URL.revokeObjectURL(src);
            if (cancelValidation.current === cancel) cancelValidation.current = undefined;
            if (error) reject(error); else resolve();
        };
        const cancel = () => finish(new Error('Conferência de áudio interrompida.'));
        cancelValidation.current = cancel;
        const timeout = setTimeout(() => finish(new Error('Este áudio demorou para abrir. Tente outro arquivo ou grave aqui.')), 12000);
        const validation = new Howl({ src: [src], format: [format],
            onload: () => {
                const duration = validation.duration();
                finish(!Number.isFinite(duration) || duration > 10 || duration <= 0
                    ? new Error('Use um trecho de até 10 segundos, com uma só fala.') : undefined);
            },
            onloaderror: () => finish(new Error('Não foi possível abrir este áudio. Tente gravar aqui ou use outro arquivo.'))
        });
    });

    const prepare = async (blob: Blob) => {
        stopPreview(); setDraft(undefined); setBusy(true);
        try {
            await checkClip(blob);
            if (active.current) { setDraft(blob); setMessage('Ouça o trecho e escolha Usar esta gravação.'); }
        } catch (error) { if (active.current) setMessage((error as Error).message); }
        finally { if (active.current) setBusy(false); }
    };

    const record = async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setMessage('A gravação não está disponível aqui. Use Carregar áudio.'); return;
        }
        setBusy(true); setMessage(''); stopPreview();
        try {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!active.current || document.hidden) {
                mic.getTracks().forEach((track) => track.stop());
                if (active.current) { setBusy(false); setMessage('Volte a esta tela e toque em Gravar para começar.'); }
                return;
            }
            stream.current = mic;
            const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
                .find((type) => MediaRecorder.isTypeSupported(type));
            const capture = new MediaRecorder(mic, mimeType ? { mimeType } : undefined);
            const chunks: Blob[] = [];
            recorder.current = capture;
            capture.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
            capture.onstop = () => {
                clearTimeout(timer.current);
                mic.getTracks().forEach((track) => track.stop());
                if (active.current) { setRecording(false); prepare(new Blob(chunks, { type: capture.mimeType })); }
            };
            capture.onerror = () => {
                capture.onstop = null;
                if (capture.state !== 'inactive') capture.stop();
                clearTimeout(timer.current); mic.getTracks().forEach((track) => track.stop());
                if (active.current) { setRecording(false); setBusy(false); setMessage('A gravação foi interrompida. Tente novamente.'); }
            };
            capture.start(); setDraft(undefined); setRecording(true); setBusy(false);
            timer.current = setTimeout(() => { if (capture.state === 'recording') capture.stop(); }, 8000);
        } catch {
            stream.current?.getTracks().forEach((track) => track.stop());
            if (active.current) { setBusy(false); setMessage('Não foi possível acessar o microfone. Permita o acesso no navegador ou carregue um áudio.'); }
        }
    };

    const listen = () => {
        stopPreview();
        let clip = humanVoice.get(selected);
        if (draft) { previewUrl.current = URL.createObjectURL(draft); clip = { src: previewUrl.current, format: voiceFormat(draft.type)! }; }
        if (!clip) return;
        preview.current = new Howl({ src: [clip.src], format: [clip.format], volume: 0.85,
            onend: stopPreview, onloaderror: () => { stopPreview(); setMessage('Não foi possível ouvir este áudio. Grave novamente.'); },
            onplayerror: () => { stopPreview(); setMessage('Toque em Ouvir novamente para liberar o áudio.'); } });
        preview.current.play();
    };

    const save = async (remove = false) => {
        if (!remove && !draft) return;
        setBusy(true); stopPreview();
        try {
            await humanVoice.save(selected, remove ? undefined : draft);
            if (!active.current) return;
            setDraft(undefined);
            const next = VOICE_SCRIPT.find((item) => !humanVoice.hasCustom(item.id));
            if (!remove && next) setSelected(next.id);
            setMessage(remove ? 'Voz incluída restaurada.' : next ? 'Trecho salvo. Se quiser, personalize outra fala.' : 'Todos os trechos estão salvos. Você já pode ouvir a narração no jogo.');
        } catch (error) { if (active.current) setMessage((error as Error).message); }
        finally { if (active.current) setBusy(false); }
    };

    const exportPack = async () => {
        setBusy(true); stopPreview();
        try {
            const pack = await humanVoice.exportPack();
            if (!active.current) return;
            const url = URL.createObjectURL(pack);
            const link = document.createElement('a');
            link.href = url; link.download = 'laboratorio-vozes.json';
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setMessage('Pacote preparado. Abra o jogo no outro aparelho e escolha Carregar pacote.');
        } catch (error) { if (active.current) setMessage((error as Error).message); }
        finally { if (active.current) setBusy(false); }
    };

    const importPack = async (file: File) => {
        setBusy(true); stopPreview(); setDraft(undefined);
        try {
            const count = await humanVoice.importPack(file, async (blob) => {
                if (!active.current) throw new Error('Conferência interrompida.');
                await checkClip(blob);
            });
            if (!active.current) return;
            const next = VOICE_SCRIPT.find((item) => !humanVoice.hasCustom(item.id));
            if (next) setSelected(next.id);
            setMessage(`${count} trechos carregados. ${next ? 'As outras falas continuam com a narração incluída.' : 'A narração está pronta neste aparelho.'}`);
        } catch (error) { if (active.current) setMessage((error as Error).message); }
        finally { if (active.current) setBusy(false); }
    };

    return <section className="voice-studio" aria-labelledby="voice-studio-title">
        <h3 id="voice-studio-title">Uma voz humana na aventura</h3>
        <p>O jogo já inclui uma narração humana completa. Se quiser trocar alguma fala, grave ou carregue seu áudio aqui. Suas substituições ficam neste navegador e podem ser levadas ao tablet em um pacote.</p>
        <p className="voice-count">{savedCount} de {VOICE_SCRIPT.length} trechos personalizados · {savedCount === VOICE_SCRIPT.length ? 'Todas as falas personalizadas' : `${VOICE_SCRIPT.length - savedCount} usam a narração incluída`}</p>
        <label htmlFor="voice-line">Escolha o trecho</label>
        <select id="voice-line" value={selected} disabled={recording || busy} onChange={(event) => { stopPreview(); setSelected(event.target.value); setDraft(undefined); setMessage(''); }}>
            {VOICE_SCRIPT.map((item) => <option key={item.id} value={item.id}>{humanVoice.hasCustom(item.id) ? 'Sua voz · ' : 'Incluída · '}{item.label}</option>)}
        </select>
        <div className="voice-script"><span>FALE ASSIM</span><strong>{line.text}</strong></div>
        <div className="voice-buttons">
            <button onClick={recording ? () => recorder.current?.stop() : record} disabled={busy} className={recording ? 'recording' : ''}>{recording ? 'Parar gravação' : 'Gravar minha voz'}</button>
            <button onClick={() => fileInput.current?.click()} disabled={busy || recording}>Carregar áudio</button>
            <button onClick={listen} disabled={busy || recording || (!draft && !humanVoice.has(selected))}>Ouvir trecho</button>
        </div>
        <input ref={fileInput} type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) prepare(file); }} />
        {recording && <p role="status">Gravando… Fale “{line.text}” e toque em Parar gravação.</p>}
        <p role="status">{busy ? 'Preparando áudio…' : message}</p>
        {draft && <button className="expedition-primary" disabled={busy || recording} onClick={() => save()}>USAR ESTA GRAVAÇÃO</button>}
        {!draft && humanVoice.hasCustom(selected) && <button className="text-button" disabled={busy || recording} onClick={() => save(true)}>Restaurar voz incluída</button>}
        <h4>Levar as vozes para outro aparelho</h4>
        <p>Baixe o pacote e abra este mesmo jogo no outro aparelho para carregá-lo. Ao carregar, os trechos do pacote substituem as gravações correspondentes; os outros trechos são mantidos.</p>
        <div className="voice-buttons">
            <button onClick={exportPack} disabled={busy || recording || savedCount === 0}>Baixar pacote de vozes</button>
            <button onClick={() => packInput.current?.click()} disabled={busy || recording}>Carregar pacote</button>
        </div>
        <input ref={packInput} type="file" accept="application/json,.json" hidden onChange={(event) => {
            const file = event.target.files?.[0]; event.target.value = ''; if (file) void importPack(file);
        }} />
    </section>;
}
