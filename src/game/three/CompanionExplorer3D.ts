import * as THREE from 'three';
import type { ExplorerFrame } from './Explorer3D';

const MAX_RINGS = 24;
const SPACING = 0.055;
const clamp = THREE.MathUtils.clamp;
const footMatrix = new THREE.Matrix4();
const footCorner = new THREE.Vector3();
const companionFoot = new THREE.Box3(new THREE.Vector3(-0.15, -0.63, -0.135), new THREE.Vector3(0.15, -0.33, 0.228));

/** Ground each foot after limb rotation, without lifting the head or changing world placement. */
export function groundExplorerFeet(rig: THREE.Group, legs: THREE.Group[], footBounds: THREE.Box3): void {
    rig.updateMatrix();
    for (const leg of legs) {
        leg.updateMatrix();
        footMatrix.multiplyMatrices(rig.matrix, leg.matrix);
        let bottom = Infinity;
        for (const x of [footBounds.min.x, footBounds.max.x]) {
            for (const y of [footBounds.min.y, footBounds.max.y]) {
                for (const z of [footBounds.min.z, footBounds.max.z]) {
                    bottom = Math.min(bottom, footCorner.set(x, y, z).applyMatrix4(footMatrix).y);
                }
            }
        }
        if (bottom < 0) leg.position.y -= bottom / rig.matrix.elements[5];
    }
}

/** Original toy quadrupeds. Their four paws stay on the path as the ring-bearing body grows. */
export class CompanionExplorer3D {
    readonly root = new THREE.Group();
    private readonly rig = new THREE.Group();
    private readonly upper = new THREE.Group();
    private readonly head = new THREE.Group();
    private readonly tail = new THREE.Group();
    private readonly legs: THREE.Group[] = [];
    private readonly ears: THREE.Group[] = [];
    private readonly eyes: THREE.Group[] = [];
    private readonly rings: THREE.Mesh[] = [];
    private readonly ringAge = Array<number>(MAX_RINGS).fill(-1);
    private readonly geometries = new Set<THREE.BufferGeometry>();
    private readonly materials = new Set<THREE.Material>();
    private readonly sphere = this.track(new THREE.SphereGeometry(1, 20, 14));
    private readonly torso: THREE.Mesh;
    private growth = 0;
    private previousRingCount = 0;
    private clock = 0;
    private stride = 0;
    private movement = 0;
    private disposed = false;

    constructor(private readonly kind: 'unicorn' | 'dog') {
        const unicorn = kind === 'unicorn';
        this.root.name = unicorn ? 'Unicórnio • explorador' : 'Cachorro • explorador';
        this.rig.name = `${kind}-body`;
        this.head.name = `${kind}-head`;
        this.tail.name = `${kind}-tail`;
        this.rig.scale.setScalar(0.92);
        this.root.add(this.rig);
        this.rig.add(this.upper, this.head);

        const coat = this.material(unicorn ? 0xf8efdf : 0xc68a50);
        const cream = this.material(0xfff2d9);
        const dark = this.material(0x273a3b);
        const patch = this.material(unicorn ? 0xc7a2ca : 0x875c3d);
        const pink = this.material(0xe6aaa7);
        const mint = this.material(0x92c7b4);
        const gold = this.material(0xe9bd58, 0.32, 0.13);

        // The barrel torso, hips, four separate leg joints and animal head distinguish
        // these silhouettes from Lumi; no robot face or limb is reused.
        this.torso = this.ball(this.rig, coat, 0.33, 0.34, 0.37, 0, 0.82, 0);
        this.ball(this.upper, coat, 0.335, 0.20, 0.38, 0, 0.98, 0);
        this.ball(this.upper, cream, 0.23, 0.18, 0.06, 0, 0.94, 0.35);

        for (const z of [-0.23, 0.23]) {
            for (const side of [-1, 1]) {
                const leg = new THREE.Group();
                leg.name = `${kind}-leg-${z > 0 ? 'front' : 'back'}-${side < 0 ? 'left' : 'right'}`;
                leg.position.set(side * 0.23, 0.62, z);
                this.rig.add(leg);
                this.legs.push(leg);
                this.ball(leg, coat, 0.12, 0.25, 0.13, 0, -0.20, 0);
                this.ball(leg, unicorn ? patch : cream, 0.15, 0.15, 0.18, 0, -0.48, 0.045);
                if (!unicorn) {
                    for (const toe of [-1, 1]) this.ball(leg, coat, 0.022, 0.03, 0.018, toe * 0.055, -0.48, 0.21);
                }
            }
        }

        this.head.position.set(0, unicorn ? 1.44 : 1.38, 0.18);
        this.ball(this.head, coat, 0.25, 0.34, 0.24, 0, -0.24, -0.11);
        this.ball(this.head, coat, unicorn ? 0.35 : 0.41, unicorn ? 0.36 : 0.35, 0.33, 0, 0, 0);
        this.ball(this.head, cream, unicorn ? 0.29 : 0.30, 0.19, unicorn ? 0.24 : 0.18, 0, -0.14, 0.30);
        if (unicorn) {
            for (const side of [-1, 1]) this.ball(this.head, patch, 0.025, 0.019, 0.011, side * 0.13, -0.12, 0.526);
        } else {
            this.ball(this.head, dark, 0.10, 0.065, 0.058, 0, -0.082, 0.47);
            this.ball(this.head, pink, 0.065, 0.075, 0.025, 0, -0.29, 0.42);
            this.ball(this.head, patch, 0.15, 0.17, 0.05, -0.23, 0.055, 0.261);
        }
        for (const side of [-1, 1]) {
            const eye = new THREE.Group();
            eye.position.set(side * (unicorn ? 0.21 : 0.20), 0.045, 0.283);
            this.head.add(eye);
            this.eyes.push(eye);
            this.ball(eye, dark, 0.047, 0.065, 0.033, 0, 0, 0);
            this.ball(eye, cream, 0.015, 0.020, 0.010, -0.012, 0.019, 0.028);
            const ear = new THREE.Group();
            ear.name = `${kind}-ear-${side}`;
            ear.position.set(side * (unicorn ? 0.245 : 0.34), unicorn ? 0.29 : 0.14, -0.05);
            this.head.add(ear);
            this.ears.push(ear);
            if (unicorn) {
                this.ball(ear, coat, 0.095, 0.22, 0.075, 0, 0.09, 0);
                this.ball(ear, pink, 0.051, 0.14, 0.024, 0, 0.10, 0.060);
                ear.rotation.z = -side * 0.16;
            } else {
                this.ball(ear, patch, 0.145, 0.28, 0.105, side * 0.045, -0.16, 0);
                this.ball(ear, coat, 0.073, 0.18, 0.03, side * 0.05, -0.16, 0.09);
                ear.rotation.z = side * 0.18;
            }
        }

        this.upper.add(this.tail);
        this.tail.position.set(0, 0.94, -0.32);
        if (unicorn) {
            const horn = this.mesh(this.head, this.track(new THREE.ConeGeometry(0.09, 0.40, 16)), gold);
            horn.name = 'unicorn-horn';
            horn.position.set(0, 0.44, 0.12);
            horn.rotation.x = 0.10;
            // Rounded locks continue from the forelock down the back of the neck.
            const maneColors = [patch, mint, pink, gold];
            for (let i = 0; i < 6; i++) {
                this.ball(this.head, maneColors[i % maneColors.length], 0.13, 0.16, 0.16,
                    Math.sin(i * 0.9) * 0.05, 0.31 - i * 0.11, -0.18 - Math.sin(i / 5 * Math.PI) * 0.11);
            }
            for (let i = 0; i < 3; i++) {
                this.tube(this.tail, maneColors[i], [
                    [0, 0, 0], [(i - 1) * 0.04, -0.08, -0.22], [(i - 1) * 0.08, -0.33, -0.38],
                ], 0.065);
            }
        } else {
            this.tube(this.tail, coat, [[0, 0, 0], [0, 0.10, -0.20], [0, 0.31, -0.31], [0, 0.38, -0.23]], 0.09);
            this.ball(this.tail, cream, 0.093, 0.11, 0.09, 0, 0.35, -0.25);
            // A turquoise bandana is recognizable from the playing camera behind the puppy.
            const bandana = this.mesh(this.head, this.track(new THREE.ConeGeometry(0.22, 0.30, 3)), mint);
            bandana.position.set(0, -0.40, -0.14);
            bandana.rotation.x = Math.PI;
            bandana.scale.z = 0.14;
            this.ball(this.head, mint, 0.27, 0.060, 0.21, 0, -0.30, -0.09);
        }

        const ringGeometry = this.track(new THREE.TorusGeometry(0.416, 0.047, 10, 40));
        const ringMaterials = [0xe9b849, 0xe4a082, 0x81b9a9, 0xb9c67f, 0xf1ce73, 0xc9a2b6]
            .map((color) => this.material(color, 0.30, 0.17));
        for (let i = 0; i < MAX_RINGS; i++) {
            const ring = this.mesh(this.rig, ringGeometry, ringMaterials[Math.floor(i / 3) % ringMaterials.length]);
            ring.name = `Anel ${i + 1}`;
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.66 + i * SPACING;
            ring.visible = false;
            this.rings.push(ring);
        }
    }

    update(frame: ExplorerFrame): void {
        if (this.disposed) return;
        const dt = clamp(Number.isFinite(frame.delta) ? frame.delta : 0, 0, 0.05);
        const reduced = frame.reducedMotion;
        const ringCount = clamp(Math.floor(Number.isFinite(frame.ringCount) ? frame.ringCount : 0), 0, MAX_RINGS);
        const moving = clamp(frame.moving || 0, 0, 1);
        const greeting = clamp(frame.greeting || 0, 0, 1);
        const greetingPhase = Math.max(0, frame.greetingTime || 0) % 6.4;
        const waveEnvelope = THREE.MathUtils.smoothstep(greetingPhase, 0.15, 0.55)
            * (1 - THREE.MathUtils.smoothstep(greetingPhase, 1.9, 2.3));
        const greet = greeting * (reduced ? 0.65 : waveEnvelope);
        const collection = clamp(frame.collect || 0, 0, 1);
        const celebration = clamp(frame.celebrate || 0, 0, 1) * (1 - greeting);
        const lean = clamp(frame.laneLean || 0, -1, 1);
        this.clock += dt;
        this.movement = reduced ? moving : THREE.MathUtils.damp(this.movement, moving, 12, dt);
        this.stride += dt * (7 + this.movement * 4) * this.movement * clamp(frame.pace || 1, 0.7, 1.6);

        if (ringCount < this.previousRingCount) {
            this.growth = Math.max(0, ringCount * SPACING - 0.30);
            for (let i = ringCount; i < MAX_RINGS; i++) this.ringAge[i] = -1;
        }
        for (let i = this.previousRingCount; i < ringCount; i++) this.ringAge[i] = -(i - this.previousRingCount) * 0.065;
        this.previousRingCount = ringCount;
        const targetGrowth = Math.max(0, ringCount * SPACING - 0.30);
        this.growth = reduced ? targetGrowth : THREE.MathUtils.damp(this.growth, targetGrowth, 11, dt);
        const breath = reduced ? 0 : Math.sin(this.clock * 2.1) * 0.010 * (1 - this.movement);
        const bob = reduced ? 0 : Math.abs(Math.sin(this.stride)) * this.movement * 0.038;
        const hop = reduced ? 0 : Math.sin(collection * Math.PI) * 0.18
            + Math.max(0, Math.sin(this.clock * 5)) * celebration * 0.065;
        this.rig.position.y = bob + hop;
        this.rig.rotation.z = reduced ? 0 : -lean * 0.055 - Math.sin(this.stride) * this.movement * 0.014;
        this.rig.rotation.x = reduced ? 0 : this.movement * 0.025;
        this.torso.scale.y = 0.34 + (this.growth + breath) / 2;
        this.torso.position.y = 0.82 + (this.growth + breath) / 2;
        this.upper.position.y = this.growth + breath;
        this.head.position.y = (this.kind === 'unicorn' ? 1.44 : 1.38) + this.growth + breath;
        this.head.rotation.x = greet * (this.kind === 'unicorn' ? 0.15 : 0.08)
            + (reduced ? 0 : Math.sin(this.stride) * this.movement * 0.035);
        this.head.rotation.z = greet * (this.kind === 'dog' ? -0.17 : -0.055)
            + (reduced ? 0 : Math.sin(this.clock * 1.3) * 0.025 * (1 - this.movement));
        this.tail.rotation.y = reduced ? 0 : Math.sin(this.clock * (this.kind === 'dog' ? 9 : 3)) * (0.11 + greet * 0.35 + this.movement * 0.10);
        this.ears.forEach((ear, index) => {
            const side = index === 0 ? -1 : 1;
            ear.rotation.z = side * (this.kind === 'unicorn' ? -0.16 : 0.18)
                + (reduced ? 0 : Math.sin(this.stride + index) * this.movement * 0.13);
        });
        const blinkPhase = this.clock % 5.7;
        const blink = !reduced && blinkPhase > 5.48 ? 1 - Math.sin((blinkPhase - 5.48) / 0.22 * Math.PI) * 0.91 : 1;
        this.eyes.forEach((eye) => { eye.scale.y = blink; });
        this.legs.forEach((leg, index) => {
            const phase = this.stride + (index === 0 || index === 3 ? 0 : Math.PI);
            leg.rotation.x = reduced ? 0 : Math.sin(phase) * this.movement * 0.32;
            leg.position.y = 0.62 + (reduced ? 0 : Math.max(0, -Math.sin(phase)) * this.movement * 0.040);
            // Both animals offer one front paw, the puppy adding its characteristic head tilt.
            if (index === 3) {
                leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, -0.88, greet);
                leg.position.y += greet * 0.04;
            }
        });
        groundExplorerFeet(this.rig, this.legs, companionFoot);

        for (let i = 0; i < MAX_RINGS; i++) {
            const ring = this.rings[i];
            if (i >= ringCount) { ring.visible = false; continue; }
            this.ringAge[i] = reduced ? 0.56 : this.ringAge[i] + dt;
            const progress = reduced ? 1 : clamp(this.ringAge[i] / 0.56, 0, 1);
            const remaining = 1 - progress;
            const spring = 1 + 2.3 * Math.pow(progress - 1, 3) + 1.3 * Math.pow(progress - 1, 2);
            ring.visible = reduced || this.ringAge[i] >= 0;
            ring.scale.setScalar(0.18 + spring * 0.82);
            ring.position.y = 0.66 + i * SPACING + remaining * remaining * 0.37;
            ring.rotation.x = -Math.PI / 2 + remaining * 0.28;
            ring.rotation.z = reduced ? 0 : remaining * (i % 2 ? -0.16 : 0.16);
        }
    }

    getHeight(): number {
        return (this.kind === 'unicorn' ? 2.10 : 1.75) * 0.92 + this.growth * 0.92 + this.rig.position.y;
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
    }

    private track<T extends THREE.BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
    private material(color: number, roughness = 0.57, metalness = 0.025): THREE.MeshStandardMaterial {
        const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
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
    private ball(parent: THREE.Group, material: THREE.Material, width: number, height: number, depth: number, x: number, y: number, z: number): THREE.Mesh {
        const mesh = this.mesh(parent, this.sphere, material);
        mesh.scale.set(width, height, depth);
        mesh.position.set(x, y, z);
        return mesh;
    }
    private tube(parent: THREE.Group, material: THREE.Material, points: number[][], radius: number): THREE.Mesh {
        const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
        return this.mesh(parent, this.track(new THREE.TubeGeometry(curve, 16, radius, 8, false)), material);
    }
}
