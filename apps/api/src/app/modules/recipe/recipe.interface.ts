import { type Model } from 'mongoose';
import type { Recipe } from '@mockapis/api-spec';

export type IRecipe = Recipe;

export type RecipeModel = Model<IRecipe>;
