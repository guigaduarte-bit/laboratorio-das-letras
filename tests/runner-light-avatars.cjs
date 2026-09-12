/* Actual vector-rig logic with recorded drawing calls; no GPU/pixel assertions. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    vm.runInNewContext(source, { module, exports: module.exports, require: (name) => {
        assert.ok(name in imports, `Unexpected import ${name}`); return imports[name];
    } });
    return module.exports;
}
const { ART_COLORS } = load('src/game/visuals/palette.ts');
const victoryDance = load('src/game/content/victoryDance.ts');
const { PlayerAvatar } = load('src/game/visuals/PlayerAvatar.ts', { './palette': { ART_COLORS }, '../content/victoryDance': victoryDance });
let allocations = 0;
const activeTargets = new Set();
function display(x = 0, y = 0, children = []) {
    allocations++;
    const item = { x, y, children, commands: [], visible: true, scaleX: 1, scaleY: 1,
        add(parts) { this.children.push(...(Array.isArray(parts) ? parts : [parts])); return this; },
        setPosition(x, y) { this.x = x; this.y = y; return this; },
        setY(y) { this.y = y; return this; },
        setVisible(visible) { this.visible = visible; return this; },
        setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; },
        setAngle(angle) { this.angle = angle; return this; },
        clear() { this.commands = []; return this; },
        destroy() { this.destroyed = true; for (const child of this.children) child.destroy(); }
    };
    for (const name of ['setDepth', 'setAlpha', 'fillStyle', 'fillRoundedRect', 'strokeRoundedRect',
        'lineStyle', 'beginPath', 'moveTo', 'lineTo', 'strokePath', 'fillEllipse', 'fillCircle',
        'fillTriangle', 'lineBetween']) item[name] = (...args) => { item.commands.push([name, ...args]); return item; };
    return item;
}
const scene = {
    add: { container: display, graphics: (options = {}) => display(options.x, options.y),
        ellipse: (x, y) => display(x, y), circle: (x, y) => display(x, y), rectangle: (x, y) => display(x, y) },
    tweens: {
        add({ targets }) { for (const target of Array.isArray(targets) ? targets : [targets]) activeTargets.add(target); },
        chain({ targets }) { activeTargets.add(targets); },
        killTweensOf(target) { activeTargets.delete(target); }
    }, time: { now: 0 }
};
const avatar = new PlayerAvatar(scene, 0, 0);
const allocatedRig = allocations;
assert.equal(avatar.character, 'lumi', 'Platform mode starts with the existing Lumi rig');
let checks = 0;
for (const character of ['unicorn', 'dog', 'lumi', 'dog', 'unicorn', 'lumi']) {
    avatar.setCharacter(character);
    assert.equal(allocations, allocatedRig, 'Switches reuse rig parts without accumulating display objects');
    assert.equal(avatar.character, character);
    assert.ok(avatar.robotParts.every((part) => part.visible === (character === 'lumi')));
    assert.ok(avatar.leftFoot.visible && avatar.rightFoot.visible, 'Each character has two visible articulated feet');
    assert.equal(avatar.leftFoot.fillColor, character === 'lumi' ? ART_COLORS.ink : character === 'unicorn' ? 0xb8a5df : 0x73503b);
    assert.ok(!avatar.animalBody.commands.some(([name, x, y, w, h]) => name === 'fillEllipse' && y === 32 && w === 18 && h === 8),
        'Animal bodies contain no duplicate feet fixed to the ground');
    if (character === 'unicorn') {
        assert.ok(avatar.animalFace.commands.some(([name, ...p]) => name === 'fillTriangle' && p.includes(-68)), 'The unicorn includes a raised horn');
        assert.ok(avatar.tail.commands.some(([name]) => name === 'fillEllipse'), 'The unicorn includes a mane-colored tail');
    } else if (character === 'dog') {
        assert.ok(avatar.animalFace.commands.some(([name, x, y, w, h]) => name === 'fillEllipse' && x === -23 && h === 35), 'Dog has a distinct floppy ear silhouette');
        assert.ok(avatar.animalFace.commands.some(([name, x, y, w, h]) => name === 'fillEllipse' && y === -21 && w === 9 && h === 6), 'Dog has a nose on its muzzle');
    } else {
        assert.equal(avatar.animalFace.commands.length, 0);
        assert.equal(avatar.tail.commands.length, 0, 'Returning to Lumi clears animal-only anatomy');
    }
    for (let letters = 0; letters <= 8; letters++) {
        avatar.setRingCount(letters * 3);
        assert.equal(avatar.ringCount, letters * 3);
        assert.equal(avatar.ringFront.commands.filter(([name]) => name === 'strokePath').length, letters * 3);
        const growth = -avatar.upper.y;
        for (const [width, height] of [[300, 300], [600, 270], [900, 360], [1280, 580], [1800, 650]]) {
            for (const approach of [0, 1]) {
                const scale = avatar.getRunnerScale(width, height, approach);
                const footY = height * .24 + height * .83 * Math.pow(1 - (.10 + approach * .23), 1.6);
                const rootY = footY - 35 * scale;
                const top = character === 'unicorn' ? 68 : character === 'dog' ? 50 : 58;
                assert.ok(Number.isFinite(scale) && scale > 0);
                assert.ok(rootY - (top + growth) * scale > 0, `${character} head stays visible with ${letters} letters`);
                assert.ok(rootY + 36 * scale < height, 'Feet remain inside the stage');
                if (!approach) {
                    const gateScale = Math.min(1.22, Math.max(.52, width / 860));
                    const glyphBottom = height * .24 + height * .83 * Math.pow(.67, 1.6) - 28 * gateScale;
                    assert.ok(rootY - (44 + growth) * scale > glyphBottom, 'The face preserves space for the letter choices');
                }
                checks++;
            }
        }
        avatar.setRunnerPose(true, 1, false);
        avatar.setRunnerPose(false, 1, true);
        assert.equal(activeTargets.size, 0, 'Reduced motion also stops the animal tail');
        assert.equal(avatar.upper.y, -growth, 'Reduced motion preserves the stack and head attachment');
    }
}
avatar.setRingCount(999);
assert.equal(avatar.ringCount, 24, 'Oversized values stay within the designed ring capacity');
avatar.setRingCount(NaN);
assert.equal(avatar.ringCount, 0, 'Non-finite values cannot poison the display coordinates');
avatar.setCharacter('unknown');
assert.equal(avatar.character, 'lumi', 'An invalid runtime character leaves the current rig intact');
avatar.setCharacter('dog');
for (const character of ['lumi', 'unicorn', 'dog']) {
    avatar.setCharacter(character);
    avatar.setRingCount(24);
    const growth = avatar.upper.y;
    const pose = () => [avatar.rig.x, avatar.rig.y, avatar.rig.angle, avatar.leftArm.angle, avatar.rightArm.angle,
        avatar.leftLeg.x, avatar.leftLeg.y, avatar.rightLeg.x, avatar.rightLeg.y, avatar.tail.angle,
        avatar.leftFoot.x, avatar.leftFoot.y, avatar.leftFoot.angle, avatar.rightFoot.x, avatar.rightFoot.y, avatar.rightFoot.angle];
    avatar.setRunnerVictoryPose(1.1, 1, false);
    const firstStep = pose();
    avatar.setRunnerVictoryPose(1.85, 1, false);
    assert.notDeepEqual(pose(), firstStep, `${character} alternates its dance steps`);
    const paused = pose();
    avatar.setRunnerVictoryPose(1.85, 1, false);
    assert.deepEqual(pose(), paused, 'A frozen scene clock preserves the exact dance pose');
    avatar.setRunnerVictoryPose(2.65, 1, false);
    const leftGesture = pose();
    assert(Math.hypot(avatar.leftFoot.x + 11, avatar.leftFoot.y - 32) > 2,
        'The visible left foot moves during its tap, instead of remaining at its resting position');
    avatar.setRunnerVictoryPose(3.4, 1, false);
    assert.notDeepEqual(pose(), leftGesture, 'Foot taps and arm gestures switch sides after the lateral steps');
    const gestures = [1.1, 1.85, 2.65, 3.4, 4.4, 5.1].map((time) => {
        avatar.setRunnerVictoryPose(time, 1, false);
        return JSON.stringify(pose());
    });
    assert.equal(new Set(gestures).size, 6, 'The choreography contains six distinct readable poses');
    for (let t = 0; t <= victoryDance.VICTORY_DANCE_DURATION; t += .025) {
        avatar.setRunnerVictoryPose(t, 1, false);
        assert.equal(avatar.upper.y, growth, 'The ring stack and head stay attached during the dance');
        assert(Math.abs(avatar.rig.x) <= 6 && avatar.rig.y >= -5 && Math.abs(avatar.rig.angle) <= 2.4);
        for (const [leg, foot, side] of [[avatar.leftLeg, avatar.leftFoot, -1], [avatar.rightLeg, avatar.rightFoot, 1]]) {
            const angle = leg.angle * Math.PI / 180;
            const dx = foot.x - leg.x, dy = foot.y - leg.y;
            assert(Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle) - side) < 1e-9
                && Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle) - 12) < 1e-9,
                `${character}: the visible foot stays attached to the rotating leg through every step`);
            assert.equal(foot.angle, leg.angle);
        }
    }
    avatar.setRunnerVictoryPose(victoryDance.VICTORY_DANCE_DURATION, 1, false);
    const finished = pose();
    avatar.setRunnerVictoryPose(40, 1, false);
    assert.deepEqual(pose(), finished, 'The completed choreography does not loop');
    avatar.setRunnerVictoryPose(.5, 1, true);
    const reduced = pose();
    avatar.setRunnerVictoryPose(2.5, 1, true);
    assert.deepEqual(pose(), reduced, 'Reduced motion keeps a static victory pose');
    assert.equal(activeTargets.size, 0, 'No old celebration tween competes with the scene-clock dance');
    assert.deepEqual([avatar.leftFoot.x, avatar.leftFoot.y, avatar.rightFoot.x, avatar.rightFoot.y], [-11, 32, 11, 32],
        'A settled or reduced pose restores the existing resting feet');
}
avatar.destroy();
assert.equal(activeTargets.size, 0, 'Destroying the rig releases its tail and limb tweens');
assert.ok(avatar.root.destroyed && avatar.tail.destroyed && avatar.animalFace.destroyed);
console.log(`PASS: three original fallback rigs, reversible selection, ${checks} framing checks up to 24 rings, reduced motion and tween disposal.`);
