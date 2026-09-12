const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function storage() {
    const state = { records: new Map(), writes: 0, failNext: false, throwOnPut: false };
    state.indexedDB = { open() {
        const request = {};
        setImmediate(() => {
            request.result = { close() {}, transaction(_store, mode) {
                if (mode !== 'readwrite') return { objectStore: () => ({ getAll() {
                    const read = {};
                    setImmediate(() => { read.result = [...state.records.values()]; read.onsuccess(); });
                    return read;
                } }) };
                state.writes++;
                let aborted = false;
                const staged = new Map(state.records);
                const tx = {
                    abort() { aborted = true; setImmediate(() => tx.onabort?.()); },
                    objectStore: () => ({
                        put(record) { if (state.throwOnPut) throw Error('Quota'); staged.set(record.id, record); },
                        delete(id) { staged.delete(id); }
                    })
                };
                setImmediate(() => {
                    if (aborted) return;
                    if (state.failNext) { state.failNext = false; tx.onabort(); return; }
                    state.records = staged; tx.oncomplete();
                });
                return tx;
            } };
            request.onsuccess();
        });
        return request;
    } };
    return state;
}

function load(state) {
    const mod = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/audio/HumanVoice.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(code, { module: mod, exports: mod.exports, Blob, URL, atob, btoa, Uint8Array, indexedDB: state.indexedDB });
    return mod.exports;
}

const clip = (id, contents = id) => ({ id, mime: 'audio/wav', audio: Buffer.from(contents).toString('base64') });
const packText = (clips, extra = {}) => JSON.stringify({ format: 'laboratorio-das-letras-human-voice', version: 1, clips, ...extra });
const packFile = (clips) => new Blob([packText(clips)], { type: 'application/json' });

(async () => {
    const state = storage();
    const { humanVoice, parseVoicePack, VOICE_SCRIPT, MAX_VOICE_BYTES, MAX_VOICE_PACK_BYTES } = load(state);
    assert.equal(VOICE_SCRIPT.length, 27);
    assert.ok(VOICE_SCRIPT.some(({ id }) => id === 'letter-E'));
    assert.ok(VOICE_SCRIPT.some(({ id }) => id === 'introduction'));
    assert.ok(VOICE_SCRIPT.some(({ id }) => id === 'retry'));
    await humanVoice.init();
    await assert.rejects(humanVoice.exportPack(), /pelo menos um trecho/);
    assert.throws(() => parseVoicePack('{bad'), /não é um pacote/);
    assert.throws(() => parseVoicePack(packText([clip('letter-A')], { version: 2 })), /pacote de vozes/);
    assert.throws(() => parseVoicePack(packText([clip('letter-A')], { command: 'ignored?' })), /pacote de vozes/);
    for (const clips of [[], [clip('unknown')], [clip('letter-A'), clip('letter-A')],
        [{ ...clip('letter-A'), mime: 'text/html' }], [{ ...clip('letter-A'), audio: 'https://example.com/voice.wav' }],
        [{ ...clip('letter-A'), audio: 'YQ===' }], [{ ...clip('letter-A'), audio: 'YR==' }],
        [{ ...clip('letter-A'), audio: 'A'.repeat(Math.ceil(MAX_VOICE_BYTES / 3) * 4 + 4) }],
        [{ ...clip('letter-A'), extra: true }]]) {
        assert.throws(() => parseVoicePack(packText(clips)), /pacote|trecho|áudio/);
    }
    const parsed = parseVoicePack(packText([clip('letter-Ç', 'cedilha')]));
    assert.equal(parsed[0].id, 'letter-Ç');
    assert.equal(await parsed[0].blob.text(), 'cedilha');
    await assert.rejects(humanVoice.importPack(new Blob([new Uint8Array(MAX_VOICE_PACK_BYTES + 1)]), async () => {}), /50 MB/);
    await assert.rejects(humanVoice.importPack(packFile([clip('letter-A')]), undefined), /conferir/);

    await humanVoice.save('letter-A', new Blob(['old-A'], { type: 'audio/wav' }));
    await humanVoice.save('letter-M', new Blob(['keep-M'], { type: 'audio/wav' }));
    const oldUrl = humanVoice.get('letter-A').src;
    assert.ok(oldUrl.startsWith('blob:'), 'Custom recording overrides included narration');
    const before = state.writes;
    let checked = 0;
    await assert.rejects(humanVoice.importPack(packFile([clip('letter-A', 'new-A'), clip('letter-E', 'broken')]), async (blob) => {
        checked++;
        assert.equal(state.writes, before, 'No persistence until every clip has decoded and passed its duration check');
        if (await blob.text() === 'broken') throw Error('Decode or duration failure');
    }), /Nenhuma gravação foi substituída/);
    assert.equal(checked, 2);
    assert.equal(state.writes, before);
    assert.equal(humanVoice.get('letter-A').src, oldUrl);
    assert.equal(humanVoice.hasCustom('letter-E'), false);

    state.failNext = true;
    await assert.rejects(humanVoice.importPack(packFile([clip('letter-A', 'new-A'), clip('letter-E')]), async () => {}), /salvar neste navegador/);
    assert.equal(humanVoice.count, 2, 'An aborted import must not report new voice availability');
    assert.equal(humanVoice.get('letter-A').src, oldUrl);
    assert.equal(await state.records.get('letter-A').blob.text(), 'old-A');
    assert.equal(state.records.has('letter-E'), false);

    state.throwOnPut = true;
    await assert.rejects(humanVoice.importPack(packFile([clip('letter-E')]), async () => {}), /Nenhuma gravação/);
    state.throwOnPut = false;
    assert.equal(state.records.has('letter-E'), false);

    let notifications = 0;
    humanVoice.subscribe(() => notifications++);
    const count = await humanVoice.importPack(packFile([clip('letter-A', 'new-A'), clip('letter-E')]), async () => {});
    assert.equal(count, 2);
    assert.equal(notifications, 1, 'Expose the imported set together, once');
    assert.equal(humanVoice.count, 3);
    assert.equal(humanVoice.hasCustom('letter-M'), true, 'A partial pack preserves unrelated recordings');
    assert.notEqual(humanVoice.get('letter-A').src, oldUrl);
    assert.equal(await state.records.get('letter-A').blob.text(), 'new-A');

    const exported = await humanVoice.exportPack();
    const fresh = load(storage()).humanVoice;
    const importCount = await fresh.importPack(exported, async (blob) => assert.ok(blob.size));
    assert.equal(importCount, 3, 'An export travels to a separate browser store');
    assert.equal(fresh.count, 3);
    const roundTrip = parseVoicePack(await (await fresh.exportPack()).text());
    assert.equal(await roundTrip.find(({ id }) => id === 'letter-M').blob.text(), 'keep-M');
    assert.equal(await roundTrip.find(({ id }) => id === 'letter-A').blob.text(), 'new-A');
    await humanVoice.save('letter-A');
    assert.ok(humanVoice.get('letter-A').src.endsWith('/letter-a.mp3'), 'Deleting a personal recording restores the included voice');
    assert.equal(humanVoice.availableCount, 27);
    await humanVoice.importPack(packFile([clip('letter-G'), clip('word-PREGUIÇA')]), async () => {});
    assert.equal(humanVoice.availableCount, 27, 'Custom recordings override the included supplement without double-counting');
    await humanVoice.save('letter-G');
    assert.ok(humanVoice.get('letter-G').src.endsWith('/recorded-v2/letter-g.mp3'), 'Removing a custom recording restores the supplement');
    assert.equal(humanVoice.availableCount, 27);
    console.log('PASS: 27-line script, strict pack schema/base64/limits, decode-before-write, atomic transaction failure, preserved clips, new-word coverage and portable export/import round trip.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
