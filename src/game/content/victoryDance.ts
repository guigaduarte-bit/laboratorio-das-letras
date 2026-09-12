/** Original, finite choreography shared by both renderers. Times are phase seconds. */
export const VICTORY_DANCE_LEAD_IN = 0.75;
export const VICTORY_DANCE_DURATION = 6;

export type VictoryDancePose = {
    strength: number;
    /** Signed, normalized movement channels; no renderer units or world placement. */
    sway: number;
    twist: number;
    /** Positive channels. Every pose already includes its entrance/exit envelope. */
    bounce: number;
    leftStep: number;
    rightStep: number;
    leftTap: number;
    rightTap: number;
    leftArm: number;
    rightArm: number;
    crouch: number;
    open: number;
};

const still: Readonly<VictoryDancePose> = Object.freeze({
    strength: 0, sway: 0, twist: 0, bounce: 0, leftStep: 0, rightStep: 0,
    leftTap: 0, rightTap: 0, leftArm: 0, rightArm: 0, crouch: 0, open: 0,
});
const smooth = (value: number): number => value * value * (3 - 2 * value);
const pose = (values: Partial<VictoryDancePose> = {}): Readonly<VictoryDancePose> => ({ ...still, strength: 1, ...values });
type Keyframe = { time: number; pose: Readonly<VictoryDancePose> };

// Explicit poses make each phrase different: step–touch, mirrored step–touch,
// two forward taps with separate arm/paw salutes, prepare, hop, star and settle.
// The initial quiet interval lets the world finish turning toward the player.
const choreography: readonly Keyframe[] = [
    { time: 0, pose: still },
    { time: 0.55, pose: still },
    { time: VICTORY_DANCE_LEAD_IN, pose: pose() },
    { time: 1.00, pose: pose({ sway: -1, twist: -0.45, leftStep: 1, leftArm: 0.60, rightArm: 0.15 }) },
    { time: 1.22, pose: pose({ sway: -1, twist: -0.15, rightStep: 0.65, leftArm: 0.35, rightArm: 0.15 }) },
    { time: 1.50, pose: pose() },
    { time: 1.75, pose: pose({ sway: 1, twist: 0.45, rightStep: 1, rightArm: 0.60, leftArm: 0.15 }) },
    { time: 1.97, pose: pose({ sway: 1, twist: 0.15, leftStep: 0.65, rightArm: 0.35, leftArm: 0.15 }) },
    { time: 2.25, pose: pose() },
    { time: 2.52, pose: pose({ twist: 0.7, leftTap: 1, leftArm: 1, rightArm: 0.12 }) },
    { time: 2.72, pose: pose({ twist: 0.7, leftTap: 1, leftArm: 1, rightArm: 0.12 }) },
    { time: 3.00, pose: pose() },
    { time: 3.27, pose: pose({ twist: -0.7, rightTap: 1, rightArm: 1, leftArm: 0.12 }) },
    { time: 3.47, pose: pose({ twist: -0.7, rightTap: 1, rightArm: 1, leftArm: 0.12 }) },
    { time: 3.75, pose: pose() },
    { time: 4.04, pose: pose({ crouch: 1, leftArm: 0.12, rightArm: 0.12 }) },
    { time: 4.15, pose: pose({ crouch: 1, leftArm: 0.12, rightArm: 0.12 }) },
    { time: 4.40, pose: pose({ bounce: 1, leftArm: 0.95, rightArm: 0.95, open: 1 }) },
    { time: 4.65, pose: pose({ crouch: 0.3, leftArm: 0.95, rightArm: 0.95, open: 1 }) },
    { time: 4.85, pose: pose({ leftArm: 0.95, rightArm: 0.95, open: 1 }) },
    { time: 5.50, pose: pose({ leftArm: 0.95, rightArm: 0.95, open: 1 }) },
    { time: VICTORY_DANCE_DURATION, pose: still },
];

/** Samples keyframes with eased, continuous joints; no timers, state or looping. */
export function sampleVictoryDance(time?: number, reducedMotion = false): Readonly<VictoryDancePose> {
    if (reducedMotion || time === undefined || !Number.isFinite(time) || time <= 0 || time >= VICTORY_DANCE_DURATION) return still;
    const nextIndex = choreography.findIndex((keyframe) => keyframe.time >= time);
    const from = choreography[nextIndex - 1];
    const to = choreography[nextIndex];
    const mix = smooth((time - from.time) / (to.time - from.time));
    const result = { ...still };
    for (const key of Object.keys(still) as (keyof VictoryDancePose)[]) {
        result[key] = from.pose[key] + (to.pose[key] - from.pose[key]) * mix;
    }
    return result;
}
