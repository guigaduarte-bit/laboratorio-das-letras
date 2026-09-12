const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/audio/RunnerAudio.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
function setup() {
    let now = 0, timerId = 0, soundId = 0;
    const timers = new Map(), created = [], plays = [], fades = [];
    const clips = new Set(['introduction', 'prompt', 'letter-A', 'letter-Ç', 'letter-O', 'word-SAPO', 'word-ONÇA', 'retry', 'complete']);
    class Howl {
        constructor(options) { this.options = options; this.gain = options.volume; this.status = 'loaded'; created.push(this); }
        play(id) { this.stopped = false; this.id = id ?? ++soundId; plays.push(this); return this.id; }
        stop() { this.stopped = true; }
        pause() { this.stopped = true; this.pauses = (this.pauses ?? 0) + 1; }
        unload() { this.stopped = true; this.unloaded = true; }
        volume(value) { if (value !== undefined) this.gain = value; return this.gain; }
        state() { return this.status; }
        fade(from, to, duration) { fades.push({ from, to, duration }); this.gain = to; }
    }
    const module = { exports: {} }, storage = {};
    vm.runInNewContext(source, { module, exports: module.exports, require: (id) => id === 'howler' ? { Howl, Howler: {} } : {
        humanVoice: { has: (id) => clips.has(id), get: (id) => clips.has(id) ? { src: `blob:${id}`, format: 'webm' } : undefined }
    }, setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: (id) => timers.delete(id), localStorage: { getItem: (id) => storage[id], setItem: (id, value) => { storage[id] = value; } } });
    const audio = new module.exports.RunnerAudio();
    function tick(ms) {
        const end = now + ms;
        while (true) {
            const next = [...timers].sort((a,b) => a[1].at-b[1].at)[0];
            if (!next || next[1].at > end) break;
            now = next[1].at; timers.delete(next[0]); next[1].fn();
        }
        now = end;
    }
    const last = () => plays.at(-1);
    const end = () => { const clip = last(); assert.ok(clip.options.onend, clip.options.src[0]); clip.options.onend(); };
    const name = () => last()?.options.src[0];
    const music = () => created.findLast((howl) => howl.options.loop);
    const effect = (part) => created.findLast((howl) => howl.options.src[0].includes(part));
    return { audio, clips, created, plays, fades, tick, last, end, name, music, effect, timers, storage };
}
{
    const t = setup();
    t.audio.setActive(true); t.audio.collected('A'); t.audio.prompt('A'); t.tick(10000);
    assert.equal(t.plays.length, 0, 'Nothing plays before a gesture');
    t.audio.unlock(); const bgm = t.music(); const id = bgm.id;
    assert.equal(bgm.options.loop, true);
    assert.equal(bgm.gain, 0.24);
    t.audio.setActive(true); t.audio.setActive(true); assert.equal(t.plays.length, 1, 'Exactly one music instance');
    t.audio.setActive(false); assert.ok(bgm.stopped); assert.equal(bgm.gain, 0);
    t.audio.setActive(true); assert.equal(bgm.id, id, 'Resume the paused music position');
    t.audio.setEnabled(false); assert.ok(bgm.stopped); const count = t.plays.length;
    t.audio.celebrate('SAPO'); t.tick(15000); assert.equal(t.plays.length, count, 'Muted effects/voice stay silent');
    t.audio.setEnabled(true); assert.equal(t.music().id, id);
    t.audio.stop(); assert.ok(t.music().stopped); t.audio.setEnabled(true);
    assert.ok(t.music().stopped, 'Unmuting at home does not start the soundtrack');
}
{
    const t = setup(); t.audio.unlock(); t.audio.setActive(true);
    t.audio.introduction('SAPO'); assert.equal(t.name(), 'blob:introduction');
    const intro = t.last(); t.audio.prompt('A'); assert.equal(t.last(), intro, 'Choices must wait for the introduction');
    t.end(); assert.equal(t.name(), 'blob:word-SAPO');
    t.end(); assert.equal(t.name(), 'blob:prompt');
    t.end(); assert.equal(t.name(), 'blob:letter-A');
    assert.equal(t.music().gain, 0.24 * 0.18, 'Music ducks beneath human speech');
    t.end(); assert.equal(t.music().gain, 0.24, 'Music returns after the entire sentence');
    t.audio.collected('Ç'); assert.ok(t.name().endsWith('collect-chime.mp3'));
    assert.equal(t.music().gain, 0.24 * 0.45);
    assert.equal(t.effect('collect-chime').gain, 0.85, 'The attack of the success cue is prominent');
    t.tick(210); assert.equal(t.name(), 'blob:letter-Ç');
    assert.equal(t.effect('collect-chime').gain, 0.85 * 0.45);
    t.audio.prompt('O'); const letter = t.last(); t.audio.prompt('A'); assert.equal(t.last(), letter);
    t.end(); assert.equal(t.name(), 'blob:prompt'); t.end(); assert.equal(t.name(), 'blob:letter-A', 'Keep only the newest waiting prompt');
    t.end(); t.tick(1000); assert.equal(t.music().gain, 0.24);
    assert.ok(t.fades.some(({ from, to }) => from > to && to > 0), 'Ducking starts at the actual current gain');
    t.audio.stop();
}
{
    const t = setup(); t.audio.unlock(); t.audio.setActive(true);
    t.audio.retry('A'); assert.ok(t.name().endsWith('retry-cue.mp3'));
    t.tick(240); assert.equal(t.name(), 'blob:retry'); t.end(); assert.equal(t.name(), 'blob:prompt');
    t.end(); assert.equal(t.name(), 'blob:letter-A'); t.end();
    const effectsBefore = t.plays.filter((howl) => howl.options.src[0].includes('/expedition/') && !howl.options.loop).length;
    t.audio.help('A'); t.end(); t.end();
    assert.equal(t.plays.filter((howl) => howl.options.src[0].includes('/expedition/') && !howl.options.loop).length, effectsBefore, 'Asking for help does not play the error cue');
    t.audio.collected('O'); t.tick(210); assert.equal(t.name(), 'blob:letter-O'); t.end();
    assert.ok(!t.plays.some((howl) => howl.options.src[0] === 'blob:word-SAPO'), 'Word waits for the animal encounter');
    t.audio.celebrate('SAPO'); assert.ok(t.name().endsWith('discovery-fanfare.mp3'));
    t.tick(650); assert.equal(t.name(), 'blob:word-SAPO'); t.end(); assert.equal(t.name(), 'blob:complete'); t.end();
    t.audio.stop();
}
{
    const t = setup(); t.audio.unlock(); t.audio.setActive(true);
    t.audio.collected('A'); t.audio.setActive(false); const count = t.plays.length;
    t.tick(15000); assert.equal(t.plays.length, count, 'Pause cancels delayed narration and effect recovery');
    t.audio.setActive(true); t.audio.prompt('A'); const stale = t.last();
    t.audio.stop(); stale.options.onend(); stale.options.onloaderror();
    assert.ok(t.last().stopped, 'Late callbacks cannot restart a stopped sentence');
    t.audio.setActive(true); t.audio.word('ONÇA'); t.last().options.onloaderror();
    assert.equal(t.name(), 'blob:complete', 'An unreadable recording does not block following speech');
    t.tick(12000); assert.equal(t.music().gain, 0.24, 'A stuck recording times out and releases ducking');
    t.audio.prompt('missing'); assert.equal(t.name(), 'blob:complete', 'No incomplete prompt');
    t.audio.stop();
}
{
    const t = setup(); t.audio.unlock(); t.audio.setActive(true); const old = t.music();
    old.status = 'loading'; t.audio.setActive(false); assert.ok(old.unloaded);
    t.audio.setActive(true); const current = t.music(); assert.notEqual(current, old);
    old.options.onplay(); old.options.onloaderror(); assert.equal(t.music(), current, 'Old download callbacks cannot affect a newer soundtrack');
    current.options.onplayerror(); const count = t.plays.length; t.audio.setActive(true); assert.equal(t.plays.length, count);
    t.audio.unlock(); assert.equal(t.plays.length, count + 1, 'A new user gesture retries blocked playback');
    t.effect('retry-cue').status = 'loading'; t.audio.retry('missing');
    assert.ok(!t.plays.some((howl) => howl.options.src[0].endsWith('retry-cue.mp3')), 'No delayed feedback queued during download');
    t.audio.stop();
}
{
    const t = setup(); t.audio.unlock(); t.audio.setActive(true); t.audio.prompt('A');
    t.audio.setVolume('voice', 0); assert.equal(t.last().gain, 0); assert.equal(t.music().gain, 0.24);
    t.audio.setVolume('music', 0); assert.equal(t.music().gain, 0, 'Independent music mute keeps voice/effects available');
    t.audio.setVolume('effects', 0.5); t.audio.setVolume('voice', 0.7); assert.equal(t.last().gain, 0.7);
    t.audio.setVolume('music', 2); assert.equal(t.audio.getMix().music, 1);
    t.audio.setVolume('voice', NaN); assert.equal(t.audio.getMix().voice, 0.7);
    t.audio.stop();
    const saved = t.audio.loadMix(); assert.equal(saved.effects, 0.5);
    t.storage['laboratorio-das-letras:audio:v1'] = '{broken'; assert.doesNotThrow(() => t.audio.loadMix());
}
console.log('PASS: user activation, single looping soundtrack, resume/mute, voice priority, separate success/retry/help, final word timing, duck/recovery, stale downloads, playback failure, delayed speech cancellation and independent saved volumes.');
