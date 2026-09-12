import { RUNNER_TIMINGS } from '../content/runnerPace';
import type { RunnerPhase } from '../content/runner';
import { VICTORY_DANCE_LEAD_IN } from '../content/victoryDance';

type Encounter = {
    progress: number;
    reveal: number;
    greeting: number;
    time: number;
    explorerX: number;
    explorerZ: number;
    animalX: number;
    animalZ: number;
};

const smooth = (value: number): number => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
};

/** The final journey becomes a meeting. Both rigs share one clock through the phase transition. */
export function sampleAnimalEncounter(phase: RunnerPhase, elapsedMs: number, sidePanel: boolean): Encounter {
    const finishSeconds = RUNNER_TIMINGS.finish / 1000;
    const progress = phase === 'finish' ? smooth(elapsedMs / RUNNER_TIMINGS.finish) : phase === 'celebrate' ? 1 : 0;
    const clock = phase === 'finish' ? elapsedMs / 1000 : phase === 'celebrate' ? finishSeconds + elapsedMs / 1000 : 0;
    return {
        progress,
        reveal: smooth((progress - 0.34) / 0.30),
        greeting: smooth((progress - 0.58) / 0.30),
        time: Math.max(0, clock - finishSeconds * 0.62),
        explorerX: sidePanel ? -3.8 : -1.4,
        explorerZ: 2.45,
        animalX: sidePanel ? -1.4 : 1.3,
        animalZ: 1.95,
    };
}

/** +Z is the face direction of both models. Avoid a full spin across the -π/π seam. */
export function dampFacing(current: number, target: number, deltaSeconds: number): number {
    const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + difference * (1 - Math.exp(-Math.max(0, deltaSeconds) * 8));
}

export function facingPartner(fromX: number, fromZ: number, toX: number, toZ: number): number {
    return Math.atan2(toX - fromX, toZ - fromZ);
}

/** Turn from the meeting toward the audience before the first choreographed step. */
export function celebrationFacing(partnerYaw: number, audienceYaw: number, elapsedMs: number, reducedMotion: boolean): number {
    const amount = reducedMotion ? 1 : smooth(elapsedMs / (VICTORY_DANCE_LEAD_IN * 1000));
    const arc = Math.atan2(Math.sin(audienceYaw - partnerYaw), Math.cos(audienceYaw - partnerYaw));
    return partnerYaw + arc * amount;
}
