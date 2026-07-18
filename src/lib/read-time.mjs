// Estimated read time for a post, shown in the article header under the byline.
//
//   minutes = ceil(words / 225 + imageSeconds / 60)
//
// where imageSeconds is 10s per body image. The hero image lives only in
// frontmatter (never in the body), so every image counted here is by
// construction a non-hero image. Words are whitespace-separated tokens of the
// raw markdown body — code blocks count, since readers do read them.
const WORDS_PER_MINUTE = 225;
const SECONDS_PER_IMAGE = 10;

/**
 * @param {string | undefined} markdownBody raw markdown body of the post
 * @returns {number} whole minutes, always at least 1
 */
export function estimateReadTimeMinutes(markdownBody) {
  const body = markdownBody ?? '';
  const words = body.split(/\s+/).filter(Boolean).length;
  const images = countBodyImages(body);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE + (images * SECONDS_PER_IMAGE) / 60));
}

function countBodyImages(body) {
  const markdown = body.match(/!\[[^\]]*\]\(/g)?.length ?? 0;
  const html = body.match(/<img[\s>]/gi)?.length ?? 0;
  return markdown + html;
}
