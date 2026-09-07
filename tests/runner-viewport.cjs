/* Regression: use Phaser's actual size calculations with measured DOM bounds, without a GPU. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function load(relative, overrides = {}) {
    const file = path.join(root, relative);
    const requireFromFile = createRequire(file);
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.ts')) source = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, {
        module, exports: module.exports,
        require: (name) => name in overrides ? overrides[name] : requireFromFile(name),
        window: { pageXOffset: 0, pageYOffset: 0 },
        document: { documentElement: { clientLeft: 0, clientTop: 0 } }
    });
    return module.exports;
}

const ScaleManager = load('node_modules/phaser/src/scale/ScaleManager.js', {
    // Camera is only needed by getViewPort, which this test does not call.
    '../cameras/2d/Camera': class {}
});
const { syncRunnerViewport } = load('src/game/systems/syncRunnerViewport.ts');
const rect = { x: 0, y: 0, left: 0, top: 0, width: 1184, height: 570 };
const scale = new ScaleManager({ domContainer: null });
scale.parent = { getBoundingClientRect: () => ({ ...rect }) };
scale.canvas = {
    style: {}, width: 0, height: 0,
    getBoundingClientRect() { return { ...rect, width: this.width, height: this.height }; }
};
scale.scaleMode = 5; // Phaser.Scale.RESIZE
scale.getParentBounds();
scale.displaySize.setParent(scale.parentSize);
scale.refresh();
assert.equal(scale.height, 570);

// Reproduce the old observer: refreshing alone retains the menu's height and crops the character.
rect.height = 354;
scale.refresh();
assert.equal(scale.height, 570, 'The regression must be reproduced before testing the fix');
scale.step(1000, 1000);
assert.equal(scale.height, 570, 'The late measurement in refresh also prevents the periodic check from repairing the stale size');
let previousSize;
scale.on('resize', (_game, _base, _display, width, height) => { previousSize = [width, height]; });
syncRunnerViewport(scale);
assert.equal(scale.height, 354);
assert.equal(scale.canvas.height, 354);
assert.equal(scale.canvas.getBoundingClientRect().height, 354);
assert.deepEqual(previousSize, [1184, 570], 'Cameras receive the actual previous size');

// Initial menu -> desktop play (including the screenshot's reduced viewport), zoom and tablet rotation.
for (const [width, height] of [[1184, 430], [1292, 566], [1380, 780], [874, 420], [724, 738], [952, 486], [1184, 570], [1184, 430]]) {
    const old = [scale.width, scale.height];
    Object.assign(rect, { width, height });
    syncRunnerViewport(scale);
    assert.equal(scale.width, width); assert.equal(scale.height, height);
    assert.equal(scale.canvas.width, width); assert.equal(scale.canvas.height, height);
    assert.equal(scale.canvas.getBoundingClientRect().width, width); assert.equal(scale.canvas.getBoundingClientRect().height, height);
    assert.deepEqual(previousSize, old);
    assert.equal(scale.displayScale.x, 1); assert.equal(scale.displayScale.y, 1, 'Touch and rendering use matching coordinates');
}
const lastHeight = scale.height;
rect.height = 0;
syncRunnerViewport(scale);
assert.equal(scale.height, lastHeight, 'Transient zero-size containers must not destroy the viewport');
assert.doesNotThrow(() => syncRunnerViewport(new ScaleManager({})), 'Observer can run before canvas boot');
console.log('PASS: reproduces stale menu size; synchronizes canvas, game size and camera resize events across desktop, zoom-sized bounds and tablet rotation.');
