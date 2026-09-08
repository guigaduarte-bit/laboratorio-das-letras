/* Exercise the real scene and EventBus with rendering stand-ins; no browser or GPU. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const ts = require('typescript');
const Rectangle = require(path.join(__dirname, '../node_modules/phaser/src/geom/rectangle'));

function load(relative, imports) {
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import: ${name}`);
    }, window: { matchMedia: () => ({ matches: false }) } });
    return module.exports;
}

function display() {
    const item = {
        displayOriginX: 0, displayOriginY: 0,
        setSize(w, h) { this.displayOriginX = w / 2; this.displayOriginY = h / 2; return this; },
        setInteractive(hitArea, hitAreaCallback) { this.input = { hitArea, hitAreaCallback }; return this; }
    };
    for (const method of ['setDepth', 'setOrigin', 'setPosition', 'setScale', 'setAlpha', 'setVisible',
        'destroy', 'clear', 'fillStyle', 'fillEllipse', 'fillRoundedRect', 'lineStyle',
        'strokeRoundedRect', 'strokeEllipse', 'fillCircle', 'lineBetween']) item[method] = () => item;
    return item;
}
class Scene {
    constructor() {
        this.add = { graphics: display, text: display, container: display };
        this.input = new EventEmitter();
        this.input.keyboard = new EventEmitter();
        this.events = new EventEmitter();
        this.tweens = { resumeAll() {}, pauseAll() {} };
        this.time = { now: 0 };
        this.scale = Object.assign(new EventEmitter(), { width: 1024, height: 490 });
        this.cameras = { resize() {} };
    }
}
class Avatar {
    destroy() {}
    playCollect() {}
    playCelebrate() {}
    syncPosition(x, y) { this.x = x; this.y = y; }
    setRunnerPose() {}
    setRingCount(count) { this.rings = count; }
    getRunnerScale(width, height, approach) { return Math.min(1.4, Math.max(.82, width/740)) * (1-approach*.16); }
}
class World {
    resize() {}
    render() {}
    project(lane, depth) { return { x: lane * 100, y: 500 * (1 - depth) }; }
}
const EventBus = new EventEmitter();
const busImport = { '../EventBus': { EventBus } };
const { WordProgress } = load('src/game/systems/WordProgress.ts', busImport);
const content = load('src/game/content/runner.ts', {});
const pace = load('src/game/content/runnerPace.ts', {});
const { RUNNER_TIMINGS: times } = pace;
const { RunnerScene } = load('src/game/scenes/RunnerScene.ts', {
    ...busImport, phaser: { Scene, Geom: { Rectangle } },
    '../content/levels': load('src/game/content/levels.ts', {}),
    '../content/runner': content, '../systems/WordProgress': { WordProgress },
    '../content/runnerPace': pace,
    '../visuals/PlayerAvatar': { PlayerAvatar: Avatar },
    '../visuals/RunnerWorld': { RunnerWorld: World },
    '../visuals/palette': { ART_COLORS: {}, PHASER_FONT: 'Lexend' }
});
const scene = new RunnerScene();
let state, collected = 0, completed = 0, hints = 0;
EventBus.on('runner-state', (next) => { state = next; });
EventBus.on('letter-collected', () => collected++);
EventBus.on('word-completed', () => completed++);
EventBus.on('letter-mismatch', () => hints++);
function tick(ms) {
    while (ms > 0) { const dt = Math.min(ms, 50); scene.time.now += dt; scene.update(scene.time.now, dt); ms -= dt; }
}
function key(value, options = {}) {
    const event = { key: value, code: value === ' ' ? 'Space' : value, target: null,
        preventDefault() { this.prevented = true; }, ...options };
    scene.input.keyboard.emit('keydown', event);
    return event;
}
const button = { closest: (selector) => selector === 'button' ? button : null };
const dialog = { closest: (selector) => selector.includes('dialog') ? dialog : null };
function select(index, method = 'keyboard') {
    while (state.lane !== index) {
        const direction = Math.sign(index - state.lane);
        if (method === 'touch') EventBus.emit('runner-move', direction);
        else key(direction < 0 ? 'ArrowLeft' : 'ArrowRight', { target: button });
    }
}
scene.create();
EventBus.emit('runner-start');
assert.equal(key('ArrowUp').prevented, true, 'An early arrow must not scroll the page');
tick(times.travel - 1);
assert.equal(state.phase, 'travel', 'Travel lasts until arrival, even at the faster pace');
tick(1);
assert.equal(state.phase, 'choose');
const choiceDistance = scene.distance;
tick(120000);
assert.equal(state.phase, 'choose', 'The child can take as long as needed');
assert.equal(scene.distance, choiceDistance, 'More speed does not advance the path during reading');

// Engine input coordinates include the Container origin: test the visible letter center and edges.
for (const { root } of scene.gates) {
    const hit = (x, y) => root.input.hitAreaCallback(root.input.hitArea, x + root.displayOriginX, y + root.displayOriginY);
    assert.equal(hit(0, -56), true);
    assert.equal(hit(45, -100), true);
    assert.equal(hit(-45, 0), true);
    assert.equal(hit(-60, -56), false);
}
key('ArrowUp', { target: dialog });
key('Enter', { target: button });
key(' ', { target: button });
key('ArrowUp', { repeat: true });
assert.equal(state.phase, 'choose', 'Modal input, native buttons and held keys must not collect');

select(state.choices.findIndex((letter) => letter !== 'S'));
const laneBeforeRepeat = state.lane;
key('ArrowRight', { repeat: true });
assert.equal(state.lane, laneBeforeRepeat);
tick(200);
const beforeApproachY = scene.avatar.y;
key('ArrowUp', { target: button });
assert.equal(state.phase, 'approach', 'Up works even after focusing a UI button');
assert.equal(collected, 0, 'Nothing is collected before arriving at the letter');
tick(300);
assert.ok(scene.avatar.y < beforeApproachY, 'The character visibly advances');
EventBus.emit('runner-pause', true);
const pausedY = scene.avatar.y;
EventBus.emit('runner-advance'); tick(1200);
assert.equal(scene.avatar.y, pausedY);
assert.equal(hints, 0, 'Pause freezes the pending choice');
EventBus.emit('runner-pause', false); tick(times.approach - 300);
assert.equal(state.phase, 'retry'); assert.equal(hints, 1); assert.equal(state.count, 0);
tick(times.retry);
assert.equal(state.phase, 'choose'); assert.equal(state.hinted, true);
select(state.choices.indexOf('S'));
key('ArrowUp'); key('ArrowUp'); EventBus.emit('runner-advance');
tick(times.approach);
assert.equal(collected, 1, 'Multiple inputs cannot duplicate a collection');
tick(times.collect + times.travel);
assert.equal(state.phase, 'choose'); assert.equal(state.count, 1);

// A swipe starting on a card changes lanes without accidentally choosing that card.
const first = scene.gates[0].root;
scene.input.emit('pointerdown', { id: 1, x: 100, y: 150 }, [first]);
scene.input.emit('pointerup', { id: 2, x: 150, y: 150 }, []);
assert.equal(state.lane, 0, 'A second finger cannot complete the first gesture');
scene.input.emit('pointerup', { id: 1, x: 150, y: 150 }, []);
assert.equal(state.lane, 1); assert.equal(state.phase, 'choose');
scene.input.emit('pointerdown', { id: 1, x: 100, y: 150 }, []);
scene.input.emit('pointerupoutside', { id: 1 });
scene.input.emit('pointerup', { id: 1, x: 100, y: 80 }, []);
assert.equal(state.phase, 'choose', 'A cancelled gesture must not advance');
const secondTarget = scene.gates[state.choices.indexOf('A')].root;
scene.input.emit('pointerdown', { id: 1, x: 100, y: 150 }, [secondTarget]);
assert.equal(state.phase, 'choose', 'Touch waits for release');
scene.input.emit('pointerup', { id: 1, x: 103, y: 151 }, [secondTarget]);
tick(times.approach); assert.equal(state.count, 2);
tick(times.collect + times.travel);
select(state.choices.indexOf('P'), 'touch');
EventBus.emit('runner-advance'); tick(times.approach);
assert.equal(state.count, 3, 'Direction buttons and Advance use the same game action');
tick(times.collect + times.travel);
select(state.choices.indexOf('O'));
scene.input.emit('pointerdown', { id: 1, x: 100, y: 150 }, []);
scene.input.emit('pointerup', { id: 1, x: 105, y: 80 }, []);
tick(times.approach); tick(times.collect + times.finish);
assert.equal(state.phase, 'celebrate'); assert.equal(collected, 4); assert.equal(completed, 1);
EventBus.emit('runner-start');
assert.equal(state.count, 0); assert.equal(state.phase, 'travel');
// The same scene must complete every school word, including cedilla and repeated letters.
const { schoolLevels } = load('src/game/content/levels.ts', {});
assert.equal(schoolLevels.map(({ word }) => word).join(','), 'SAPO,ONÇA,TUCANO,MACACO');
for (const level of schoolLevels) {
    EventBus.emit('runner-home', level.id);
    assert.equal(state.phase, 'ready'); assert.equal(state.word, level.word);
    EventBus.emit('runner-start', level.id);
    assert.equal(state.levelId, level.id); assert.equal(state.count, 0);
    EventBus.emit('runner-start', 'forest-sapo');
    assert.equal(state.levelId, level.id, 'Cannot change a level during an active run');
    for (const [index, letter] of [...level.word].entries()) {
        tick(times.travel);
        assert.equal(state.phase, 'choose');
        assert.equal(state.count, index);
        select(state.choices.indexOf(letter));
        EventBus.emit('runner-advance'); tick(times.approach);
        assert.equal(state.count, index + 1);
        assert.equal(scene.avatar.rings, (index + 1) * 3);
        tick(times.collect);
    }
    tick(times.finish);
    assert.equal(state.phase, 'celebrate'); assert.equal(state.count, level.word.length);
}
EventBus.emit('runner-home', 'unknown');
assert.equal(state.word, 'SAPO', 'An unknown mission safely falls back to the school default');
scene.cleanup();
for (const event of ['runner-start', 'runner-move', 'runner-advance', 'runner-choose']) assert.equal(EventBus.listenerCount(event), 0);
assert.equal(scene.input.listenerCount('pointerup'), 0);
console.log('PASS: arrows, focused buttons, physical advance, touch targets, tap/swipe, multitouch, pause, retry and all four school words, repeated letters, cedilla and ring counts.');
