import { model, Schema } from 'mongoose';
import { MEAL_TYPES, RECIPE_DIFFICULTIES } from '@mockapis/api-spec';
import { type IRecipe, type RecipeModel } from './recipe.interface';

const recipeSchema = new Schema<IRecipe, RecipeModel>(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        cuisine: { type: String, required: true, index: true },
        difficulty: { type: String, enum: RECIPE_DIFFICULTIES, required: true },
        mealType: { type: [{ type: String, enum: MEAL_TYPES }], default: [], index: true },
        tags: { type: [String], default: [], index: true },
        ingredients: { type: [String], default: [] },
        instructions: { type: [String], default: [] },
        prepTimeMinutes: { type: Number, required: true },
        cookTimeMinutes: { type: Number, required: true },
        servings: { type: Number, required: true },
        caloriesPerServing: { type: Number, required: true },
        rating: { type: Number, required: true },
        reviewCount: { type: Number, required: true },
        userId: { type: Number, required: true, index: true },
        image: { type: String, required: true },
    },
    { collection: 'recipes', versionKey: false },
);

export const Recipe = model<IRecipe, RecipeModel>('Recipe', recipeSchema);
