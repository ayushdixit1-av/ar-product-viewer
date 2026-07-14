const API_BASE = '';

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async getProducts(category = 'all') {
        try {
            const data = await this.request(`/api/products?category=${category}`);
            return data;
        } catch {
            return this.getFallbackProducts(category);
        }
    }

    async getProduct(id) {
        try {
            const data = await this.request(`/api/products/${id}`);
            return data;
        } catch {
            return this.getFallbackProducts().find(p => p.id === id);
        }
    }

    async trackARSession(sessionData) {
        try {
            return await this.request('/api/ar-sessions', {
                method: 'POST',
                body: JSON.stringify(sessionData),
            });
        } catch {
            console.warn('AR session tracking unavailable');
            return null;
        }
    }

    async sendCaptureImage(imageData) {
        try {
            return await this.request('/api/ar-captures', {
                method: 'POST',
                body: JSON.stringify({ image: imageData, timestamp: Date.now() }),
            });
        } catch {
            console.warn('Capture upload unavailable');
            return null;
        }
    }

    getFallbackProducts(category = 'all') {
        const products = [
            {
                id: 'modern-chair',
                name: 'Modern Lounge Chair',
                price: 349.99,
                category: 'furniture',
                emoji: '🪑',
                description: 'Mid-century modern lounge chair with premium fabric upholstery and solid wood legs. Perfect for living rooms and reading nooks.',
                specs: {
                    material: 'Fabric & Walnut',
                    weight: '12 kg',
                    color: 'Charcoal Grey',
                    assembly: 'Required'
                },
                dimensions: { width: 72, depth: 78, height: 82 }
            },
            {
                id: 'coffee-table',
                name: 'Walnut Coffee Table',
                price: 279.99,
                category: 'furniture',
                emoji: '☕',
                description: 'Elegant coffee table crafted from solid walnut with a natural oil finish. Minimalist design that complements any living space.',
                specs: {
                    material: 'Solid Walnut',
                    weight: '18 kg',
                    finish: 'Natural Oil',
                    shape: 'Rectangle'
                },
                dimensions: { width: 120, depth: 60, height: 42 }
            },
            {
                id: 'floor-lamp',
                name: 'Arc Floor Lamp',
                price: 199.99,
                category: 'lighting',
                emoji: '💡',
                description: 'Contemporary arc floor lamp with adjustable arm and warm LED light. Creates the perfect ambient glow.',
                specs: {
                    material: 'Metal & Glass',
                    weight: '6 kg',
                    wattage: '12W LED',
                    height: '180 cm'
                },
                dimensions: { width: 30, depth: 30, height: 180 }
            },
            {
                id: 'bookshelf',
                name: 'Modular Bookshelf',
                price: 449.99,
                category: 'furniture',
                emoji: '📚',
                description: '5-tier modular bookshelf with steel frame and reclaimed wood shelves. Industrial chic design.',
                specs: {
                    material: 'Steel & Reclaimed Wood',
                    weight: '32 kg',
                    shelves: '5 tiers',
                    capacity: '80 kg total'
                },
                dimensions: { width: 80, depth: 30, height: 200 }
            },
            {
                id: 'pendant-light',
                name: 'Geometric Pendant',
                price: 159.99,
                category: 'lighting',
                emoji: '✨',
                description: 'Geometric brass pendant light with frosted glass shade. A statement piece for dining areas.',
                specs: {
                    material: 'Brass & Frosted Glass',
                    weight: '3 kg',
                    wattage: '9W LED',
                    cord: 'Adjustable 150cm'
                },
                dimensions: { width: 35, depth: 35, height: 40 }
            },
            {
                id: 'side-table',
                name: 'Marble Side Table',
                price: 189.99,
                category: 'furniture',
                emoji: '🪨',
                description: 'Round side table with genuine marble top and matte black steel base. Luxurious accent piece.',
                specs: {
                    material: 'Marble & Steel',
                    weight: '10 kg',
                    top: 'Genuine Marble',
                    base: 'Matte Black'
                },
                dimensions: { width: 40, depth: 40, height: 55 }
            },
            {
                id: 'wall-art',
                name: 'Abstract Canvas Set',
                price: 129.99,
                category: 'decor',
                emoji: '🎨',
                description: 'Set of 3 abstract canvas prints in earth tones. Gallery-wrapped and ready to hang.',
                specs: {
                    material: 'Canvas & Pine',
                    weight: '2.5 kg total',
                    sizes: '40x60cm each',
                    frames: 'Included'
                },
                dimensions: { width: 60, depth: 3, height: 40 }
            },
            {
                id: 'plant-pot',
                name: 'Ceramic Plant Pot',
                price: 49.99,
                category: 'decor',
                emoji: '🪴',
                description: 'Handcrafted ceramic planter with drainage hole and bamboo saucer. Perfect for indoor plants.',
                specs: {
                    material: 'Ceramic & Bamboo',
                    weight: '1.8 kg',
                    diameter: '20 cm',
                    drainage: 'Yes'
                },
                dimensions: { width: 20, depth: 20, height: 25 }
            }
        ];

        if (category !== 'all') {
            return products.filter(p => p.category === category);
        }
        return products;
    }
}

const api = new ApiClient(API_BASE);

export default api;
