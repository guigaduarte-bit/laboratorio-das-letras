import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { EventBus } from './game/EventBus';
import type { RunnerSnapshot } from './game/content/runner';
import { RunnerController } from './game/systems/RunnerController';
import type { RunnerWorld3D } from './game/three/RunnerWorld3D';

const LightGame = dynamic(() => import('./PhaserGame').then(({ PhaserGame }) => PhaserGame), {
    ssr: false,
    loading: () => <div className="runner-3d-status" data-state="loading" role="status">Preparando a versão leve…</div>
});

type Gesture = { id: number; x: number; y: number; gate: number | null };

export function RunnerGame3D({ word }: { word: string })
{
    const container = useRef<HTMLDivElement>(null);
    const fallbackButton = useRef<HTMLButtonElement>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState<string | null>(null);
    const [light, setLight] = useState(false);

    useEffect(() => {
        if (light || failed || !container.current) return;
        const host = container.current;
        let cancelled = false;
        let stopped = false;
        let world: RunnerWorld3D | undefined;
        let controller: RunnerController | undefined;
        let resizeObserver: ResizeObserver | undefined;
        let frameRequest = 0;
        let previousTime = 0;
        let gesture: Gesture | undefined;
        const pointers = new Set<number>();
        const removeListeners: Array<() => void> = [];
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reducedMotion = motionPreference.matches;

        const clearGesture = () => {
            gesture = undefined;
            for (const id of pointers)
            {
                if (world?.canvas.hasPointerCapture(id)) world.canvas.releasePointerCapture(id);
            }
            pointers.clear();
        };
        const dispose = () => {
            if (stopped) return;
            stopped = true;
            window.cancelAnimationFrame(frameRequest);
            resizeObserver?.disconnect();
            removeListeners.forEach((remove) => remove());
            clearGesture();
            controller?.destroy();
            controller = undefined;
            world?.dispose();
            world = undefined;
        };
        const fail = (message: string) => {
            if (cancelled || stopped) return;
            if (controller)
            {
                const levelId = controller.snapshot.levelId;
                EventBus.emit('runner-pause', true);
                // Volta ao menu antes do descarte para não deixar um diálogo de pausa sobre o fallback.
                EventBus.emit('runner-home', levelId);
            }
            EventBus.emit('runner-unavailable');
            dispose();
            setLoading(false);
            setFailed(message);
        };
        const canChoose = () => controller?.snapshot.phase === 'choose' && !controller.snapshot.paused;
        const handleKey = (event: KeyboardEvent) => {
            const state = controller?.snapshot;
            if (!state || state.paused || state.phase === 'ready' || state.phase === 'celebrate'
                || event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.defaultPrevented) return;
            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest('input, select, textarea, dialog, [role="dialog"], a, [contenteditable]:not([contenteditable="false"])')) return;
            const space = event.code === 'Space' || event.key === ' ';
            if ((space || event.key === 'Enter') && target?.closest('button')) return;
            const left = ['ArrowLeft', 'a', 'A'].includes(event.key);
            const right = ['ArrowRight', 'd', 'D'].includes(event.key);
            const forward = ['ArrowUp', 'w', 'W', 'Enter'].includes(event.key) || space;
            if (!left && !right && !forward && event.key !== 'ArrowDown') return;
            event.preventDefault();
            if (event.repeat || state.phase !== 'choose') return;
            if (left || right) EventBus.emit('runner-move', left ? -1 : 1);
            else if (forward) EventBus.emit('runner-advance');
        };
        const pointerDown = (event: PointerEvent) => {
            if (!world || !canChoose() || event.button !== 0) return;
            event.preventDefault();
            host.focus({ preventScroll: true });
            pointers.add(event.pointerId);
            world.canvas.setPointerCapture(event.pointerId);
            if (pointers.size > 1)
            {
                // Dois dedos cancelam a intenção, sem transformar um gesto em duas escolhas.
                gesture = undefined;
                return;
            }
            gesture = {
                id: event.pointerId, x: event.clientX, y: event.clientY,
                gate: world.pick(event.clientX, event.clientY)
            };
        };
        const pointerUp = (event: PointerEvent) => {
            const start = gesture;
            const singlePointer = pointers.size === 1;
            pointers.delete(event.pointerId);
            if (start?.id === event.pointerId) gesture = undefined;
            if (world?.canvas.hasPointerCapture(event.pointerId)) world.canvas.releasePointerCapture(event.pointerId);
            if (!world || !start || start.id !== event.pointerId || !singlePointer || !canChoose()) return;
            event.preventDefault();
            const bounds = world.canvas.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right
                || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) EventBus.emit('runner-move', Math.sign(dx));
            else if (dy < -40 && Math.abs(dy) > Math.abs(dx)) EventBus.emit('runner-advance');
            else if (Math.hypot(dx, dy) < 18 && start.gate !== null
                && world.pick(event.clientX, event.clientY) === start.gate) EventBus.emit('runner-choose', start.gate);
        };
        const pointerCancel = (event: PointerEvent) => {
            pointers.delete(event.pointerId);
            if (gesture?.id === event.pointerId) gesture = undefined;
        };
        const cancelOnState = (state: RunnerSnapshot) => {
            if (state.paused || state.phase !== 'choose') clearGesture();
        };
        const contextLost = (event: Event) => {
            event.preventDefault();
            fail('A cena em 3D foi interrompida. Você pode recomeçar a fase na versão leve.');
        };
        const visibilityChanged = () => {
            previousTime = 0;
            clearGesture();
            const state = controller?.snapshot;
            if (document.hidden && state && state.phase !== 'ready' && state.phase !== 'celebrate')
            {
                EventBus.emit('runner-pause', true);
            }
        };
        const motionChanged = (event: MediaQueryListEvent) => { reducedMotion = event.matches; };
        const resize = () => {
            if (!world || stopped) return;
            const { width, height } = host.getBoundingClientRect();
            if (width <= 0 || height <= 0) return;
            world.resize(width, height);
        };
        const step = (now: number) => {
            if (cancelled || stopped || !world || !controller) return;
            const dt = previousTime === 0 ? 0 : Math.max(0, Math.min(now - previousTime, 50));
            previousTime = now;
            try
            {
                controller.update(dt);
                const frame = controller.frame;
                world.update(frame, frame.paused ? 0 : dt / 1000, reducedMotion);
                world.render();
                frameRequest = window.requestAnimationFrame(step);
            }
            catch
            {
                fail('A cena em 3D não pôde continuar. Você pode recomeçar a fase na versão leve.');
            }
        };

        void (async () => {
            try
            {
                const [module] = await Promise.all([
                    import('./game/three/RunnerWorld3D'),
                    document.fonts.ready
                ]);
                if (cancelled) return;
                world = new module.RunnerWorld3D(host);
                const canvas = world.canvas;
                canvas.style.touchAction = 'none';
                canvas.setAttribute('aria-hidden', 'true');
                canvas.addEventListener('webglcontextlost', contextLost);
                removeListeners.push(() => canvas.removeEventListener('webglcontextlost', contextLost));
                resize();
                world.render();
                // Inicialização e primeira renderização precisam funcionar antes de habilitar uma partida.
                controller = new RunnerController();
                world.update(controller.frame, 0, reducedMotion);
                world.render();
                if (typeof ResizeObserver !== 'undefined')
                {
                    resizeObserver = new ResizeObserver(resize);
                    resizeObserver.observe(host);
                }
                window.addEventListener('resize', resize);
                window.addEventListener('keydown', handleKey);
                document.addEventListener('visibilitychange', visibilityChanged);
                motionPreference.addEventListener('change', motionChanged);
                canvas.addEventListener('pointerdown', pointerDown, { passive: false });
                canvas.addEventListener('pointerup', pointerUp, { passive: false });
                canvas.addEventListener('pointercancel', pointerCancel);
                canvas.addEventListener('lostpointercapture', pointerCancel);
                EventBus.on('runner-state', cancelOnState);
                removeListeners.push(
                    () => window.removeEventListener('resize', resize),
                    () => window.removeEventListener('keydown', handleKey),
                    () => document.removeEventListener('visibilitychange', visibilityChanged),
                    () => motionPreference.removeEventListener('change', motionChanged),
                    () => canvas.removeEventListener('pointerdown', pointerDown),
                    () => canvas.removeEventListener('pointerup', pointerUp),
                    () => canvas.removeEventListener('pointercancel', pointerCancel),
                    () => canvas.removeEventListener('lostpointercapture', pointerCancel),
                    () => EventBus.off('runner-state', cancelOnState)
                );
                setLoading(false);
                EventBus.emit('runner-ready');
                EventBus.emit('runner-state-request');
                frameRequest = window.requestAnimationFrame(step);
            }
            catch
            {
                fail('A cena em 3D não abriu neste aparelho. Você pode jogar na versão leve.');
            }
        })();

        return () => {
            cancelled = true;
            dispose();
        };
    }, [failed, light]);

    useEffect(() => {
        if (failed && !document.querySelector('dialog[open]')) fallbackButton.current?.focus({ preventScroll: true });
    }, [failed]);

    if (light) return <LightGame word={word} mode="runner" />;

    return <>
        <div
            id="game-container"
            className="runner-3d-container"
            ref={container}
            tabIndex={0}
            role="application"
            aria-busy={loading}
            aria-label={`Pista de letras de ${word}. Use esquerda e direita para escolher um caminho e seta para cima para avançar. Na tela, toque na letra ou use os botões de direção e Avançar.`}
        />
        {(loading || failed) && <div className="runner-3d-status" data-state={failed ? 'error' : 'loading'}>
            <div className="runner-3d-status-content">
                <p role="status" aria-live="polite">{failed ?? 'Preparando o bosque em 3D…'}</p>
                {failed && <button ref={fallbackButton} type="button" className="expedition-primary" onClick={() => setLight(true)}>Jogar na versão leve</button>}
            </div>
        </div>}
    </>;
}
