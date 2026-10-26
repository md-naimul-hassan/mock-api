import { createReadHandlers } from '../../../helpers/resourceController';
import { RecipeService } from './recipe.service';

export const RecipeController = createReadHandlers(RecipeService);
