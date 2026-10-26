import ApiError from '../../../errors/ApiErrors';
import { resourceModels } from '../../../DB/models';

export const IMAGE_TYPES = ['users', 'products', 'recipes'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

const PALETTE = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1', '#ec4899', '#84cc16', '#f97316'];

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);

const initials = (text: string) =>
    text
        .split(/\s+/)
        .filter((word) => /^[A-Za-z]/.test(word))
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');

const labelFields: Record<ImageType, string[]> = {
    users: ['firstName', 'lastName'],
    products: ['title'],
    recipes: ['name'],
};

/** Builds a deterministic SVG placeholder for a seeded record. */
const imageFromDB = async (type: ImageType, id: number) => {
    const fields = labelFields[type];
    const record = await resourceModels[type].findOne({ id }, Object.fromEntries([['_id', 0], ...fields.map((field) => [field, 1])])).lean<Record<string, string>>();
    if (!record) throw ApiError.notFound(`No image: ${type} record with id ${id} not found`);

    const label = fields.map((field) => record[field]).join(' ');
    const color = PALETTE[id % PALETTE.length];
    const size = type === 'users' ? 256 : 400;
    const caption = type === 'users' ? '' : `<text x="50%" y="88%" font-family="system-ui, sans-serif" font-size="18" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">${escapeXml(label.length > 34 ? `${label.slice(0, 33)}…` : label)}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(label)}">
<rect width="100%" height="100%" fill="${color}"/>
<text x="50%" y="50%" dy=".35em" font-family="system-ui, sans-serif" font-size="${size / 3}" font-weight="600" fill="#ffffff" text-anchor="middle">${escapeXml(initials(label))}</text>
${caption}
</svg>`;
};

export const ImageService = { imageFromDB };
