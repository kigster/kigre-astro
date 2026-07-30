/*
 * qualified.at intake widget bootstrap for the ONE blog post that declares
 *   headScripts: ["/assets/js/qualified-blog-intake.js"]
 * in its frontmatter (see src/content.config.ts + BaseLayout.astro). No other
 * page loads this file.
 *
 * The post's CTA is:  <a id="qualified-blog-intake" href="https://qualified.at">
 * Until the real embed lands here, the button is an honest link. To go live,
 * replace this file's body with the embed for the blog-specific flow, e.g.:
 *
 *   const s = document.createElement("script");
 *   s.src = "https://qualified.at/embed.js";
 *   s.onload = () =>
 *     QualifiedAt.init({
 *       trigger: "element",
 *       elementId: "qualified-blog-intake",
 *       flowUrl: "https://qualified.at/?widget=<blog-flow-id>",
 *     });
 *   document.head.appendChild(s);
 */
console.info("[qualified.at] intake embed placeholder loaded — CTA falls back to a plain link");
