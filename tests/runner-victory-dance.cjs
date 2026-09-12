/* Real Three.js rig poses and geometry. Does not render pixels or claim device FPS. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

async function main() {
    const roundedBox = await import('three/addons/geometries/RoundedBoxGeometry.js');
    const modules = new Map();
    function load(filename) {
        const absolute = path.resolve(__dirname, '..', filename);
        if (modules.has(absolute)) return modules.get(absolute).exports;
        const module = { exports: {} };
        modules.set(absolute, module);
        const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        }).outputText;
        vm.runInNewContext(code, { module, exports: module.exports,
            require(name) {
                if (name === 'three') return THREE;
                if (name === 'three/addons/geometries/RoundedBoxGeometry.js') return roundedBox;
                if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name + '.ts'));
                throw new Error(`Unexpected dependency: ${name}`);
            },
        }, { filename: absolute });
        return module.exports;
    }
    const { Explorer3D } = load('src/game/three/Explorer3D.ts');
    const { sampleVictoryDance, VICTORY_DANCE_DURATION } = load('src/game/content/victoryDance.ts');
    assert.equal(VICTORY_DANCE_DURATION, 4);
    const zero = Object.values(sampleVictoryDance());
    for (const time of [undefined, NaN, Infinity, -Infinity, -1, 0, 4, 8, 100]) {
        assert.deepEqual(Object.values(sampleVictoryDance(time)), zero, `No dance outside its finite clock: ${time}`);
    }
    assert(sampleVictoryDance(0.25).leftStep > 0.9);
    assert.equal(sampleVictoryDance(0.25).rightStep, 0);
    assert(sampleVictoryDance(0.75).rightStep > 0.9, 'The next beat uses the other foot');
    assert(sampleVictoryDance(3.05).bounce > 0.99, 'The closing beat has one little hop');
    assert.equal(sampleVictoryDance(3.5).strength, 1, 'A brief final pose follows the hop');
    assert.equal(sampleVictoryDance(3.5).bounce, 0);
    assert(sampleVictoryDance(0.01).strength < 0.01, 'Soft entrance');
    assert(sampleVictoryDance(3.99).strength < 0.01, 'Soft return to the greeting');
    for (let i = 0; i <= 400; i++) {
        const sample = sampleVictoryDance(i / 100);
        for (const [key, value] of Object.entries(sample)) {
            assert(value <= 1 && value >= (key === 'sway' || key === 'twist' ? -1 : 0), `${key} is normalized`);
        }
        assert.deepEqual(Object.values(sampleVictoryDance(i / 100, true)), zero, 'Reduced motion never samples movement');
    }

    const frame = { time: 0, delta: 0, moving: 0, pace: 1, laneLean: 0, ringCount: 24,
        collect: 0, celebrate: 1, greeting: 1, greetingTime: 0.8, reducedMotion: false };
    const transform = (object) => [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()];
    const pose = (root) => { const result = []; root.traverse((object) => result.push(transform(object))); return result; };
    const bounds = (root) => {
        root.updateMatrixWorld(true);
        const result = new THREE.Box3();
        root.traverseVisible((object) => {
            if (!object.isMesh) return;
            if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
            result.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
        });
        return result;
    };
    let samples = 0;
    const fullBounds = new THREE.Box3();
    for (const id of ['lumi', 'unicorn', 'dog']) {
        const explorer = new Explorer3D(id);
        // Finish growth before measuring the completed-word dance.
        explorer.update({ ...frame, reducedMotion: true });
        const baselineFrame = { ...frame, victoryTime: undefined };
        explorer.update(baselineFrame);
        const body = explorer.root.getObjectByName(id === 'lumi' ? 'explorer-body' : `${id}-body`);
        const left = explorer.root.getObjectByName(id === 'lumi' ? 'explorer-leg-left' : `${id}-leg-front-left`);
        const right = explorer.root.getObjectByName(id === 'lumi' ? 'explorer-leg-right' : `${id}-leg-front-right`);
        explorer.update({ ...frame, victoryTime: 0.25 });
        const firstBeat = [transform(left), transform(right)];
        explorer.update({ ...frame, victoryTime: 0.75 });
        assert.notDeepEqual([transform(left), transform(right)], firstBeat, `${id} alternates actual limb joints`);
        assert.notEqual(body.rotation.y, 0, `${id} twists its body without changing world facing`);
        if (id === 'lumi') {
            assert(explorer.root.getObjectByName('explorer-arm-left').rotation.z < -2);
            assert(explorer.root.getObjectByName('explorer-arm-right').rotation.z > 2);
        }
        for (let i = 0; i <= 240; i++) {
            explorer.update({ ...frame, delta: 1 / 60, victoryTime: i / 60, greetingTime: i / 60 });
            const box = bounds(explorer.root);
            assert(box.min.y >= -0.002, `${id} dance sinks a foot: ${box.min.y}`);
            assert(box.max.y <= 3.3, `${id} dance is too tall: ${box.max.y}`);
            assert(Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z)) <= 0.95,
                `${id} dance is too wide: ${box.min.toArray()} to ${box.max.toArray()}`);
            assert(Math.abs(body.rotation.y) <= 0.081, 'Body turns stay directed toward the animal');
            fullBounds.union(box);
            samples++;
        }
        const frozenFrame = { ...frame, victoryTime: 1.25 };
        explorer.update(frozenFrame);
        const frozen = pose(explorer.root);
        explorer.update(frozenFrame);
        assert.deepEqual(pose(explorer.root), frozen, `${id} dance freezes on pause`);

        explorer.update({ ...frame, victoryTime: 4 });
        const ended = pose(explorer.root);
        explorer.update(baselineFrame);
        assert.deepEqual(pose(explorer.root), ended, `${id} returns fully to the current greeting after four seconds`);
        // Time itself is not a trigger. Starting a new mission clears the pose immediately.
        explorer.update({ ...frame, victoryTime: 0.25 });
        explorer.update({ ...frame, celebrate: 0, greeting: 0 });
        assert.equal(body.position.x, 0);
        assert.equal(body.rotation.y, 0);
        assert.equal(Math.abs(left.rotation.z), 0);
        assert.equal(Math.abs(right.rotation.z), 0);
        explorer.update({ ...frame, victoryTime: 0.25, reducedMotion: true });
        const reduced = pose(explorer.root);
        explorer.update({ ...frame, delta: 0.05, victoryTime: 2.95, greetingTime: 99, reducedMotion: true });
        assert.deepEqual(pose(explorer.root), reduced, `${id} keeps a static friendly pose for reduced motion`);

        explorer.root.position.set(2, 0.03, -3);
        explorer.root.rotation.y = 1.2;
        const placement = transform(explorer.root);
        explorer.update({ ...frame, victoryTime: 0.5 });
        assert.deepEqual(transform(explorer.root), placement, 'The rig never owns world placement or partner-facing rotation');
        const resources = new Set();
        explorer.root.traverse((object) => { if (object.isMesh) { resources.add(object.geometry); resources.add(object.material); } });
        const disposed = new Set();
        resources.forEach((resource) => resource.addEventListener('dispose', () => disposed.add(resource)));
        explorer.dispose();
        explorer.dispose();
        assert.equal(disposed.size, resources.size, 'Every rig resource is released during/after dancing');
        assert.equal(explorer.root.children.length, 0);
    }
    console.log(`PASS: finite four-second dance, alternating real joints for 3 avatars, ${samples} grounded/bounded poses with 24 rings, pause/reduced motion, greeting/reset and disposal.`);
    console.log(`Dance bounds: ${fullBounds.min.toArray().map((x) => x.toFixed(3))} to ${fullBounds.max.toArray().map((x) => x.toFixed(3))}. No pixel rendering.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
