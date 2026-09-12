/* Real meshes and poses; no WebGL pixel rendering or device FPS claim. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

async function main() {
    const roundedBox = await import('three/addons/geometries/RoundedBoxGeometry.js');
    const storage = new Map();
    let blocked = false;
    const window = { localStorage: {
        getItem(key) { if (blocked) throw new Error('blocked'); return storage.get(key) ?? null; },
        setItem(key, value) { if (blocked) throw new Error('blocked'); storage.set(key, value); },
    } };
    const modules = new Map();
    function load(filename) {
        const absolute = path.resolve(__dirname, '..', filename);
        if (modules.has(absolute)) return modules.get(absolute).exports;
        const module = { exports: {} };
        modules.set(absolute, module);
        const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        }).outputText;
        vm.runInNewContext(code, { module, exports: module.exports, window,
            require(name) {
                if (name === 'three') return THREE;
                if (name === 'three/addons/geometries/RoundedBoxGeometry.js') return roundedBox;
                if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name + '.ts'));
                throw new Error(`Unexpected model dependency: ${name}`);
            },
        }, { filename: absolute });
        return module.exports;
    }
    const { Explorer3D } = load('src/game/three/Explorer3D.ts');
    const { characters, getCharacter, readCharacter, writeCharacter } = load('src/game/content/characters.ts');
    assert.equal(readCharacter(), 'lumi');
    assert.equal(getCharacter('unicorn').name, 'Unicórnio');
    assert.equal(getCharacter('unknown').id, 'lumi');
    assert.equal(writeCharacter('dog'), 'dog');
    assert.equal(readCharacter(), 'dog');
    blocked = true;
    assert.equal(writeCharacter('unicorn'), 'unicorn');
    assert.equal(readCharacter(), 'unicorn', 'A blocked store retains this session’s choice');
    blocked = false;
    storage.set('laboratorio-das-letras:character:v1', '{bad preference}');
    assert.equal(readCharacter(), 'lumi', 'Malformed stored choices resolve safely');

    const base = { time: 0, delta: 0, moving: 0, pace: 1, laneLean: 0, ringCount: 0,
        collect: 0, celebrate: 0, greeting: 0, greetingTime: 0, reducedMotion: false };
    const transform = (object) => [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()];
    const pose = (root) => { const out = []; root.traverse((object) => out.push(transform(object))); return out; };
    const bounds = (root) => {
        root.updateMatrixWorld(true);
        const box = new THREE.Box3();
        root.traverseVisible((object) => {
            if (!object.isMesh) return;
            object.geometry.computeBoundingBox();
            box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
        });
        return box;
    };
    const rings = (root) => {
        const out = [];
        root.traverseVisible((object) => { if (/^Anel /.test(object.name)) out.push(object); });
        return out;
    };
    let samples = 0;
    const overallBounds = new THREE.Box3();
    for (const { id } of characters) {
        const explorer = new Explorer3D(id);
        if (id !== 'lumi') {
            const legs = [];
            explorer.root.traverse((object) => { if (object.name.startsWith(`${id}-leg-`)) legs.push(object); });
            assert.equal(legs.length, 4, 'Animal explorers have four independently animated legs');
            assert(!explorer.root.getObjectByName('explorer-head'), 'Animals do not reuse a robot face');
            assert(explorer.root.getObjectByName(`${id}-tail`));
        }
        if (id === 'unicorn') assert(explorer.root.getObjectByName('unicorn-horn'));
        explorer.update({ ...base, ringCount: 24, reducedMotion: true });
        assert.equal(rings(explorer.root).length, 24, 'Eight-letter words retain all 24 rings');
        const matureHeight = bounds(explorer.root).max.y;
        assert(matureHeight <= 3.2, `${id} outgrows the available camera height: ${matureHeight}`);
        assert(explorer.getHeight() >= matureHeight - 0.05, 'Height estimate includes the head and horn');
        rings(explorer.root).forEach((ring, index) => {
            assert(ring.material, 'Every ring, including palette repeats, has a real material');
            assert.equal(ring.position.x, 0, 'The stack remains on the explorer body');
            assert.equal(ring.position.z, 0, 'The stack remains on the explorer body');
            if (index) assert(ring.position.y > rings(explorer.root)[index - 1].position.y);
        });
        for (const phase of ['walk', 'collect', 'greeting']) {
            for (let i = 0; i < 128; i++) {
                const time = i * 0.05;
                explorer.update({ ...base, delta: 0.05, ringCount: 24, time,
                    moving: phase === 'walk' ? 1 : 0,
                    laneLean: phase === 'walk' ? Math.sin(time) : 0,
                    collect: phase === 'collect' ? i / 127 : 0,
                    celebrate: phase === 'greeting' ? 1 : 0,
                    greeting: phase === 'greeting' ? 1 : 0, greetingTime: time });
                const box = bounds(explorer.root);
                assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
                assert(box.min.y >= -0.002, `${id} ${phase} puts a paw beneath the path: ${box.min.y}`);
                assert(box.max.y < 3.3, `${id} ${phase} leaves the reserved animation margin: ${box.max.y}`);
                assert(Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z)) < 0.95,
                    `${id} ${phase} exceeds the shared horizontal envelope`);
                overallBounds.union(box);
                samples++;
            }
        }
        const greetFrame = { ...base, ringCount: 24, greeting: 1, greetingTime: 0.8 };
        explorer.update(greetFrame);
        const frozen = pose(explorer.root);
        explorer.update(greetFrame);
        assert.deepEqual(pose(explorer.root), frozen, 'Frozen world/encounter clocks freeze every joint');
        explorer.update({ ...greetFrame, reducedMotion: true });
        const reduced = pose(explorer.root);
        explorer.update({ ...greetFrame, greetingTime: 99, delta: 0.05, reducedMotion: true });
        assert.deepEqual(pose(explorer.root), reduced, 'Reduced motion makes the greeting a stable friendly pose');
        explorer.update({ ...base, reducedMotion: true });
        assert.equal(rings(explorer.root).length, 0, 'A new mission clears its old rings');
        assert(bounds(explorer.root).max.y < matureHeight - 0.8, 'The whole body returns to its initial height');

        // Switching is a resource ownership boundary, with the public placement unchanged.
        explorer.root.position.set(3, 0.03, -7);
        explorer.root.rotation.y = 1.2;
        const placement = transform(explorer.root);
        const resources = new Set();
        explorer.root.traverse((object) => { if (object.isMesh) { resources.add(object.geometry); resources.add(object.material); } });
        const disposed = new Set();
        for (const resource of resources) resource.addEventListener('dispose', () => disposed.add(resource));
        explorer.update({ ...base, ringCount: 24, reducedMotion: true });
        explorer.setCharacter(id === 'lumi' ? 'unicorn' : 'lumi');
        assert.equal(disposed.size, resources.size, 'Changing character disposes every old geometry/material');
        assert.deepEqual(transform(explorer.root), placement, 'Character selection preserves world placement and facing');
        assert.equal(rings(explorer.root).length, 24, 'Restoring a preference mid-session retains every collected ring');
        explorer.dispose();
        explorer.dispose();
        assert.equal(explorer.root.children.length, 0);
    }
    console.log(`PASS: three original playable rigs, 24 rings, persistence/invalid storage, ${samples} bounded poses, pause/reduced motion, switch/reset and disposal.`);
    console.log(`Measured local animation bounds: ${overallBounds.min.toArray().map((x) => x.toFixed(3))} to ${overallBounds.max.toArray().map((x) => x.toFixed(3))}. No pixel rendering.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
