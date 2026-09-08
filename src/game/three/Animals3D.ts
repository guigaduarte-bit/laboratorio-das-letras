import * as THREE from 'three';

type Point = [number, number, number];
type AnimalRig = {
    body: THREE.Group;
    head: THREE.Group;
    tail?: THREE.Group;
    eyes: THREE.Group[];
};

const colors = {
    sage: '#8B9D83', moss: '#606C38', leaf: '#93AD6F', sand: '#E8DCC7',
    cream: '#F8F0D9', clay: '#C66B3D', ochre: '#C08E3A', ink: '#26383A',
    sun: '#E3BD57', bark: '#76503A', brown: '#AD7950', blush: '#D68D67',
};

/** Original toy animals. Every resource belongs to this model and can be disposed by traversal. */
export function createAnimal3D(kind: 'sapo' | 'onca' | 'tucano' | 'macaco' | string): THREE.Group {
    const root = new THREE.Group();
    root.name = `animal-${kind}`;
    const body = new THREE.Group();
    body.name = 'animal-body';
    root.add(body);
    const head = new THREE.Group();
    head.name = 'animal-head';
    body.add(head);
    const rig: AnimalRig = { body, head, eyes: [] };
    const sphere = new THREE.SphereGeometry(1, 20, 14);
    const materials = new Map<string, THREE.MeshStandardMaterial>();

    const material = (color: string) => {
        let value = materials.get(color);
        if (!value) {
            value = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0 });
            materials.set(color, value);
        }
        return value;
    };
    const oval = (parent: THREE.Object3D, color: string, position: Point, scale: Point) => {
        const mesh = new THREE.Mesh(sphere, material(color));
        mesh.position.set(...position);
        mesh.scale.set(...scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    };
    const curve = (parent: THREE.Object3D, color: string, points: Point[], radius: number) => {
        const path = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 24, radius, 8, false), material(color));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    };
    const eye = (parent: THREE.Object3D, x: number, y: number, z: number, size: number, surround = colors.cream) => {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        oval(group, surround, [0, 0, 0], [size * 1.45, size * 1.55, size * 0.64]);
        oval(group, colors.ink, [0, -size * 0.06, size * 0.54], [size * 0.72, size * 1.05, size * 0.43]);
        oval(group, colors.cream, [-size * 0.22, size * 0.38, size * 0.91], [size * 0.24, size * 0.27, size * 0.1]);
        parent.add(group);
        rig.eyes.push(group);
    };
    const smile = (parent: THREE.Object3D, y: number, z: number, width: number) => {
        curve(parent, colors.ink, [[-width, y, z], [-width * 0.45, y - 0.05, z + 0.025],
            [width * 0.45, y - 0.05, z + 0.025], [width, y, z]], 0.016);
    };

    if (kind === 'onca' || kind === 'onça') {
        oval(body, colors.ochre, [0, 0.64, -0.14], [0.56, 0.49, 0.7]);
        oval(body, colors.sand, [0, 0.55, 0.35], [0.4, 0.35, 0.2]);
        for (const x of [-0.4, 0.4]) {
            for (const z of [-0.46, 0.4]) {
                oval(body, colors.ochre, [x, 0.29, z], [0.17, 0.27, 0.18]);
                oval(body, colors.sun, [x, 0.11, z + 0.1], [0.22, 0.11, 0.28]);
            }
        }
        head.position.set(0, 1.14, 0.46);
        oval(head, colors.ochre, [0, 0, 0], [0.59, 0.5, 0.43]);
        for (const side of [-1, 1]) {
            oval(head, colors.ochre, [side * 0.43, 0.37, -0.02], [0.19, 0.23, 0.15]);
            oval(head, colors.bark, [side * 0.43, 0.39, 0.11], [0.115, 0.14, 0.037]);
            oval(head, colors.cream, [side * 0.18, -0.17, 0.36], [0.25, 0.2, 0.18]);
            eye(head, side * 0.24, 0.06, 0.37, 0.077);
            oval(head, colors.bark, [side * 0.42, -0.06, 0.29], [0.052, 0.043, 0.037]);
        }
        oval(head, colors.ink, [0, -0.08, 0.55], [0.11, 0.072, 0.062]);
        smile(head, -0.25, 0.505, 0.18);
        // Raised spots stay visible in both the front and three-quarter views.
        for (const side of [-1, 1]) {
            const spots: Point[] = [[0.45, 0.84, -0.35], [0.5, 0.69, -0.02],
                [0.38, 0.99, -0.13], [0.39, 0.78, -0.65]];
            for (const point of spots) {
                oval(body, colors.bark, [point[0] * side, point[1], point[2]], [0.06, 0.077, 0.09]);
            }
            oval(head, colors.bark, [side * 0.25, 0.29, 0.32], [0.075, 0.046, 0.041]);
        }
        const tail = new THREE.Group();
        tail.position.set(0.22, 0.63, -0.64);
        body.add(tail);
        curve(tail, colors.ochre, [[0, 0, 0], [0.4, 0.1, -0.35], [0.78, 0.28, -0.26],
            [0.83, 0.53, -0.09], [0.72, 0.66, -0.04]], 0.095);
        oval(tail, colors.bark, [0.72, 0.66, -0.04], [0.1, 0.12, 0.1]);
        rig.tail = tail;
    } else if (kind === 'tucano') {
        oval(body, colors.ink, [0, 0.78, -0.05], [0.46, 0.64, 0.43]);
        oval(body, colors.sand, [0, 0.83, 0.29], [0.32, 0.44, 0.15]);
        for (const side of [-1, 1]) {
            const wing = oval(body, colors.ink, [side * 0.37, 0.78, -0.06], [0.16, 0.46, 0.3]);
            wing.rotation.z = side * 0.15;
            oval(body, colors.ochre, [side * 0.22, 0.08, 0.15], [0.2, 0.08, 0.24]);
        }
        head.position.set(0, 1.39, 0.08);
        oval(head, colors.ink, [0, 0, 0], [0.4, 0.4, 0.37]);
        oval(head, colors.sand, [0, -0.1, 0.23], [0.3, 0.3, 0.18]);
        for (const side of [-1, 1]) {
            eye(head, side * 0.29, 0.1, 0.3, 0.066, colors.leaf);
        }
        // Two rounded bill lobes make the bird readable without a fragile pointed tip.
        oval(head, colors.sun, [0, -0.015, 0.66], [0.28, 0.245, 0.62]);
        oval(head, colors.clay, [0, -0.03, 1.05], [0.24, 0.19, 0.29]);
        oval(head, colors.ink, [0, -0.035, 1.235], [0.12, 0.13, 0.14]);
        curve(head, colors.ochre, [[-0.25, -0.065, 0.42], [-0.245, -0.065, 0.78],
            [-0.13, -0.065, 1.21]], 0.012);
        const tail = new THREE.Group();
        tail.position.set(0, 0.45, -0.37);
        body.add(tail);
        for (const side of [-1, 0, 1]) {
            const feather = oval(tail, colors.ink, [side * 0.12, 0.07, -0.21], [0.105, 0.16, 0.48]);
            feather.rotation.x = -0.2;
            feather.rotation.y = side * 0.12;
        }
        rig.tail = tail;
    } else if (kind === 'macaco') {
        oval(body, colors.brown, [0, 0.61, 0], [0.44, 0.57, 0.34]);
        oval(body, colors.sand, [0, 0.61, 0.29], [0.28, 0.38, 0.085]);
        for (const side of [-1, 1]) {
            const arm = oval(body, colors.brown, [side * 0.43, 0.67, 0.025], [0.16, 0.45, 0.17]);
            arm.rotation.z = side * 0.18;
            oval(body, colors.sand, [side * 0.5, 0.28, 0.08], [0.17, 0.16, 0.17]);
            oval(body, colors.brown, [side * 0.27, 0.18, 0.12], [0.23, 0.18, 0.25]);
            oval(body, colors.sand, [side * 0.27, 0.1, 0.32], [0.22, 0.1, 0.26]);
        }
        head.position.set(0, 1.36, 0.02);
        oval(head, colors.brown, [0, 0, 0], [0.54, 0.5, 0.41]);
        for (const side of [-1, 1]) {
            oval(head, colors.brown, [side * 0.5, 0.01, -0.005], [0.25, 0.26, 0.15]);
            oval(head, colors.sand, [side * 0.54, 0.01, 0.11], [0.165, 0.18, 0.052]);
            oval(head, colors.sand, [side * 0.19, 0.025, 0.315], [0.24, 0.3, 0.125]);
            eye(head, side * 0.21, 0.06, 0.415, 0.068, colors.sand);
        }
        oval(head, colors.sand, [0, -0.2, 0.33], [0.32, 0.225, 0.18]);
        oval(head, colors.bark, [0, -0.105, 0.5], [0.08, 0.052, 0.04]);
        smile(head, -0.255, 0.493, 0.16);
        const hair = oval(head, colors.brown, [0.015, 0.47, -0.015], [0.16, 0.16, 0.15]);
        hair.rotation.z = -0.4;
        const tail = new THREE.Group();
        tail.position.set(0.2, 0.36, -0.25);
        body.add(tail);
        curve(tail, colors.brown, [[0, 0, 0], [0.52, -0.16, -0.1], [0.91, 0.05, -0.07],
            [0.96, 0.53, 0.03], [0.71, 0.8, 0.09], [0.5, 0.63, 0.11], [0.59, 0.47, 0.12]], 0.085);
        oval(tail, colors.brown, [0.59, 0.47, 0.12], [0.09, 0.09, 0.09]);
        rig.tail = tail;
    } else {
        oval(body, colors.moss, [0, 0.6, 0], [0.62, 0.54, 0.48]);
        oval(body, colors.sand, [0, 0.56, 0.36], [0.43, 0.36, 0.16]);
        for (const side of [-1, 1]) {
            oval(body, colors.leaf, [side * 0.57, 0.3, -0.05], [0.33, 0.29, 0.4]);
            oval(body, colors.moss, [side * 0.59, 0.095, 0.27], [0.32, 0.095, 0.36]);
            const arm = oval(body, colors.moss, [side * 0.32, 0.35, 0.39], [0.13, 0.28, 0.135]);
            arm.rotation.z = side * -0.13;
            for (const toe of [-1, 0, 1]) {
                oval(body, colors.leaf, [side * 0.35 + toe * 0.105, 0.055, 0.58 + Math.abs(toe) * -0.04],
                    [0.085, 0.055, 0.16]);
            }
        }
        head.position.set(0, 1.11, 0.06);
        oval(head, colors.leaf, [0, 0, 0], [0.66, 0.39, 0.45]);
        for (const side of [-1, 1]) {
            oval(head, colors.leaf, [side * 0.36, 0.27, 0.045], [0.25, 0.29, 0.24]);
            eye(head, side * 0.36, 0.29, 0.24, 0.125);
            oval(head, colors.sage, [side * 0.46, -0.05, 0.32], [0.105, 0.05, 0.031]);
        }
        smile(head, -0.11, 0.456, 0.28);
    }

    root.userData.animalRig = rig;
    return root;
}

/** Call with the world's paused-aware clock. The root's placement and scale are never changed. */
export function animateAnimal3D(root: THREE.Group, timeSeconds: number, reducedMotion: boolean): void {
    const rig = root.userData.animalRig as AnimalRig | undefined;
    if (!rig) return;
    const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
    rig.body.scale.y = reducedMotion ? 1 : 1 + Math.sin(time * 1.7) * 0.012;
    rig.head.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.72) * 0.07;
    rig.head.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.92) * 0.025;
    if (rig.tail) rig.tail.rotation.y = reducedMotion ? 0 : Math.sin(time * 1.2) * 0.1;
    const blinkTime = ((time % 5.6) + 5.6) % 5.6;
    const eyeScale = reducedMotion || blinkTime < 5.37 ? 1 : 1 - Math.sin((blinkTime - 5.37) / 0.23 * Math.PI) * 0.9;
    for (const eye of rig.eyes) eye.scale.y = eyeScale;
}
