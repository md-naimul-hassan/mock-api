export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const titleCase = (slug: string) =>
    slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const round2 = (value: number) => Math.round(value * 100) / 100;
