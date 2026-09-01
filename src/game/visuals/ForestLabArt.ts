import { Display, Scene } from 'phaser';
import type { PlatformPlacement } from '../content/levels';
import { ART_COLORS } from './palette';

type ForestLabBackgroundOptions = {
    menu?: boolean;
};

export function drawForestLabBackground(
    scene: Scene,
    { menu = false }: ForestLabBackgroundOptions = {}
): void
{
    drawSky(scene);
    drawSun(scene);
    drawDistantCanopy(scene);
    drawFieldStation(scene, menu);
    drawForegroundPlants(scene);
}

export function drawPlatformVisual(
    scene: Scene,
    placement: PlatformPlacement,
    isGround: boolean
): void
{
    if (isGround)
    {
        const soil = scene.add.rectangle(
            placement.x,
            placement.y + 8,
            placement.width,
            placement.height + 16,
            ART_COLORS.deepMoss
        ).setDepth(3);
        const moss = scene.add.rectangle(
            placement.x,
            placement.y - placement.height / 2 + 3,
            placement.width,
            14,
            ART_COLORS.moss
        ).setDepth(4);

        for (let x = 16; x < placement.width; x += 48)
        {
            scene.add.circle(
                placement.x - placement.width / 2 + x,
                placement.y - placement.height / 2 - 2 - (x % 3),
                10 + (x % 4),
                x % 96 === 0 ? ART_COLORS.leafLight : ART_COLORS.moss
            ).setDepth(4);
        }

        soil.setData('art-role', 'ground');
        moss.setData('art-role', 'ground-cap');
        return;
    }

    const shadow = scene.add.graphics().setDepth(3);
    shadow.fillStyle(ART_COLORS.ink, 0.16);
    shadow.fillRoundedRect(
        placement.x - placement.width / 2 + 5,
        placement.y - placement.height / 2 + 7,
        placement.width,
        placement.height,
        12
    );

    const pod = scene.add.graphics().setDepth(4);
    pod.fillStyle(ART_COLORS.oat, 1);
    pod.fillRoundedRect(
        placement.x - placement.width / 2,
        placement.y - placement.height / 2,
        placement.width,
        placement.height,
        12
    );
    pod.lineStyle(4, ART_COLORS.deepMoss, 1);
    pod.strokeRoundedRect(
        placement.x - placement.width / 2,
        placement.y - placement.height / 2,
        placement.width,
        placement.height,
        12
    );

    const mossCap = scene.add.graphics().setDepth(5);
    mossCap.fillStyle(ART_COLORS.moss, 1);
    mossCap.fillRoundedRect(
        placement.x - placement.width / 2 + 5,
        placement.y - placement.height / 2 - 3,
        placement.width - 10,
        10,
        5
    );

    scene.add.circle(
        placement.x - placement.width / 2 + 18,
        placement.y + 1,
        4,
        ART_COLORS.ochre
    ).setDepth(5);
    scene.add.circle(
        placement.x + placement.width / 2 - 18,
        placement.y + 1,
        4,
        ART_COLORS.ochre
    ).setDepth(5);
}

function drawSky(scene: Scene): void
{
    const bands = 30;
    const top = Display.Color.IntegerToColor(ART_COLORS.skyTop);
    const bottom = Display.Color.IntegerToColor(ART_COLORS.skyBottom);

    for (let index = 0; index < bands; index += 1)
    {
        const color = Display.Color.Interpolate.ColorWithColor(
            top,
            bottom,
            bands - 1,
            index
        );
        scene.add.rectangle(
            480,
            (540 / bands) * index + 540 / bands / 2,
            960,
            540 / bands + 1,
            Display.Color.GetColor(color.r, color.g, color.b)
        ).setDepth(-12);
    }

    const haze = scene.add.graphics().setDepth(-11);
    haze.fillStyle(ART_COLORS.sand, 0.12);
    haze.fillCircle(250, 130, 128);
    haze.fillCircle(690, 160, 170);
}

function drawSun(scene: Scene): void
{
    scene.add.circle(846, 94, 49, ART_COLORS.sun, 0.9).setDepth(-10);
    scene.add.circle(846, 94, 63, ART_COLORS.sand, 0.14).setDepth(-10);
}

function drawDistantCanopy(scene: Scene): void
{
    scene.add.ellipse(170, 397, 430, 190, ART_COLORS.sage, 0.7).setDepth(-9);
    scene.add.ellipse(510, 420, 520, 210, ART_COLORS.moss, 0.35).setDepth(-9);
    scene.add.ellipse(850, 392, 420, 180, ART_COLORS.leafLight, 0.66).setDepth(-9);

    const trees = [
        { x: 64, y: 350, scale: 0.84 },
        { x: 152, y: 330, scale: 1.02 },
        { x: 760, y: 336, scale: 0.92 },
        { x: 910, y: 346, scale: 1.08 }
    ];

    trees.forEach(({ x, y, scale }, index) => {
        scene.add.rectangle(
            x,
            y + 55 * scale,
            24 * scale,
            132 * scale,
            index % 2 === 0 ? ART_COLORS.clay : ART_COLORS.ochre,
            0.7
        ).setDepth(-8);
        scene.add.ellipse(
            x - 18 * scale,
            y - 8 * scale,
            94 * scale,
            116 * scale,
            index % 2 === 0 ? ART_COLORS.moss : ART_COLORS.deepMoss,
            0.76
        ).setDepth(-8);
        scene.add.ellipse(
            x + 24 * scale,
            y + 4 * scale,
            78 * scale,
            100 * scale,
            ART_COLORS.sage,
            0.8
        ).setDepth(-8);
    });
}

function drawFieldStation(scene: Scene, menu: boolean): void
{
    const station = scene.add.graphics().setDepth(-7);
    const centerX = menu ? 480 : 510;
    const centerY = menu ? 375 : 390;
    const width = menu ? 390 : 300;
    const height = menu ? 210 : 160;

    station.fillStyle(ART_COLORS.sand, menu ? 0.32 : 0.2);
    station.fillRoundedRect(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height,
        90
    );
    station.lineStyle(menu ? 7 : 5, ART_COLORS.deepMoss, menu ? 0.52 : 0.34);
    station.strokeRoundedRect(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height,
        90
    );
    station.lineBetween(centerX, centerY - height / 2, centerX, centerY + height / 2);
    station.lineBetween(
        centerX - width * 0.42,
        centerY,
        centerX + width * 0.42,
        centerY
    );

    scene.add.circle(
        centerX,
        centerY,
        menu ? 26 : 20,
        ART_COLORS.sun,
        menu ? 0.48 : 0.34
    ).setDepth(-6);
}

function drawForegroundPlants(scene: Scene): void
{
    const plants = [40, 104, 650, 720, 904];

    plants.forEach((x, index) => {
        const baseY = 487;
        const stem = scene.add.graphics().setDepth(1);
        stem.lineStyle(5, ART_COLORS.deepMoss, 0.74);
        stem.lineBetween(x, baseY, x + (index % 2 === 0 ? 4 : -4), baseY - 38);
        scene.add.ellipse(
            x - 10,
            baseY - 26,
            25,
            13,
            index % 2 === 0 ? ART_COLORS.leafLight : ART_COLORS.sage,
            0.85
        ).setAngle(-22).setDepth(1);
        scene.add.ellipse(
            x + 12,
            baseY - 40,
            27,
            14,
            ART_COLORS.moss,
            0.84
        ).setAngle(24).setDepth(1);
    });
}
