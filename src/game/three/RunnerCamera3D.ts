import * as THREE from 'three';

export const RUNNER_LANE_SPACING = 3.4;

const FIELD_OF_VIEW = 48;
const TOP_INSET = 0.22;
const BOTTOM_INSET = 0.05;
const SIDE_INSET = 0.05;
const target = new THREE.Vector3(0, 1.4, 0.8);
const backward = new THREE.Vector3(0, 9.4, 20.9).normalize();
const screenUp = new THREE.Vector3(0, backward.z, -backward.y);
const actionCorners: THREE.Vector3[] = [];

function includeBox(minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number): void {
    for (const x of [minX, maxX]) {
        for (const y of [minY, maxY]) {
            for (const z of [minZ, maxZ]) actionCorners.push(new THREE.Vector3(x, y, z));
        }
    }
}

// Three letter blocks, including their thickness. The two-choice arrangement fits inside this volume.
includeBox(-RUNNER_LANE_SPACING - 1.175, RUNNER_LANE_SPACING + 1.175, 0.2, 3.7, -3.1, -2.5);
// The full-grown explorer can occupy any lane and any point of the approach, including its depth.
includeBox(-RUNNER_LANE_SPACING - 0.9, RUNNER_LANE_SPACING + 0.9, 0, 3.25, -2.5, 5.4);

/** Frame the complete action without changing the viewing angle during play or screen rotation. */
export function configureRunnerCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;

    const aspect = width / height;
    const halfFov = Math.tan(THREE.MathUtils.degToRad(FIELD_OF_VIEW / 2));
    // The word HUD has a pixel height; a percentage alone is insufficient in short landscape windows.
    const topInset = Math.max(TOP_INSET, Math.min(0.42, 112 / height));
    const horizontalRoom = 1 - SIDE_INSET * 2;
    const verticalRoom = 1 - topInset - BOTTOM_INSET;
    const offset = new THREE.Vector3();
    let distance = 0;

    // For each corner, solve perspective x/depth and y/depth against the usable screen bounds.
    // This also handles the near-side lanes, which appear larger than the distant letter blocks.
    for (const corner of actionCorners) {
        offset.copy(corner).sub(target);
        const towardCamera = offset.dot(backward);
        distance = Math.max(distance,
            towardCamera + Math.abs(offset.x) / (halfFov * aspect * horizontalRoom),
            towardCamera + Math.abs(offset.dot(screenUp)) / (halfFov * verticalRoom));
    }
    distance *= 1.035;

    camera.fov = FIELD_OF_VIEW;
    camera.aspect = aspect;
    camera.zoom = 1;
    camera.near = 0.1;
    camera.far = Math.max(160, distance + 100);
    camera.up.set(0, 1, 0);
    camera.position.copy(target).addScaledVector(backward, distance);
    camera.lookAt(target);
    // Shift the framed action down to preserve the HUD, without tilting or distorting the world.
    camera.setViewOffset(width, height, 0, -height * (topInset - BOTTOM_INSET) / 2, width, height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
}
