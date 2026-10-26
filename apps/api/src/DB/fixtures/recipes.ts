import type { Recipe } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

type Method = 'pasta' | 'salad' | 'curry' | 'stirfry' | 'grill' | 'bake' | 'breakfast' | 'dessert' | 'skillet' | 'nocook' | 'soup';

type RecipeSeed = {
    name: string;
    cuisine: string;
    mealType: Recipe['mealType'];
    difficulty: Recipe['difficulty'];
    tags: string[];
    ingredients: string[];
    method?: Method;
    steps?: string[];
};

const TEMPLATES: Record<Method, string[]> = {
    pasta: [
        'Bring a large pot of salted water to a boil.',
        'Cook the {main} until al dente, then reserve a cup of the cooking water.',
        'Meanwhile, gently cook the remaining ingredients in olive oil over medium heat.',
        'Toss the drained {main} with the sauce, adding cooking water as needed.',
        'Serve immediately, topped with {last}.',
    ],
    salad: [
        'Wash and prepare the {main}.',
        'Chop the remaining ingredients into bite-sized pieces.',
        'Whisk together a simple dressing in a small bowl.',
        'Toss everything together just before serving.',
        'Finish with {last} and serve.',
    ],
    curry: [
        'Heat oil in a deep pan and cook the onion until golden.',
        'Add the garlic, ginger, and spices and cook for one minute until fragrant.',
        'Add the {main} and stir to coat in the spices.',
        'Pour in the liquid ingredients and simmer for 20 minutes.',
        'Stir in the {last}, simmer for 2 more minutes, and serve with rice.',
    ],
    stirfry: [
        'Prepare the {main} and cut the vegetables into even pieces.',
        'Heat a wok or large skillet over high heat with a little oil.',
        'Stir-fry the {main} for 3-4 minutes until lightly browned.',
        'Add the remaining ingredients and sauce, tossing until everything is coated and hot.',
        'Serve hot, topped with {last}.',
    ],
    grill: [
        'Marinate the {main} for at least 30 minutes.',
        'Preheat a grill or grill pan to medium-high heat.',
        'Grill the {main} for 4-6 minutes per side until cooked through.',
        'Let it rest for a few minutes, then slice.',
        'Serve with the {last}.',
    ],
    bake: [
        'Preheat the oven to 190°C (375°F).',
        'Prepare the {main} and place it in a baking dish.',
        'Combine the remaining ingredients and add them to the dish.',
        'Bake for 25-35 minutes until golden and cooked through.',
        'Rest for five minutes before serving.',
    ],
    breakfast: [
        'Whisk the {main} together with the wet ingredients until smooth.',
        'Heat a lightly buttered non-stick pan over medium heat.',
        'Cook in batches until golden on both sides.',
        'Keep warm in a low oven while you cook the rest.',
        'Serve with {last}.',
    ],
    dessert: [
        'Preheat the oven to 175°C (350°F) and line a tray or tin.',
        'Cream the butter and sugar until light and fluffy.',
        'Beat in the eggs, then fold in the dry ingredients.',
        'Gently fold in the {main}.',
        'Bake for 20-30 minutes until set, then cool before serving.',
    ],
    skillet: [
        'Heat a skillet over medium-high heat with a little oil.',
        'Cook the {main} until browned and cooked through.',
        'Add the remaining filling ingredients and cook for 2 more minutes.',
        'Warm the tortillas while the filling finishes.',
        'Assemble and serve with {last}.',
    ],
    nocook: [
        'Prepare and slice all of the ingredients.',
        'Combine the {main} with the remaining ingredients.',
        'Season to taste with salt, pepper, or a squeeze of citrus.',
        'Serve right away, finished with {last}.',
    ],
    soup: [
        'Heat oil in a large pot and gently cook the aromatics until soft.',
        'Add the {main} and stir for two minutes.',
        'Pour in the stock or liquid and bring to a gentle simmer.',
        'Cook for 20-25 minutes until everything is tender.',
        'Season to taste and serve hot with {last}.',
    ],
};

const RECIPES: RecipeSeed[] = [
    {
        name: 'Classic Margherita Pizza', cuisine: 'Italian', mealType: ['Dinner'], difficulty: 'Medium', tags: ['pizza', 'vegetarian'],
        ingredients: ['pizza dough', 'tomato sauce', 'fresh mozzarella', 'fresh basil', 'olive oil', 'salt'],
        steps: [
            'Preheat the oven to its highest setting with a tray or pizza stone inside.',
            'Stretch the pizza dough into a thin round on a floured surface.',
            'Spread a thin layer of tomato sauce and tear the mozzarella over the top.',
            'Bake for 8-10 minutes until the crust is blistered and the cheese is bubbling.',
            'Finish with fresh basil and a drizzle of olive oil.',
        ],
    },
    { name: 'Spaghetti Aglio e Olio', cuisine: 'Italian', mealType: ['Dinner'], difficulty: 'Easy', tags: ['pasta', 'vegetarian', 'quick'], method: 'pasta', ingredients: ['spaghetti', 'garlic', 'olive oil', 'red pepper flakes', 'parsley', 'parmesan'] },
    { name: 'Creamy Mushroom Pasta', cuisine: 'Italian', mealType: ['Lunch', 'Dinner'], difficulty: 'Easy', tags: ['pasta', 'vegetarian'], method: 'pasta', ingredients: ['penne', 'mushrooms', 'cream', 'garlic', 'parmesan', 'fresh thyme'] },
    { name: 'Chicken Tikka Masala', cuisine: 'Indian', mealType: ['Dinner'], difficulty: 'Medium', tags: ['curry', 'chicken'], method: 'curry', ingredients: ['chicken thighs', 'tomato puree', 'yogurt', 'onion', 'garlic', 'ginger', 'garam masala', 'cream'] },
    { name: 'Chickpea Spinach Curry', cuisine: 'Indian', mealType: ['Lunch', 'Dinner'], difficulty: 'Easy', tags: ['curry', 'vegan', 'vegetarian'], method: 'curry', ingredients: ['chickpeas', 'curry powder', 'onion', 'garlic', 'ginger', 'coconut milk', 'spinach'] },
    { name: 'Vegetable Fried Rice', cuisine: 'Chinese', mealType: ['Lunch', 'Dinner'], difficulty: 'Easy', tags: ['rice', 'vegetarian', 'quick'], method: 'stirfry', ingredients: ['cooked rice', 'frozen peas', 'carrots', 'eggs', 'soy sauce', 'spring onions'] },
    { name: 'Beef and Broccoli Stir-Fry', cuisine: 'Chinese', mealType: ['Dinner'], difficulty: 'Medium', tags: ['beef', 'quick'], method: 'stirfry', ingredients: ['flank steak', 'broccoli', 'soy sauce', 'garlic', 'ginger', 'oyster sauce', 'sesame seeds'] },
    { name: 'Kung Pao Tofu', cuisine: 'Chinese', mealType: ['Dinner'], difficulty: 'Medium', tags: ['tofu', 'vegan', 'spicy'], method: 'stirfry', ingredients: ['firm tofu', 'dried chilies', 'bell pepper', 'soy sauce', 'rice vinegar', 'roasted peanuts'] },
    { name: 'Chicken Teriyaki Bowl', cuisine: 'Japanese', mealType: ['Lunch', 'Dinner'], difficulty: 'Easy', tags: ['chicken', 'rice bowl'], method: 'grill', ingredients: ['chicken breast', 'teriyaki sauce', 'rice', 'cucumber', 'sesame seeds', 'steamed rice'] },
    { name: 'Miso Soup with Tofu', cuisine: 'Japanese', mealType: ['Lunch'], difficulty: 'Easy', tags: ['soup', 'vegetarian', 'quick'], method: 'soup', ingredients: ['silken tofu', 'spring onions', 'miso paste', 'dashi stock', 'wakame'] },
    { name: 'Salmon Teriyaki', cuisine: 'Japanese', mealType: ['Dinner'], difficulty: 'Medium', tags: ['fish', 'healthy'], method: 'grill', ingredients: ['salmon fillets', 'teriyaki sauce', 'ginger', 'rice', 'bok choy'] },
    { name: 'Beef Tacos', cuisine: 'Mexican', mealType: ['Dinner'], difficulty: 'Easy', tags: ['beef', 'tacos'], method: 'skillet', ingredients: ['ground beef', 'taco seasoning', 'corn tortillas', 'lettuce', 'tomato', 'cheddar cheese', 'sour cream'] },
    { name: 'Chicken Quesadillas', cuisine: 'Mexican', mealType: ['Lunch', 'Snack'], difficulty: 'Easy', tags: ['chicken', 'quick'], method: 'skillet', ingredients: ['chicken breast', 'bell pepper', 'flour tortillas', 'cheddar cheese', 'salsa'] },
    { name: 'Black Bean Burrito Bowl', cuisine: 'Mexican', mealType: ['Lunch'], difficulty: 'Easy', tags: ['vegan', 'rice bowl'], method: 'nocook', ingredients: ['black beans', 'rice', 'corn', 'avocado', 'salsa', 'lime', 'cilantro'] },
    { name: 'Fresh Guacamole', cuisine: 'Mexican', mealType: ['Snack'], difficulty: 'Easy', tags: ['vegan', 'dip', 'quick'], method: 'nocook', ingredients: ['avocados', 'lime', 'red onion', 'tomato', 'jalapeño', 'cilantro'] },
    { name: 'Greek Salad', cuisine: 'Greek', mealType: ['Lunch'], difficulty: 'Easy', tags: ['salad', 'vegetarian'], method: 'salad', ingredients: ['cucumber', 'tomatoes', 'red onion', 'kalamata olives', 'feta cheese', 'olive oil', 'dried oregano'] },
    { name: 'Chicken Souvlaki', cuisine: 'Greek', mealType: ['Dinner'], difficulty: 'Medium', tags: ['chicken', 'grill'], method: 'grill', ingredients: ['chicken breast', 'lemon', 'garlic', 'oregano', 'pita bread', 'tzatziki'] },
    { name: 'Spanakopita', cuisine: 'Greek', mealType: ['Lunch', 'Dinner'], difficulty: 'Hard', tags: ['vegetarian', 'pastry'], method: 'bake', ingredients: ['phyllo pastry', 'spinach', 'feta cheese', 'eggs', 'onion', 'dill', 'butter'] },
    { name: 'French Onion Soup', cuisine: 'French', mealType: ['Dinner'], difficulty: 'Medium', tags: ['soup', 'comfort food'], method: 'soup', ingredients: ['onions', 'butter', 'beef stock', 'thyme', 'baguette', 'gruyère cheese'] },
    { name: 'Classic Crêpes', cuisine: 'French', mealType: ['Breakfast', 'Dessert'], difficulty: 'Medium', tags: ['breakfast', 'sweet'], method: 'breakfast', ingredients: ['flour', 'milk', 'eggs', 'butter', 'sugar', 'lemon wedges'] },
    { name: 'Ratatouille', cuisine: 'French', mealType: ['Dinner'], difficulty: 'Medium', tags: ['vegan', 'vegetarian'], method: 'bake', ingredients: ['eggplant', 'zucchini', 'bell peppers', 'tomatoes', 'onion', 'garlic', 'herbes de Provence'] },
    { name: 'Pad Thai', cuisine: 'Thai', mealType: ['Dinner'], difficulty: 'Medium', tags: ['noodles'], method: 'stirfry', ingredients: ['rice noodles', 'shrimp', 'eggs', 'bean sprouts', 'tamarind paste', 'fish sauce', 'crushed peanuts'] },
    { name: 'Thai Green Curry', cuisine: 'Thai', mealType: ['Dinner'], difficulty: 'Medium', tags: ['curry', 'spicy'], method: 'curry', ingredients: ['chicken thighs', 'green curry paste', 'coconut milk', 'bamboo shoots', 'fish sauce', 'Thai basil'] },
    { name: 'Tom Yum Soup', cuisine: 'Thai', mealType: ['Lunch', 'Dinner'], difficulty: 'Medium', tags: ['soup', 'spicy'], method: 'soup', ingredients: ['shrimp', 'lemongrass', 'mushrooms', 'lime leaves', 'chicken stock', 'chili paste', 'lime wedges'] },
    { name: 'Korean Bibimbap', cuisine: 'Korean', mealType: ['Lunch', 'Dinner'], difficulty: 'Medium', tags: ['rice bowl'], method: 'stirfry', ingredients: ['beef', 'cooked rice', 'spinach', 'carrots', 'gochujang', 'sesame oil', 'a fried egg'] },
    { name: 'Kimchi Fried Rice', cuisine: 'Korean', mealType: ['Lunch'], difficulty: 'Easy', tags: ['rice', 'spicy', 'quick'], method: 'stirfry', ingredients: ['kimchi', 'cooked rice', 'gochujang', 'sesame oil', 'eggs', 'spring onions'] },
    {
        name: 'Shakshuka', cuisine: 'Middle Eastern', mealType: ['Breakfast', 'Lunch'], difficulty: 'Easy', tags: ['vegetarian', 'eggs'],
        ingredients: ['eggs', 'canned tomatoes', 'bell pepper', 'onion', 'garlic', 'cumin', 'paprika', 'feta cheese'],
        steps: [
            'Cook the onion and bell pepper in olive oil until soft.',
            'Add the garlic, cumin, and paprika and cook for one minute.',
            'Pour in the canned tomatoes and simmer for 10 minutes until thickened.',
            'Make small wells in the sauce and crack in the eggs.',
            'Cover and cook until the whites are set, then top with feta cheese.',
        ],
    },
    {
        name: 'Baked Falafel Wraps', cuisine: 'Middle Eastern', mealType: ['Lunch'], difficulty: 'Medium', tags: ['vegan', 'wrap'],
        ingredients: ['chickpeas', 'parsley', 'onion', 'garlic', 'cumin', 'flatbread', 'tahini'],
        steps: [
            'Preheat the oven to 200°C (400°F) and line a baking tray.',
            'Pulse the chickpeas, parsley, onion, garlic, and cumin into a coarse mixture.',
            'Shape into small patties and brush lightly with oil.',
            'Bake for 25 minutes, flipping halfway, until golden.',
            'Wrap in warm flatbread and drizzle with tahini.',
        ],
    },
    {
        name: 'Smooth Hummus', cuisine: 'Middle Eastern', mealType: ['Snack'], difficulty: 'Easy', tags: ['vegan', 'dip'],
        ingredients: ['chickpeas', 'tahini', 'lemon juice', 'garlic', 'olive oil', 'cumin'],
        steps: [
            'Drain the chickpeas, reserving a little of the liquid.',
            'Blend the tahini and lemon juice until creamy.',
            'Add the chickpeas, garlic, and cumin and blend until smooth.',
            'Loosen with a splash of the reserved liquid if needed.',
            'Serve drizzled with olive oil.',
        ],
    },
    { name: 'Red Lentil Soup', cuisine: 'Middle Eastern', mealType: ['Lunch', 'Dinner'], difficulty: 'Easy', tags: ['soup', 'vegan', 'healthy'], method: 'soup', ingredients: ['red lentils', 'onion', 'carrot', 'garlic', 'cumin', 'vegetable stock', 'lemon wedges'] },
    { name: 'Fluffy Pancakes', cuisine: 'American', mealType: ['Breakfast'], difficulty: 'Easy', tags: ['breakfast', 'sweet'], method: 'breakfast', ingredients: ['flour', 'milk', 'eggs', 'baking powder', 'butter', 'maple syrup'] },
    { name: 'Avocado Toast', cuisine: 'American', mealType: ['Breakfast'], difficulty: 'Easy', tags: ['vegetarian', 'quick'], method: 'nocook', ingredients: ['sourdough bread', 'avocado', 'lemon', 'chili flakes', 'a poached egg'] },
    { name: 'BBQ Pulled Chicken Sandwiches', cuisine: 'American', mealType: ['Lunch', 'Dinner'], difficulty: 'Medium', tags: ['chicken', 'sandwich'], method: 'bake', ingredients: ['chicken thighs', 'barbecue sauce', 'brioche buns', 'coleslaw', 'onion'] },
    { name: 'Baked Mac and Cheese', cuisine: 'American', mealType: ['Dinner'], difficulty: 'Easy', tags: ['comfort food', 'vegetarian'], method: 'bake', ingredients: ['macaroni', 'cheddar cheese', 'milk', 'butter', 'flour', 'breadcrumbs'] },
    { name: 'Chocolate Chip Cookies', cuisine: 'American', mealType: ['Dessert', 'Snack'], difficulty: 'Easy', tags: ['baking', 'sweet'], method: 'dessert', ingredients: ['chocolate chips', 'butter', 'brown sugar', 'eggs', 'flour', 'vanilla extract', 'baking soda'] },
    { name: 'Blueberry Muffins', cuisine: 'American', mealType: ['Breakfast', 'Snack'], difficulty: 'Easy', tags: ['baking', 'breakfast'], method: 'dessert', ingredients: ['blueberries', 'butter', 'sugar', 'eggs', 'flour', 'milk', 'baking powder'] },
    { name: 'Banana Bread', cuisine: 'American', mealType: ['Breakfast', 'Dessert'], difficulty: 'Easy', tags: ['baking'], method: 'dessert', ingredients: ['mashed ripe bananas', 'butter', 'sugar', 'eggs', 'flour', 'baking soda', 'walnuts'] },
    {
        name: 'Overnight Oats', cuisine: 'American', mealType: ['Breakfast'], difficulty: 'Easy', tags: ['breakfast', 'healthy', 'vegetarian'],
        ingredients: ['rolled oats', 'milk', 'chia seeds', 'yogurt', 'honey', 'fresh berries'],
        steps: [
            'Combine the rolled oats, milk, chia seeds, and yogurt in a jar.',
            'Stir in the honey and mix well.',
            'Cover and refrigerate overnight.',
            'Top with fresh berries in the morning and enjoy cold.',
        ],
    },
    {
        name: 'Berry Smoothie Bowl', cuisine: 'American', mealType: ['Breakfast', 'Snack'], difficulty: 'Easy', tags: ['vegan', 'healthy', 'quick'],
        ingredients: ['frozen berries', 'banana', 'almond milk', 'granola', 'chia seeds'],
        steps: [
            'Blend the frozen berries, banana, and almond milk until thick and smooth.',
            'Pour into a bowl.',
            'Top with granola and chia seeds.',
            'Serve immediately.',
        ],
    },
    { name: 'Caprese Salad', cuisine: 'Italian', mealType: ['Lunch', 'Snack'], difficulty: 'Easy', tags: ['salad', 'vegetarian', 'quick'], method: 'salad', ingredients: ['tomatoes', 'fresh mozzarella', 'fresh basil', 'olive oil', 'balsamic glaze'] },
    {
        name: 'Mushroom Risotto', cuisine: 'Italian', mealType: ['Dinner'], difficulty: 'Hard', tags: ['vegetarian', 'rice'],
        ingredients: ['arborio rice', 'mushrooms', 'onion', 'vegetable stock', 'white wine', 'parmesan', 'butter'],
        steps: [
            'Warm the vegetable stock in a saucepan and keep it at a gentle simmer.',
            'Cook the onion and mushrooms in butter until soft.',
            'Add the arborio rice and toast for two minutes, then add the white wine.',
            'Add the stock one ladle at a time, stirring until each addition is absorbed.',
            'Finish with parmesan and a knob of butter, then rest for two minutes.',
        ],
    },
    {
        name: 'Tiramisu', cuisine: 'Italian', mealType: ['Dessert'], difficulty: 'Hard', tags: ['dessert', 'no-bake'],
        ingredients: ['mascarpone', 'egg yolks', 'sugar', 'ladyfingers', 'espresso', 'cocoa powder'],
        steps: [
            'Whisk the egg yolks with sugar until pale and thick.',
            'Fold in the mascarpone until smooth.',
            'Dip the ladyfingers briefly in espresso and layer them in a dish.',
            'Alternate layers of ladyfingers and mascarpone cream.',
            'Chill for at least 4 hours and dust with cocoa powder before serving.',
        ],
    },
    { name: 'Moroccan Chicken Tagine', cuisine: 'Moroccan', mealType: ['Dinner'], difficulty: 'Hard', tags: ['chicken', 'stew'], method: 'curry', ingredients: ['chicken thighs', 'onion', 'garlic', 'ginger', 'cinnamon', 'cumin', 'chicken stock', 'dried apricots'] },
    { name: 'Herby Couscous Salad', cuisine: 'Moroccan', mealType: ['Lunch'], difficulty: 'Easy', tags: ['salad', 'vegan'], method: 'salad', ingredients: ['cooked couscous', 'cucumber', 'cherry tomatoes', 'chickpeas', 'lemon', 'fresh mint'] },
    {
        name: 'Fish and Chips', cuisine: 'British', mealType: ['Dinner'], difficulty: 'Hard', tags: ['fish', 'comfort food'],
        ingredients: ['cod fillets', 'potatoes', 'flour', 'sparkling water', 'baking powder', 'lemon wedges'],
        steps: [
            'Cut the potatoes into thick chips and par-boil for 5 minutes.',
            'Heat oil for frying to 180°C (350°F).',
            'Whisk the flour, baking powder, and sparkling water into a smooth batter.',
            'Coat the cod fillets in batter and fry with the chips in batches until golden.',
            'Drain on paper towels and serve with lemon wedges.',
        ],
    },
    { name: "Shepherd's Pie", cuisine: 'British', mealType: ['Dinner'], difficulty: 'Medium', tags: ['comfort food'], method: 'bake', ingredients: ['ground lamb', 'mashed potatoes', 'carrots', 'peas', 'onion', 'beef stock'] },
    {
        name: 'Vietnamese Spring Rolls', cuisine: 'Vietnamese', mealType: ['Snack', 'Lunch'], difficulty: 'Medium', tags: ['healthy', 'fresh'],
        ingredients: ['rice paper', 'cooked shrimp', 'rice vermicelli', 'lettuce', 'mint', 'carrots', 'peanut sauce'],
        steps: [
            'Soak the rice vermicelli in hot water until soft, then drain.',
            'Dip a sheet of rice paper in warm water for a few seconds.',
            'Fill with lettuce, carrots, mint, vermicelli, and shrimp.',
            'Fold in the sides and roll up tightly.',
            'Serve with peanut sauce for dipping.',
        ],
    },
    { name: 'Chicken Pho', cuisine: 'Vietnamese', mealType: ['Lunch', 'Dinner'], difficulty: 'Hard', tags: ['soup', 'noodles'], method: 'soup', ingredients: ['chicken', 'onion', 'ginger', 'star anise', 'chicken stock', 'rice noodles', 'fish sauce', 'Thai basil'] },
    { name: 'Lemon Herb Roast Chicken', cuisine: 'Mediterranean', mealType: ['Dinner'], difficulty: 'Medium', tags: ['chicken', 'roast'], method: 'bake', ingredients: ['whole chicken', 'lemon', 'garlic', 'rosemary', 'thyme', 'butter', 'potatoes'] },
    {
        name: 'Mango Sticky Rice', cuisine: 'Thai', mealType: ['Dessert'], difficulty: 'Medium', tags: ['dessert', 'vegan'],
        ingredients: ['glutinous rice', 'coconut milk', 'sugar', 'salt', 'ripe mango', 'sesame seeds'],
        steps: [
            'Rinse the glutinous rice and soak it for at least 4 hours.',
            'Steam the rice for 20-25 minutes until tender.',
            'Warm the coconut milk with sugar and salt until dissolved.',
            'Pour most of the sauce over the warm rice and let it absorb.',
            'Serve with sliced mango, the remaining sauce, and sesame seeds.',
        ],
    },
];

const CALORIES: Record<Recipe['mealType'][number], [number, number]> = {
    Breakfast: [220, 480],
    Lunch: [300, 650],
    Dinner: [380, 850],
    Snack: [90, 320],
    Dessert: [180, 520],
};

function instructionsFor(seed: RecipeSeed): string[] {
    if (seed.steps) return seed.steps;
    const main = seed.ingredients[0];
    const last = seed.ingredients[seed.ingredients.length - 1];
    return TEMPLATES[seed.method ?? 'nocook'].map((step) => step.replaceAll('{main}', main).replaceAll('{last}', last));
}

export function buildRecipes(baseUrl: string, userCount: number): Recipe[] {
    const random = createRandom(7007);
    return RECIPES.map((seed, index) => {
        const id = index + 1;
        const [minCalories, maxCalories] = CALORIES[seed.mealType[0]];
        const difficultyFactor = seed.difficulty === 'Hard' ? 2 : seed.difficulty === 'Medium' ? 1.4 : 1;
        return {
            id,
            name: seed.name,
            cuisine: seed.cuisine,
            difficulty: seed.difficulty,
            mealType: seed.mealType,
            tags: seed.tags,
            ingredients: seed.ingredients,
            instructions: instructionsFor(seed),
            prepTimeMinutes: Math.round(random.int(5, 20) * difficultyFactor),
            cookTimeMinutes: seed.steps?.some((step) => /chill|refrigerate/i.test(step)) ? 0 : Math.round(random.int(8, 30) * difficultyFactor),
            servings: random.int(2, 6),
            caloriesPerServing: random.int(minCalories, maxCalories),
            rating: random.float(3.6, 5, 1),
            reviewCount: random.int(4, 240),
            userId: random.int(1, userCount),
            image: `${baseUrl}/api/v1/images/recipes/${id}`,
        };
    });
}
