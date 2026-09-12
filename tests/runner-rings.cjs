const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports) {
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => imports[name] });
    return module.exports;
}
const { ART_COLORS } = load('src/game/visuals/palette.ts', {});
function display(x = 0, y = 0, children = []) {
    const item = { x, y, children, points: [], paths: 0,
        add(children) { this.children.push(...(Array.isArray(children) ? children : [children])); return this; },
        setPosition(x, y) { this.x = x; this.y = y; return this; },
        setY(y) { this.y = y; return this; },
        clear() { this.points = []; this.paths = 0; return this; },
        moveTo(x, y) { this.points.push({ x, y }); return this; },
        lineTo(x, y) { this.points.push({ x, y }); return this; },
        strokePath() { this.paths++; return this; }
    };
    for (const name of ['setDepth', 'setScale', 'setAngle', 'setAlpha', 'fillStyle', 'fillRoundedRect',
        'strokeRoundedRect', 'lineStyle', 'beginPath', 'destroy', 'setVisible', 'fillEllipse',
        'fillTriangle', 'fillCircle', 'lineBetween']) item[name] = () => item;
    return item;
}
const scene = { add: { container: display, graphics: () => display(), ellipse: display, circle: display, rectangle: display },
    tweens: { add() {}, chain() {}, killTweensOf() {} }, time: { now: 0 } };
const { PlayerAvatar } = load('src/game/visuals/PlayerAvatar.ts', { './palette': { ART_COLORS }, '../content/victoryDance': load('src/game/content/victoryDance.ts', {}) });
const avatar = new PlayerAvatar(scene, 0, 0);
assert.ok(avatar.rig.children.indexOf(avatar.ringBack) < avatar.rig.children.indexOf(avatar.ringFront));
assert.ok(avatar.rig.children.indexOf(avatar.ringFront) < avatar.rig.children.indexOf(avatar.upper), 'The face stays in front of the stack');
for (let letters = 0; letters <= 8; letters++) {
    avatar.setRingCount(letters * 3);
    assert.equal(avatar.ringBack.paths, letters * 3); assert.equal(avatar.ringFront.paths, letters * 3);
    for (const g of [avatar.ringBack, avatar.ringFront]) {
        if (!letters) continue;
        assert.equal(Math.min(...g.points.map(({ x }) => x)), -30);
        assert.equal(Math.max(...g.points.map(({ x }) => x)), 30);
    }
    const growth = -avatar.upper.y;
    avatar.syncPosition(170, 240); avatar.setRunnerPose(true, 1.2, false);
    assert.equal(avatar.root.x, 170); assert.equal(avatar.upper.y, -growth);
    avatar.setRunnerPose(false, 1.2, true);
    assert.equal(avatar.upper.y, -growth, 'Reduced motion must not detach the head from a grown stack');
    // Fit the complete explorer above its feet across the supported short/narrow viewports.
    for (const [width, height] of [[300, 300], [600, 270], [900, 360], [1280, 580], [1800, 650]]) {
        for (const approach of [0, 1]) {
            const scale = avatar.getRunnerScale(width, height, approach);
            const footY = height * .24 + height * .83 * Math.pow(1 - (.10 + approach * .23), 1.6);
            const rootY = footY - 35 * scale;
            assert.ok(rootY + 36 * scale < height, 'Feet remain inside the stage');
            assert.ok(rootY - (58 + growth) * scale > 0, 'The complete ring stack and antenna remain visible');
            if (!approach) {
                const gateScale = Math.min(1.22, Math.max(.52, width / 860));
                const glyphBottom = height * .24 + height * .83 * Math.pow(.67, 1.6) - 28 * gateScale;
                assert.ok(rootY - (44 + growth) * scale > glyphBottom, 'The grown face must not obscure letters while choosing');
            }
        }
    }
}
avatar.setRingCount(0); assert.equal(Math.abs(avatar.upper.y), 0); assert.equal(avatar.ringFront.paths, 0);
console.log('PASS: rings wrap around the avatar, move with its rig, stack up to eight letters, preserve the face and stay within the game viewport.');
