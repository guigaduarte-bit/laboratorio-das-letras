import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getSchoolLevel, schoolLevels } from '../content/levels';
import { type CharacterId, readCharacter } from '../content/characters';
import { getBiomeForLevel } from '../content/biomes';
import { RUNNER_SPEED } from '../content/runnerPace';
import { lanePosition } from '../content/runner';
import { RUNNER_TIMINGS, type RunnerFrame } from '../systems/RunnerController';
import { Explorer3D } from './Explorer3D';
import { createAnimal3D, animateAnimal3D } from './Animals3D';
import { configureRunnerCamera } from './RunnerCamera3D';
import { BiomeWorld3D } from './BiomeWorld3D';
import { dampFacing, facingPartner, sampleAnimalEncounter } from './AnimalEncounter3D';

const C = { sky: 0xc7e0d4, moss: 0x355f4b, sand: 0xe8dcc7, ochre: 0xe3bd57, clay: 0xc66b48, water: 0x79b7ac };
const ease = (x: number) => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t); };
type Gate = { root: THREE.Group; body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; face: THREE.Mesh; halo: THREE.Mesh; index: number };

/** A small, original toy forest: all silhouettes, rings, scenery and rewards are real meshes. */
export class RunnerWorld3D {
    readonly canvas: HTMLCanvasElement;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene = new THREE.Scene();
    private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 150);
    private readonly explorer = new Explorer3D();
    private biomeWorld?: BiomeWorld3D;
    private biomeId = '';
    private readonly sunlight = new THREE.DirectionalLight(0xffecc7, 3.3);
    private readonly ambient = new THREE.HemisphereLight(0xfff4d9, 0x718c69, 2.7);
    private readonly laboratory = new THREE.Group();
    private readonly animals = new Map<string, THREE.Group>();
    private readonly gates: Gate[] = [];
    private readonly textures = new Map<string, THREE.CanvasTexture>();
    private readonly materials = new Map<number, THREE.MeshStandardMaterial>();
    private readonly geometry = new Map<string, THREE.BufferGeometry>();
    private readonly raycaster = new THREE.Raycaster();
    private readonly pointer = new THREE.Vector2();
    private readonly cameraHome = new THREE.Vector3();
    private readonly cameraBack = new THREE.Vector3();
    private readonly dust: THREE.InstancedMesh;
    private readonly fireflies: THREE.InstancedMesh;
    private readonly dummy = new THREE.Object3D();
    private readonly targetColor = new THREE.Color();
    private time = 0;
    private distance = 0;
    private velocity = 0;
    private previousLane = 0;
    private lastLevel = '';
    private lastPhase = 'ready';
    private choiceKey = '';
    private lastFrame: RunnerFrame | null = null;
    private width = 1000;
    private sidePanel = true;
    private disposed = false;

    constructor(container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.canvas = this.renderer.domElement;
        try {
            this.canvas.setAttribute('aria-hidden', 'true');
            this.canvas.style.touchAction = 'none';
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.22;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFShadowMap;
            this.scene.background = new THREE.Color(C.sky);
            this.scene.fog = new THREE.Fog(C.sky, 30, 90);
            this.scene.add(this.ambient);
            const sun = this.sunlight;
            sun.position.set(-12, 23, 9);
            sun.castShadow = true;
            sun.shadow.mapSize.set(1024, 1024);
            Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 20, bottom: -20, near: 1, far: 65 });
            sun.shadow.normalBias = 0.035;
            sun.shadow.bias = -0.0002;
            sun.target.position.set(0, 0, -5);
            this.scene.add(sun, sun.target, this.laboratory, this.explorer.root);
            this.setBiome('forest-sapo');
            this.buildLaboratory();
            this.buildGates();
            this.explorer.setCharacter(readCharacter());
            for (const kind of schoolLevels.map(level => level.imageKey)) {
                const animal = createAnimal3D(kind);
                animal.visible = false;
                this.animals.set(kind, animal);
                this.scene.add(animal);
            }
            this.dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), this.material(C.ochre), 30);
            this.dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.dust.frustumCulled = false;
            this.fireflies = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe99d }), 22);
            this.fireflies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.fireflies.frustumCulled = false;
            this.scene.add(this.dust, this.fireflies);
            container.appendChild(this.canvas);
            this.resize(container.clientWidth, container.clientHeight);
        } catch (error) {
            this.dispose();
            throw error;
        }
    }

    private material(color: number): THREE.MeshStandardMaterial {
        if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.025 }));
        return this.materials.get(color)!;
    }

    private box(w: number, h: number, d: number, radius = 0.1): THREE.BufferGeometry {
        const key = `${w},${h},${d},${radius}`;
        if (!this.geometry.has(key)) this.geometry.set(key, new RoundedBoxGeometry(w, h, d, 2, radius));
        return this.geometry.get(key)!;
    }

    private mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
        const mesh = new THREE.Mesh(geometry, this.material(color));
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    private setBiome(levelId: string): void {
        const biome = getBiomeForLevel(levelId);
        if (this.biomeId === biome.id) return;
        const next = new BiomeWorld3D(biome);
        this.biomeWorld?.dispose();
        this.biomeWorld = next;
        this.biomeId = biome.id;
        this.scene.add(next.root);
        (this.scene.background as THREE.Color).setHex(biome.sky);
        this.scene.fog = new THREE.Fog(biome.sky, biome.fogNear, biome.fogFar);
        this.sunlight.color.setHex(biome.sunlight);
        this.ambient.groundColor.setHex(biome.ground);
    }

    private buildLaboratory(): void {
        this.mesh(this.laboratory, new THREE.CylinderGeometry(5.8, 6.1, 0.3, 40), C.moss, 0, 0.05);
        this.mesh(this.laboratory, this.box(6.1, 4.3, 3.8, 0.6), C.sand, 0, 2.15);
        this.mesh(this.laboratory, this.box(6.7, 0.4, 4.4, 0.2), C.clay, 0, 4.2);
        this.mesh(this.laboratory, this.box(3.25, 3.2, 0.2, 0.4), C.moss, 0, 1.8, 1.96);
        this.mesh(this.laboratory, this.box(2.9, 2.85, 0.22, 0.35), C.water, 0, 1.8, 2.09);
        this.mesh(this.laboratory, this.box(0.1, 2.8, 0.08, 0.02), C.moss, 0, 1.8, 2.24);
        this.mesh(this.laboratory, this.box(2.85, 0.1, 0.08, 0.02), C.moss, 0, 1.6, 2.24);
        const sign = this.mesh(this.laboratory, new THREE.CylinderGeometry(0.7, 0.7, 0.22, 32), C.ochre, 0, 4.9, 0.9);
        sign.rotation.x = Math.PI / 2;
        const flask = this.mesh(this.laboratory, new THREE.SphereGeometry(0.26, 12, 8), C.moss, 0, 4.78, 1.07);
        flask.scale.z = 0.22;
        this.mesh(this.laboratory, this.box(0.16, 0.32, 0.08, 0.02), C.moss, 0, 5.04, 1.07);
        this.mesh(this.laboratory, this.box(0.3, 0.08, 0.08, 0.02), C.moss, 0, 5.22, 1.07);
        this.laboratory.position.z = -40;
    }

    private buildGates(): void {
        for (let index = 0; index < 3; index++) {
            const root = new THREE.Group();
            root.name = `Caminho ${index + 1}`;
            const body = new THREE.Mesh(this.box(2.35, 3.5, 0.6, 0.23), this.material(C.sand).clone());
            body.position.y = 1.95;
            body.castShadow = true; body.receiveShadow = true;
            const face = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 2.15), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
            face.position.set(0, 2.18, 0.315);
            face.userData.gateIndex = index;
            body.userData.gateIndex = index;
            const plinth = this.mesh(root, this.box(2.7, 0.22, 1.5, 0.1), C.moss, 0, 0.11, 0);
            plinth.userData.gateIndex = index;
            const halo = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.065, 6, 32), this.material(C.ochre));
            halo.rotation.x = Math.PI / 2;
            halo.scale.set(1, 0.7, 1);
            halo.position.y = 0.25;
            root.add(body, face, halo);
            this.scene.add(root);
            this.gates.push({ root, body, face, halo, index });
        }
    }

    private letterTexture(letter: string): THREE.CanvasTexture {
        const existing = this.textures.get(letter);
        if (existing) return existing;
        const canvas = document.createElement('canvas');
        canvas.width = 384; canvas.height = 448;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D indisponível para as letras');
        context.fillStyle = '#26383a';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '700 282px "Lexend Variable", Lexend, sans-serif';
        context.fillText(letter, 192, 215);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        this.textures.set(letter, texture);
        return texture;
    }

    setCharacter(id: CharacterId): void {
        // The controller validates ready state; the last rendered frame can lag behind the menu.
        if (!this.disposed) this.explorer.setCharacter(id);
    }

    resize(width: number, height: number): void {
        if (this.disposed) return;
        this.width = Math.max(1, width);
        this.sidePanel = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 900px)').matches : this.width >= 900;
        configureRunnerCamera(this.camera, this.width, Math.max(1, height));
        this.cameraHome.copy(this.camera.position);
        this.camera.getWorldDirection(this.cameraBack).negate();
        this.renderer.setSize(this.width, Math.max(1, height));
    }

    update(frame: RunnerFrame, delta: number, reducedMotion: boolean): void {
        if (this.disposed) return;
        if (frame.paused && this.lastFrame) {
            this.lastFrame = frame;
            return;
        }
        const dt = frame.paused ? 0 : Math.min(Math.max(delta, 0), 0.05);
        this.time += dt;
        const phase = frame.phase;
        const reset = this.lastLevel !== frame.levelId || (phase === 'ready' && this.lastPhase !== 'ready') || (phase === 'travel' && ['ready', 'celebrate'].includes(this.lastPhase));
        if (reset) {
            this.distance = 0; this.velocity = 0;
            this.explorer.root.position.set(0, 0.03, 4.5);
        }
        this.setBiome(frame.levelId);
        this.lastLevel = frame.levelId;
        this.lastPhase = phase;
        this.lastFrame = frame;
        const moving = phase === 'travel' || phase === 'finish';
        let speed = moving ? RUNNER_SPEED : 0;
        if (phase === 'travel') speed *= 1 - ease((frame.elapsed / RUNNER_TIMINGS.travel - 0.64) / 0.36);
        if (phase === 'finish') speed *= 1 - ease((frame.elapsed / RUNNER_TIMINGS.finish - 0.55) / 0.35);
        this.velocity = THREE.MathUtils.damp(this.velocity, speed, 7, dt);
        this.camera.position.copy(this.cameraHome).addScaledVector(this.cameraBack, reducedMotion ? 0 : this.velocity * 0.075);
        this.camera.updateMatrixWorld();
        this.distance += this.velocity * dt;
        this.biomeWorld?.update(this.time, this.distance, reducedMotion);

        const approach = phase === 'approach' ? ease(frame.elapsed / RUNNER_TIMINGS.approach)
            : phase === 'retry' ? 1 - ease(frame.elapsed / RUNNER_TIMINGS.retry)
            : phase === 'collect' ? 1 : (phase === 'travel' && frame.count > 0) || phase === 'finish' ? 1 - ease(frame.elapsed / 750) : 0;
        const encounter = sampleAnimalEncounter(phase, frame.elapsed, this.sidePanel);
        const completing = encounter.progress;
        const x = phase === 'ready' ? 3.2 : THREE.MathUtils.lerp(frame.lane * 3.4, encounter.explorerX, completing);
        const targetZ = THREE.MathUtils.lerp(4.5 - approach * 6.1, encounter.explorerZ, completing);
        this.explorer.root.position.x = THREE.MathUtils.damp(this.explorer.root.position.x, x, 12, dt);
        this.explorer.root.position.z = THREE.MathUtils.damp(this.explorer.root.position.z, targetZ, 16, dt);
        this.explorer.root.scale.setScalar(phase === 'ready' ? 1.25 : 1);
        const towardAnimal = facingPartner(this.explorer.root.position.x, this.explorer.root.position.z, encounter.animalX, encounter.animalZ);
        const yaw = phase === 'ready' ? -0.25 : completing > 0.34 ? towardAnimal : Math.PI;
        this.explorer.root.rotation.y = dampFacing(this.explorer.root.rotation.y, yaw, dt);
        const laneLean = dt > 0 ? THREE.MathUtils.clamp((frame.lane - this.previousLane) / dt * -0.09, -0.2, 0.2) : 0;
        this.previousLane = frame.lane;
        this.explorer.update({ time: this.time, delta: dt, moving: Math.max(this.velocity / RUNNER_SPEED, phase === 'approach' || phase === 'retry' ? 0.85 : 0), pace: RUNNER_SPEED / 5.8, laneLean,
            ringCount: frame.count * 3, collect: phase === 'collect' ? frame.elapsed / RUNNER_TIMINGS.collect : 0,
            celebrate: completing * (1 - encounter.greeting * 0.65), greeting: encounter.greeting, greetingTime: encounter.time, reducedMotion });

        const key = `${frame.levelId}:${frame.choices.join('')}`;
        if (key !== this.choiceKey) {
            this.choiceKey = key;
            this.gates.forEach((gate, i) => {
                if (frame.choices[i]) {
                    const material = gate.face.material as THREE.MeshBasicMaterial;
                    material.map = this.letterTexture(frame.choices[i]);
                    material.needsUpdate = true;
                }
            });
        }
        this.gates.forEach((gate, i) => {
            const visible = i < frame.choices.length && !['ready', 'finish', 'celebrate'].includes(phase);
            gate.root.visible = visible;
            if (!visible) return;
            const travel = phase === 'travel' ? ease(frame.elapsed / RUNNER_TIMINGS.travel) : 1;
            gate.root.position.set(lanePosition(i, frame.choices.length) * 3.4, 0, -2.8 - (1 - travel) * 21);
            const collected = phase === 'collect' && i === frame.selectedLane;
            const shrink = collected ? 1 - ease(frame.elapsed / 550) : phase === 'collect' ? 1 - ease((frame.elapsed - 320) / 600) : 1;
            gate.root.scale.setScalar(Math.max(0.001, shrink));
            if (collected) gate.root.position.y = ease(frame.elapsed / 550) * 1.3;
            const isTarget = frame.hinted && frame.choices[i] === frame.word[frame.count];
            const selected = i === frame.selectedLane && phase !== 'travel';
            this.targetColor.setHex(isTarget ? C.ochre : selected ? 0xf3e8c9 : C.sand);
            gate.body.material.color.lerp(this.targetColor, 1 - Math.exp(-dt * 9));
            gate.body.material.emissive.setHex(isTarget ? 0x7a5b17 : 0x000000);
            gate.body.material.emissiveIntensity = isTarget ? 0.12 : 0;
            gate.halo.visible = selected || isTarget;
        });

        this.laboratory.position.z = -40 + completing * 28;
        const kind = getSchoolLevel(frame.levelId).imageKey;
        this.animals.forEach((animal, keyName) => {
            const wasVisible = animal.visible;
            animal.visible = keyName === kind && encounter.reveal > 0;
            if (!animal.visible) return;
            animal.position.set(encounter.animalX, 0.05, encounter.animalZ);
            animal.scale.setScalar(encounter.reveal * 1.15);
            const animalYaw = facingPartner(animal.position.x, animal.position.z, this.explorer.root.position.x, this.explorer.root.position.z);
            animal.rotation.y = wasVisible ? dampFacing(animal.rotation.y, animalYaw, dt) : animalYaw;
            animateAnimal3D(animal, this.time, reducedMotion, { strength: encounter.greeting, time: encounter.time });
        });
        this.updateParticles(frame, reducedMotion);
    }

    private updateParticles(frame: RunnerFrame, reducedMotion: boolean): void {
        this.dust.visible = !reducedMotion && (frame.phase === 'collect' || this.velocity > 0.3 || frame.phase === 'celebrate');
        for (let i = 0; i < 30; i++) {
            const p = (this.time * 1.4 + i / 30) % 1;
            const angle = i * 2.399;
            const burst = frame.phase === 'collect' || frame.phase === 'celebrate';
            const spread = burst ? p * 2.3 : p * 0.5;
            this.dummy.position.set(this.explorer.root.position.x + Math.cos(angle) * spread, burst ? 0.4 + Math.sin(p * Math.PI) * 2.4 : 0.12 + p * 0.2,
                this.explorer.root.position.z + (burst ? Math.sin(angle) * spread : 0.3 + p * 1.9));
            this.dummy.scale.setScalar((1 - p) * (burst ? 1.1 : 0.7));
            this.dummy.rotation.set(p, angle, p * 2);
            this.dummy.updateMatrix(); this.dust.setMatrixAt(i, this.dummy.matrix);
        }
        this.dust.instanceMatrix.needsUpdate = true;
        this.fireflies.visible = !reducedMotion;
        for (let i = 0; i < 22; i++) {
            this.dummy.position.set((i % 2 ? -1 : 1) * (6.4 + (i % 4) * 0.7) + Math.sin(this.time + i) * 0.3,
                0.5 + (i % 4) * 0.4 + Math.cos(this.time * 1.3 + i) * 0.16, 8 - i * 2.5);
            this.dummy.scale.setScalar(0.7 + Math.sin(this.time * 2 + i) * 0.3);
            this.dummy.updateMatrix(); this.fireflies.setMatrixAt(i, this.dummy.matrix);
        }
        this.fireflies.instanceMatrix.needsUpdate = true;
    }

    pick(clientX: number, clientY: number): number | null {
        if (this.disposed || this.lastFrame?.phase !== 'choose' || this.lastFrame.paused) return null;
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.gates.filter(g => g.root.visible).map(g => g.root), true);
        return hits.find(hit => typeof hit.object.userData.gateIndex === 'number')?.object.userData.gateIndex ?? null;
    }

    render(): void { if (!this.disposed) this.renderer.render(this.scene, this.camera); }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.biomeWorld?.dispose();
        this.biomeWorld = undefined;
        this.scene.remove(this.explorer.root);
        this.explorer.dispose();
        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        this.scene.traverse(object => {
            if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
            if (object instanceof THREE.Mesh) {
                geometries.add(object.geometry);
                (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
                if (object instanceof THREE.InstancedMesh) object.dispose();
            }
        });
        this.geometry.forEach(geometry => geometries.add(geometry));
        this.materials.forEach(material => materials.add(material));
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        this.textures.forEach(texture => texture.dispose());
        this.renderer.dispose();
        this.canvas.remove();
    }
}
