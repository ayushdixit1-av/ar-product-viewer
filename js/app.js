import api from './api.js?v=2';

let currentProductId = null;

const PRODUCTS = [
    {
        id: 'modern-chair', name: 'Modern Lounge Chair', price: 349.99, category: 'furniture',
        description: 'Mid-century modern lounge chair with premium fabric upholstery, solid walnut legs, deep cushioning, and button tufting for ultimate comfort.',
        specs: { material: 'Fabric & Walnut', weight: '12 kg', color: 'Charcoal Grey', assembly: 'Required' },
        dimensions: { width: 72, depth: 78, height: 82 },
        model: 'assets/models/modern-chair.glb',
    },
    {
        id: 'coffee-table', name: 'Walnut Coffee Table', price: 279.99, category: 'furniture',
        description: 'Elegant coffee table crafted from solid walnut with natural oil finish, beveled edges, and cross-brace detailing.',
        specs: { material: 'Solid Walnut', weight: '18 kg', finish: 'Natural Oil', shape: 'Rectangle' },
        dimensions: { width: 120, depth: 60, height: 42 },
        model: 'assets/models/coffee-table.glb',
    },
    {
        id: 'floor-lamp', name: 'Arc Floor Lamp', price: 199.99, category: 'lighting',
        description: 'Contemporary arc floor lamp with weighted base, brushed steel arm, frosted drum shade, and warm 2700K LED.',
        specs: { material: 'Brushed Steel & Linen', weight: '7 kg', wattage: '12W LED', height: '180 cm' },
        dimensions: { width: 30, depth: 30, height: 180 },
        model: 'assets/models/floor-lamp.glb',
    },
    {
        id: 'bookshelf', name: 'Industrial Bookshelf', price: 449.99, category: 'furniture',
        description: '5-tier bookshelf with powder-coated steel frame, reclaimed wood shelves, and decorative brackets. Includes back panel.',
        specs: { material: 'Steel & Reclaimed Wood', weight: '34 kg', shelves: '5 tiers', capacity: '80 kg' },
        dimensions: { width: 80, depth: 30, height: 200 },
        model: 'assets/models/bookshelf.glb',
    },
    {
        id: 'pendant-light', name: 'Geometric Pendant', price: 159.99, category: 'lighting',
        description: 'Handcrafted brass pendant with geometric icosahedron frosted glass shade and exposed wireframe detail.',
        specs: { material: 'Brushed Brass & Glass', weight: '3.5 kg', wattage: '9W LED', cord: 'Adjustable 150cm' },
        dimensions: { width: 35, depth: 35, height: 40 },
        model: 'assets/models/pendant-light.glb',
    },
    {
        id: 'side-table', name: 'Marble Side Table', price: 189.99, category: 'furniture',
        description: 'Genuine Carrara marble top with natural veining, matte black tapered pedestal base, and brass edge trim.',
        specs: { material: 'Carrara Marble & Steel', weight: '11 kg', top: 'Genuine Marble', base: 'Matte Black' },
        dimensions: { width: 40, depth: 40, height: 55 },
        model: 'assets/models/side-table.glb',
    },
    {
        id: 'wall-art', name: 'Abstract Canvas Set', price: 129.99, category: 'decor',
        description: 'Gallery-wrapped abstract canvas in earth tones with pine stretcher bars and hanging wire. Ready to hang.',
        specs: { material: 'Canvas & Pine', weight: '2.5 kg', size: '60×40 cm', hanging: 'Wire included' },
        dimensions: { width: 60, depth: 3, height: 40 },
        model: 'assets/models/wall-art.glb',
    },
    {
        id: 'plant-pot', name: 'Ceramic Plant Pot', price: 49.99, category: 'decor',
        description: 'Handcrafted ceramic planter with drainage, matching bamboo saucer, and faux monstera plant.',
        specs: { material: 'Ceramic & Bamboo', weight: '2 kg', diameter: '20 cm', includes: 'Faux plant' },
        dimensions: { width: 20, depth: 20, height: 25 },
        model: 'assets/models/plant-pot.glb',
    },
];

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'catalog') renderCatalog();
}
window.navigateTo = navigateTo;

function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCatalog(category);
}
window.filterProducts = filterProducts;

let catalogObserver = null;

function renderCatalog(category = 'all') {
    const grid = document.getElementById('product-grid');
    const filtered = category === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);
    grid.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="selectProduct('${p.id}')">
            <div class="product-card-image">
                <model-viewer
                    data-src="${p.model}"
                    alt="${p.name}"
                    camera-controls
                    auto-rotate
                    rotation-per-second="25deg"
                    camera-orbit="40deg 60deg 2.2m"
                    min-camera-orbit="auto auto 1.2m"
                    max-camera-orbit="auto auto 4m"
                    shadow-intensity="0.6"
                    environment-image="neutral"
                    exposure="1.0"
                    interaction-prompt="none"
                    loading="lazy"
                    style="width:100%;height:100%;background:transparent;"
                ></model-viewer>
                <span class="ar-badge">AR</span>
            </div>
            <div class="product-card-info">
                <div class="product-card-name">${p.name}</div>
                <div class="product-card-price">$${p.price.toFixed(2)}</div>
            </div>
        </div>
    `).join('');

    if (catalogObserver) catalogObserver.disconnect();
    catalogObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const mv = entry.target;
                if (mv.dataset.src && !mv.getAttribute('src')) {
                    mv.setAttribute('src', mv.dataset.src);
                    mv.removeAttribute('data-src');
                }
                catalogObserver.unobserve(mv);
            }
        });
    }, { rootMargin: '200px' });
    grid.querySelectorAll('model-viewer[data-src]').forEach(mv => catalogObserver.observe(mv));
}

function selectProduct(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    currentProductId = id;

    document.getElementById('detail-title').textContent = product.name;
    document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detail-description').textContent = product.description;
    document.getElementById('detail-specs').innerHTML = Object.entries(product.specs).map(([k, v]) => `
        <div class="spec-item"><div class="spec-label">${k}</div><div class="spec-value">${v}</div></div>
    `).join('');
    const d = product.dimensions;
    document.getElementById('detail-dimensions').innerHTML = `
        <div class="dim-title">Real-World Dimensions</div>
        <div class="dim-values">W: <span>${d.width} cm</span> &nbsp; D: <span>${d.depth} cm</span> &nbsp; H: <span>${d.height} cm</span></div>
    `;

    const mv = document.getElementById('detail-model-viewer');
    mv.src = product.model;
    mv.alt = product.name;
    mv.setAttribute('camera-orbit', '40deg 65deg 2.5m');

    navigateTo('product-detail');
}
window.selectProduct = selectProduct;

function launchAR() {
    const product = PRODUCTS.find(p => p.id === currentProductId);
    if (!product) return;
    navigateTo('ar-viewer');
    initAR(product);
}
window.launchAR = launchAR;

let arAutoRotating = false;

function initAR(product) {
    document.getElementById('ar-product-name').textContent = product.name;
    const mv = document.getElementById('ar-model-viewer');
    mv.src = product.model;
    mv.alt = product.name;
    mv.autoRotate = false;
    arAutoRotating = false;

    const label = document.getElementById('ar-main-label');
    if (mv.canActivateAR) {
        label.textContent = 'View in Your Room';
    } else {
        label.textContent = '3D View Only';
    }

    api.trackARSession({ productId: product.id, action: 'loaded', timestamp: Date.now() }).catch(() => {});
}

function exitAR() {
    const mv = document.getElementById('ar-model-viewer');
    mv.src = '';
    navigateTo('product-detail');
}
window.exitAR = exitAR;

function arActivateNativeAR() {
    const mv = document.getElementById('ar-model-viewer');
    if (mv.canActivateAR) {
        mv.activateAR();
    } else {
        showToast('AR requires a supported mobile device (Android with ARCore or iOS with ARKit)');
    }
}
window.arActivateNativeAR = arActivateNativeAR;

function toggleAutoRotate() {
    const mv = document.getElementById('ar-model-viewer');
    arAutoRotating = !arAutoRotating;
    mv.autoRotate = arAutoRotating;
    mv.rotationPerSecond = arAutoRotating ? '30deg' : '0deg';
}
window.toggleAutoRotate = toggleAutoRotate;

function arScreenshot() {
    const mv = document.getElementById('ar-model-viewer');
    try {
        const dataUrl = mv.toDataURL();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `ar-${currentProductId || 'product'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Screenshot saved!');
    } catch (e) {
        showToast('Could not capture — try after model loads');
    }
}
window.arScreenshot = arScreenshot;

function arShare() {
    if (navigator.share) {
        navigator.share({ title: 'AR Product View', text: 'Check out this product in AR!', url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!'));
    }
}
window.arShare = arShare;

function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
});
