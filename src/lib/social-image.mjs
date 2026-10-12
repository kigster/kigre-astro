// Social-preview images (og:image / twitter:image).
//
// A post's hero image is used as-is when social crawlers can render its
// format and it is not portrait. SVG and AVIF cannot be rendered by Facebook,
// X, LinkedIn or Slack, and a tall phone screenshot gets its middle centre-
// cropped, so those posts point at a PNG that src/pages/og/[...slug].png.ts
// letterboxes onto a landscape card at build time.
import path from 'node:path';
import sharp from 'sharp';

// Formats every major unfurler can fetch and draw.
const SOCIAL_SAFE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

// Size of the generated PNGs: the canonical 1.91:1 Open Graph card.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Narrower than this (width / height) and unfurlers crop a hero to a useless strip.
const MIN_ASPECT = 0.8;

const extOf = (p) => p.split('.').pop().toLowerCase();

/** `/2026/09/21/some-post.html` -> `2026-09-21-some-post` */
export const ogSlug = (permalink) =>
  permalink.replace(/^\//, '').replace(/\.html$/, '').replaceAll('/', '-');

/** Absolute path of a site-relative asset path such as `/assets/images/x.png`. */
export const publicFile = (assetPath) => path.resolve('public', `.${assetPath}`);

/** Intrinsic size of a hero; also used for <img width/height> so layout never shifts. */
export async function heroSize(heroPath) {
  const meta = await sharp(publicFile(heroPath)).metadata();
  // an animated image reports the height of all its frames stacked
  return { width: meta.width, height: meta.pageHeight ?? meta.height };
}

/** True when the hero must be re-rendered as a generated /og/*.png card. */
export async function needsRaster(heroPath) {
  if (!SOCIAL_SAFE.has(extOf(heroPath))) return true;
  const { width, height } = await heroSize(heroPath);
  return width / height < MIN_ASPECT;
}

/**
 * Social image for a post: `{ path, width, height }`, `path` site-relative.
 * Real pixel dimensions are required so og:image:width/height never lie.
 */
export async function socialImageForHero(heroPath, permalink) {
  if (await needsRaster(heroPath)) {
    return { path: `/og/${ogSlug(permalink)}.png`, width: OG_WIDTH, height: OG_HEIGHT };
  }
  return { path: heroPath, ...(await heroSize(heroPath)) };
}

/**
 * Social image for a page that is not a post: any site-relative asset the
 * layout can use directly. Returns the `{ path, width, height, alt }` shape
 * BaseLayout's `socialImage` prop expects.
 */
export async function socialImageForAsset(assetPath, alt) {
  return { path: assetPath, ...(await heroSize(assetPath)), alt };
}
