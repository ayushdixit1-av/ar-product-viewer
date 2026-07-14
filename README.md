# AR Product Viewer

A web-based augmented reality product visualization platform that lets users browse furniture products and place true-to-scale 3D models in their real-world environment using WebXR.

## Architecture

```
ar-product-viewer/
├── server.js                # Express server with API proxy
├── index.html               # Single-page application (4 views)
├── js/
│   ├── app.js               # Client-side routing, UI logic, AR controls
│   └── api.js               # API client with offline fallback
├── css/
│   └── style.css            # Dark-themed responsive styles
├── assets/
│   └── models/              # Procedurally generated GLB files
│       ├── modern-chair.glb
│       ├── coffee-table.glb
│       ├── floor-lamp.glb
│       ├── bookshelf.glb
│       ├── pendant-light.glb
│       ├── side-table.glb
│       ├── wall-art.glb
│       └── plant-pot.glb
├── generate-models.js       # Three.js procedural model generator
└── package.json
```

## How It Works

### Frontend (SPA)

The app is a single HTML file with four page sections managed by client-side navigation:

1. **Landing** -- Hero screen with CTA
2. **Catalog** -- Filterable product grid (All / Furniture / Decor / Lighting) with lazy-loaded 3D previews
3. **Product Detail** -- Interactive 3D model viewer + specs, dimensions, and pricing
4. **AR Viewer** -- Full-screen AR experience with screenshot, share, and auto-rotate controls

### 3D Rendering

Uses [Google model-viewer](https://modelviewer.dev/) web component to render GLB models with:

- Camera controls and auto-rotation
- PBR lighting with environment maps
- Shadow casting
- WebXR AR activation (ARCore on Android, ARKit on iOS)

### Procedural Model Generation (`generate-models.js`)

All 8 furniture models are generated entirely in code using Three.js -- no Blender or external 3D tools.

```
JavaScript → Three.js Geometry/Materials → Scene Graph → GLTFExporter → .glb
```

Each model is built from mathematical primitives:

| Model | Technique |
|-------|-----------|
| Chair | Box/Cylinder/Sphere geometries with PBR fabric and walnut materials |
| Coffee Table | Rounded box top via ExtrudeGeometry, tapered legs, cross-brace |
| Floor Lamp | CatmullRomCurve3 + TubeGeometry for curved arm, emissive shade |
| Bookshelf | Iterative book generation with random width/height/color |
| Pendant Light | IcosahedronGeometry with wireframe overlay for geometric glass |
| Side Table | CylinderGeometry marble top with procedural vein lines |
| Wall Art | Abstract strokes on canvas with hanging wire |
| Plant Pot | Scaled SphereGeometry leaves (monstera-inspired) |

### Backend (`server.js`)

Minimal Express server on port 3000:

- **Static file serving** -- Serves the SPA from the project root
- **API proxy** -- Proxies `/api/*` requests to `https://cfcrack.co.in` with CORS headers and error fallback
- **SPA fallback** -- All unmatched routes return `index.html`

### API Layer (`api.js`)

`ApiClient` class with graceful degradation:

- Fetches products and AR session data from the backend API
- Falls back to a hardcoded product catalog when the API is unreachable
- Tracks AR sessions and captures via POST endpoints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js, Express, http-proxy-middleware |
| Frontend | Vanilla JS (ES Modules), HTML5, CSS3 |
| 3D Rendering | Google model-viewer 3.3.0 |
| Model Generation | Three.js r160, GLTFExporter |
| AR | WebXR (immersive-ar), ARCore, ARKit, Scene Viewer, Quick Look |

## Getting Started

```bash
# Install dependencies
npm install

# Generate 3D models (creates assets/models/*.glb)
node generate-models.js

# Start server
npm start
```

The app runs at `http://localhost:3000`.

### AR Requirements

- **Android** -- Chrome with ARCore support
- **iOS** -- Safari with ARKit support
- Desktop browsers get 3D preview only (no AR placement)

## Key Concepts

### GLB Format

GLB is the binary variant of glTF (GL Transmission Format) -- the industry standard for 3D on the web. A single `.glb` file contains vertices, normals, UVs, PBR materials, textures, and scene hierarchy. This makes it ideal for web delivery: one file, fast loading, GPU-ready.

### WebXR

The WebXR Device API enables browser-based AR without installing a native app. The flow:

```
requestSession("immersive-ar") → Camera opens → Plane detection →
Hit testing → Furniture placement → Real-time tracking → Render loop
```

### Procedural Modeling

Instead of creating models in Blender, every mesh is defined mathematically:

```javascript
const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.78),
    fabricMaterial
);
scene.add(seat);
```

This approach gives exact real-world dimensions, version control compatibility, and zero dependency on external tools.
