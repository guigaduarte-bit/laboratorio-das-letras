const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

const filename = path.join(__dirname, '../src/game/three/RunnerCamera3D.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(compiled, { exports: mod.exports, module: mod, require }, { filename });
const { configureRunnerCamera } = mod.exports;

function boxCorners(center, halfSize) {
    const points = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        points.push(new THREE.Vector3(center[0] + x * halfSize[0], center[1] + y * halfSize[1], center[2] + z * halfSize[2]));
    }
    return points;
}

function pixel(point, camera, width, height) {
    const projected = point.clone().project(camera);
    assert(projected.z > -1 && projected.z < 1, 'Action must lie between the clipping planes');
    return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2 };
}

const sizes = [[1300, 550], [900, 700], [768, 650], [800, 300], [360, 360], [360, 560], [800, 270]];
const camera = new THREE.PerspectiveCamera();
let checks = 0;

for (const [width, height] of sizes) {
    configureRunnerCamera(camera, width, height);
    assert.equal(camera.position.x, 0, 'Keep the view centered on the three lanes');
    assert(camera.position.y > 0 && camera.position.z > 4.5, 'Use a camera behind and above the explorer');
    assert(camera.fov >= 45 && camera.fov <= 50, 'Keep a natural perspective');

    function inside(points, label) {
        for (const point of points) {
            const { x, y } = pixel(point, camera, width, height);
            assert(x >= width * 0.05 && x <= width * 0.95, `${width}×${height}: ${label} crosses a side margin`);
            assert(y >= Math.max(height * 0.22, Math.min(height * 0.42, 112)) && y <= height * 0.95, `${width}×${height}: ${label} crosses the HUD or bottom margin`);
            checks++;
        }
    }

    for (const lanes of [[-3.4, 0, 3.4], [-2.448, 2.448]]) {
        for (const lane of lanes) {
            inside(boxCorners([lane, 1.95, -2.8], [1.175, 1.75, 0.3]), 'letter block');
        }
        for (const lane of [...lanes, -1.7, 1.7]) {
            for (const z of [4.5, 3, 1, -1.6]) {
                inside(boxCorners([lane, 1.625, z], [0.9, 1.625, 0.9]), 'explorer during an approach');
            }
        }
    }

    // At the waiting point, even the tallest ring stack must stay below the letter glyphs.
    const explorerTop = Math.min(...boxCorners([0, 1.625, 4.5], [0.9, 1.625, 0.9])
        .map((point) => pixel(point, camera, width, height).y));
    const glyphBottom = Math.max(...boxCorners([0, 2.5, -2.48], [0.7, 0.7, 0.02])
        .map((point) => pixel(point, camera, width, height).y));
    assert(explorerTop - glyphBottom >= 12, `${width}×${height}: the explorer obscures the letters while waiting`);

    const direction = camera.getWorldDirection(new THREE.Vector3());
    configureRunnerCamera(camera, height, width);
    assert(direction.distanceTo(camera.getWorldDirection(new THREE.Vector3())) < 1e-10,
        'Rotating the screen should not tilt or orbit the camera');
    configureRunnerCamera(camera, width, height);
    const projection = camera.projectionMatrix.toArray();
    const position = camera.position.toArray();
    configureRunnerCamera(camera, width, height);
    assert.deepEqual(camera.projectionMatrix.toArray(), projection, 'Repeated resize calls must not accumulate an offset');
    assert.deepEqual(camera.position.toArray(), position);
    for (const dimensions of [[0, height], [width, 0], [NaN, height], [width, Infinity]]) {
        configureRunnerCamera(camera, ...dimensions);
        assert.deepEqual(camera.projectionMatrix.toArray(), projection, 'A hidden or invalid viewport must preserve its camera');
        assert.deepEqual(camera.position.toArray(), position);
    }
}

console.log(`3D framing passed: ${sizes.length} viewports, ${checks} projected action corners, HUD margins and unobscured letters.`);
