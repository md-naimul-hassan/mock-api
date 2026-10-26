import express from 'express';
import requireDatabase from '../middlewares/requireDatabase';
import methodNotAllowed from '../middlewares/methodNotAllowed';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { CartRoutes } from '../modules/cart/cart.routes';
import { CommentRoutes } from '../modules/comment/comment.routes';
import { ImageRoutes } from '../modules/image/image.routes';
import { PostRoutes } from '../modules/post/post.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { QuoteRoutes } from '../modules/quote/quote.routes';
import { RecipeRoutes } from '../modules/recipe/recipe.routes';
import { SystemController } from '../modules/system/system.controller';
import { TestingRoutes } from '../modules/testing/testing.routes';
import { TodoRoutes } from '../modules/todo/todo.routes';
import { UserRoutes } from '../modules/user/user.routes';
const router = express.Router();

const apiRoutes = [
    { path: '/users', route: UserRoutes, database: true },
    { path: '/products', route: ProductRoutes, database: true },
    { path: '/posts', route: PostRoutes, database: true },
    { path: '/comments', route: CommentRoutes, database: true },
    { path: '/todos', route: TodoRoutes, database: true },
    { path: '/carts', route: CartRoutes, database: true },
    { path: '/recipes', route: RecipeRoutes, database: true },
    { path: '/quotes', route: QuoteRoutes, database: true },
    { path: '/auth', route: AuthRoutes, database: true },
    { path: '/images', route: ImageRoutes, database: true },
    { path: '/test', route: TestingRoutes, database: false },
];

router.route('/').get(SystemController.root).all(methodNotAllowed('GET'));
apiRoutes.forEach(({ path, route, database }) => (database ? router.use(path, requireDatabase, route) : router.use(path, route)));

export default router;
