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
    const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const active = useRef(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const line = VOICE_SCRIPT.find(({ id }) => id === selected)!;

    const stopPreview = () => {
        clearTimeout(loadTimer.current);
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

    const prepare = (blob: Blob) => {
        stopPreview(); setDraft(undefined);
        const format = voiceFormat(blob.type);
        if (!format || !blob.size || blob.size > MAX_VOICE_BYTES) {
            setMessage('Escolha um áudio em MP3, M4A, WAV, OGG ou WebM de até 2 MB.'); setBusy(false); return;
        }
        setBusy(true);
        const src = URL.createObjectURL(blob);
        previewUrl.current = src;
        loadTimer.current = setTimeout(() => {
            stopPreview();
            if (active.current) { setBusy(false); setMessage('Este áudio demorou para abrir. Tente outro arquivo ou grave aqui.'); }
        }, 12000);
        const validation = new Howl({ src: [src], format: [format],
            onload: () => {
                if (!active.current) return;
                if (validation.duration() > 10 || validation.duration() <= 0) setMessage('Use um trecho de até 10 segundos, com uma só fala.');
                else { setDraft(blob); setMessage('Ouça o trecho e escolha Usar esta gravação.'); }
                setBusy(false); stopPreview();
            },
            onloaderror: () => { if (active.current) { setMessage('Não foi possível abrir este áudio. Tente gravar aqui ou use outro arquivo.'); setBusy(false); } stopPreview(); }
        });
        preview.current = validation;
    };

    const record = async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setMessage('A gravação não está disponível aqui. Use Carregar áudio.'); return;
        }
        setBusy(true); setMessage(''); stopPreview();
        try {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!active.current) { mic.getTracks().forEach((track) => track.stop()); return; }
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
            setMessage(remove ? 'Gravação removida.' : 'Gravação salva e pronta para o jogo.');
        } catch (error) { if (active.current) setMessage((error as Error).message); }
        finally { if (active.current) setBusy(false); }
    };

    return <section className="voice-studio" aria-labelledby="voice-studio-title">
        <h3 id="voice-studio-title">Uma voz humana na aventura</h3>
        <p>Grave com sua voz ou carregue uma gravação de alguém que autorizou o uso. Fale devagar, sem música ao fundo. Os áudios ficam neste navegador; prepare-os também no tablet se for jogar lá.</p>
        <p className="voice-count">{savedCount} de {VOICE_SCRIPT.length} trechos preparados</p>
        <label htmlFor="voice-line">Escolha o trecho</label>
        <select id="voice-line" value={selected} disabled={recording || busy} onChange={(event) => { stopPreview(); setSelected(event.target.value); setDraft(undefined); setMessage(''); }}>
            {VOICE_SCRIPT.map((item) => <option key={item.id} value={item.id}>{humanVoice.has(item.id) ? '✓ ' : ''}{item.label}</option>)}
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
        {!draft && humanVoice.has(selected) && <button className="text-button" disabled={busy || recording} onClick={() => save(true)}>Apagar este trecho</button>}
    </section>;
}
