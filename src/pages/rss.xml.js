import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  return rss({
    title: 'kig.re',
    description: 'Engineering notes on scaling, Ruby, DevOps and questionable hardware.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: post.data.permalink, // exact legacy URL
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}
