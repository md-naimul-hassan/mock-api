import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import catchAsync from '../../../shared/catchAsync';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { IMAGE_TYPES, ImageService, type ImageType } from './image.service';
const router = express.Router();

const imageValidation = {
    params: z.object({
        type: z.enum(IMAGE_TYPES, { error: `type must be one of: ${IMAGE_TYPES.join(', ')}` }),
        id: z.string().regex(/^[1-9]\d{0,9}$/, 'id must be a positive integer').transform(Number),
    }),
    query: z.strictObject({}),
};

const getImage = catchAsync(async (req: Request, res: Response) => {
    const { type, id } = req.validated.params as { type: ImageType; id: number };
    const svg = await ImageService.imageFromDB(type, id);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(svg);
});

router.route('/:type/:id').get(validateRequest(imageValidation), getImage).all(methodNotAllowed('GET'));

export const ImageRoutes = router;
