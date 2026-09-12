/* Real Three.js geometry and joint samples; this does not render pixels or measure device FPS. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

const source = path.resolve(__dirname, '../src/game/three/Animals3D.ts');
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module: loaded, exports: loaded.exports, require: (name) => {
    assert.equal(name, 'three');
    return THREE;
} }, { filename: source });
const { createAnimal3D, animateAnimal3D } = loaded.exports;
const transform = (object) => [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()];
function pose(root) {
    const values = [];
    root.traverse((object) => values.push(...transform(object)));
    return values;
}
function resources(root) {
    const owned = new Set();
    root.traverse((mesh) => {
        if (!mesh.isMesh) return;
        owned.add(mesh.geometry);
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) owned.add(mat);
    });
    return owned;
}

let samples = 0;
const metrics = [];
for (const kind of ['preguica', 'sucuri', 'capivara', 'arara']) {
    const animal = createAnimal3D(kind);
    const head = animal.getObjectByName('animal-head');
    const originalPlacement = transform(animal);
    const totalBounds = new THREE.Box3();
    assert(head, 'Every animal retains the head joint expected by the shared encounter');
    for (const eye of animal.userData.animalRig.eyes) assert(eye.position.z > 0.24, 'The face points along +Z toward the explorer');
    animateAnimal3D(animal, 0, false);
    const resting = pose(animal);
    animateAnimal3D(animal, 0, false, { strength: 1, time: 0.5 });
    assert.deepEqual(pose(animal), resting, 'The animal waits for the explorer to greet it');
    animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
    assert.notDeepEqual(pose(animal), resting, `${kind} must make a visible joint response`);
    if (kind === 'preguica') {
        assert(animal.getObjectByName('sloth-mask-left') && animal.getObjectByName('sloth-mask-right'));
        assert(animal.getObjectByName('animal-greeting-arm').rotation.z > 0.6, 'The sloth raises its long arm');
    }
    if (kind === 'sucuri') {
        const coils = animal.getObjectByName('snake-coiled-body');
        assert(coils.geometry.isBufferGeometry);
        assert(coils.geometry.parameters.path.getLength() > 5, 'A continuous tubular body makes multiple real coils');
        assert(animal.getObjectByName('snake-raised-neck'));
        assert(head.rotation.x > 0.1, 'The snake replies by nodding its raised head');
    }
    if (kind === 'capivara') {
        assert(animal.getObjectByName('capybara-broad-muzzle'));
        assert(animal.getObjectByName('animal-greeting-paw').rotation.x < -0.1);
    }
    if (kind === 'arara') {
        assert(animal.getObjectByName('macaw-hooked-bill'));
        assert(animal.getObjectByName('macaw-long-tail'));
        assert(animal.getObjectByName('animal-wing-left').rotation.z < -0.5);
        assert(animal.getObjectByName('animal-wing-right').rotation.z > 0.5);
    }
    const frozen = pose(animal);
    animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
    assert.deepEqual(pose(animal), frozen, 'Frozen clocks preserve an exact paused pose');
    for (let t = 0; t < 12.8; t += 0.05) {
        animateAnimal3D(animal, t, false, { strength: 1, time: t });
        assert.deepEqual(transform(animal), originalPlacement, 'Animation leaves placement and facing to the world');
        const bounds = new THREE.Box3().setFromObject(animal, true);
        assert([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
        assert(bounds.min.y >= -0.006, `${kind} never sinks below the floor: ${bounds.min.y}`);
        assert(bounds.min.x > -1.15 && bounds.max.x < 1.15, `${kind} stays inside the encounter width`);
        assert(bounds.min.z > -1.3 && bounds.max.z < 1.3, `${kind} stays inside the encounter depth`);
        assert(bounds.max.y < 2, `${kind} stays inside the reserved height`);
        totalBounds.union(bounds);
        samples++;
    }
    animateAnimal3D(animal, 0, false, { strength: 1, time: 4 });
    assert.deepEqual(pose(animal), resting, 'Every greeting includes a true rest');
    animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
    animateAnimal3D(animal, 0, false);
    assert.deepEqual(pose(animal), resting, 'Leaving the encounter resets all joints');
    animateAnimal3D(animal, 0, true, { strength: 1, time: 1.75 });
    const reduced = pose(animal);
    animateAnimal3D(animal, 77, true, { strength: 1, time: 42 });
    assert.deepEqual(pose(animal), reduced, 'Reduced motion is a stable friendly pose');
    const own = resources(animal);
    const sibling = createAnimal3D(kind);
    const other = resources(sibling);
    assert([...own].every((resource) => !other.has(resource)), 'Each model owns resources; replacing it cannot invalidate another');
    let disposed = 0;
    for (const resource of own) resource.addEventListener('dispose', () => { disposed++; });
    for (const resource of own) resource.dispose();
    assert.equal(disposed, own.size, 'World traversal can release every model resource');
    for (const resource of other) resource.dispose();
    metrics.push({ kind, min: totalBounds.min.toArray().map((value) => +value.toFixed(3)),
        max: totalBounds.max.toArray().map((value) => +value.toFixed(3)), resources: own.size });
}
console.log(JSON.stringify(metrics));
console.log(`PASS: four new animal geometries, ${samples} bounded poses, face direction, greetings, pause, reset, reduced motion and resource ownership.`);
