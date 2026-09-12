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
    assert.equal(humanVoice.availableCount, 27);
    await assert.rejects(humanVoice.init(), /salvar gravações/);
    assert.equal(humanVoice.availableCount, 27, 'Included narration works even if IndexedDB is unavailable');
    assert.equal(VOICE_SCRIPT.length, 27);
    for (const id of Object.keys(BUNDLED_VOICE)) {
        assert.ok(humanVoice.has(id), id);
        assert.equal(humanVoice.hasCustom(id), false);
        const clip = humanVoice.get(id);
        assert.equal(clip.format, 'mp3');
        assert.equal(clip.src, BUNDLED_VOICE[id]);
        assert.ok(fs.statSync(path.join(root, 'public', clip.src)).size > 1000, `${id} must ship with a real file`);
    }
    const missing = VOICE_SCRIPT.filter(({ id }) => !humanVoice.has(id)).map(({ id }) => id);
    assert.deepEqual(Array.from(missing), []);
    for (const id of missing) assert.equal(humanVoice.get(id), undefined, 'Unrecorded lines must never resolve to nonexistent MP3s');
    for (const id of ['unknown', '__proto__', 'constructor']) assert.equal(humanVoice.get(id), undefined);
    assert.equal(new Set(Object.values(BUNDLED_VOICE)).size, 27, 'Cedilla must not collide with C');
    for (const reportName of ['NARRACAO_GRAVADA_METRICAS.json', 'NARRACAO_COMPLEMENTAR_METRICAS.json']) {
        const report = JSON.parse(fs.readFileSync(path.join(root, 'docs', reportName), 'utf8'));
        for (const clip of report.clips) {
            assert.equal(BUNDLED_VOICE[clip.id], `/${clip.file}`);
            const data = fs.readFileSync(path.join(root, 'public', clip.file));
            assert.equal(require('node:crypto').createHash('sha256').update(data).digest('hex'), clip.sha256, 'All recordings match their provenance, including the original nineteen');
        }
    }
    console.log('PASS: 27 actual bundled recordings, original hashes preserved, fresh-browser availability, no storage dependency, safe lookup and separate personal count.');
})().catch((e) => { console.error(e); process.exitCode = 1; });
