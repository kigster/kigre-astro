// The /speaking slide modal (light half). Hydrated on page load, it:
//   - intercepts clicks on any [data-talk] link and opens the deck in a modal
//     (without JS the links still work — they point at the raw PDF);
//   - keeps ?talk=<slug> in the URL, so an open deck is shareable
//     (/speaking?talk=2026.inquirex) and back/forward re-open/close it;
//   - lazy-loads the react-pdf viewer (TalkSlidesViewer) on first open.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

const TalkSlidesViewer = lazy(() => import("./TalkSlidesViewer"));

export type Talk = {
  slug: string;
  year: string;
  title: string;
  /** same-origin PDF path */
  pdf: string;
  /** canonical copy on reinvent.one */
  remote: string;
};

const PARAM = "talk";

const slugFromLocation = () =>
  new URLSearchParams(window.location.search).get(PARAM);

export default function TalkPdfModal({ talks }: { talks: Talk[] }) {
  const [slug, setSlug] = useState<string | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const open = useCallback((next: string, pushUrl = true) => {
    setSlug(next);
    if (pushUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set(PARAM, next);
      history.pushState({}, "", url);
    }
  }, []);

  const close = useCallback((pushUrl = true) => {
    setSlug(null);
    if (pushUrl) {
      const url = new URL(window.location.href);
      if (url.searchParams.has(PARAM)) {
        url.searchParams.delete(PARAM);
        history.pushState({}, "", url);
      }
    }
  }, []);

  useEffect(() => {
    // deep link: /speaking?talk=<slug> opens that deck on load
    const initial = slugFromLocation();
    if (initial && talks.some((t) => t.slug === initial)) setSlug(initial);

    const onClick = (e: MouseEvent) => {
      // let modified clicks keep their native open-in-new-tab behavior
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const link = (e.target as Element).closest<HTMLElement>("[data-talk]");
      if (!link?.dataset.talk) return;
      e.preventDefault();
      open(link.dataset.talk);
    };
    const onPop = () => {
      const s = slugFromLocation();
      if (s && talks.some((t) => t.slug === s)) open(s, false);
      else close(false);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, [talks, open, close]);

  const talk = talks.find((t) => t.slug === slug) ?? null;

  // while open: lock page scroll, close on Escape, park keyboard focus in
  // the dialog and hand it back on close
  useEffect(() => {
    if (!talk) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      restoreFocus.current?.focus();
    };
  }, [talk, close]);

  if (!talk) return null;

  return (
    <div
      className="talk-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="talk-modal" role="dialog" aria-modal="true" aria-label={`Slides: ${talk.title}`}>
        <header className="talk-modal-head">
          <span className="talk-modal-title">
            {talk.year} · {talk.title}
          </span>
          <a className="talk-modal-open" href={talk.pdf} target="_blank" rel="noopener">
            Open PDF ↗
          </a>
          <button
            ref={closeBtn}
            type="button"
            className="talk-modal-close"
            onClick={() => close()}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <Suspense fallback={<div className="talk-modal-loading">Loading viewer…</div>}>
          <TalkSlidesViewer url={talk.pdf} remote={talk.remote} title={talk.title} />
        </Suspense>
      </div>
    </div>
  );
}
