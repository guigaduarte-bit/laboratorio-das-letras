const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file, imports = {}, globals = {}) {
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => {
        if (name in imports) return imports[name]; throw Error(name);
    }, setTimeout, clearTimeout, Blob, URL, ...globals });
    return module.exports;
}

(async () => {
    const { VOICE_SCRIPT, voiceFormat, humanVoice } = load('src/audio/HumanVoice.ts');
    for (const word of ['SAPO', 'ONÇA', 'TUCANO', 'MACACO', 'PREGUIÇA', 'SUCURI', 'CAPIVARA', 'ARARA']) {
        assert.ok(VOICE_SCRIPT.some(({ id }) => id === `word-${word}`));
        for (const letter of word) assert.ok(VOICE_SCRIPT.some(({ id }) => id === `letter-${letter}`));
    }
    assert.equal(voiceFormat('audio/webm;codecs=opus'), 'webm');
    assert.equal(voiceFormat('audio/mp4'), 'm4a');
    assert.equal(voiceFormat('text/html'), undefined);
    await assert.rejects(humanVoice.init(), /salvar gravações/);
    await assert.rejects(humanVoice.save('letter-A', new Blob(['bad'], { type: 'text/html' })), /áudio curto/);
    assert.equal(humanVoice.count, 0, 'An unsuccessful save must not pretend that a recording is ready');

    // Event-controlled Howler verifies queue order and interruption without emitting synthetic speech.
    const playing = [];
    class Howl {
        constructor(options) { this.options = options; }
        play() { playing.push(this); return 1; }
        stop() { this.stopped = true; }
        volume(value) { if (value !== undefined) this.gain = value; return this.gain ?? 0; }
        state() { return 'loaded'; }
        pause() { this.stopped = true; }
        fade(from, to) { this.gain = to; }
        unload() { this.stopped = true; }
    }
    const clips = new Set(['prompt', 'letter-A', 'letter-Ç', 'word-ONÇA', 'complete']);
    const recorded = { has: (id) => clips.has(id), count: clips.size,
        get: (id) => clips.has(id) ? { src: `blob:${id}`, format: 'webm' } : undefined };
    const { RunnerAudio } = load('src/audio/RunnerAudio.ts', {
        howler: { Howl, Howler: {} }, './HumanVoice': { humanVoice: recorded }
    });
    const audio = new RunnerAudio();
    audio.prompt('A'); assert.equal(playing.length, 0, 'No autoplay before the first interaction');
    audio.unlock(); audio.prompt('A');
    const prompt = playing.at(-1);
    assert.equal(prompt.options.src[0], 'blob:prompt');
    prompt.options.onend();
    const a = playing.at(-1);
    assert.equal(a.options.src[0], 'blob:letter-A');
    audio.prompt('Ç');
    assert.ok(a.stopped, 'A new prompt stops the previous voice');
    const count = playing.length;
    a.options.onend(); assert.equal(playing.length, count, 'Late events cannot resurrect a stopped queue');
    playing.at(-1).options.onend();
    assert.equal(playing.at(-1).options.src[0], 'blob:letter-Ç');
    audio.stop();
    assert.ok(playing.at(-1).stopped, 'Pause must stop speech');
    audio.setEnabled(false); audio.word('ONÇA');
    assert.equal(playing.length, count + 1);
    audio.setEnabled(true); audio.prompt('M');
    assert.equal(playing.length, count + 1, 'Do not say an incomplete prompt when the target recording is missing');
    audio.word('ONÇA'); playing.at(-1).options.onloaderror();
    assert.equal(playing.at(-1).options.src[0], 'blob:complete', 'A failed clip must not block the rest of the queue');
    audio.stop();
    console.log('PASS: recording script coverage, cedilla, supported formats, unavailable storage, user activation, voice sequencing, pause, mute, missing clips and stale callbacks.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
