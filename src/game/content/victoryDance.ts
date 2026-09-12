/** One original eight-beat celebration at 120 BPM, shared by both renderers. */
export const VICTORY_DANCE_DURATION = 4;

export type VictoryDancePose = {
    strength: number;
    /** Signed, normalized movement channels; the envelope is already applied. */
    sway: number;
    twist: number;
    /** Positive normalized channels, also enveloped. */
    bounce: number;
    leftStep: number;
    rightStep: number;
};

const still: Readonly<VictoryDancePose> = Object.freeze({
    strength: 0, sway: 0, twist: 0, bounce: 0, leftStep: 0, rightStep: 0,
});
const smooth = (value: number): number => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
};

/** Samples a finite phase clock. No timers, accumulated state or looping after four seconds. */
export function sampleVictoryDance(time?: number, reducedMotion = false): Readonly<VictoryDancePose> {
    if (reducedMotion || time === undefined || !Number.isFinite(time) || time <= 0 || time >= VICTORY_DANCE_DURATION) return still;
    const strength = smooth(time / 0.20) * (1 - smooth((time - 3.70) / 0.30));
    const stepping = 1 - smooth((time - 2.55) / 0.25);
    const rhythm = Math.sin(time * Math.PI * 2);
    const jump = time > 2.8 && time < 3.3 ? Math.sin((time - 2.8) / 0.5 * Math.PI) : 0;
    return {
        strength,
        sway: rhythm * stepping * strength,
        twist: Math.sin(time * Math.PI * 2 + Math.PI / 3) * stepping * strength,
        bounce: (Math.abs(Math.sin(time * Math.PI * 4)) * 0.18 * stepping + jump) * strength,
        leftStep: Math.max(0, rhythm) * stepping * strength,
        rightStep: Math.max(0, -rhythm) * stepping * strength,
    };
}
