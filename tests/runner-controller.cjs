/* Exercise the production runner rules without a renderer, DOM or GPU. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const ts = require('typescript');

function load(relative, imports = {}) {
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected dependency: ${name}`);
    } });
    return module.exports;
}

const EventBus = new EventEmitter();
const bus = { '../EventBus': { EventBus } };
const content = load('src/game/content/levels.ts');
const { RunnerController, RUNNER_TIMINGS: times } = load('src/game/systems/RunnerController.ts', {
    ...bus,
    '../content/levels': content,
    '../content/runner': load('src/game/content/runner.ts'),
    '../content/runnerPace': load('src/game/content/runnerPace.ts'),
    './WordProgress': load('src/game/systems/WordProgress.ts', bus)
});
const collections = [], starts = [], completions = [], celebrations = [], mismatches = [], hints = [];
let publications = 0;
EventBus.on('runner-state', () => publications++);
EventBus.on('level-started', (event) => starts.push(event));
EventBus.on('letter-collected', (event) => {
    collections.push(event);
    // Input can arrive synchronously from another listener; collection must already be locked.
    EventBus.emit('runner-advance');
});
EventBus.on('word-completed', (event) => completions.push(event));
EventBus.on('celebration-ready', (event) => celebrations.push(event));
EventBus.on('letter-mismatch', (event) => mismatches.push(event));
EventBus.on('runner-hint-used', (event) => hints.push(event));
const controller = new RunnerController();
let animatedMs = 0;
function tick(ms) {
    while (ms > 0) {
        const dt = Math.min(ms, 50);
        const { paused, phase } = controller.snapshot;
        if (!paused && ['travel', 'approach', 'retry', 'collect', 'finish'].includes(phase)) animatedMs += dt;
        controller.update(dt);
        ms -= dt;
    }
}
function select(index) {
    assert.ok(index >= 0, 'The requested letter must have a visible alternative');
    while (controller.snapshot.lane !== index) {
        EventBus.emit('runner-move', Math.sign(index - controller.snapshot.lane));
    }
}
function assertPaused(ms) {
    EventBus.emit('runner-pause', true);
    const before = JSON.stringify(controller.frame);
    EventBus.emit('runner-choose', 0);
    EventBus.emit('runner-move', 1);
    EventBus.emit('runner-advance');
    EventBus.emit('runner-hint');
    tick(ms);
    assert.equal(JSON.stringify(controller.frame), before, 'Pause freezes position, clock and choices');
    EventBus.emit('runner-pause', false);
}

assert.equal(controller.snapshot.word, 'SAPO');
assert.equal(controller.snapshot.phase, 'ready');
EventBus.emit('runner-start');
assert.equal(starts.length, 1);
assert.equal(starts[0].display, 'S _ _ _');
tick(100);
assertPaused(600);
tick(times.travel - 100);
assert.equal(controller.snapshot.phase, 'choose');
const choiceDistance = controller.frame.distance;
const stationaryPublications = publications;
tick(30000);
assert.equal(controller.snapshot.phase, 'choose', 'Choosing has no deadline');
assert.equal(controller.frame.distance, choiceDistance, 'The path remains stationary while reading');
assert.equal(publications, stationaryPublications, 'Frames do not flood React with state events');

const initial = JSON.stringify(controller.snapshot);
for (const index of [-1, 9, 0.5, NaN, '0', undefined]) EventBus.emit('runner-choose', index);
for (const direction of [-2, 0, 2, NaN, '1']) EventBus.emit('runner-move', direction);
assert.equal(JSON.stringify(controller.snapshot), initial, 'Invalid input cannot start an approach');
const mutableSnapshot = controller.snapshot;
mutableSnapshot.choices.length = 0;
assert.equal(controller.snapshot.choices.length, 2, 'Consumers cannot mutate the controller choices');

select(1);
const laneBefore = controller.frame.lane;
controller.update(16);
assert.ok(controller.frame.lane > laneBefore && controller.frame.lane < 0.72, 'Lane movement eases toward the selected route');
tick(800);
assert.ok(Math.abs(controller.frame.lane - 0.72) < 0.01);

EventBus.emit('runner-hint');
EventBus.emit('runner-hint');
assert.equal(hints.length, 1, 'One explicit hint is counted per choice');
assert.equal(hints[0].expected, 'S');
select(controller.snapshot.choices.findIndex((letter) => letter !== 'S'));
EventBus.emit('runner-advance');
assert.equal(controller.snapshot.phase, 'approach');
tick(300);
assert.equal(collections.length, 0);
assert.equal(mismatches.length, 0, 'Choice is resolved only after arriving');
assert.equal(controller.frame.distance, choiceDistance, 'Approach movement belongs to the avatar, not the path');
assertPaused(1500);
tick(times.approach - 300);
assert.equal(controller.snapshot.phase, 'retry');
assert.equal(mismatches.length, 1);
assert.equal(mismatches[0].expected, 'S');
assert.equal(controller.snapshot.count, 0);
assertPaused(1500);
tick(times.retry);
assert.equal(controller.snapshot.phase, 'choose');
assert.equal(controller.snapshot.hinted, true);
assert.equal(controller.frame.distance, choiceDistance);
select(controller.snapshot.choices.indexOf('S'));
EventBus.emit('runner-advance');
EventBus.emit('runner-advance');
EventBus.emit('runner-choose', 0);
tick(times.approach);
assert.equal(controller.snapshot.phase, 'collect');
assert.equal(collections.length, 1);
assert.equal(controller.snapshot.count, 1, 'Repeated and reentrant inputs collect only once');
assertPaused(2000);
tick(times.collect);
assert.equal(controller.snapshot.phase, 'travel');
assert.equal(controller.snapshot.hinted, false, 'A new letter begins without an automatic hint');
assert.equal(controller.snapshot.choices.length, 3);

// Reset cancels a pending choice and clears its clock, movement and hint state.
tick(times.travel);
EventBus.emit('runner-advance');
tick(250);
EventBus.emit('runner-home', 'forest-onca');
assert.equal(controller.snapshot.phase, 'ready');
assert.equal(controller.snapshot.word, 'ONÇA');
assert.equal(controller.snapshot.count, 0);
assert.equal(controller.frame.elapsed, 0);
assert.equal(controller.frame.distance, 0);
assert.equal(controller.frame.lane, 0);
assert.equal(controller.snapshot.hinted, false);
tick(2000);
assert.equal(collections.length, 1, 'No pending result survives returning to the menu');

// Every approved word follows the same rules, including Ç and both repetitions in MACACO.
assert.equal(content.schoolLevels.map(({ word }) => word).join(','), 'SAPO,ONÇA,TUCANO,MACACO,PREGUIÇA,SUCURI,CAPIVARA,ARARA');
for (const level of content.schoolLevels) {
    EventBus.emit('runner-home', level.id);
    const initialCollections = collections.length;
    const initialCompletions = completions.length;
    const initialCelebrations = celebrations.length;
    EventBus.emit('runner-start', level.id);
    const animatedStart = animatedMs;
    assert.equal(starts.at(-1).word, level.word);
    assert.equal(starts.at(-1).levelId, level.id);
    assert.equal(starts.at(-1).display.split(' ').length, level.word.length);
    const startCount = starts.length;
    EventBus.emit('runner-start', 'forest-pato');
    assert.equal(starts.length, startCount, 'An active game cannot be restarted by duplicate input');
    assert.equal(controller.snapshot.levelId, level.id);
    for (const [index, letter] of [...level.word].entries()) {
        tick(times.travel);
        assert.equal(controller.snapshot.phase, 'choose');
        assert.equal(controller.snapshot.count, index);
        assert.equal(controller.snapshot.choices.filter((choice) => choice === letter).length, 1);
        select(controller.snapshot.choices.indexOf(letter));
        EventBus.emit('runner-advance');
        tick(times.approach - 1);
        assert.equal(controller.snapshot.count, index, 'The letter is not awarded early');
        tick(1);
        assert.equal(controller.snapshot.count, index + 1);
        assert.equal(collections.at(-1).letter, letter);
        assert.equal(collections.at(-1).word, level.word);
        assert.equal(collections.at(-1).total, level.word.length);
        tick(times.collect);
    }
    assert.equal(controller.snapshot.phase, 'finish');
    assert.equal(completions.length, initialCompletions + 1);
    assert.equal(completions.at(-1).word, level.word);
    assert.equal(celebrations.length, initialCelebrations, 'Completion presentation waits for the final journey');
    const finishDistance = controller.frame.distance;
    assertPaused(4000);
    tick(times.finish);
    assert.ok(controller.frame.distance > finishDistance);
    assert.equal(controller.snapshot.phase, 'celebrate');
    const previousDuration = level.word.length * (2400 + 700 + 1000) + 2800;
    assert.equal(animatedMs - animatedStart, level.word.length * 3050 + 2200,
        'The observed journey uses the faster pace through arrival and celebration');
    assert.ok(animatedMs - animatedStart < previousDuration * 0.8,
        'A full word has at least 20% less animation waiting than the previous 3D journey');
    assert.equal(celebrations.length, initialCelebrations + 1);
    assert.equal(celebrations.at(-1).levelId, level.id);
    tick(10000);
    EventBus.emit('runner-advance');
    assert.equal(collections.length, initialCollections + level.word.length);
    assert.equal(completions.length, initialCompletions + 1);
    assert.equal(celebrations.length, initialCelebrations + 1);
}

EventBus.emit('runner-start');
assert.equal(controller.snapshot.word, 'ARARA', 'Replay keeps the selected final mission');
assert.equal(controller.snapshot.count, 0);
assert.equal(controller.snapshot.phase, 'travel');
const beforeInvalidClock = JSON.stringify(controller.frame);
for (const delta of [NaN, Infinity, -100, 0]) controller.update(delta);
assert.equal(JSON.stringify(controller.frame), beforeInvalidClock);
controller.update(60000);
assert.equal(controller.frame.elapsed, 50, 'A late browser frame cannot skip the journey');
EventBus.emit('runner-home', 'forest-pato');
assert.equal(controller.snapshot.word, 'SAPO', 'Technical PATO stays outside the school mission catalog');
EventBus.emit('runner-home', 'unknown');
assert.equal(controller.snapshot.word, 'SAPO');
const beforeRequest = publications;
EventBus.emit('runner-state-request');
assert.equal(publications, beforeRequest + 1);

const events = ['runner-start', 'runner-state-request', 'runner-choose', 'runner-move',
    'runner-advance', 'runner-hint', 'runner-pause', 'runner-home'];
const externalHomeListener = () => {};
EventBus.on('runner-home', externalHomeListener);
controller.destroy();
controller.destroy();
for (const event of events) assert.equal(EventBus.listenerCount(event), event === 'runner-home' ? 1 : 0);
assert.equal(EventBus.listeners('runner-home')[0], externalHomeListener, 'Cleanup preserves listeners it does not own');
const destroyedState = JSON.stringify(controller.frame);
const destroyedPublications = publications;
controller.update(50);
EventBus.emit('runner-start');
EventBus.emit('runner-state-request');
assert.equal(JSON.stringify(controller.frame), destroyedState);
assert.equal(publications, destroyedPublications, 'Unmounted controllers stop publishing');
console.log('PASS: renderer-independent rules, all eight words, cedilla/repetitions, indefinite choices, smooth lanes, approach, pause, retries, hint/input deduplication, reset and cleanup.');
