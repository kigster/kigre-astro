// Turns ```mermaid fences into a hidden-source HTML shell. Runs as a remark
// plugin, i.e. BEFORE Shiki — so the diagram source is never syntax-highlighted
// as a code block. The hidden <pre class="mermaid-src"> is the persistent
// source of truth: the client-side renderer (MermaidRenderer.astro) reads it
// and draws the SVG next to it, and re-reads it on every theme switch.

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function remarkMermaid() {
  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;
      node.children.forEach((child, i) => {
        if (child.type === "code" && child.lang === "mermaid") {
          node.children[i] = {
            type: "html",
            value: `<div class="mermaid-diagram"><pre class="mermaid-src">${escapeHtml(child.value)}</pre></div>`,
          };
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
  };
}
