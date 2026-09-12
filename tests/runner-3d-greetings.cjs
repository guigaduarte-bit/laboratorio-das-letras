/* Real model rigs: directed greetings, animal-specific replies, pause and ownership.
 * This verifies geometry/poses, not rendered pixels or animation quality on a device. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

async function main() {
    const roundedBox = await import('three/addons/geometries/RoundedBoxGeometry.js');
    function load(filename) {
        const absolute = path.resolve(__dirname, '..', filename);
        const module = { exports: {} };
        const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        }).outputText;
        vm.runInNewContext(code, {
            module, exports: module.exports,
            require(name) {
                if (name === 'three') return THREE;
                if (name === 'three/addons/geometries/RoundedBoxGeometry.js') return roundedBox;
                if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), `${name}.ts`));
                throw new Error(`Unexpected model dependency: ${name}`);
            },
        }, { filename: absolute });
        return module.exports;
    }
    const { Explorer3D } = load('src/game/three/Explorer3D.ts');
    const { createAnimal3D, animateAnimal3D } = load('src/game/three/Animals3D.ts');
    const transform = (object) => [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()];
    function pose(root) {
        const result = [];
        root.traverse((object) => result.push(transform(object)));
        return result;
    }
    function setPlacement(root) {
        root.position.set(3, 0.3, -7);
        root.rotation.set(0, 1.17, 0);
        root.scale.setScalar(0.87);
        return transform(root);
    }

    const explorer = new Explorer3D();
    const frame = { time: 19, delta: 0, moving: 0, laneLean: 0, ringCount: 0,
        collect: 0, celebrate: 1, greeting: 1, greetingTime: 0, reducedMotion: false };
    const placement = setPlacement(explorer.root);
    explorer.update(frame);
    const left = explorer.root.getObjectByName('explorer-arm-left');
    const right = explorer.root.getObjectByName('explorer-arm-right');
    const hand = explorer.root.getObjectByName('explorer-hand-right');
    const handPosition = () => {
        explorer.root.updateMatrixWorld(true);
        return explorer.root.worldToLocal(hand.getWorldPosition(new THREE.Vector3()));
    };
    const restingHand = handPosition();
    explorer.update({ ...frame, greetingTime: 0.8 });
    assert(handPosition().z > restingHand.z + 0.2, 'The greeting hand must reach toward the animal-facing +Z direction');
    assert(Math.abs(left.rotation.z) < 0.2, 'The other hand relaxes instead of retaining the two-handed victory pose');
    assert(Math.abs(right.rotation.x) > 0.7, 'A real shoulder joint produces the greeting');
    const pausedPose = pose(explorer.root);
    for (let i = 0; i < 20; i++) explorer.update({ ...frame, greetingTime: 0.8 });
    assert.deepEqual(pose(explorer.root), pausedPose, 'Zero delta and frozen encounter time must preserve the exact pose');
    for (let time = 0; time < 12.8; time += 0.05) {
        explorer.update({ ...frame, greetingTime: time });
        assert.deepEqual(transform(explorer.root), placement, 'The world owns explorer placement, facing and scale');
        assert(Math.abs(hand.rotation.z) <= 0.35, 'Wrist motion remains a small wave');
        assert(Math.abs(left.rotation.z) < 0.2, 'Greeting wins over celebration throughout the encounter');
    }
    explorer.update({ ...frame, greetingTime: 4 });
    assert(Math.abs(right.rotation.x) < 0.01, 'The wave includes a real resting interval');
    explorer.update({ ...frame, celebrate: 0, greeting: 0 });
    const baseline = pose(explorer.root);
    explorer.update({ ...frame, greetingTime: 0.8 });
    explorer.update({ ...frame, celebrate: 0, greeting: 0 });
    assert.deepEqual(pose(explorer.root), baseline, 'A new mission clears the greeting pose');
    explorer.update({ ...frame, reducedMotion: true });
    const reducedExplorer = pose(explorer.root);
    explorer.update({ ...frame, greetingTime: 99, reducedMotion: true });
    assert.deepEqual(pose(explorer.root), reducedExplorer, 'Reduced motion uses a stable friendly pose');
    explorer.dispose();

    let samples = 0;
    for (const kind of ['sapo', 'onca', 'tucano', 'macaco']) {
        const animal = createAnimal3D(kind);
        const placed = setPlacement(animal);
        const body = animal.getObjectByName('animal-body');
        const head = animal.getObjectByName('animal-head');
        animateAnimal3D(animal, 0, false);
        const resting = pose(animal);
        animateAnimal3D(animal, 0, false, { strength: 1, time: 0.5 });
        assert.deepEqual(pose(animal), resting, 'The animal waits for the first wave before answering');
        animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
        assert.notDeepEqual(pose(animal), resting, `${kind} responds with actual joint motion`);
        if (kind === 'sapo') assert(body.position.y > 0.15, 'The frog responds with a small hop');
        if (kind === 'onca') {
            assert(animal.getObjectByName('animal-greeting-paw').rotation.x < -0.2, 'The jaguar lifts a front paw');
            assert(Math.abs(head.rotation.z) > 0.08, 'The jaguar tilts its head toward its new friend');
        }
        if (kind === 'tucano') {
            assert(animal.getObjectByName('animal-wing-left').rotation.z < -0.5);
            assert(animal.getObjectByName('animal-wing-right').rotation.z > 0.5, 'The toucan opens both wings');
        }
        if (kind === 'macaco') assert(animal.getObjectByName('animal-greeting-arm').rotation.z > 1.2, 'The monkey raises its hand to wave back');
        const frozen = pose(animal);
        animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
        assert.deepEqual(pose(animal), frozen, 'Frozen world and encounter clocks preserve the response exactly');
        for (let time = 0; time < 12.8; time += 0.05) {
            animateAnimal3D(animal, 0, false, { strength: 1, time });
            assert.deepEqual(transform(animal), placed, 'The world owns animal placement, facing and scale');
            assert(body.position.y >= 0 && body.position.y <= 0.24, 'Replies never leave the landing area or jump excessively');
            assert(body.scale.y > 0.95 && body.scale.y < 1.06, 'Body deformation remains subtle');
            const bounds = new THREE.Box3().setFromObject(animal, true);
            assert([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
            assert(bounds.min.y >= placed[1] - 0.01, `${kind} at ${time}: reply motions must not bury the feet beneath the ground (${bounds.min.y})`);
            samples++;
        }
        animateAnimal3D(animal, 0, false, { strength: 1, time: 4 });
        assert.deepEqual(pose(animal), resting, 'Each reply ends with a resting interval');
        animateAnimal3D(animal, 0, false, { strength: 1, time: 1.75 });
        animateAnimal3D(animal, 0, false);
        assert.deepEqual(pose(animal), resting, 'Leaving the encounter resets all reply joints');
        animateAnimal3D(animal, 0, true, { strength: 1, time: 1.75 });
        const reduced = pose(animal);
        animateAnimal3D(animal, 59, true, { strength: 1, time: 99 });
        assert.deepEqual(pose(animal), reduced, 'Reduced motion removes all continuous animal reply animation');
        assert.equal(body.position.y, 0, 'Reduced motion never hops');
    }
    console.log(`PASS: one-handed directed greeting, four distinct replies, ${samples} bounded pose samples, shared-clock pause, rest/reset and reduced motion (no pixel rendering).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
