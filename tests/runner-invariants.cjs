const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const ts = require('typescript');

function load(relative, imports = {}) {
    const file = path.join(__dirname, '..', relative);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import: ${name}`);
    }, Date, Set, Map, Object, JSON, Number });
    return module.exports;
}

const { makeRunnerChoices } = load('src/game/content/runner.ts');
const positions = new Set();
for (let seed = 1; seed <= 100; seed++) {
    let value = seed;
    const random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const word of ['SAPO', 'ARARA']) {
        for (let index = 0; index < word.length; index++) {
            const choices = makeRunnerChoices({ word }, index, random);
            assert.equal(choices.filter((letter) => letter === word[index]).length, 1, 'One target, including repeated letters');
            assert.equal(new Set(choices).size, choices.length, 'No duplicate alternatives');
            assert.equal(choices.length, index ? 3 : 2, 'A smaller first choice');
            positions.add(choices.indexOf(word[index]));
        }
    }
}
assert.equal(positions.size, 3, 'The target can appear in every lane');

const EventBus = new EventEmitter();
const { WordProgress } = load('src/game/systems/WordProgress.ts', { '../EventBus': { EventBus } });
let collected = 0, completed = 0;
EventBus.on('letter-collected', () => collected++);
EventBus.on('word-completed', () => completed++);
const progress = new WordProgress('SAPO');
assert.equal(progress.tryCollect('A').accepted, false);
assert.equal(progress.expectedLetter, 'S');
for (const letter of 'SAPO') assert.equal(progress.tryCollect(letter).accepted, true);
assert.equal(progress.tryCollect('O').accepted, false, 'Repeated final input cannot count twice');
assert.equal(collected, 4); assert.equal(completed, 1);

const { LocalProgressStore } = load('src/progress/LocalProgress.ts');
let saved;
const storage = { getItem: () => saved ?? null, setItem: (_key, value) => { saved = value; } };
const store = new LocalProgressStore({ getStorage: () => storage });
store.recordSessionStarted(); store.recordCorrectLetter('S'); store.recordHintAttempt('A');
store.recordLevelCompleted('forest-sapo'); store.recordLevelCompleted('forest-sapo');
const reopened = new LocalProgressStore({ getStorage: () => storage }).read();
assert.equal(reopened.sessionCount, 1);
assert.equal(reopened.letterStats.S.correct, 1);
assert.equal(reopened.letterStats.A.hints, 1);
assert.equal(reopened.completedLevels.length, 1);
const blocked = new LocalProgressStore({ getStorage: () => { throw new Error('Blocked'); } });
assert.doesNotThrow(() => blocked.recordSessionStarted());
assert.equal(blocked.read().sessionCount, 1);
saved = '{broken';
assert.equal(store.read().sessionCount, 0);
console.log('PASS: target placement, repeated letters, wrong choices, completion deduplication, persistence and unavailable storage.');
