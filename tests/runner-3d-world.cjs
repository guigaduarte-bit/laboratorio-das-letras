/* Integration without pixels: actual Three meshes, transforms, raycasting, controller and resources.
 * Only WebGLRenderer and the browser canvas/text surface are replaced. This is not a visual test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

function canvas() {
    return {
        width: 1, height: 1, style: {}, parentNode: null, drawnText: '',
        setAttribute() {},
        getContext(kind) {
            assert.equal(kind, '2d', 'Only the font texture uses Canvas 2D');
            const surface = this;
            return { fillText(text) { surface.drawnText = text; } };
        },
        getBoundingClientRect() { return { left: 37, top: 53, width: this.width, height: this.height }; },
        remove() {
            if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
            this.parentNode = null;
        },
    };
}

class Renderer {
    constructor() {
        this.domElement = canvas();
        this.shadowMap = {};
        this.capabilities = { getMaxAnisotropy: () => 8 };
        this.renderCalls = 0;
        this.disposeCalls = 0;
    }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(width, height) { this.domElement.width = width; this.domElement.height = height; }
    render(scene, camera) {
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        // A real renderer owns a render target on every light that renders a shadow map.
        scene.traverse((object) => {
            if (this.shadowMap.enabled && object.isLight && object.castShadow && !object.shadow.map) {
                object.shadow.map = new THREE.WebGLRenderTarget(16, 16);
            }
        });
        this.renderCalls++;
    }
    dispose() { this.disposeCalls++; }
}

async function main() {
    const roundedBox = await import('three/addons/geometries/RoundedBoxGeometry.js');
    const three = { ...THREE, WebGLRenderer: Renderer };
    const modules = new Map();
    let viewportWidth = 1380;
    function load(filename) {
        const absolute = path.resolve(__dirname, '..', filename);
        if (modules.has(absolute)) return modules.get(absolute).exports;
        const module = { exports: {} };
        modules.set(absolute, module);
        const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        }).outputText;
        vm.runInNewContext(code, {
            module, exports: module.exports,
            require(name) {
                if (name === 'three') return three;
                if (name === 'three/addons/geometries/RoundedBoxGeometry.js') return roundedBox;
                if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), `${name}.ts`));
                return require(name);
            },
            window: { devicePixelRatio: 2, matchMedia(query) {
                assert.equal(query, '(min-width: 900px)');
                return { matches: viewportWidth >= 900 };
            } },
            document: { createElement(tag) { assert.equal(tag, 'canvas'); return canvas(); } },
            console,
        }, { filename: absolute });
        return module.exports;
    }

    const animalModule = load('src/game/three/Animals3D.ts');
    const animateAnimal = animalModule.animateAnimal3D;
    let lastAnimalGreeting;
    animalModule.animateAnimal3D = (animal, time, reduced, greeting) => {
        lastAnimalGreeting = greeting;
        return animateAnimal(animal, time, reduced, greeting);
    };
    const { RunnerWorld3D } = load('src/game/three/RunnerWorld3D.ts');
    const { RunnerController, RUNNER_TIMINGS } = load('src/game/systems/RunnerController.ts');
    const { schoolLevels } = load('src/game/content/levels.ts');
    const { EventBus } = load('src/game/EventBus.ts');
    const { getBiomeForLevel } = load('src/game/content/biomes.ts');
    const container = {
        clientWidth: 1300, clientHeight: 550, children: [],
        appendChild(child) { assert(!this.children.includes(child)); child.parentNode = this; this.children.push(child); },
    };
    const world = new RunnerWorld3D(container);
    const animateExplorer = world.explorer.update.bind(world.explorer);
    let lastExplorerGreeting;
    world.explorer.update = (frame) => { lastExplorerGreeting = frame; return animateExplorer(frame); };
    const controller = new RunnerController();
    let collects = 0, words = 0, picks = 0, encounters = 0, replacedResources = 0;
    const regressions = new Set();
    EventBus.on('letter-collected', () => collects++);
    EventBus.on('word-completed', () => words++);
    const render = (delta = 0, reduced = false) => { world.update(controller.frame, delta, reduced); world.render(); };
    const resize = (width, height, windowWidth = width) => { viewportWidth = windowWidth; world.resize(width, height); };
    function tick(milliseconds, options = {}) {
        for (let remaining = milliseconds; remaining > 0;) {
            const step = Math.min(50, remaining);
            const before = world.explorer.root.position.clone();
            controller.update(step);
            render(step / 1000, options.reduced);
            if (options.smooth) {
                assert(world.explorer.root.position.distanceTo(before) < 1.7,
                    'Approaching and returning must move continuously, without teleporting between cards');
            }
            remaining -= step;
        }
    }
    const visibleRings = () => {
        let count = 0;
        world.explorer.root.traverseVisible((object) => { if (/^Anel /.test(object.name)) count++; });
        return count;
    };
    const visibleAnimals = () => [...world.animals].filter(([, animal]) => animal.visible).map(([kind]) => kind);
    function screenPoint(object, local = new THREE.Vector3()) {
        const point = object.localToWorld(local.clone()).project(world.camera);
        const rect = world.canvas.getBoundingClientRect();
        return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2,
            ndc: new THREE.Vector2(point.x, point.y) };
    }
    function effectiveVisibility(object) {
        for (let parent = object; parent; parent = parent.parent) if (!parent.visible) return false;
        return true;
    }
    function checkPicks() {
        assert.equal(controller.frame.phase, 'choose');
        for (const [width, height] of [[1300, 550], [900, 700], [768, 650], [800, 300], [800, 270], [360, 360], [360, 560]]) {
            resize(width, height);
            world.render();
            assert.equal(container.children.length, 1, 'Resize must keep a single canvas');
            const frame = controller.frame;
            assert.equal(world.gates.filter((gate) => gate.root.visible).length, frame.choices.length);
            for (let index = 0; index < frame.choices.length; index++) {
                const gate = world.gates[index];
                assert.equal(gate.face.material.map.image.drawnText, frame.choices[index], 'The real face texture carries the selected letter, including Ç');
                for (const local of [new THREE.Vector3(), new THREE.Vector3(0.6, 0.45, 0)]) {
                    const point = screenPoint(gate.face, local);
                    assert.equal(world.pick(point.x, point.y), index, `${width}×${height}: touching a visible face must choose that exact gate`);
                    picks++;
                }
                const point = screenPoint(gate.face);
                const ray = new THREE.Raycaster();
                ray.setFromCamera(point.ndc, world.camera);
                const nearest = ray.intersectObjects(world.scene.children, true)
                    .find((hit) => effectiveVisibility(hit.object) && hit.object.material?.visible !== false);
                assert.equal(nearest?.object, gate.face, `${width}×${height}: another solid model obscures the letter face`);
            }
            assert.equal(world.pick(38, 54), null, 'Empty sky is not an implicit letter choice');
        }
    }
    function frozenState() {
        const state = [];
        world.scene.traverse((object) => {
            state.push([object.uuid, ...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray(), object.visible]);
            if (object.isInstancedMesh) state.push(Array.from(object.instanceMatrix.array));
        });
        state.push(world.camera.matrixWorld.toArray());
        return state;
    }

    function facingDot(from, toward) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(from.getWorldQuaternion(new THREE.Quaternion()));
        forward.y = 0;
        const direction = toward.getWorldPosition(new THREE.Vector3()).sub(from.getWorldPosition(new THREE.Vector3()));
        direction.y = 0;
        return forward.normalize().dot(direction.normalize());
    }

    function checkEncounter(animal, label) {
        assert(facingDot(world.explorer.root, animal) > 0.9, `${label}: the explorer's actual +Z front must face the animal`);
        assert(facingDot(animal, world.explorer.root) > 0.9, `${label}: the animal must face the explorer in return`);
        assert.equal(lastExplorerGreeting.greetingTime, lastAnimalGreeting.time, 'Both rigs must receive the same greeting clock');
        assert(lastExplorerGreeting.greeting > 0.9 && lastAnimalGreeting.strength > 0.9, 'The final meeting drives both actual greeting rigs');
        encounters++;
    }

    function checkEncounterBounds(animal, width, height, windowWidth) {
        const sidePanel = windowWidth >= 900;
        assert.equal(world.sidePanel, sidePanel, 'The encounter follows the CSS viewport breakpoint, not the narrower canvas');
        const rightLimit = sidePanel ? width - 24 - Math.min(360, width * 0.42) - 8 : width * 0.98;
        for (const [label, root] of [['explorer', world.explorer.root], ['animal', animal]]) {
            const bounds = new THREE.Box3().setFromObject(root, true);
            for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
                const point = new THREE.Vector3(x, y, z).project(world.camera);
                const px = (point.x + 1) * width / 2;
                const py = (1 - point.y) * height / 2;
                assert(px >= width * 0.02 && px < rightLimit,
                    `${width}×${height}, viewport ${windowWidth}: ${label} crosses a side margin or sits under the final card (${px.toFixed(1)} vs ${rightLimit.toFixed(1)})`);
                assert(py > height * 0.1 && py < height * 0.98, `${label} stays inside the final scene vertically`);
            }
        }
    }

    function observeBiomeDisposal(biome) {
        const owned = new Map();
        function record(resource) {
            if (!resource || owned.has(resource)) return;
            owned.set(resource, 0);
            resource.addEventListener('dispose', () => owned.set(resource, owned.get(resource) + 1));
        }
        biome.root.traverse(object => {
            if (!object.isMesh) return;
            record(object.geometry);
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) record(material);
            if (object.isInstancedMesh) record(object);
        });
        return () => {
            assert.equal(biome.root.parent, null, 'The previous biome leaves the actual scene');
            for (const count of owned.values()) assert.equal(count, 1, 'Changing destinations disposes every previous biome resource once');
            replacedResources += owned.size;
        };
    }

    render();
    assert.equal(container.children.length, 1);
    assert.equal(world.renderer.pixelRatio, 1.5, 'High-density screens use the bounded rendering resolution');
    assert.equal(world.gates.some((gate) => gate.root.visible), false);
    assert.equal(world.pick(200, 200), null);

    // A menu click can run after controller reset but before the next rendered frame.
    // The renderer must honor the selection authorized by the ready controller.
    EventBus.emit('runner-start');
    render(0.016);
    EventBus.emit('runner-home');
    assert.equal(controller.snapshot.phase, 'ready');
    assert.equal(world.lastFrame.phase, 'travel', 'The reproduction retains the previous rendered phase');
    world.setCharacter('dog');
    assert.equal(world.explorer.character, 'dog', 'Returning home and choosing before RAF must replace the visible explorer');
    world.setCharacter('lumi');
    render();

    for (const [levelIndex, level] of schoolLevels.entries()) {
        const previousBiome = world.biomeWorld;
        const replaced = previousBiome.root.userData.biomeId !== getBiomeForLevel(level.id).id;
        const checkReplaced = replaced ? observeBiomeDisposal(previousBiome) : null;
        EventBus.emit('runner-home', level.id);
        const character = ['lumi', 'unicorn', 'dog'][levelIndex % 3];
        world.setCharacter(character);
        render();
        assert.equal(world.explorer.character, character, 'The next mission uses the newly chosen explorer');
        checkReplaced?.();
        assert.equal(world.biomeWorld.root.userData.biomeId, getBiomeForLevel(level.id).id);
        assert.equal(world.scene.children.filter(child => child.userData.biomeId).length, 1, 'Exactly one destination is mounted');
        assert.equal(world.scene.background.getHex(), getBiomeForLevel(level.id).sky, 'Sky follows the selected destination');
        const selectedBiome = world.biomeWorld;
        render(0.016);
        assert.equal(world.biomeWorld, selectedBiome, 'A frame never rebuilds an unchanged habitat');
        assert.equal(visibleRings(), 0, 'A new mission clears the previous stack immediately');
        assert.equal(visibleAnimals().length, 0, 'A new mission hides the previous reward');
        assert.equal(world.gates.some((gate) => gate.root.visible), false);
        EventBus.emit('runner-start', level.id);
        render();
        assert.equal(world.pick(200, 200), null, 'Letter picking is disabled during travel');

        for (const [index, expected] of [...level.word].entries()) {
            tick(RUNNER_TIMINGS.travel);
            tick(800);
            assert.equal(controller.frame.phase, 'choose');
            assert.equal(controller.frame.count, index);
            checkPicks();

            if (level.word === 'SAPO' && index === 0) {
                const wrong = controller.frame.choices.findIndex((letter) => letter !== expected);
                EventBus.emit('runner-choose', wrong);
                tick(RUNNER_TIMINGS.approach, { smooth: true });
                assert.equal(controller.frame.phase, 'retry');
                assert.equal(controller.frame.count, 0);
                assert.equal(visibleRings(), 0, 'A different letter does not add or remove collected rings');
                tick(RUNNER_TIMINGS.retry, { smooth: true });
                const target = world.gates[controller.frame.choices.indexOf(expected)];
                assert(target.halo.visible && target.body.material.emissiveIntensity > 0, 'The expected letter receives a gentle visible hint');
            }

            EventBus.emit('runner-choose', controller.frame.choices.indexOf(expected));
            tick(250, { smooth: true });
            assert.equal(world.pick(200, 200), null, 'A pending approach cannot accept a second letter');
            const beforePause = frozenState();
            EventBus.emit('runner-pause', true);
            tick(1000);
            try { assert.deepEqual(frozenState(), beforePause); }
            catch { regressions.add('Pause must freeze every mesh, particle instance and the camera'); }
            assert.equal(world.pick(200, 200), null);
            EventBus.emit('runner-pause', false);
            tick(RUNNER_TIMINGS.approach - 250, { smooth: true });
            assert.equal(controller.frame.phase, 'collect');
            assert.equal(controller.frame.count, index + 1);
            tick(800);
            assert.equal(visibleRings(), (index + 1) * 3, 'Each completed letter adds exactly three settled body rings');
            assert(world.gates.every((gate) => gate.root.scale.x > 0 && gate.root.scale.x <= 1), 'Collection shrink stays finite and bounded');
            tick(RUNNER_TIMINGS.collect - 800);
        }
        assert.equal(controller.frame.phase, 'finish');
        assert.equal(world.gates.some((gate) => gate.root.visible), false, 'The reward sequence clears all letter gates');
        resize(1300, 610);
        tick(RUNNER_TIMINGS.finish - 50);
        const animal = world.animals.get(level.imageKey);
        checkEncounter(animal, 'before celebration');
        const greetingBefore = lastExplorerGreeting.greetingTime;
        const explorerBefore = world.explorer.root.position.clone();
        tick(50);
        assert.equal(controller.frame.phase, 'celebrate');
        checkEncounter(animal, 'finish → celebrate');
        assert(Math.abs(lastExplorerGreeting.greetingTime - greetingBefore - 0.05) < 1e-9,
            'Changing phase advances the greeting clock by exactly one frame; it must not restart');
        assert(world.explorer.root.position.distanceTo(explorerBefore) < 0.08, 'Entering celebration cannot teleport the explorer');
        assert.deepEqual(visibleAnimals(), [level.imageKey], 'The 3D reward matches the completed school word');
        assert(animal.scale.x > 0.9 && Number.isFinite(animal.scale.x), 'The reward finishes its appearance at a visible scale');
        const beforeEncounterPause = frozenState();
        const clockBeforePause = lastExplorerGreeting.greetingTime;
        EventBus.emit('runner-pause', true);
        tick(1000);
        assert.deepEqual(frozenState(), beforeEncounterPause, 'Pause freezes greeting, reply, environment, particles and facing');
        assert.equal(lastExplorerGreeting.greetingTime, clockBeforePause);
        EventBus.emit('runner-pause', false);
        for (const [width, height, windowWidth] of [[1300, 610, 1380], [836, 610, 912], [768, 320, 820], [360, 320, 390], [1000, 610, 1080]]) {
            resize(width, height, windowWidth);
            tick(1000);
            checkEncounter(animal, `${width}×${height} after resize`);
            checkEncounterBounds(animal, width, height, windowWidth);
        }
        render(0, true);
        assert.equal(world.dust.visible, false);
        assert.equal(world.fireflies.visible, false);
        EventBus.emit('runner-start', level.id);
        render();
        assert.equal(visibleRings(), 0, 'Direct replay clears all rings');
        assert.equal(visibleAnimals().length, 0, 'Direct replay hides the previous animal immediately');
        assert.equal(lastExplorerGreeting.greeting, 0, 'Direct replay clears the explorer greeting');
        assert.equal(lastExplorerGreeting.greetingTime, 0, 'Direct replay starts with no stale meeting clock');
    }
    assert.equal(collects, schoolLevels.reduce((sum, level) => sum + level.word.length, 0));
    assert.equal(words, schoolLevels.length, 'Each word completes exactly once');

    // Track real disposal events, including cached letter textures that are no longer assigned to a face.
    const resources = new Map();
    function track(resource, label) {
        if (!resource || resources.has(resource)) return;
        const record = { label, count: 0 };
        resources.set(resource, record);
        resource.addEventListener('dispose', () => record.count++);
    }
    world.scene.traverse((object) => {
        if (object.isMesh) {
            track(object.geometry, 'geometry');
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) track(material, 'material');
            if (object.isInstancedMesh) track(object, 'instance buffer');
        }
        if (object.isLight && object.shadow) track(object.shadow.map, 'shadow render target');
    });
    for (const texture of world.textures.values()) track(texture, 'letter texture');
    const renderer = world.renderer;
    const renderCalls = renderer.renderCalls;
    world.dispose();
    world.dispose();
    for (const { label, count } of resources.values()) {
        if (count !== 1) regressions.add(`Each owned ${label} must be disposed exactly once (received ${count})`);
    }
    assert.equal(renderer.disposeCalls, 1);
    assert.equal(container.children.length, 0, 'Unmount removes the canvas');
    world.resize(500, 500); render(0.016);
    assert.equal(renderer.renderCalls, renderCalls, 'Disposed worlds do not draw or recreate their canvas');
    assert.equal(world.pick(200, 200), null);
    controller.destroy();
    assert.equal(regressions.size, 0, [...regressions].join('\n'));
    console.log(`PASS: real Three world, ${schoolLevels.length} animals, three explorers, selection before RAF, ${picks} face picks, ${encounters} mutual-facing meetings, shared-clock transition/pause/replay, viewport/card framing, four active biomes, ${replacedResources} replaced + ${resources.size} final disposed resources (no pixel rendering).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
