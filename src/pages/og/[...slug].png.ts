// Generated social-preview image for posts whose hero social crawlers cannot
// use directly: SVG/AVIF, or portrait (see src/lib/social-image.mjs). The hero
// is letterboxed onto a 1200x630 card so its whole content stays visible.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { OG_HEIGHT, OG_WIDTH, needsRaster, ogSlug, publicFile } from '../../lib/social-image.mjs';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const withHero = posts.filter((p) => p.data.heroImage);
  const raster = await Promise.all(withHero.map((p) => needsRaster(p.data.heroImage as string)));
  return withHero
    .filter((_, i) => raster[i])
    .map((p) => ({
      params: { slug: ogSlug(p.data.permalink) },
      props: { hero: p.data.heroImage as string },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const src = publicFile(props.hero);
  // backdrop: the hero itself, cover-cropped, blurred and dimmed, so the
  // letterbox bars match the image instead of a flat white strip
  const backdrop = await sharp(src, { density: 192 })
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 0.55 })
    .toBuffer();
  // foreground: the whole hero, fitted with a small margin
  const pad = 24;
  const fg = await sharp(src, { density: 192 })
    .resize(OG_WIDTH - pad * 2, OG_HEIGHT - pad * 2, { fit: 'inside' })
    .toBuffer();
  const png = await sharp(backdrop)
    .composite([{ input: fg, gravity: 'center' }])
    .flatten({ background: '#000000' })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
