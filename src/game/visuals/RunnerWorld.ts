import { GameObjects, Scene } from 'phaser';
import { ART_COLORS as C } from './palette';

/** Perspectiva 2.5D nativa do Phaser. Não requer motor 3D nem imagens externas. */
export class RunnerWorld
{
    private readonly sky: GameObjects.Graphics;
    private readonly road: GameObjects.Graphics;
    private readonly scenery: GameObjects.Graphics;
    private readonly equipment: GameObjects.Graphics;
    private width = 0;
    private height = 0;
    private lastRender = '';

    constructor(private readonly scene: Scene)
    {
        this.sky = scene.add.graphics().setDepth(0);
        this.road = scene.add.graphics().setDepth(1);
        this.scenery = scene.add.graphics().setDepth(2);
        this.equipment = scene.add.graphics().setDepth(71);
    }

    get center(): number { return this.width * (this.width >= 900 ? 0.58 : 0.5); }
    get halfWidth(): number { return Math.min(this.width * 0.49, 550); }

    project(lane: number, distance: number): { x: number; y: number; scale: number }
    {
        const depth = Math.max(0, Math.min(1, distance));
        const scale = Math.pow(1 - depth, 1.6);
        return {
            x: this.center + lane * this.halfWidth * 0.57 * (scale + 0.1),
            y: this.height * 0.24 + this.height * 0.83 * scale,
            scale
        };
    }

    resize(): void
    {
        const { width, height } = this.scene.scale;
        if (this.width !== width || this.height !== height)
        {
            this.width = width;
            this.height = height;
            this.drawBackdrop();
        }
    }

    render(distance: number, count: number, playerX: number, playerY: number, reduced: boolean, finish = 0): void
    {
        // O mundo parado não precisa redesenhar centenas de formas a cada frame.
        const renderKey = [this.width, this.height, reduced ? 0 : distance, count, playerX, playerY, finish].join(':');
        if (renderKey === this.lastRender) return;
        this.lastRender = renderKey;
        const g = this.road;
        g.clear();
        for (let i = 23; i >= 0; i--)
        {
            const far = (i + 1) / 24;
            const near = i / 24;
            const a = this.project(0, far);
            const b = this.project(0, near);
            const aw = this.halfWidth * (a.scale + 0.095);
            const bw = this.halfWidth * (b.scale + 0.095);
            // Bordas espessas dão ao caminho a aparência de uma pista de brinquedo.
            this.quad(g, a.x-aw-9, a.y+12, a.x+aw+9, a.y+12, b.x+bw+9, b.y+15, b.x-bw-9, b.y+15, 0x438f80);
            this.quad(g, a.x-aw, a.y, a.x+aw, a.y, b.x+bw, b.y, b.x-bw, b.y,
                i % 2 === 0 ? 0xe7dbc4 : 0xe4d7bc);
            g.lineStyle(Math.max(1, b.scale * 7), C.sand, 1);
            g.lineBetween(a.x-aw, a.y, b.x-bw, b.y);
            g.lineBetween(a.x+aw, a.y, b.x+bw, b.y);
        }
        // Marcas avançam sob o explorador; ficam imóveis com movimento reduzido.
        for (let i = 0; i < 15; i++)
        {
            const z = ((i / 15 + (reduced ? 0 : distance * 0.2)) % 1);
            const near = this.project(0, z);
            const far = this.project(0, Math.min(1, z + 0.028));
            for (const lane of [-0.57, 0.57])
            {
                const x = this.project(lane, z).x;
                const x2 = this.project(lane, Math.min(1, z + 0.028)).x;
                g.lineStyle(Math.max(1.3, near.scale * 4), 0xb8a885, 0.5);
                g.lineBetween(x, near.y, x2, far.y);
            }
        }
        this.scenery.clear();
        for (let i = 13; i >= 0; i--)
        {
            const z = ((i / 14 + (reduced ? 0 : distance * 0.075)) % 1);
            const p = this.project(0, z);
            const side = i % 2 === 0 ? -1 : 1;
            const x = p.x + side * this.halfWidth * (p.scale + 0.14) * (1.35 + (i % 3)*0.18);
            this.drawTree(x, p.y + 2, 0.22 + p.scale * 1.3, i);
        }
        this.drawLaboratory(finish);
        this.drawEquipment(playerX, playerY, count, finish);
    }

    private drawBackdrop(): void
    {
        const g = this.sky;
        const w = this.width, h = this.height;
        g.clear();
        g.fillGradientStyle(0x82b8ac, 0x82b8ac, 0xc8d9a7, 0xc8d9a7, 1);
        g.fillRect(0, 0, w, h);
        g.fillStyle(C.sand, 0.34);
        g.fillCircle(w * 0.83, h * 0.19, 46);
        g.fillStyle(0xe9ce82, 0.82);
        g.fillCircle(w * 0.83, h * 0.19, 31);
        for (let i = 0; i < 5; i++)
        {
            const x = w * (0.09 + i * 0.22), y = h * (0.12 + (i % 2) * 0.05);
            g.fillStyle(C.sand, 0.28);
            g.fillEllipse(x, y, 118, 24);
            g.fillEllipse(x + 19, y - 9, 56, 32);
        }
        g.fillStyle(0x8daf80, 0.8);
        g.fillEllipse(w * 0.1, h * 0.41, w * 0.8, h * 0.37);
        g.fillEllipse(w * 0.86, h * 0.43, w * 0.8, h * 0.41);
        g.fillStyle(0x5aa89e, 1);
        g.fillRect(0, h * 0.44, w, h);
        g.fillStyle(0x6bb7aa, 1);
        g.fillEllipse(w * 0.46, h * 0.52, w * 1.6, h * 0.24);
        for (let i = 0; i < 20; i++)
        {
            const y = h * (0.49 + ((i * 31) % 45) / 100);
            const x = ((i * 163) % Math.max(w, 1));
            g.lineStyle(2, C.sand, 0.14);
            g.lineBetween(x, y, x + 13 + (i % 4) * 16, y);
        }
    }

    private drawTree(x: number, y: number, scale: number, index: number): void
    {
        const g = this.scenery;
        if (x < -140 || x > this.width + 140) return;
        const s = scale;
        g.fillStyle(0x32786a, 0.3);
        g.fillEllipse(x+12*s, y+7*s, 92*s, 22*s);
        g.fillStyle(0x8eac6d, 1);
        g.fillEllipse(x, y, 85*s, 25*s);
        g.fillStyle(0x789756, 1);
        g.fillEllipse(x, y-5*s, 80*s, 24*s);
        g.fillStyle(C.oat, 1);
        g.fillRoundedRect(x-7*s, y-69*s, 14*s, 67*s, 5*s);
        g.fillStyle(index % 2 ? 0x376e51 : 0x568453, 1);
        g.fillEllipse(x, y-82*s, 78*s, 94*s);
        g.fillStyle(index % 2 ? 0x548651 : 0x719954, 1);
        g.fillEllipse(x-13*s, y-96*s, 44*s, 63*s);
        g.fillStyle(C.leafLight, 0.3);
        g.fillEllipse(x-21*s, y-109*s, 16*s, 28*s);
        if (index % 3 === 0)
        {
            g.fillStyle(C.sun, 1);
            g.fillCircle(x+23*s, y-79*s, 5*s);
            g.fillCircle(x-16*s, y-64*s, 4*s);
        }
    }

    private drawLaboratory(finish: number): void
    {
        const g = this.scenery;
        const p = this.project(0, 0.88 - finish * 0.38);
        const s = 0.48 + finish * 0.52;
        const x = p.x, y = p.y;
        g.fillStyle(0x448b70, 1);
        g.fillEllipse(x, y+8*s, 204*s, 33*s);
        g.fillStyle(C.deepMoss, 1);
        g.fillRoundedRect(x-85*s, y-95*s, 170*s, 98*s, 22*s);
        g.fillStyle(C.sand, 1);
        g.fillRoundedRect(x-77*s, y-89*s, 154*s, 84*s, 17*s);
        g.fillStyle(0x8bc3ae, 1);
        g.fillRoundedRect(x-61*s, y-72*s, 122*s, 68*s, 24*s);
        g.lineStyle(5*s, C.deepMoss, 0.5);
        g.lineBetween(x, y-70*s, x, y-2*s);
        g.lineBetween(x-60*s, y-36*s, x+60*s, y-36*s);
        g.fillStyle(C.clay, 1);
        g.fillRoundedRect(x-100*s, y-103*s, 200*s, 21*s, 9*s);
        g.fillStyle(C.sand, 1);
        g.fillCircle(x, y-115*s, 24*s);
        g.lineStyle(3*s, C.deepMoss, 1);
        g.strokeCircle(x, y-115*s, 24*s);
        g.lineBetween(x-7*s, y-128*s, x-7*s, y-113*s);
        g.lineBetween(x+7*s, y-128*s, x+7*s, y-113*s);
        g.strokeEllipse(x, y-110*s, 27*s, 17*s);
        if (finish > 0.7) this.drawFrog(x, y-18*s, s * 0.62);
    }

    drawFrog(x: number, y: number, s: number): void
    {
        const g = this.scenery;
        g.fillStyle(C.moss, 1);
        g.fillEllipse(x-30*s, y+22*s, 38*s, 19*s);
        g.fillEllipse(x+30*s, y+22*s, 38*s, 19*s);
        g.fillEllipse(x, y, 73*s, 57*s);
        g.fillCircle(x-22*s, y-26*s, 15*s);
        g.fillCircle(x+22*s, y-26*s, 15*s);
        g.fillStyle(C.leafLight, 1);
        g.fillEllipse(x, y+9*s, 44*s, 32*s);
        g.fillStyle(C.sand, 1);
        g.fillCircle(x-22*s, y-27*s, 9*s);
        g.fillCircle(x+22*s, y-27*s, 9*s);
        g.fillStyle(C.ink, 1);
        g.fillCircle(x-21*s, y-27*s, 4*s);
        g.fillCircle(x+21*s, y-27*s, 4*s);
        g.lineStyle(2.5*s, C.ink, 1);
        g.beginPath();
        g.arc(x, y-7*s, 13*s, 0.2, Math.PI-0.2);
        g.strokePath();
    }

    private drawEquipment(x: number, y: number, count: number, finish: number): void
    {
        const g = this.equipment;
        g.clear();
        if (!count) return;
        const s = Math.min(1.3, Math.max(0.76, this.width/760));
        const cx = x+43*s, cy = y+15*s;
        g.fillStyle(C.ink, 0.13);
        g.fillEllipse(cx+5*s, cy+24*s, 75*s, 21*s);
        g.fillStyle(C.deepMoss, 1);
        g.fillRoundedRect(cx-29*s, cy+6*s, 58*s, 18*s, 8*s);
        for (let i = 0; i < count * 3; i++)
        {
            const ey = cy-i*5.5*s;
            g.lineStyle(5*s, [C.sun, C.clay, C.lagoon, C.leafLight][Math.floor(i/3) % 4], 1);
            g.strokeEllipse(cx, ey, 50*s, 15*s);
        }
        if (finish > 0.5)
        {
            g.lineStyle(3*s, C.sun, 0.65);
            g.strokeCircle(cx, cy-count*16*s, 17*s+(finish-0.5)*22);
        }
    }

    private quad(g: GameObjects.Graphics, ...p: number[]): void
    {
        g.fillStyle(p[8], 1);
        g.beginPath(); g.moveTo(p[0],p[1]);
        g.lineTo(p[2],p[3]); g.lineTo(p[4],p[5]); g.lineTo(p[6],p[7]);
        g.closePath(); g.fillPath();
    }
}
