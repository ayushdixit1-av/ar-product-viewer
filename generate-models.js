require('blob-polyfill');
const { Blob } = require('buffer');
class FileReader {
    constructor() { this.result = null; this.onloadend = null; }
    readAsArrayBuffer(blob) { blob.arrayBuffer().then(buf => { this.result = buf; if (this.onloadend) this.onloadend(); }); }
    readAsDataURL(blob) { blob.arrayBuffer().then(buf => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64'); if (this.onloadend) this.onloadend(); }); }
}
globalThis.FileReader = FileReader;
globalThis.Blob = Blob;

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'assets', 'models');
fs.mkdirSync(outDir, { recursive: true });

function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color, roughness: opts.r ?? 0.5, metalness: opts.m ?? 0.05,
        side: opts.side ?? THREE.FrontSide, transparent: opts.t ?? false,
        opacity: opts.op ?? 1.0, emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 0,
    });
}

function addShadow(group) {
    group.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
}

function roundedBox(w, h, d, r = 0.01) {
    const shape = new THREE.Shape();
    const x = -w/2, y = -h/2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const extrudeSettings = { depth: d, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
}

function buildChair() {
    const g = new THREE.Group();
    const W = 0.72, D = 0.78, H = 0.82;
    const fab = mat(0x4a4a4a, { r: 0.92 });
    const fabLight = mat(0x5a5a5a, { r: 0.9 });
    const wd = mat(0x6B4226, { r: 0.28, m: 0.08 });
    const wdDark = mat(0x5a3a20, { r: 0.3, m: 0.1 });

    const sY = 0.43;
    // Seat with rounded cushion
    const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, D), wd);
    seatFrame.position.y = sY; g.add(seatFrame);

    const cushGeom = new THREE.BoxGeometry(W - 0.06, 0.08, D - 0.06);
    const cushion = new THREE.Mesh(cushGeom, fab);
    cushion.position.y = sY + 0.06; g.add(cushion);

    // Top stitch line on cushion
    const stitchGeom = new THREE.BoxGeometry(W - 0.12, 0.002, 0.003);
    const stitch = new THREE.Mesh(stitchGeom, mat(0x666666, { r: 0.9 }));
    stitch.position.set(0, sY + 0.101, 0); g.add(stitch);
    const stitch2 = stitch.clone();
    stitch2.position.z = -0.12; g.add(stitch2);
    const stitch3 = stitch.clone();
    stitch3.position.z = 0.12; g.add(stitch3);

    // Back
    const bH = H - sY - 0.14;
    const backGeom = new THREE.BoxGeometry(W - 0.03, bH, 0.05);
    const back = new THREE.Mesh(backGeom, wd);
    back.position.set(0, sY + 0.08 + bH/2, -D/2 + 0.03); g.add(back);

    const backCushGeom = new THREE.BoxGeometry(W - 0.1, bH - 0.08, 0.04);
    const backCush = new THREE.Mesh(backCushGeom, fab);
    backCush.position.set(0, sY + 0.08 + bH/2, -D/2 + 0.01); g.add(backCush);

    // Tufting buttons on back cushion
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
            const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), fabLight);
            btn.position.set(
                -W/2 + 0.12 + c * (W - 0.24) / 2,
                sY + 0.16 + r * 0.15,
                -D/2 - 0.005
            );
            g.add(btn);
        }
    }

    // Tapered legs
    const legH = sY - 0.02;
    const legPositions = [
        [-W/2 + 0.06, -D/2 + 0.06, 0.02],
        [W/2 - 0.06, -D/2 + 0.06, 0.02],
        [-W/2 + 0.06, D/2 - 0.06, 0.02],
        [W/2 - 0.06, D/2 - 0.06, 0.02],
    ];
    legPositions.forEach(([x, z, taper]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, legH, 12), wdDark);
        leg.position.set(x, legH/2, z);
        // Slight splay
        leg.rotation.z = x > 0 ? -0.04 : 0.04;
        leg.rotation.x = z > 0 ? 0.04 : -0.04;
        g.add(leg);
    });

    // Armrests
    [-1, 1].forEach(side => {
        const armH = 0.2;
        const armGeom = new THREE.BoxGeometry(0.035, armH, D * 0.55);
        const arm = new THREE.Mesh(armGeom, wd);
        arm.position.set(side * (W/2 - 0.02), sY + armH/2 + 0.04, -D * 0.08);
        g.add(arm);
        // Armrest pad
        const padGeom = new THREE.BoxGeometry(0.045, 0.018, D * 0.5);
        const pad = new THREE.Mesh(padGeom, fab);
        pad.position.set(side * (W/2 - 0.02), sY + armH + 0.05, -D * 0.08);
        g.add(pad);
    });

    addShadow(g);
    return g;
}

function buildTable() {
    const g = new THREE.Group();
    const W = 1.2, D = 0.6, H = 0.42;
    const wd = mat(0x6B4226, { r: 0.25, m: 0.04 });
    const wdEdge = mat(0x5a3a20, { r: 0.22, m: 0.06 });

    // Tabletop with beveled edges
    const topGeom = roundedBox(W, 0.038, D, 0.005);
    const top = new THREE.Mesh(topGeom, wd);
    top.position.y = H; top.rotation.x = Math.PI / 2; g.add(top);

    // Edge banding
    const edgeGeom = new THREE.BoxGeometry(W + 0.004, 0.012, D + 0.004);
    const edge = new THREE.Mesh(edgeGeom, wdEdge);
    edge.position.y = H - 0.022; g.add(edge);

    // Wood grain lines (subtle)
    for (let i = 0; i < 5; i++) {
        const grain = new THREE.Mesh(
            new THREE.BoxGeometry(W * 0.8, 0.001, 0.003),
            mat(0x7a5230, { r: 0.3 })
        );
        grain.position.set((Math.random() - 0.5) * 0.1, H + 0.02, -D/3 + i * D/5);
        g.add(grain);
    }

    // Tapered legs
    const legH = H - 0.038;
    const legPositions = [
        [-W/2 + 0.07, -D/2 + 0.07],
        [W/2 - 0.07, -D/2 + 0.07],
        [-W/2 + 0.07, D/2 - 0.07],
        [W/2 - 0.07, D/2 - 0.07],
    ];
    legPositions.forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, legH, 12), wd);
        leg.position.set(x, legH/2, z);
        leg.rotation.z = x > 0 ? -0.03 : 0.03;
        leg.rotation.x = z > 0 ? 0.03 : -0.03;
        g.add(leg);
    });

    // Cross brace
    const brace = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.022, 0.022), wd);
    brace.position.set(0, H * 0.32, 0); g.add(brace);

    // Decorative brackets at leg-to-top junctions
    legPositions.forEach(([x, z]) => {
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.015),
            wd
        );
        bracket.position.set(x, legH - 0.02, z);
        g.add(bracket);
    });

    addShadow(g);
    return g;
}

function buildLamp() {
    const g = new THREE.Group();
    const H = 1.8;
    const mt = mat(0x1a1a1a, { r: 0.1, m: 0.95 });
    const mtBrushed = mat(0x222222, { r: 0.18, m: 0.88 });

    // Weighted circular base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 48), mt);
    base.position.y = 0.015; g.add(base);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.004, 8, 48), mtBrushed);
    baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.03; g.add(baseRing);

    // Pole with subtle taper
    const poleH = H - 0.35;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, poleH, 16), mtBrushed);
    pole.position.y = poleH/2 + 0.03; g.add(pole);

    // Arc arm using curved tube
    const topY = poleH + 0.03;
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, topY, 0),
        new THREE.Vector3(0.06, topY + 0.03, 0),
        new THREE.Vector3(0.18, topY + 0.02, -0.03),
        new THREE.Vector3(0.3, topY - 0.02, -0.1),
        new THREE.Vector3(0.38, topY - 0.06, -0.18),
        new THREE.Vector3(0.42, topY - 0.1, -0.24),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.007, 12, false), mtBrushed);
    g.add(arm);

    const endPt = curve.getPoint(1);

    // Shade - tapered drum shape with ribs
    const shadeMat = mat(0xFFF0E0, {
        r: 0.4, t: true, op: 0.8,
        side: THREE.DoubleSide, e: 0xFFE4B5, ei: 0.2,
    });
    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.16, 0.18, 48, 1, true),
        shadeMat
    );
    shade.position.copy(endPt); g.add(shade);

    // Shade rim (top and bottom rings)
    const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.003, 8, 48), mtBrushed);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.set(endPt.x, endPt.y + 0.09, endPt.z); g.add(rimTop);
    const rimBot = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.003, 8, 48), mtBrushed);
    rimBot.rotation.x = Math.PI / 2;
    rimBot.position.set(endPt.x, endPt.y - 0.09, endPt.z); g.add(rimBot);

    // Inner shade surface
    const innerShade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.158, 0.178, 48, 1, true),
        mat(0xFFF8F0, { t: true, op: 0.1, side: THREE.BackSide })
    );
    innerShade.position.copy(endPt); g.add(innerShade);

    // Bulb
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xFFF5E6 })
    );
    bulb.position.set(endPt.x, endPt.y - 0.04, endPt.z); g.add(bulb);

    // Light source
    const light = new THREE.PointLight(0xFFE4B5, 3, 5, 2);
    light.position.set(endPt.x, endPt.y - 0.04, endPt.z); g.add(light);

    addShadow(g);
    return g;
}

function buildBookshelf() {
    const g = new THREE.Group();
    const W = 0.8, D = 0.3, H = 2.0;
    const wood = mat(0x6B4226, { r: 0.45 });
    const metal = mat(0x1a1a1a, { r: 0.2, m: 0.88 });

    // Side frames (L-shaped steel)
    [-1, 1].forEach(side => {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.025, H, D), metal);
        upright.position.set(side * W/2, H/2, 0); g.add(upright);
        // Front face trim
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.008, H, 0.008), metal);
        trim.position.set(side * W/2, H/2, D/2 - 0.004); g.add(trim);
    });

    // Back panel
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, H - 0.04, 0.008), mat(0x5a3a20, { r: 0.6 }));
    backPanel.position.set(0, H/2, -D/2 + 0.004); g.add(backPanel);

    const bookColors = [0x8B0000, 0x00008B, 0x006400, 0x8B4513, 0x4B0082, 0xB8860B, 0x2F4F4F, 0x800020, 0x003366, 0x556B2F];
    const numShelves = 5;
    for (let i = 0; i <= numShelves; i++) {
        const y = i * H / numShelves;
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, 0.016, D), wood);
        shelf.position.y = y; g.add(shelf);

        // Shelf brackets
        if (i > 0) {
            [-1, 1].forEach(side => {
                const bracket = new THREE.Mesh(
                    new THREE.BoxGeometry(0.03, 0.002, 0.03),
                    metal
                );
                bracket.position.set(side * (W/2 - 0.025), y - 0.009, D/2 - 0.02);
                g.add(bracket);
            });
        }

        if (i < numShelves) {
            let xP = -W/2 + 0.04;
            while (xP < W/2 - 0.06) {
                const bW = 0.016 + Math.random() * 0.028;
                const bH = 0.06 + Math.random() * 0.1;
                const c = bookColors[Math.floor(Math.random() * bookColors.length)];
                const bookMat = mat(c, { r: 0.75 + Math.random() * 0.15 });
                const book = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, D * 0.78), bookMat);
                book.position.set(xP + bW/2, y + 0.016 + bH/2, 0);
                g.add(book);

                // Book spine line
                if (bW > 0.02) {
                    const spine = new THREE.Mesh(
                        new THREE.BoxGeometry(0.001, bH * 0.3, D * 0.78),
                        mat(0xffffff, { r: 0.5, op: 0.15, t: true })
                    );
                    spine.position.set(xP + bW/2, y + 0.016 + bH * 0.7, 0);
                    g.add(spine);
                }

                xP += bW + 0.002;
                if (Math.random() < 0.15) xP += 0.02; // gap
            }
        }
    }

    addShadow(g);
    return g;
}

function buildPendant() {
    const g = new THREE.Group();
    const H = 0.4;
    const metal = mat(0xD4A843, { r: 0.1, m: 0.96 });

    // Suspension rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 8), metal);
    rod.position.y = H/2 + 0.3; g.add(rod);

    // Canopy (ceiling mount)
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 32), metal);
    canopy.position.y = H/2 + 0.6 - 0.0075; g.add(canopy);

    // Socket
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.04, 16), metal);
    socket.position.y = H/2 + 0.02; g.add(socket);

    // Geometric icosahedron glass shade
    const glassMat = mat(0xFFF3CD, {
        r: 0.06, t: true, op: 0.4,
        e: 0xFFF3CD, ei: 0.3, side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glassMat);
    shade.position.y = H/2 - 0.04; g.add(shade);

    // Wireframe overlay for geometric look
    const wireGeom = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.202, 1));
    const wireframe = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({
        color: 0xD4A843, transparent: true, opacity: 0.3
    }));
    wireframe.position.y = H/2 - 0.04; g.add(wireframe);

    // Bulb inside
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xFFF8E1 })
    );
    bulb.position.y = H/2 - 0.04; g.add(bulb);

    // Light
    const light = new THREE.PointLight(0xFFF3CD, 3, 8, 2);
    light.position.y = H/2 - 0.04; g.add(light);

    addShadow(g);
    return g;
}

function buildSideTable() {
    const g = new THREE.Group();
    const R = 0.2, H = 0.55;
    const marble = mat(0xE8DDD0, { r: 0.08, m: 0.02 });
    const mt = mat(0x1a1a1a, { r: 0.15, m: 0.9 });

    // Marble top with veining illusion
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.03, 64), marble);
    top.position.y = H; g.add(top);

    // Marble edge highlight
    const edge = new THREE.Mesh(new THREE.TorusGeometry(R, 0.004, 8, 64), mt);
    edge.rotation.x = Math.PI / 2; edge.position.y = H; g.add(edge);

    // Veining on marble
    for (let i = 0; i < 4; i++) {
        const vein = new THREE.Mesh(
            new THREE.BoxGeometry(R * 1.2, 0.001, 0.002),
            mat(0xCCC0B0, { r: 0.15, t: true, op: 0.3 })
        );
        vein.position.set(
            (Math.random() - 0.5) * R * 0.6,
            H + 0.016,
            (Math.random() - 0.5) * R * 0.6
        );
        vein.rotation.y = Math.random() * Math.PI;
        g.add(vein);
    }

    // Tapered pedestal
    const legH = H - 0.03;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.1, legH, 24), mt);
    leg.position.y = legH/2; g.add(leg);

    // Base plate
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.008, 48), mt);
    base.position.y = 0.004; g.add(base);

    addShadow(g);
    return g;
}

function buildCanvas() {
    const g = new THREE.Group();
    const W = 0.6, H = 0.4;
    const frameMat = mat(0xF5F5F0, { r: 0.35, m: 0.04 });
    const canvasMat = mat(0xC4956A, { r: 0.92 });

    // Frame with depth
    const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, H + 0.04, 0.02), frameMat);
    frame.position.set(0, H/2 + 1, -0.005); g.add(frame);

    // Canvas surface
    const cv = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.008), canvasMat);
    cv.position.set(0, H/2 + 1, 0.006); g.add(cv);

    // Abstract art strokes
    const strokes = [
        { c: 0xA0C4B8, w: 0.18, h: 0.14, x: -0.08, y: 0.04 },
        { c: 0xE8D5A3, w: 0.14, h: 0.12, x: 0.06, y: -0.02 },
        { c: 0xC89070, w: 0.16, h: 0.1, x: -0.02, y: -0.06 },
        { c: 0xD4A080, w: 0.08, h: 0.18, x: 0.1, y: 0.06 },
        { c: 0x8FA898, w: 0.12, h: 0.08, x: -0.12, y: -0.08 },
    ];
    strokes.forEach(s => {
        const stroke = new THREE.Mesh(
            new THREE.BoxGeometry(W * s.w, H * s.h, 0.003),
            mat(s.c, { r: 0.85 })
        );
        stroke.position.set(s.x, H/2 + 1 + s.y, 0.012);
        g.add(stroke);
    });

    // Hanging wire
    const wireMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const pts = [new THREE.Vector3(-0.08, H + 1 + 0.01, -0.01), new THREE.Vector3(0, H + 1 + 0.08, -0.01), new THREE.Vector3(0.08, H + 1 + 0.01, -0.01)];
    const wireGeom = new THREE.BufferGeometry().setFromPoints(pts);
    g.add(new THREE.Line(wireGeom, wireMat));

    addShadow(g);
    return g;
}

function buildPot() {
    const g = new THREE.Group();
    const R = 0.1, H = 0.25;
    const ceramic = mat(0xE0D5C5, { r: 0.35, m: 0.02 });
    const ceramicDark = mat(0xD0C5B5, { r: 0.4 });
    const soil = mat(0x3E2723, { r: 1.0 });
    const stemMat = mat(0x2E5A1E, { r: 0.55 });

    // Pot body (slightly tapered)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.7, R, H, 48), ceramic);
    pot.position.y = H/2; g.add(pot);

    // Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, 0.008, 8, 48), ceramicDark);
    rim.rotation.x = Math.PI / 2; rim.position.y = H; g.add(rim);

    // Drainage saucer
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.85, R * 0.85, 0.012, 48), ceramicDark);
    saucer.position.y = 0.006; g.add(saucer);

    // Soil surface
    const soilMesh = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.65, R * 0.65, 0.02, 48), soil);
    soilMesh.position.y = H - 0.01; g.add(soilMesh);

    // Main stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.25, 8), stemMat);
    stem.position.y = H + 0.125; g.add(stem);

    // Leaves (monstera-inspired)
    const leaves = [
        { a: 0, t: 0.3, s: 0.14, y: 0.2, sY: 0.35 },
        { a: 1.0, t: 0.25, s: 0.12, y: 0.22, sY: 0.4 },
        { a: 2.2, t: 0.38, s: 0.13, y: 0.18, sY: 0.32 },
        { a: 3.5, t: 0.2, s: 0.1, y: 0.24, sY: 0.38 },
        { a: 4.7, t: 0.3, s: 0.11, y: 0.21, sY: 0.36 },
        { a: 0.5, t: 0.42, s: 0.09, y: 0.26, sY: 0.33 },
        { a: 2.8, t: 0.15, s: 0.08, y: 0.27, sY: 0.3 },
    ];
    const leafMats = [
        mat(0x2E7D32, { r: 0.62 }),
        mat(0x1B5E20, { r: 0.68 }),
        mat(0x388E3C, { r: 0.58 }),
    ];

    leaves.forEach(ld => {
        const leafGeom = new THREE.SphereGeometry(ld.s, 12, 8);
        const leaf = new THREE.Mesh(leafGeom, leafMats[Math.floor(Math.random() * leafMats.length)]);
        leaf.scale.set(1, ld.sY, 0.5);
        leaf.position.set(Math.cos(ld.a) * 0.04, H + ld.y, Math.sin(ld.a) * 0.04);
        leaf.rotation.z = Math.cos(ld.a) * ld.t;
        leaf.rotation.x = Math.sin(ld.a) * ld.t;
        g.add(leaf);

        // Leaf vein
        const veinGeom = new THREE.BoxGeometry(ld.s * 1.4, 0.001, 0.002);
        const vein = new THREE.Mesh(veinGeom, mat(0x256025, { r: 0.7 }));
        vein.position.copy(leaf.position);
        vein.position.y += 0.003;
        vein.rotation.copy(leaf.rotation);
        g.add(vein);
    });

    addShadow(g);
    return g;
}

const builders = {
    'modern-chair': buildChair,
    'coffee-table': buildTable,
    'floor-lamp': buildLamp,
    'bookshelf': buildBookshelf,
    'pendant-light': buildPendant,
    'side-table': buildSideTable,
    'wall-art': buildCanvas,
    'plant-pot': buildPot,
};

const exporter = new GLTFExporter();
let completed = 0;
const total = Object.keys(builders).length;

Object.entries(builders).forEach(([id, buildFn]) => {
    const scene = buildFn();
    scene.updateMatrixWorld(true);
    exporter.parse(scene, (result) => {
        const buffer = Buffer.from(result);
        const outPath = path.join(outDir, `${id}.glb`);
        fs.writeFileSync(outPath, buffer);
        console.log(`${id}.glb — ${(buffer.length / 1024).toFixed(1)} KB`);
        completed++;
        if (completed === total) console.log('\nAll models generated!');
    }, (error) => {
        console.error(`FAILED: ${id}`, error);
        completed++;
    }, { binary: true });
});
