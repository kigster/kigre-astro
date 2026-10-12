// The talk list shared by /speaking and the per-talk share pages.
//
// Talk data lives in src/data/talks.json (sourced from reinvent.one/#speaking —
// edit it there to add new talks; bin/rasterize-talk-pdfs.sh reads the same file).
// Each talk derives from its pdf filename: a slug (also the header anchor and
// the ?talk= deep-link value), a local cover image, and the checked-in
// same-origin PDF that react-pdf renders in the modal.
import talks from '../data/talks.json';

export const talkItems = talks.map((t) => {
  const slug = t.pdf.split('/').pop().replace(/\.pdf$/, '');
  return {
    ...t,
    slug,
    img: `/assets/images/talks/${slug}.jpg`,
    localPdf: `/assets/talks/pdfs/${slug}.pdf`,
  };
});
