/* Actual habitat geometry and instance transforms; no WebGL or pixel rendering. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

function load(filename) {
    const absolute = path.resolve(__dirname, '..', filename);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require }, { filename: absolute });
    return module.exports;
}

const { BiomeWorld3D } = load('src/game/three/BiomeWorld3D.ts');
const { getBiomeForLevel } = load('src/game/content/biomes.ts');
const destinations = [
    ['forest-sapo', 'mata-atlantica', [['Folhas aquáticas', 'CylinderGeometry'], ['Taboas', 'CylinderGeometry'], ['Bromélias', 'SphereGeometry']]],
    ['forest-onca', 'pantanal', [['Águas do Pantanal', 'BoxGeometry'], ['Ondas nas ilhas', 'TorusGeometry'], ['Troncos de palmeiras', 'CylinderGeometry']]],
    ['forest-tucano', 'cerrado', [['Árvores retorcidas', 'CylinderGeometry'], ['Pedras do cerrado', 'DodecahedronGeometry'], ['Água da vereda', 'BoxGeometry']]],
    ['forest-macaco', 'amazonia', [['Cipós', 'TubeGeometry'], ['Raízes altas', 'CylinderGeometry'], ['Folhas largas', 'SphereGeometry']]],
];
const matrices = root => root.children.filter(object => object.isInstancedMesh).map(mesh => Array.from(mesh.instanceMatrix.array));
const measured = [];
let instanceChecks = 0;

for (const [levelId, biomeId, features] of destinations) {
    const definition = getBiomeForLevel(levelId);
    assert.equal(definition.id, biomeId, 'Every school word selects its own destination');
    const habitat = new BiomeWorld3D(definition);
    const parent = new THREE.Group();
    parent.add(habitat.root);
    assert.equal(habitat.root.userData.biomeId, biomeId);
    const meshes = habitat.root.children.filter(object => object.isMesh);
    assert(meshes.length > 0 && meshes.every(mesh => mesh.isInstancedMesh), 'Repeated habitat geometry is actually batched');
    for (const [name, geometryType] of features) {
        const feature = meshes.find(mesh => mesh.name.startsWith(name) && mesh.geometry.type === geometryType);
        assert(feature && feature.count > 0, `${biomeId} contains real ${geometryType} instances for ${name}`);
    }
    const drawCalls = meshes.reduce((sum, mesh) => sum + (Array.isArray(mesh.material) ? mesh.material.length : 1), 0);
    const shadowCalls = meshes.filter(mesh => mesh.castShadow).length;
    assert(drawCalls + shadowCalls <= 45, `${biomeId}: active scenery exceeds the 45 scene + shadow draw-call budget`);
    measured.push(`${biomeId}: ${drawCalls}+${shadowCalls}`);

    // Assert actual spatial extents, including wind and wrapped instance placement.
    for (const distance of [0, 26.5, 94, 188, 1e9]) {
        habitat.update(13.2, distance, false);
        habitat.root.updateMatrixWorld(true);
        for (const mesh of meshes) {
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            for (let index = 0; index < mesh.count; index++) {
                const transform = new THREE.Matrix4();
                mesh.getMatrixAt(index, transform);
                assert(transform.elements.every(Number.isFinite), `${biomeId}: long travel must never create invalid transforms`);
                assert(Math.abs(transform.determinant()) > 1e-10, 'Instance geometry must retain positive, nonzero volume');
                const position = new THREE.Vector3().setFromMatrixPosition(transform);
                assert(position.z > -120 && position.z < 30, 'Travel wraps scenery into a bounded world instead of accumulating coordinates');
                if (/Troncos|Árvores retorcidas|Raízes altas|Capins|Folhas|Bromélias|Taboas|Cipós/.test(mesh.name)) {
                    const bounds = mesh.geometry.boundingBox.clone().applyMatrix4(transform);
                    assert(bounds.max.x < -5.9 || bounds.min.x > 5.9,
                        `${biomeId}: ${mesh.name} extends into the 11.8-unit playable path`);
                }
                instanceChecks++;
            }
        }
    }

    habitat.update(8, 0, false);
    const initial = matrices(habitat.root);
    habitat.update(8, 94, false);
    assert.deepEqual(matrices(habitat.root), initial, 'One complete environment wrap returns every instance to its previous transform');
    habitat.update(9, 94, false);
    assert.notDeepEqual(matrices(habitat.root), initial, 'The active habitat has real ambient animation');
    const frozen = matrices(habitat.root);
    habitat.update(9, 94, false);
    assert.deepEqual(matrices(habitat.root), frozen, 'A frozen animation clock preserves the precise habitat pose');
    habitat.update(10, 94, true);
    const reduced = matrices(habitat.root);
    habitat.update(5000, 94, true);
    assert.deepEqual(matrices(habitat.root), reduced, 'Reduced motion removes continuous wind cycles');
    habitat.update(5000, 106, true);
    assert.notDeepEqual(matrices(habitat.root), reduced, 'Reduced motion preserves the necessary travel movement');

    const resources = new Map();
    for (const mesh of meshes) {
        for (const resource of [mesh, mesh.geometry, ...(Array.isArray(mesh.material) ? mesh.material : [mesh.material])]) {
            if (resources.has(resource)) continue;
            resources.set(resource, 0);
            resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
        }
    }
    habitat.dispose();
    habitat.dispose();
    assert.equal(parent.children.length, 0, 'Disposal detaches the habitat from the parent scene');
    assert.equal(habitat.root.children.length, 0);
    for (const count of resources.values()) assert.equal(count, 1, 'Every owned instance buffer, geometry and material is released once');
    habitat.update(100, 100, false);
    assert.equal(habitat.root.children.length, 0, 'An update after disposal cannot recreate the biome');
}

assert.equal(getBiomeForLevel('unavailable-level').id, 'mata-atlantica', 'Unknown input preserves the default destination');
console.log(`PASS: four distinct real habitat geometries, ${instanceChecks} finite/path-clear instance checks, bounded wrap, reduced motion and disposal. Estimated scene+shadow draws: ${measured.join('; ')} (no FPS or pixel measurement).`);
