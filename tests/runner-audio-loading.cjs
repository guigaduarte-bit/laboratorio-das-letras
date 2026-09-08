const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise installed Howler itself, replacing only clocks, network and WebAudio.
// In particular, its queue, instance IDs, fades, load events and stop logic are real.
function environment() {
    let now = 0;
    let nextTimer = 0;
    const timers = new Map();
    const requests = [];
    const starts = [];
    const gains = [];
    const schedule = (fn, delay = 0, interval = 0, args = []) => {
        const id = ++nextTimer;
        timers.set(id, { fn, due: now + delay, interval, args });
        return id;
    };
    const tick = (duration = 0) => {
        const end = now + duration;
        let count = 0;
        for (;;) {
            const next = [...timers].filter(([, t]) => t.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
            if (!next) break;
            assert.ok(++count < 10000, 'Howler must not enter an endless callback loop');
            const [id, timer] = next;
            now = timer.due;
            if (timer.interval) timer.due += timer.interval;
            else timers.delete(id);
            timer.fn(...timer.args);
        }
        now = end;
    };
    const fakeDate = class extends Date { static now() { return now; } };
    const globals = {
        console, Date: fakeDate,
        setTimeout: (fn, delay, ...args) => schedule(fn, delay, 0, args),
        clearTimeout: (id) => timers.delete(id),
        setInterval: (fn, delay, ...args) => schedule(fn, delay, delay, args),
        clearInterval: (id) => timers.delete(id),
        window: { location: { protocol: 'https:' } },
        navigator: { userAgent: 'Controlled Howler regression' },
        XMLHttpRequest: class {
            open(_method, url) { this.url = url; }
            send() { requests.push(this); }
            setRequestHeader() {}
            complete() {
                if (this.completed) return;
                this.completed = true;
                this.status = 200;
                this.response = { duration: this.url.includes('adventure-loop') ? 32 : .82, url: this.url };
                this.onload();
            }
        },
    };
    const module = { exports: {} };
    const scope = vm.createContext({ ...globals, module, exports: module.exports });
    vm.runInContext(fs.readFileSync(require.resolve('howler/src/howler.core.js'), 'utf8'), scope);
    const { Howl, Howler } = module.exports;
    const parameter = () => ({
        value: 0, sets: [], ramps: [],
        setValueAtTime(value) { this.value = value; this.sets.push(value); },
        linearRampToValueAtTime(value) { this.ramps.push(value); },
        cancelScheduledValues() {},
    });
    Howler.ctx = {
        state: 'running', get currentTime() { return now / 1000; },
        createGain() {
            const node = { gain: parameter(), connect() {}, disconnect() {} };
            gains.push(node); return node;
        },
        createBufferSource() {
            return {
                playbackRate: parameter(), connect(node) { this.connected = node; }, disconnect() {},
                start() { starts.push({ url: this.buffer.url, gain: this.connected.gain.value, at: now }); },
                stop() {},
            };
        },
        decodeAudioData(data, success) { success(data); },
    };
    Howler.noAudio = false;
    Howler.usingWebAudio = true;
    Howler.autoUnlock = false;
    Howler.state = 'running';
    Howler.masterGain = {};
    Howler._codecs.mp3 = true;
    Howler._autoResume = () => {};
    Howler._autoSuspend = () => {};
    const runnerModule = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/audio/RunnerAudio.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(source, {
        ...globals, module: runnerModule, exports: runnerModule.exports,
        localStorage: { getItem: () => null, setItem() {} },
        require: (name) => {
            if (name === 'howler') return { Howl, Howler };
            if (name === './HumanVoice') return { humanVoice: { count: 0, has: () => false, get: () => undefined } };
            throw Error(name);
        },
    });
    return {
        audio: runnerModule.exports.runnerAudio, Howler, starts, gains, tick,
        load: (fragment) => requests.filter((request) => request.url.includes(fragment)).forEach((request) => request.complete()),
    };
}

const tests = [
    ['slow feedback cannot start after mute', () => {
        const env = environment();
        env.audio.unlock();
        env.audio.setActive(true);
        env.audio.collected('A');
        env.audio.setEnabled(false);
        env.load('collect-chime');
        env.tick();
        assert.equal(env.starts.filter((start) => start.gain > 0).length, 0,
            'A queued play must not begin with audible gain after mute, even for one render quantum');
        env.audio.stop();
    }],
    ['slow feedback is not played against a later choice', () => {
        const env = environment();
        env.audio.unlock();
        env.audio.collected('A');
        env.tick(1800);
        env.load('collect-chime');
        env.tick();
        assert.equal(env.starts.filter((start) => start.gain > 0).length, 0,
            'A discovery cue downloaded long after the discovery must be skipped');
        env.audio.stop();
    }],
    ['music download cannot resurrect a stopped session', () => {
        const env = environment();
        env.audio.unlock(); env.audio.setActive(true); env.audio.stop();
        env.load('adventure-loop'); env.tick();
        assert.equal(env.starts.length, 0);
    }],
    ['ducking starts at the current sound-instance gain', () => {
        const env = environment();
        env.audio.unlock(); env.audio.setActive(true);
        env.load('adventure-loop'); env.load('collect-chime'); env.tick(600);
        const music = env.Howler._howls.find((howl) => String(howl._src).includes('adventure-loop'));
        const sound = music._sounds.find((item) => !item._paused);
        assert.ok(sound && sound._volume > .2, 'Music should have faded up before feedback');
        const before = sound._volume;
        env.audio.collected('A');
        assert.equal(sound._node.gain.sets.at(-1), before,
            'Ducking must begin from the instance volume rather than the untouched group volume');
        env.audio.stop();
    }],
];

let failed = 0;
for (const [name, run] of tests) {
    try { run(); console.log(`PASS: ${name}`); }
    catch (error) { failed++; console.error(`FAIL: ${name}\n${error.stack}`); }
}
process.exitCode = failed ? 1 : 0;
