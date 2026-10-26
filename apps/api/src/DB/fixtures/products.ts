import type { Product } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

type CategorySeed = {
    slug: string;
    price: [number, number];
    tags: string[];
    blurbs: string[];
    items: [brand: string, model: string][];
};

const CATEGORIES: CategorySeed[] = [
    {
        slug: 'smartphones',
        price: [149, 1299],
        tags: ['mobile', 'electronics', '5g'],
        blurbs: ['a bright OLED display', 'all-day battery life', 'a dual-lens camera system', 'fast wireless charging', 'water and dust resistance'],
        items: [
            ['Lumio', 'Nova X5 Smartphone'], ['Lumio', 'Nova X5 Pro Smartphone'], ['Lumio', 'Lite 3 Smartphone'], ['Vexa', 'Edge 12 Smartphone'],
            ['Vexa', 'Edge 12 Mini Smartphone'], ['Vexa', 'Fold Z Smartphone'], ['Orbitel', 'One Smartphone'], ['Orbitel', 'One Plus Smartphone'],
            ['Orbitel', 'Rugged R2 Smartphone'], ['Lumio', 'Flip Compact Phone'],
        ],
    },
    {
        slug: 'laptops',
        price: [299, 2799],
        tags: ['computers', 'electronics', 'work'],
        blurbs: ['a lightweight aluminum chassis', 'a comfortable backlit keyboard', 'a high-resolution display', 'fast solid-state storage', 'a long-lasting battery'],
        items: [
            ['Kestrel', 'Air 14 Laptop'], ['Kestrel', 'Air 16 Laptop'], ['Kestrel', 'Pro 16 Workstation Laptop'], ['Arcbook', 'Slim 13 Laptop'],
            ['Arcbook', 'Studio 15 Laptop'], ['Arcbook', 'Go 12 Chromebook'], ['Corvid', 'Blade 15 Gaming Laptop'], ['Corvid', 'Blade 17 Gaming Laptop'],
            ['Corvid', 'Flex 14 2-in-1 Laptop'], ['Kestrel', 'Student 15 Laptop'],
        ],
    },
    {
        slug: 'tablets',
        price: [99, 1199],
        tags: ['electronics', 'reading', 'mobile'],
        blurbs: ['a glare-free screen', 'stylus support', 'weeks of standby time', 'a slim, portable design', 'a kid-friendly protective case'],
        items: [
            ['Lumio', 'Tab 11'], ['Lumio', 'Tab 11 Pro'], ['Lumio', 'Tab Mini 8'], ['Paperleaf', 'E-Ink Reader 7'], ['Paperleaf', 'Note 10 E-Ink Tablet'],
            ['Vexa', 'Pad 12'], ['Vexa', 'Pad Kids Edition'], ['Vexa', 'Pad Ultra 14'], ['Orbitel', 'Slate 10'], ['Paperleaf', 'Color Reader 8'],
        ],
    },
    {
        slug: 'audio',
        price: [19, 449],
        tags: ['music', 'electronics', 'wireless'],
        blurbs: ['active noise cancellation', 'rich, balanced sound', 'Bluetooth multipoint pairing', 'a splash-proof design', 'a built-in microphone'],
        items: [
            ['Sonora', 'Studio Wireless Headphones'], ['Sonora', 'Buds Pro Earbuds'], ['Sonora', 'Buds Lite Earbuds'], ['Wavecraft', 'Boom Portable Speaker'],
            ['Wavecraft', 'Soundbar 300'], ['Wavecraft', 'Mini Speaker'], ['Hummingbird', 'Open-Ear Sport Headphones'], ['Hummingbird', 'Kids Headphones'],
            ['Sonora', 'Noise-Cancelling Headphones'], ['Wavecraft', 'USB Podcast Microphone'],
        ],
    },
    {
        slug: 'wearables',
        price: [29, 599],
        tags: ['fitness', 'health', 'electronics'],
        blurbs: ['heart-rate monitoring', 'sleep tracking', 'built-in GPS', 'a week of battery life', 'swim-proof construction'],
        items: [
            ['Pulsefit', 'Band 5 Fitness Tracker'], ['Pulsefit', 'Band 5 Plus Fitness Tracker'], ['Pulsefit', 'Sleep Ring'], ['Lumio', 'Watch Series 3'],
            ['Lumio', 'Watch Series 3 LTE'], ['Trailmark', 'Explorer GPS Watch'], ['Trailmark', 'Summit Solar Watch'], ['Pulsefit', 'Kids Activity Tracker'],
            ['Lumio', 'Watch Sport Strap'], ['Trailmark', 'Heart Rate Chest Strap'],
        ],
    },
    {
        slug: 'kitchen-accessories',
        price: [9, 249],
        tags: ['kitchen', 'cooking', 'home'],
        blurbs: ['dishwasher-safe materials', 'an ergonomic grip', 'even heat distribution', 'a durable stainless finish', 'easy-to-clean surfaces'],
        items: [
            ['Copperline', "Chef's Knife 8in"], ['Copperline', 'Nonstick Frying Pan 10in'], ['Hearthware', 'Cast Iron Skillet'], ['Hearthware', 'Dutch Oven 5qt'],
            ['Brewster', 'Pour-Over Coffee Kit'], ['Brewster', 'Burr Coffee Grinder'], ['Copperline', 'Bamboo Cutting Board'], ['Hearthware', 'Silicone Spatula Set'],
            ['Brewster', 'Electric Gooseneck Kettle'], ['Copperline', 'Stainless Mixing Bowls'],
        ],
    },
    {
        slug: 'furniture',
        price: [39, 1899],
        tags: ['home', 'furniture', 'interior'],
        blurbs: ['sustainably sourced wood', 'a minimalist Scandinavian design', 'tool-free assembly', 'stain-resistant upholstery', 'a sturdy steel frame'],
        items: [
            ['Oakhaven', 'Solid Oak Dining Table'], ['Oakhaven', 'Bench Seat'], ['Nordlys', 'Lounge Chair'], ['Nordlys', '3-Seat Sofa'],
            ['Loftline', 'Standing Desk'], ['Loftline', 'Ergonomic Office Chair'], ['Oakhaven', 'Bookshelf 5-Tier'], ['Nordlys', 'Bedside Table'],
            ['Loftline', 'Wall Shelf Set'], ['Nordlys', 'Coffee Table'],
        ],
    },
    {
        slug: 'groceries',
        price: [1, 25],
        tags: ['food', 'pantry', 'organic'],
        blurbs: ['sourced from local farms', 'no artificial additives', 'a resealable package', 'a rich, natural flavor', 'certified organic ingredients'],
        items: [
            ['Greenfield', 'Organic Bananas (1kg)'], ['Greenfield', 'Baby Spinach 200g'], ['Harvest & Co', 'Extra Virgin Olive Oil 500ml'],
            ['Harvest & Co', 'Basmati Rice 2kg'], ['Morning Mill', 'Rolled Oats 1kg'], ['Morning Mill', 'Whole Grain Bread'], ['Greenfield', 'Free-Range Eggs (12)'],
            ['Harvest & Co', 'Dark Roast Coffee Beans 500g'], ['Morning Mill', 'Honey Granola'], ['Greenfield', 'Almond Milk 1L'],
        ],
    },
    {
        slug: 'beauty',
        price: [6, 89],
        tags: ['skincare', 'beauty', 'cosmetics'],
        blurbs: ['a lightweight, non-greasy texture', 'dermatologist-tested ingredients', 'a fragrance-free formula', 'long-lasting color', 'vegan and cruelty-free ingredients'],
        items: [
            ['Lumina Skin', 'Hydrating Serum'], ['Lumina Skin', 'Daily Moisturizer SPF 30'], ['Petalcraft', 'Rose Lip Balm'], ['Petalcraft', 'Matte Lipstick'],
            ['Dewdrop', 'Gentle Foaming Cleanser'], ['Dewdrop', 'Vitamin C Brightening Cream'], ['Lumina Skin', 'Night Repair Cream'], ['Petalcraft', 'Volume Mascara'],
            ['Dewdrop', 'Clay Face Mask'], ['Petalcraft', 'Eyeshadow Palette'],
        ],
    },
    {
        slug: 'sports-accessories',
        price: [5, 299],
        tags: ['sports', 'fitness', 'outdoors'],
        blurbs: ['sweat-resistant materials', 'a non-slip surface', 'a compact, travel-friendly size', 'reinforced stitching', 'quick-dry fabric'],
        items: [
            ['Peakline', 'Yoga Mat 6mm'], ['Peakline', 'Adjustable Dumbbells'], ['Strideon', 'Running Belt'], ['Strideon', 'Trail Running Socks (3 pack)'],
            ['Aquaform', 'Swim Goggles'], ['Aquaform', 'Quick-Dry Towel'], ['Peakline', 'Resistance Bands Set'], ['Strideon', 'Insulated Water Bottle 750ml'],
            ['Peakline', 'Jump Rope'], ['Aquaform', 'Kickboard'],
        ],
    },
];

export const PRODUCT_CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug);

const availability = (stock: number): Product['availabilityStatus'] => (stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock');

export function buildProducts(baseUrl: string): Product[] {
    const random = createRandom(2002);
    const products: Product[] = [];
    let id = 1;

    for (const category of CATEGORIES) {
        for (const [brand, model] of category.items) {
            const [first, second] = random.sample(category.blurbs, 2);
            const title = `${brand} ${model}`;
            const roll = random.next();
            const stock = roll < 0.08 ? 0 : roll < 0.2 ? random.int(1, 9) : random.int(10, 150);
            const price = Math.round(random.float(category.price[0], category.price[1]) * 100) / 100;
            products.push({
                id,
                title,
                description: `The ${title} features ${first} and ${second}. A dependable choice from ${brand}.`,
                category: category.slug,
                brand,
                price: price >= 20 ? Math.floor(price) + 0.99 : price,
                discountPercentage: random.float(0, 25),
                rating: random.float(2.8, 5, 1),
                stock,
                sku: `${category.slug.slice(0, 3).toUpperCase()}-${brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(id).padStart(4, '0')}`,
                tags: [category.tags[0], ...random.sample(category.tags.slice(1), random.int(1, 2))],
                availabilityStatus: availability(stock),
                thumbnail: `${baseUrl}/api/v1/images/products/${id}`,
            });
            id++;
        }
    }
    return products;
}
