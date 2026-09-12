const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/audio/HumanVoice.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, { module: mod, exports: mod.exports, Blob, URL });
const { humanVoice, VOICE_SCRIPT, BUNDLED_VOICE } = mod.exports;
(async () => {
    assert.equal(humanVoice.count, 0, 'Bundled voice does not pretend to be a personal recording');
    assert.equal(humanVoice.availableCount, 19);
    await assert.rejects(humanVoice.init(), /salvar gravações/);
    assert.equal(humanVoice.availableCount, 19, 'Included narration works even if IndexedDB is unavailable');
    for (const { id } of VOICE_SCRIPT) {
        assert.ok(humanVoice.has(id), id);
        assert.equal(humanVoice.hasCustom(id), false);
        const clip = humanVoice.get(id);
        assert.equal(clip.format, 'mp3');
        assert.equal(clip.src, BUNDLED_VOICE[id]);
        assert.ok(fs.statSync(path.join(root, 'public', clip.src)).size > 1000, `${id} must ship with a real file`);
    }
    for (const id of ['unknown', '__proto__', 'constructor']) assert.equal(humanVoice.get(id), undefined);
    assert.equal(new Set(Object.values(BUNDLED_VOICE)).size, 19, 'Cedilla must not collide with C');
    console.log('PASS: 19 actual bundled recordings, fresh-browser availability, no storage dependency, safe lookup, unique cedilla and separate personal count.');
})().catch((e) => { console.error(e); process.exitCode = 1; });
