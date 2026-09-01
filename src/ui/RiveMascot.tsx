import {
    Alignment,
    Fit,
    Layout,
    useRive,
    useViewModel,
    useViewModelInstance,
    useViewModelInstanceBoolean,
    useViewModelInstanceTrigger
} from '@rive-app/react-canvas';
import { useEffect } from 'react';
import type { MascotState } from './MascotGuide';

type RiveMascotProps = {
    state: MascotState;
    onLoadError: () => void;
};

const RIVE_LAYOUT = new Layout({
    fit: Fit.Contain,
    alignment: Alignment.Center
});

export function RiveMascot({ state, onLoadError }: RiveMascotProps)
{
    const { rive, RiveComponent } = useRive({
        src: '/assets/rive/pisco.riv',
        artboard: 'Mascot',
        stateMachine: 'MascotState',
        autoplay: true,
        autoBind: true,
        layout: RIVE_LAYOUT,
        automaticallyHandleEvents: false,
        onLoadError
    });
    const viewModel = useViewModel(rive, { useDefault: true });
    const instance = useViewModelInstance(viewModel, { useDefault: true, rive });
    const { trigger: listen } = useViewModelInstanceTrigger('listen', instance);
    const { trigger: think } = useViewModelInstanceTrigger('think', instance);
    const { trigger: hint } = useViewModelInstanceTrigger('hint', instance);
    const { trigger: happy } = useViewModelInstanceTrigger('happy', instance);
    const { trigger: celebrate } = useViewModelInstanceTrigger('celebrate', instance);
    const { trigger: reset } = useViewModelInstanceTrigger('reset', instance);
    const { setValue: setReducedMotion } = useViewModelInstanceBoolean(
        'reducedMotion',
        instance
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncMotionPreference = (): void => setReducedMotion(mediaQuery.matches);

        syncMotionPreference();
        mediaQuery.addEventListener('change', syncMotionPreference);

        return () => mediaQuery.removeEventListener('change', syncMotionPreference);
    }, [setReducedMotion]);

    useEffect(() => {
        if (!instance)
        {
            return;
        }

        const triggers: Record<MascotState, () => void> = {
            idle: reset,
            ouvindo: listen,
            pensando: think,
            dando_dica: hint,
            feliz: happy,
            comemorando: celebrate
        };

        triggers[state]();
    }, [celebrate, happy, hint, instance, listen, reset, state, think]);

    return (
        <RiveComponent
            className="mascot-guide__rive"
            aria-hidden="true"
        />
    );
}
