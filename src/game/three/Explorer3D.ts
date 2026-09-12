import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getCharacter, type CharacterId } from '../content/characters';
import { sampleVictoryDance } from '../content/victoryDance';
import { CompanionExplorer3D, groundExplorerFeet } from './CompanionExplorer3D';

export type ExplorerFrame = {
    /** Seconds. The parent can freeze time and delta while the game is paused. */
    time: number;
    delta: number;
    moving: number;
    /** Relative walking cadence; keeps the steps in sync with faster ground travel. */
    pace?: number;
    laneLean: number;
    ringCount: number;
    /** Progress of the current collection, from 0 to 1; 0 when inactive. */
    collect: number;
    celebrate: number;
    /** Blend of the animal greeting; the world's placement continues to own the facing direction. */
    greeting?: number;
    /** Seconds since this encounter began, shared with the responding animal and frozen on pause. */
    greetingTime?: number;
    /** Seconds since entering the final celebration; undefined outside it, frozen on pause. */
    victoryTime?: number;
    reducedMotion: boolean;
};

const MAX_RINGS = 24;
const RING_SPACING = 0.055;
const clamp = THREE.MathUtils.clamp;
const lumiFoot = new THREE.Box3(new THREE.Vector3(-0.165, -0.58, -0.165), new THREE.Vector3(0.165, -0.262, 0.325));

/** Original toy explorer. Feet are at y=0 and the face points toward +Z. */
class LumiExplorer3D {
    readonly root = new THREE.Group();

    private readonly rig = new THREE.Group();
    private readonly head = new THREE.Group();
    private readonly shoulders = new THREE.Group();
    private readonly antenna = new THREE.Group();
    private readonly eyes: THREE.Group[] = [];
    private readonly arms: THREE.Group[] = [];
    private readonly hands: THREE.Group[] = [];
    private readonly legs: THREE.Group[] = [];
    private readonly rings: THREE.Mesh[] = [];
    private readonly ringAge = Array<number>(MAX_RINGS).fill(-1);
    private readonly geometries = new Set<THREE.BufferGeometry>();
    private readonly materials = new Set<THREE.Material>();
    private readonly boxCache = new Map<string, THREE.BufferGeometry>();
    private readonly sphere: THREE.SphereGeometry;
    private readonly torso: THREE.Mesh;
    private readonly chest: THREE.Group;
    private readonly beacon: THREE.MeshStandardMaterial;
    private growth = 0;
    private stride = 0;
    private clock = 0;
    private movement = 0;
    private previousRingCount = 0;
    private disposed = false;

    constructor() {
        this.root.name = 'Lumi • explorador do bosque';
        this.rig.name = 'explorer-body';
        this.rig.scale.setScalar(0.92);
        this.head.name = 'explorer-head';
        this.root.add(this.rig);
        this.sphere = this.track(new THREE.SphereGeometry(1, 20, 14));

        const sage = this.material(0x7eaca0, 0.48, 0.10);
        const deepSage = this.material(0x355d54, 0.60, 0.12);
        const cream = this.material(0xf4ecd7, 0.47, 0.06);
        const sand = this.material(0xdccb9d, 0.53, 0.10);
        const dark = this.material(0x233d3e, 0.37, 0.15);
        const visor = this.material(0x163235, 0.24, 0.25);
        const amber = this.material(0xe8b747, 0.38, 0.15);
        const glow = this.material(0xffd978, 0.32, 0.02, 0xffb634, 0.66);
        this.beacon = this.material(0xffd16a, 0.32, 0.04, 0xffbf44, 0.70);

        // A sand-coloured telescoping torso stays inside the complete ring stack.
        this.torso = this.box(this.rig, sand, 0.63, 0.58, 0.52, 0.12, 0, 0.91, 0);
        this.box(this.rig, deepSage, 0.69, 0.16, 0.55, 0.06, 0, 0.65, 0);
        this.box(this.rig, sage, 0.54, 0.13, 0.44, 0.05, 0, 0.56, -0.01);

        this.chest = new THREE.Group();
        this.chest.position.y = 1.12;
        this.rig.add(this.chest);
        this.box(this.chest, sage, 0.66, 0.25, 0.56, 0.10, 0, 0, 0);
        this.box(this.chest, cream, 0.21, 0.18, 0.055, 0.025, 0, 0.006, 0.298);
        // A tiny raised flask emblem, modelled in geometry rather than a texture.
        const flask = new THREE.Group();
        flask.position.set(0, -0.008, 0.335);
        this.chest.add(flask);
        this.ball(flask, deepSage, 0.046, 0.042, 0.016, 0, -0.016, 0);
        this.box(flask, deepSage, 0.023, 0.06, 0.025, 0.006, 0, 0.03, 0);
        this.box(flask, deepSage, 0.043, 0.014, 0.025, 0.005, 0, 0.059, 0);
        this.ball(flask, amber, 0.03, 0.014, 0.009, 0, -0.025, 0.016);

        // A compact backpack and shoulder straps make the explorer readable from behind.
        this.box(this.chest, deepSage, 0.43, 0.40, 0.23, 0.07, 0, -0.06, -0.35);
        this.box(this.chest, sage, 0.35, 0.31, 0.13, 0.06, 0, -0.043, -0.48);
        this.box(this.chest, sand, 0.29, 0.055, 0.025, 0.01, 0, 0.04, -0.555);
        this.box(this.chest, sand, 0.29, 0.055, 0.025, 0.01, 0, -0.10, -0.555);
        [-1, 1].forEach((side) => {
            this.box(this.chest, cream, 0.065, 0.18, 0.61, 0.025, side * 0.225, 0.014, -0.022);
        });

        this.shoulders.position.y = 1.16;
        this.rig.add(this.shoulders);
        [-1, 1].forEach((side) => {
            const arm = new THREE.Group();
            arm.name = side < 0 ? 'explorer-arm-left' : 'explorer-arm-right';
            arm.position.set(side * 0.445, 0, 0);
            this.shoulders.add(arm);
            this.arms.push(arm);
            this.ball(arm, dark, 0.11, 0.11, 0.11, 0, -0.035, 0);
            this.box(arm, cream, 0.235, 0.28, 0.27, 0.09, side * 0.016, -0.11, 0);
            this.ball(arm, deepSage, 0.09, 0.09, 0.09, 0, -0.29, 0);
            this.box(arm, sage, 0.18, 0.19, 0.20, 0.07, 0, -0.35, 0.012);
            const hand = new THREE.Group();
            hand.name = side < 0 ? 'explorer-hand-left' : 'explorer-hand-right';
            hand.position.set(0, -0.42, 0.025);
            arm.add(hand);
            this.hands.push(hand);
            this.ball(hand, dark, 0.11, 0.12, 0.12, 0, -0.045, 0);
            this.ball(hand, dark, 0.048, 0.064, 0.062, -side * 0.082, -0.016, 0.063);

            const leg = new THREE.Group();
            leg.name = side < 0 ? 'explorer-leg-left' : 'explorer-leg-right';
            leg.position.set(side * 0.225, 0.58, 0);
            this.rig.add(leg);
            this.legs.push(leg);
            this.box(leg, dark, 0.17, 0.28, 0.20, 0.05, 0, -0.12, 0);
            this.ball(leg, sand, 0.12, 0.11, 0.12, 0, -0.26, 0);
            this.box(leg, amber, 0.30, 0.27, 0.43, 0.09, 0, -0.397, 0.075);
            this.box(leg, deepSage, 0.33, 0.09, 0.49, 0.035, 0, -0.535, 0.08);
            this.box(leg, cream, 0.23, 0.06, 0.045, 0.017, 0, -0.355, 0.286);
        });

        this.rig.add(this.head);
        this.head.position.y = 1.58;
        this.ball(this.head, dark, 0.17, 0.14, 0.17, 0, -0.34, 0);
        this.box(this.head, sage, 1.0, 0.68, 0.72, 0.23, 0, 0, 0);
        this.box(this.head, cream, 0.90, 0.55, 0.21, 0.10, 0, 0.004, 0.292);
        this.box(this.head, visor, 0.80, 0.445, 0.15, 0.075, 0, 0.018, 0.385);
        // Two dimensional eye rigs allow a soft blink without scaling the head.
        [-1, 1].forEach((side) => {
            const eye = new THREE.Group();
            eye.position.set(side * 0.17, 0.046, 0.465);
            this.head.add(eye);
            this.eyes.push(eye);
            this.ball(eye, glow, 0.070, 0.098, 0.027, 0, 0, 0);
            this.ball(eye, cream, 0.019, 0.026, 0.009, -0.017, 0.031, 0.024);
            this.ball(this.head, sand, 0.053, 0.035, 0.025, side * 0.294, -0.112, 0.455);

            // Flush ear discs and inset screws catch light in a three-quarter view.
            this.ball(this.head, deepSage, 0.075, 0.14, 0.13, side * 0.485, -0.01, -0.015);
            this.ball(this.head, sand, 0.034, 0.075, 0.076, side * 0.542, -0.01, -0.015);
        });

        const smilePoints = [
            new THREE.Vector3(-0.071, -0.104, 0.468),
            new THREE.Vector3(0, -0.126, 0.474),
            new THREE.Vector3(0.071, -0.104, 0.468),
        ];
        this.mesh(this.head, this.track(new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(smilePoints), 12, 0.011, 5, false,
        )), glow);
        this.box(this.head, cream, 0.32, 0.055, 0.024, 0.01, 0, 0.087, -0.365);
        this.box(this.head, deepSage, 0.28, 0.045, 0.025, 0.01, 0, -0.087, -0.367);

        this.antenna.position.set(0.13, 0.32, -0.045);
        this.antenna.rotation.z = -0.18;
        this.head.add(this.antenna);
        this.ball(this.antenna, sand, 0.078, 0.045, 0.078, 0, 0, 0);
        const stem = this.mesh(this.antenna, this.track(new THREE.CylinderGeometry(0.019, 0.025, 0.205, 10)), deepSage);
        stem.position.y = 0.104;
        this.ball(this.antenna, this.beacon, 0.073, 0.073, 0.073, 0, 0.235, 0);

        const ringGeometry = this.track(new THREE.TorusGeometry(0.416, 0.047, 10, 40));
        const ringPalette = [0xe9b849, 0xe4a082, 0x81b9a9, 0xb9c67f, 0xf1ce73, 0xc9a2b6];
        const ringMaterials = ringPalette.map((color) => this.material(color, 0.30, 0.17));
        for (let i = 0; i < MAX_RINGS; i += 1) {
            const ring = this.mesh(this.rig, ringGeometry, ringMaterials[Math.floor(i / 3) % ringMaterials.length]);
            ring.name = `Anel ${i + 1}`;
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.66 + i * RING_SPACING;
            ring.visible = false;
            this.rings.push(ring);
        }
    }

    update(frame: ExplorerFrame): void {
        if (this.disposed) return;
        const delta = clamp(Number.isFinite(frame.delta) ? frame.delta : 0, 0, 0.05);
        const ringCount = clamp(Math.floor(Number.isFinite(frame.ringCount) ? frame.ringCount : 0), 0, MAX_RINGS);
        const reduced = frame.reducedMotion;
        const dance = sampleVictoryDance(frame.victoryTime, reduced);
        const greeting = clamp(Number.isFinite(frame.greeting) ? frame.greeting! : 0, 0, 1) * (1 - dance.strength);
        // A short call followed by the animal's reply, then a quiet pause. The encounter
        // clock starts at zero rather than joining an arbitrary global animation phase.
        const encounterTime = Math.max(0, Number.isFinite(frame.greetingTime) ? frame.greetingTime! : 0);
        const greetingPhase = encounterTime % 6.4;
        const waveEnvelope = THREE.MathUtils.smoothstep(greetingPhase, 0.15, 0.55)
            * (1 - THREE.MathUtils.smoothstep(greetingPhase, 1.9, 2.3));
        const greetingPose = greeting * (reduced ? 0.65 : waveEnvelope);
        const wave = reduced ? 0 : Math.sin(Math.max(0, greetingPhase - 0.55) * Math.PI * 4) * greetingPose;
        const celebration = Number.isFinite(frame.victoryTime) ? 0 : clamp(frame.celebrate || 0, 0, 1) * (1 - greeting);
        const collection = clamp(frame.collect || 0, 0, 1);
        const moving = clamp(frame.moving || 0, 0, 1);
        const lean = clamp(frame.laneLean || 0, -1, 1);
        this.clock += delta;
        this.movement = reduced ? moving : THREE.MathUtils.damp(this.movement, moving, 12, delta);
        const pace = clamp(Number.isFinite(frame.pace) ? frame.pace! : 1, 0.7, 1.6);
        this.stride += delta * (7 + this.movement * 4) * this.movement * pace;

        if (ringCount < this.previousRingCount) {
            // A new mission resets immediately; rings from the previous animal never linger.
            this.growth = Math.max(0, ringCount * RING_SPACING - 0.30);
            for (let i = ringCount; i < MAX_RINGS; i += 1) this.ringAge[i] = -1;
        }
        for (let i = this.previousRingCount; i < ringCount; i += 1) {
            this.ringAge[i] = -(i - this.previousRingCount) * 0.065;
        }
        this.previousRingCount = ringCount;
        const targetGrowth = Math.max(0, ringCount * RING_SPACING - 0.30);
        this.growth = reduced ? targetGrowth : THREE.MathUtils.damp(this.growth, targetGrowth, 11, delta);

        const breath = reduced ? 0 : Math.sin(this.clock * 2.1) * 0.011 * (1 - this.movement);
        const strideBob = reduced ? 0 : Math.abs(Math.sin(this.stride)) * 0.035 * this.movement;
        const collectHop = reduced ? 0 : Math.sin(collection * Math.PI) * 0.20;
        const celebrateHop = reduced ? 0 : Math.max(0, Math.sin(this.clock * 5)) * celebration * 0.085;
        this.rig.position.x = dance.sway * 0.045;
        this.rig.position.y = strideBob + collectHop + celebrateHop + dance.bounce * 0.065 - dance.crouch * 0.055;
        this.rig.rotation.z = (reduced ? 0 : -lean * 0.105 - Math.sin(this.stride) * this.movement * 0.025) - dance.sway * 0.025;
        this.rig.rotation.x = (reduced ? 0 : this.movement * 0.07) + greetingPose * 0.035;
        this.rig.rotation.y = dance.twist * 0.08;

        this.torso.position.y = 0.91 + (this.growth + breath) / 2;
        this.torso.scale.y = 1 + (this.growth + breath) / 0.58;
        this.chest.position.y = 1.12 + this.growth + breath;
        this.shoulders.position.y = 1.16 + this.growth + breath;
        this.head.position.y = 1.58 + this.growth + breath;
        this.head.rotation.z = reduced ? 0 : lean * 0.045 + Math.sin(this.clock * 1.7) * 0.022 * (1 - this.movement);
        this.head.rotation.x = reduced ? 0 : -this.movement * 0.055 - Math.sin(collection * Math.PI) * 0.06;
        this.head.rotation.y = reduced ? 0 : Math.sin(this.clock * 0.87) * 0.025 * (1 - this.movement);
        this.head.rotation.x += greeting * 0.065 + greetingPose * 0.085;
        this.head.rotation.z += greetingPose * -0.06;
        this.head.rotation.z += dance.sway * 0.055;
        this.head.rotation.x += dance.crouch * 0.09 - dance.open * 0.045;
        this.antenna.rotation.z = -0.18 + (reduced ? 0 : Math.sin(this.stride + 0.8) * this.movement * 0.06);
        this.beacon.emissiveIntensity = 0.70 + Math.sin(collection * Math.PI) * 0.7 + (celebration + dance.strength) * 0.2;

        const blinkPhase = this.clock % 5.7;
        const blink = !reduced && blinkPhase > 5.48 ? 1 - Math.sin((blinkPhase - 5.48) / 0.22 * Math.PI) * 0.91 : 1;
        for (const eye of this.eyes) eye.scale.y = blink;

        this.arms.forEach((arm, index) => {
            const side = index === 0 ? -1 : 1;
            // Bring the shoulders inward a little while lifting the arms so the
            // swept hands stay inside the encounter's reserved camera envelope.
            arm.position.x = side * (0.445 - dance.strength * 0.205);
            const swing = reduced ? 0 : Math.sin(this.stride + index * Math.PI) * this.movement * 0.53;
            arm.rotation.x = swing * (1 - celebration) - celebration * 0.35;
            arm.rotation.z = side * (0.09 + celebration * 2.25 + (reduced ? 0 : Math.sin(collection * Math.PI) * 0.33));
            if (!reduced) arm.rotation.z += side * celebration * Math.sin(this.clock * 6) * 0.075;
            // Only the right arm reaches toward +Z. The free arm stays relaxed so the
            // greeting reads as a directed exchange rather than another victory pose.
            if (index === 1) {
                arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -1.30, greetingPose);
                arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0.72, greetingPose);
            }
            // Separate salutes distinguish the forward taps from the side steps;
            // both arms open together only for the hop and held final pose.
            const raise = index === 0 ? dance.leftArm : dance.rightArm;
            const tap = index === 0 ? dance.leftTap : dance.rightTap;
            arm.rotation.x = arm.rotation.x * (1 - dance.strength) - raise * 0.20 - tap * 0.22;
            arm.rotation.z = arm.rotation.z * (1 - dance.strength) + side * (dance.strength * 0.22 + raise * 1.90 + dance.open * 0.20);
            this.hands[index].rotation.z = index === 1 ? wave * 0.34 : 0;
            this.hands[index].rotation.y = index === 1 ? wave * 0.16 : 0;
            this.hands[index].rotation.z += side * dance.twist * 0.18;
        });
        this.legs.forEach((leg, index) => {
            const phase = this.stride + index * Math.PI;
            leg.rotation.x = reduced ? 0 : Math.sin(phase) * this.movement * 0.43 * (1 - celebration);
            leg.position.y = 0.58 + (reduced ? 0 : Math.max(0, -Math.sin(phase)) * this.movement * 0.06);
            const step = index === 0 ? dance.leftStep : dance.rightStep;
            const tap = index === 0 ? dance.leftTap : dance.rightTap;
            const side = index === 0 ? -1 : 1;
            leg.position.x = side * (0.225 + step * 0.075 + dance.open * 0.055);
            leg.position.z = tap * 0.14;
            leg.rotation.x -= step * 0.20 + tap * 0.30 - dance.crouch * 0.13;
            leg.rotation.z = side * (step * 0.10 + dance.open * 0.075);
            leg.position.y += step * 0.10 + tap * 0.025;
        });
        groundExplorerFeet(this.rig, this.legs, lumiFoot);

        for (let i = 0; i < MAX_RINGS; i += 1) {
            const ring = this.rings[i];
            if (i >= ringCount) {
                ring.visible = false;
                continue;
            }
            this.ringAge[i] = reduced ? 0.56 : this.ringAge[i] + delta;
            const progress = reduced ? 1 : clamp(this.ringAge[i] / 0.56, 0, 1);
            ring.visible = reduced || this.ringAge[i] >= 0;
            const remaining = 1 - progress;
            // A small spring settles every new torus around the body in sequence.
            const spring = 1 + 2.3 * Math.pow(progress - 1, 3) + 1.3 * Math.pow(progress - 1, 2);
            ring.scale.setScalar(0.18 + spring * 0.82);
            ring.position.y = 0.66 + i * RING_SPACING + remaining * remaining * 0.37;
            ring.rotation.x = -Math.PI / 2 + remaining * 0.28;
            ring.rotation.z = reduced ? 0 : remaining * (i % 2 ? -0.16 : 0.16);
        }
    }

    getHeight(): number {
        return (2.21 + this.growth) * 0.92 + this.rig.position.y;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.root.removeFromParent();
        this.root.clear();
        this.geometries.forEach((geometry) => geometry.dispose());
        this.materials.forEach((material) => material.dispose());
        this.geometries.clear();
        this.materials.clear();
        this.boxCache.clear();
    }

    private track<T extends THREE.BufferGeometry>(geometry: T): T {
        this.geometries.add(geometry);
        return geometry;
    }

    private material(color: number, roughness: number, metalness: number, emissive = 0, intensity = 0): THREE.MeshStandardMaterial {
        const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: intensity });
        this.materials.add(material);
        return material;
    }

    private mesh(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    private box(parent: THREE.Group, material: THREE.Material, width: number, height: number, depth: number, radius: number, x: number, y: number, z: number): THREE.Mesh {
        const key = `${width}:${height}:${depth}:${radius}`;
        let geometry = this.boxCache.get(key);
        if (!geometry) {
            geometry = this.track(new RoundedBoxGeometry(width, height, depth, 3, radius));
            this.boxCache.set(key, geometry);
        }
        const mesh = this.mesh(parent, geometry, material);
        mesh.position.set(x, y, z);
        return mesh;
    }

    private ball(parent: THREE.Group, material: THREE.Material, width: number, height: number, depth: number, x: number, y: number, z: number): THREE.Mesh {
        const mesh = this.mesh(parent, this.sphere, material);
        mesh.scale.set(width, height, depth);
        mesh.position.set(x, y, z);
        return mesh;
    }
}

/** Stable placement node: switching an explorer never changes the world's facing or position. */
export class Explorer3D {
    readonly root = new THREE.Group();
    private character: CharacterId;
    private model: LumiExplorer3D | CompanionExplorer3D;
    private lastFrame?: ExplorerFrame;
    private disposed = false;

    constructor(character: CharacterId = 'lumi') {
        this.character = getCharacter(character).id;
        this.model = this.createModel(this.character);
        this.root.name = `Explorador • ${getCharacter(this.character).name}`;
        this.root.add(this.model.root);
    }

    setCharacter(id: CharacterId): void {
        const character = getCharacter(id).id;
        if (this.disposed || character === this.character) return;
        const next = this.createModel(character);
        this.model.dispose();
        this.model = next;
        this.character = character;
        this.root.name = `Explorador • ${getCharacter(character).name}`;
        this.root.add(next.root);
        if (this.lastFrame) {
            // If a renderer restores a preference mid-session, preserve its current ring stack.
            next.update({ ...this.lastFrame, delta: 0, reducedMotion: true });
            next.update({ ...this.lastFrame, delta: 0 });
        }
    }

    update(frame: ExplorerFrame): void {
        if (this.disposed) return;
        this.lastFrame = frame;
        this.model.update(frame);
    }

    getHeight(): number { return this.model.getHeight(); }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.model.dispose();
        this.root.removeFromParent();
        this.root.clear();
    }

    private createModel(character: CharacterId): LumiExplorer3D | CompanionExplorer3D {
        return character === 'lumi' ? new LumiExplorer3D() : new CompanionExplorer3D(character);
    }
}
