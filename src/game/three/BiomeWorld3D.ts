import * as THREE from 'three';
import type { BiomeDefinition } from '../content/biomes';

type Anchor = { x: number; z: number };
type Instance = {
    x: number; y: number; z: number; baseZ: number;
    sx: number; sy: number; sz: number;
    rx: number; ry: number; rz: number;
    wind: number; seed: number; loop: boolean;
};
type Batch = {
    geometry: THREE.BufferGeometry; color: number; shadow: boolean;
    items: Instance[]; mesh?: THREE.InstancedMesh; animated: boolean;
};

const LOOP_LENGTH = 94;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Four original toy habitats, batching all repeated geometry in the active destination. */
export class BiomeWorld3D {
    readonly root = new THREE.Group();
    private readonly definition: BiomeDefinition;
    private readonly materials = new Map<number, THREE.MeshStandardMaterial>();
    private readonly geometries = new Map<string, THREE.BufferGeometry>();
    private readonly batches = new Map<string, Batch>();
    private readonly dummy = new THREE.Object3D();
    private readonly direction = new THREE.Vector3();
    private readonly quaternion = new THREE.Quaternion();
    private readonly euler = new THREE.Euler();
    private lastDistance = Number.NaN;
    private lastReducedMotion = false;
    private disposed = false;

    constructor(definition: BiomeDefinition) {
        this.definition = definition;
        this.root.name = `Bioma • ${definition.name}`;
        this.root.userData.biomeId = definition.id;
        this.buildLand();
        if (definition.id === 'mata-atlantica') this.buildPond();
        else if (definition.id === 'pantanal') this.buildWetlands();
        else if (definition.id === 'cerrado') this.buildSavanna();
        else this.buildRainforest();
        this.buildClouds();
        for (const [name, batch] of this.batches) {
            const mesh = new THREE.InstancedMesh(batch.geometry, this.material(batch.color), batch.items.length);
            mesh.name = name;
            mesh.castShadow = batch.shadow;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            batch.mesh = mesh;
            this.root.add(mesh);
        }
        this.update(0, 0, false);
    }

    private material(color: number): THREE.MeshStandardMaterial {
        let material = this.materials.get(color);
        if (!material) {
            material = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 });
            this.materials.set(color, material);
        }
        return material;
    }

    private geometry(kind: string): THREE.BufferGeometry {
        let geometry = this.geometries.get(kind);
        if (geometry) return geometry;
        switch (kind) {
            case 'trunk': geometry = new THREE.CylinderGeometry(0.72, 1, 1, 8); break;
            case 'stem': geometry = new THREE.CylinderGeometry(0.6, 1, 1, 5); break;
            case 'pebble': geometry = new THREE.DodecahedronGeometry(1, 0); break;
            case 'leaf': geometry = new THREE.SphereGeometry(1, 8, 6); break;
            case 'lily': geometry = new THREE.CylinderGeometry(1, 1, 0.04, 18, 1, false, 0.22, Math.PI * 2 - 0.44); break;
            case 'ripple': geometry = new THREE.TorusGeometry(1, 0.025, 5, 24); break;
            case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'vine': geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, -1.3, 0.1),
                new THREE.Vector3(-0.12, -2.5, 0), new THREE.Vector3(0.25, -3.7, 0.12),
                new THREE.Vector3(0.6, -4.5, 0.1)
            ]), 14, 0.045, 5, false); break;
            default: geometry = new THREE.SphereGeometry(1, 12, 8);
        }
        this.geometries.set(kind, geometry);
        return geometry;
    }

    private instance(name: string, kind: string, color: number, anchor: Anchor, position: [number, number, number],
        scale: [number, number, number], rotation: [number, number, number] = [0, 0, 0], shadow = false, wind = 0, loop = true): void {
        const key = `${name} • ${color.toString(16)}`;
        let batch = this.batches.get(key);
        if (!batch) {
            batch = { geometry: this.geometry(kind), color, shadow, items: [], animated: false };
            this.batches.set(key, batch);
        }
        batch.animated ||= wind !== 0;
        batch.items.push({ x: anchor.x + position[0], y: position[1], z: position[2], baseZ: anchor.z,
            sx: scale[0], sy: scale[1], sz: scale[2], rx: rotation[0], ry: rotation[1], rz: rotation[2],
            wind, seed: anchor.z * 0.47 + anchor.x, loop });
    }

    private segment(name: string, color: number, anchor: Anchor, start: [number, number, number], end: [number, number, number],
        radius: number, shadow = false): void {
        this.direction.set(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
        const length = this.direction.length();
        this.quaternion.setFromUnitVectors(Y_AXIS, this.direction.normalize());
        this.euler.setFromQuaternion(this.quaternion);
        this.instance(name, 'trunk', color, anchor, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2],
            [radius, length, radius], [this.euler.x, this.euler.y, this.euler.z], shadow);
    }

    private staticBox(name: string, color: number, x: number, y: number, z: number, w: number, h: number, d: number): void {
        this.instance(name, 'box', color, { x, z }, [0, y, 0], [w, h, d], [0, 0, 0], false, 0, false);
    }

    private buildLand(): void {
        const def = this.definition;
        this.staticBox('Terra', def.ground, 0, -0.72, -40, 120, 1, 164);
        this.staticBox('Caminho', def.path, 0, -0.12, -40, 11.8, 0.28, 164);
        for (let i = 0; i < 24; i++) {
            const anchor = { x: 0, z: 13 - i * (LOOP_LENGTH / 24) };
            for (const x of [-5.74, 5.74]) this.instance('Bordas do caminho', 'box', 0xcabb96, anchor, [x, 0.07, 0], [0.22, 0.15, 3.56]);
            for (const x of [-3.4, 0, 3.4]) this.instance('Marcas do caminho', 'box', 0xcabc9e, anchor, [x, 0.025, 0], [0.045, 0.007, 1.26]);
            this.instance('Travessas do caminho', 'box', 0xd1c4a7, anchor, [0, 0.024, -1.82], [11.1, 0.006, 0.027]);
        }
        const hills = def.id === 'pantanal' ? 3 : 7;
        for (let i = 0; i < hills; i++) {
            const h = def.id === 'pantanal' ? 1.4 : def.id === 'cerrado' ? 3.2 : 6.2;
            this.instance('Colinas distantes', 'sphere', def.foliage[2], { x: (i - (hills - 1) / 2) * 22, z: -90 - i % 2 * 6 },
                [0, -0.5, 0], [21, h + i % 2, 17], [0, 0, 0], false, 0, false);
        }
    }

    private water(x: number, width: number, name: string): void {
        this.staticBox(name, this.definition.water, x, -0.16, -40, width, 0.055, 162);
        for (let i = 0; i < 15; i++) this.instance('Reflexos da água', 'leaf', 0xb4d5c4,
            { x: x + Math.sin(i * 3.1) * width * 0.28, z: 9 - i * 6 }, [0, -0.123, 0], [0.65 + i % 3 * 0.23, 0.008, 0.045], [0, 0, 0], false, 0.012);
    }

    private mound(anchor: Anchor, xScale = 2.1, zScale = 1.8): void {
        this.instance('Ilhas de vegetação', 'sphere', this.definition.ground, anchor, [0, -0.1, 0], [xScale, 0.3, zScale]);
    }

    private tree(anchor: Anchor, height: number, size: number, seed: number): void {
        const def = this.definition;
        this.segment('Troncos', def.trunk, anchor, [0, 0, 0], [0, height * 0.64, 0], 0.24 * size, true);
        for (let j = 0; j < 4; j++) {
            const angle = j * Math.PI * 0.7 + seed;
            this.instance('Copas arredondadas', 'sphere', def.foliage[(seed + j) % 3], anchor,
                [Math.cos(angle) * size * 0.5, height * 0.7 + j % 2 * size * 0.55, Math.sin(angle) * size * 0.38],
                [size, size * 1.12, size * 0.86], [0, angle, 0], true, 0.018);
        }
    }

    private palm(anchor: Anchor, height: number, seed: number): void {
        const def = this.definition;
        this.segment('Troncos de palmeiras', def.trunk, anchor, [0, 0, 0], [0.15, height, 0], 0.19, true);
        for (let j = 0; j < 7; j++) {
            const angle = j / 7 * Math.PI * 2 + seed * 0.9;
            this.instance('Folhas de palmeiras', 'leaf', def.foliage[(j + seed) % 3], anchor,
                [0.15 + Math.sin(angle) * 0.78, height + 0.06, Math.cos(angle) * 0.78],
                [0.28, 0.12, 1.35], [0.24, angle, 0], true, 0.018);
        }
        this.instance('Broto das palmeiras', 'leaf', def.foliage[0], anchor, [0.15, height + 0.2, 0], [0.2, 0.52, 0.22]);
    }

    private grass(anchor: Anchor, height: number, color: number, seed: number): void {
        for (let j = 0; j < 5; j++) {
            const angle = j * 1.256 + seed;
            this.instance('Capins', 'leaf', color, anchor, [Math.sin(angle) * 0.2, height * 0.48, Math.cos(angle) * 0.2],
                [0.075, height * (0.5 + j % 2 * 0.1), 0.055], [Math.cos(angle) * 0.2, angle, Math.sin(angle) * 0.22], false, 0.045);
        }
    }

    private rosette(anchor: Anchor, size: number, color: number, seed: number, flower: boolean): void {
        for (let j = 0; j < 7; j++) {
            const angle = j / 7 * Math.PI * 2 + seed;
            this.instance('Folhas em roseta', 'leaf', color, anchor,
                [Math.sin(angle) * size * 0.4, size * 0.28, Math.cos(angle) * size * 0.4],
                [size * 0.16, size * 0.09, size * 0.62], [0.28, angle, 0], false, 0.03);
        }
        if (flower) {
            this.instance('Bromélias', 'leaf', this.definition.accent, anchor, [0, size * 0.7, 0], [size * 0.17, size * 0.46, size * 0.17]);
            this.instance('Miolo das bromélias', 'leaf', 0xf1d680, anchor, [0, size, 0], [size * 0.085, size * 0.18, size * 0.085]);
        }
    }

    private buildPond(): void {
        const def = this.definition;
        this.water(-13.3, 13, 'Lagoa da mata');
        for (let i = 0; i < 24; i++) {
            const anchor = { x: (i % 2 ? 1 : -1) * (10.4 + i % 3 * 3.2), z: 10 - i * 3.85 };
            this.mound(anchor, 2.3, 2.4);
            this.tree(anchor, 3.6 + i % 3 * 0.55, 1.35 + i % 2 * 0.22, i);
            this.rosette({ x: (i % 2 ? 1 : -1) * (7.8 + i % 3 * 0.25), z: anchor.z + 1.8 }, 0.85, def.foliage[1], i, true);
            if (i % 2 === 0) {
                const lily = { x: -8.2 - i % 5 * 1.35, z: anchor.z + 2 };
                this.instance('Folhas aquáticas', 'lily', def.foliage[1], lily, [0, -0.095, 0], [0.55 + i % 3 * 0.13, 1, 0.48 + i % 3 * 0.13], [0, i, 0]);
                this.instance('Flores da lagoa', 'leaf', 0xf0d1be, lily, [0.14, 0.01, 0.03], [0.12, 0.14, 0.12]);
            }
        }
        for (let i = 0; i < 25; i++) {
            const anchor = { x: -7.25 - i % 3 * 0.4, z: 12 - i * 3.65 };
            for (let j = 0; j < 3; j++) {
                this.instance('Taboas • hastes', 'stem', def.foliage[0], anchor, [j * 0.17, 0.55 + j % 2 * 0.08, j % 2 * 0.13], [0.027, 1.2 + j % 2 * 0.15, 0.027], [0, 0, 0.04 * (j - 1)], false, 0.03);
                this.instance('Taboas • espigas', 'leaf', 0x9c704f, anchor, [j * 0.17 + 0.02, 1.15 + j % 2 * 0.16, j % 2 * 0.13], [0.065, 0.24, 0.065], [0, 0, 0], false, 0.02);
            }
        }
    }

    private buildWetlands(): void {
        const def = this.definition;
        this.water(-21, 28, 'Águas do Pantanal • esquerda');
        this.water(21, 28, 'Águas do Pantanal • direita');
        for (let i = 0; i < 22; i++) {
            const side = i % 2 ? 1 : -1;
            const anchor = { x: side * (10.2 + i % 3 * 4.1), z: 10 - i * 4.2 };
            this.mound(anchor, 2.7, 2.1);
            if (i % 3 === 0) this.palm(anchor, 3.8 + i % 2 * 0.7, i);
            else if (i % 4 === 0) this.tree(anchor, 2.7, 1.18, i);
            for (let j = 0; j < 5; j++) this.grass({ x: anchor.x - 1.1 + j * 0.55, z: anchor.z + 0.5 + j % 2 * 0.5 }, 0.65 + j % 3 * 0.18, def.foliage[1 + j % 2], i + j);
            this.instance('Ondas nas ilhas', 'ripple', 0xbcd9c5, anchor, [0, -0.122, 0], [3.1, 2.5, 1], [Math.PI / 2, 0, 0]);
            this.grass({ x: side * 7.5, z: anchor.z + 1 }, 0.78, def.foliage[0], i);
        }
    }

    private buildSavanna(): void {
        const def = this.definition;
        this.water(16.3, 10.4, 'Água da vereda');
        for (let i = 0; i < 21; i++) {
            const side = i % 2 ? 1 : -1;
            const anchor = { x: side * (9.9 + i % 3 * 3.4), z: 11 - i * 4.45 };
            if (i % 4 === 1) this.palm({ x: 15.2, z: anchor.z }, 5.2 + i % 3 * 0.3, i);
            else {
                const lean = side * 0.5;
                this.segment('Árvores retorcidas', def.trunk, anchor, [0, 0, 0], [lean, 1.05, 0.1], 0.22, true);
                this.segment('Árvores retorcidas', def.trunk, anchor, [lean, 1.05, 0.1], [-lean * 0.4, 1.95, 0], 0.18, true);
                for (let j = 0; j < 3; j++) {
                    const x = (j - 1) * 0.93;
                    this.segment('Árvores retorcidas', def.trunk, anchor, [-lean * 0.4, 1.65, 0], [x, 2.3 + j % 2 * 0.38, 0.25 * (j - 1)], 0.12, true);
                    this.instance('Copas do cerrado', 'sphere', def.foliage[(i + j) % 3], anchor, [x, 2.65 + j % 2 * 0.3, 0.25 * (j - 1)],
                        [1.05, 0.62, 0.91], [0, j * 0.6, 0], true, 0.02);
                }
            }
            for (let j = 0; j < 4; j++) this.grass({ x: side * (7.4 + j * 0.85), z: anchor.z + 0.7 + j % 2 }, 0.6 + j % 2 * 0.3, j % 2 ? def.accent : def.foliage[2], i + j);
            this.instance('Pedras do cerrado', 'pebble', 0xad8863, { x: side * 7.55, z: anchor.z - 1.2 }, [0, 0.18, 0], [0.65, 0.34, 0.49], [0, i, 0], true);
            this.instance('Flores do cerrado', 'leaf', 0xf1d888, { x: side * 7.15, z: anchor.z }, [0, 0.51, 0], [0.1, 0.12, 0.1]);
        }
    }

    private buildRainforest(): void {
        const def = this.definition;
        this.water(-17.4, 12.8, 'Igarapé');
        for (let i = 0; i < 30; i++) {
            const side = i % 2 ? 1 : -1;
            const anchor = { x: side * (11.2 + i % 3 * 4.5), z: 10 - i * 3.08 };
            const height = 7.2 + i % 3 * 0.9;
            this.tree(anchor, height, 2.2 + i % 2 * 0.2, i);
            for (let j = 0; j < 4; j++) {
                const angle = j * Math.PI / 2 + i;
                this.segment('Raízes altas', def.trunk, anchor, [0, 1.25, 0], [Math.sin(angle) * 1.35, 0.08, Math.cos(angle) * 1.35], 0.21, true);
            }
            if (i % 2 === 0) {
                this.instance('Cipós', 'vine', def.foliage[0], anchor, [side * -1.2, height * 0.81, 0.35], [0.85, 1.05, 0.85], [0, i, 0], false, 0.014);
                this.instance('Cipós', 'vine', def.foliage[0], anchor, [0.6, height * 0.83, -0.15], [0.7, 0.8, 0.7], [0, -i, 0], false, 0.018);
            }
            this.rosette({ x: side * (7.7 + i % 3 * 0.55), z: anchor.z + 0.8 }, 1.3, def.foliage[1 + i % 2], i, false);
            for (let j = 0; j < 3; j++) {
                const angle = (j - 1) * 0.65;
                this.instance('Folhas largas', 'leaf', def.foliage[(i + j) % 3], { x: side * 9.1, z: anchor.z - 0.8 },
                    [Math.sin(angle) * 0.6, 0.72 + j % 2 * 0.3, Math.cos(angle) * 0.3], [0.3, 0.08, 0.93], [-0.78, angle, 0], false, 0.03);
            }
        }
    }

    private buildClouds(): void {
        const amount = this.definition.id === 'amazonia' ? 3 : 5;
        for (let i = 0; i < amount; i++) for (let j = 0; j < 3; j++) this.instance('Nuvens', 'sphere', 0xedeee0,
            { x: (i - (amount - 1) / 2) * 16, z: -48 - i % 3 * 8 }, [(j - 1) * 1.8, 13 + i % 2 * 2 + j % 2 * 0.4, 0],
            [2.2, 0.72 + j % 2 * 0.3, 1.1], [0, 0, 0], false, 0.004, false);
    }

    update(timeSeconds: number, distance: number, reducedMotion: boolean): void {
        if (this.disposed) return;
        const distanceChanged = this.lastDistance !== distance;
        const motionChanged = this.lastReducedMotion !== reducedMotion;
        for (const batch of this.batches.values()) {
            if (!distanceChanged && !motionChanged && (!batch.animated || reducedMotion)) continue;
            const mesh = batch.mesh;
            if (!mesh) continue;
            batch.items.forEach((item, index) => {
                const z = item.loop ? 16 - ((16 - item.baseZ - distance) % LOOP_LENGTH + LOOP_LENGTH) % LOOP_LENGTH : item.baseZ;
                const sway = reducedMotion ? 0 : Math.sin(timeSeconds * 0.85 + item.seed) * item.wind;
                this.dummy.position.set(item.x, item.y, z + item.z);
                this.dummy.rotation.set(item.rx, item.ry, item.rz + sway);
                this.dummy.scale.set(item.sx, item.sy, item.sz);
                this.dummy.updateMatrix();
                mesh.setMatrixAt(index, this.dummy.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
        }
        this.lastDistance = distance;
        this.lastReducedMotion = reducedMotion;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.root.removeFromParent();
        this.batches.forEach(batch => batch.mesh?.dispose());
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());
        this.root.clear();
        this.batches.clear();
        this.geometries.clear();
        this.materials.clear();
    }
}
