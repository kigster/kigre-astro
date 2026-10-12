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
  const png = await sharp(publicFile(props.hero), { density: 192 })
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
