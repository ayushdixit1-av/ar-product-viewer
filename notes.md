# GLB, WebXR, and Procedural 3D Model Development

---

## 1. What is a GLB File?

### Definition

- GLB is the **binary version** of the glTF (GL Transmission Format).
- glTF was developed by the **Khronos Group** (the organization behind OpenGL and Vulkan) to efficiently transmit and load 3D scenes and models.
- Think of GLB as the **JPEG or PNG of the 3D world**.
  - Just as a PNG stores an image, a GLB stores an entire 3D model.

### Difference between glTF and GLB

**glTF**
```
chair.gltf
chair.bin
wood.png
fabric.png
```
Multiple files are needed.

**GLB**
```
chair.glb
```
Everything is packed into a single binary file. This makes deployment much easier.

### What does a GLB file contain?

A GLB stores almost everything required to reconstruct a 3D object.

```
GLB File
│
├── Vertices
├── Normals
├── UV Coordinates
├── Materials
├── Textures
├── Cameras
├── Lights
├── Meshes
├── Animations
├── Scene Graph
└── Metadata
```

### Internal Structure of a GLB

A GLB has three major sections.

```
GLB
│
├── Header
├── JSON Chunk
└── Binary Chunk
```

**Header**
- Magic Number
- Version
- Total File Size

**JSON Chunk**
- Nodes
- Materials
- Meshes
- Animations
- Scene Hierarchy

Example:
```json
{
    "nodes": [...],
    "meshes": [...],
    "materials": [...]
}
```

**Binary Chunk**
- Vertices
- Indices
- Normals
- Textures
- Animation Data

This is why GLB loads much faster than OBJ.

### Why use GLB?

Instead of using OBJ + MTL + Textures + Materials separately, GLB offers:
- Single file
- Faster loading
- Smaller size
- Industry standard
- Native Three.js support
- Supports physically based rendering (PBR)

### How was the GLB created?

No Blender was used. The entire furniture was generated mathematically.

```
JavaScript → Three.js → Geometry → Mesh → Scene → GLTFExporter → chair.glb
```

Example — Seat:
```javascript
const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.78),
    fabricMaterial
);
```
This code creates vertices, triangles, and normals automatically.

Then:
```javascript
scene.add(seat);
```
adds it into the scene graph.

Finally:
```javascript
const exporter = new GLTFExporter();
exporter.parse(scene, callback, { binary: true });
```
creates `chair.glb`.

### How GLTFExporter Works Internally

```
Three.js Scene
│
├── Geometry
├── Mesh
├── Material
├── Lights
└── Cameras
        │
        ▼
    GLTFExporter
        │
        ▼
    Collect Objects
        │
        ▼
    Serialize Data
        │
        ▼
    Generate JSON
        │
        ▼
    Generate Binary Buffers
        │
        ▼
    Merge
        │
        ▼
    chair.glb
```

### Why Node.js Needed Blob Polyfill?

- GLTFExporter was originally written for browsers.
- Internally it calls `new Blob(...)` and `FileReader`.
- Node.js doesn't have these browser APIs.
- Therefore, `blob-polyfill` was used and a custom `FileReader` implementation was created.
- That allowed GLTFExporter to work inside Node.js.

---

## 2. What is WebXR?

### Definition

- WebXR is a browser API that allows web applications to create **Virtual Reality (VR)** and **Augmented Reality (AR)** without installing a native application.
- It provides:
  - Camera access
  - Motion tracking
  - Device pose
  - Plane detection
  - Hit testing
  - Anchors
  - Render loop

### Why use WebXR?

Instead of developing an Android or iOS app, WebXR enables **browser-based AR**.

**Advantages:**
- No installation
- Runs on compatible browsers
- Cross-platform
- Easy deployment

### Complete WebXR Workflow

```
User
↓
Open Website
↓
Click View in AR
↓
navigator.xr
↓
requestSession()
↓
Camera Opens
↓
Room Scan
↓
Plane Detection
↓
Hit Testing
↓
Furniture Placement
↓
Continuous Tracking
```

### requestSession()

```javascript
navigator.xr.requestSession("immersive-ar");
```

This tells the browser: "I want an AR experience."

### Reference Space

```javascript
session.requestReferenceSpace('local-floor');
```

Reference Space defines the origin (X, Y, Z). The floor becomes `Y = 0`.

### Hit Testing

Suppose the phone points toward the floor. WebXR casts an invisible ray:

```
Camera
  ↓
  ↓
  ↓
Floor
```

It calculates the **Intersection Point**, which becomes `chair.position`.

### Pose

Hit testing returns:
- **Position** — e.g., `(2.1, 0, -3.4)`
- **Rotation** — Quaternion

**Why is Pose Important?**
Without Pose, Three.js wouldn't know where to place the furniture.

### Render Loop

Instead of `requestAnimationFrame()`, WebXR uses `session.requestAnimationFrame()` because camera tracking and rendering must remain synchronized.

---

## 3. How Models Were Developed Using Code

This is called **Procedural Modeling** — generating models using mathematical primitives instead of manually creating them.

### Traditional Workflow

```
Blender → Model → Export → GLB
```

### Procedural Workflow

```
JavaScript → Three.js → Geometry → Meshes → Materials → Scene → Export → GLB
```

### Every Model Starts Like This

```javascript
const group = new THREE.Group();
```

A Group acts like a folder. Everything belonging to one chair is stored inside it.

### Materials

```javascript
const wood = new THREE.MeshStandardMaterial({
    color: 0x6B4226
});
```

**Why MeshStandardMaterial?** Because GLB supports Physically Based Rendering (PBR).

### Chair Example

The chair consists of many meshes:

```
Chair
│
├── Seat
├── Cushion
├── Back
├── Legs
├── Armrests
└── Buttons
```

**Seat:**
```javascript
new THREE.BoxGeometry(0.72, 0.08, 0.78);
```
Creates 8 vertices, 12 triangles, 6 faces.

**Cushion:** Another box placed slightly above the seat.

**Legs:** Used `CylinderGeometry` because real chair legs are tapered (top radius, bottom radius, height).

**Armrests:** `BoxGeometry` translated to both sides.

**Tufting Buttons:** `SphereGeometry` placed in a 2×3 grid to create upholstery look.

### Lamp

Instead of a straight pipe, a curved arm was created using:
- `CatmullRomCurve3` — defines the curve
- `TubeGeometry` — wraps a tube around the curve

Result: **Curved Metal Pipe**

### Bookshelf

Books were generated using `while(...)`:
- Each book received random height, width, and color
- Creates natural variation

### Plant

Leaves used `SphereGeometry` scaled to:
- X = 1
- Y = 0.35
- Z = 0.5

Making spheres look like leaves.

### Marble Table

Instead of textures, veins were procedurally generated using thin rotated boxes. Every execution produces slightly different marble.

### Why Procedural Modeling?

**Advantages:**
- Exact dimensions
- Easily editable
- Small source code
- No external software
- Automatic regeneration
- Version control friendly

---

## Complete Pipeline

```
Design Furniture
↓
Decide Dimensions
↓
Create Materials
↓
Create Geometry
↓
Create Meshes
↓
Position Meshes
↓
Add to Group
↓
Add Group to Scene
↓
Export GLB
↓
Website Loads GLB
↓
WebXR Starts
↓
Camera Opens
↓
Floor Detection
↓
Hit Testing
↓
Furniture Placed
↓
User Walks Around
↓
Real-Time Rendering
```
