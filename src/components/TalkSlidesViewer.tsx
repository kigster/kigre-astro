// The heavy half of the /speaking slide modal: react-pdf + pdf.js (~1MB).
// Loaded via React.lazy from TalkPdfModal.tsx only when a deck is first
// opened, so the page itself stays light.
//
// Slide changes cross-fade (~300ms): `shown` is the fully-painted visible
// slide, `target` is the one the user asked for. While they differ, the
// target renders in a stacked transparent layer and fades in over the old
// slide only after pdf.js finishes painting it — never a blank frame. The
// slide after `target` also pre-rasterizes in a hidden layer, so forward
// navigation fades immediately instead of waiting on a render.
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Vite rewrites this to the bundled worker asset (same-origin, hashed).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  /** same-origin PDF from public/assets/talks/pdfs/ (see bin/rasterize-talk-pdfs.sh) */
  url: string;
  /** canonical copy on reinvent.one — fallback link if the local one 404s */
  remote: string;
  title: string;
};

export default function TalkSlidesViewer({ url, remote, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [shown, setShown] = useState(1);
  const [target, setTarget] = useState(1);
  const [fadeIn, setFadeIn] = useState(false);
  const [failed, setFailed] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // fit the slide to the modal body; clientWidth is consistent within the
  // page's (zoomed) coordinate space, so the fit holds under :root { zoom }
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setTarget((p) => Math.min(p + 1, numPages || 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setTarget((p) => Math.max(p - 1, 1));
      } else if (e.key === "Home") {
        setTarget(1);
      } else if (e.key === "End" && numPages) {
        setTarget(numPages);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  // retargeting mid-fade (rapid arrow presses) restarts the fade for the new
  // slide instead of finishing the stale one
  useEffect(() => setFadeIn(false), [target]);

  // the site-wide :root { zoom: 1.2/1.3 } (global.css) stretches the canvas
  // past its backing store — render at a bumped DPR so slides stay crisp
  const dpr = Math.min((window.devicePixelRatio || 1) * 1.3, 4);

  if (failed) {
    return (
      <div className="talk-modal-fallback">
        <p>The slides could not be rendered here.</p>
        <p>
          <a href={remote} target="_blank" rel="noopener">
            Open “{title}” as a PDF ↗
          </a>
        </p>
      </div>
    );
  }

  const slideProps = {
    width,
    devicePixelRatio: dpr,
    renderTextLayer: false,
    renderAnnotationLayer: false,
  };
  const incoming = target !== shown ? target : null;
  const preload = numPages > 0 ? Math.min(target + 1, numPages) : 0;

  return (
    <>
      <div className="talk-modal-body" ref={bodyRef}>
        <Document
          file={url}
          onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
          onLoadError={() => setFailed(true)}
          loading={<div className="talk-modal-loading">Loading slides…</div>}
          error={<div className="talk-modal-loading">Loading slides…</div>}
        >
          {width > 0 && (
            <div className="talk-slide-stack">
              {/* layers are keyed by page number so that when the fade ends
                  and `shown` catches up to `target`, React PROMOTES the
                  already-painted incoming canvas to be the base layer instead
                  of re-rendering it — re-rasterizing here would blank the
                  canvas and flash white after every fade */}
              {(incoming !== null ? [shown, incoming] : [shown]).map((p) => (
                <div
                  key={p}
                  className={
                    p === incoming
                      ? `talk-slide-incoming${fadeIn ? " is-shown" : ""}`
                      : undefined
                  }
                  onTransitionEnd={
                    p === incoming
                      ? () => {
                          setShown(p);
                          setFadeIn(false);
                        }
                      : undefined
                  }
                >
                  <Page
                    pageNumber={p}
                    {...slideProps}
                    onRenderSuccess={
                      p === incoming
                        ? () =>
                            // double rAF: let the browser paint the opacity:0
                            // frame first, so .is-shown actually transitions
                            requestAnimationFrame(() =>
                              requestAnimationFrame(() => setFadeIn(true)),
                            )
                        : undefined
                    }
                  />
                </div>
              ))}
              {preload > target && preload !== shown && (
                <div className="talk-slide-preload" aria-hidden="true">
                  <Page pageNumber={preload} {...slideProps} />
                </div>
              )}
            </div>
          )}
        </Document>
      </div>
      <footer className="talk-modal-nav">
        <button
          type="button"
          onClick={() => setTarget((p) => Math.max(1, p - 1))}
          disabled={target <= 1}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <span className="talk-modal-pages">
          {target} / {numPages || "…"}
        </span>
        <button
          type="button"
          onClick={() => setTarget((p) => Math.min(numPages || 1, p + 1))}
          disabled={numPages > 0 && target >= numPages}
          aria-label="Next slide"
        >
          ›
        </button>
      </footer>
    </>
  );
}
