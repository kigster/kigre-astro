#!/usr/bin/env bash
# Regenerates the checked-in talk-slide PDFs in public/assets/talks/pdfs/ from
# the full-resolution originals on reinvent.one (URLs in src/data/talks.json).
#
# Each original page is rendered to a 1920px-wide JPEG (quality 82) and the
# JPEGs are wrapped losslessly back into a PDF with img2pdf. This flattens
# vector text into pixels (no selection/search inside slides) but cut the set
# from 219MB to ~68MB, small enough to live in git — the /speaking react-pdf
# modal renders these same-origin and links to the original for full res.
#
# By default only missing decks are built, so after adding a talk to
# talks.json a single run builds just the new one. --force rebuilds all.
#
# Needs: curl, jq, poppler (pdftoppm/pdfinfo), uv (uvx runs img2pdf).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="${root}/public/assets/talks/pdfs"
talks="${root}/src/data/talks.json"
force="${1:-}"

for tool in curl jq pdftoppm pdfinfo uvx; do
  command -v "${tool}" >/dev/null || { echo "missing dependency: ${tool}" >&2; exit 1; }
done

mkdir -p "${dest}"
work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT

built=0 kept=0
while IFS= read -r url; do
  name="$(basename "${url}" .pdf)"
  out="${dest}/${name}.pdf"
  if [[ -s "${out}" && "${force}" != "--force" ]]; then
    kept=$((kept + 1))
    continue
  fi

  echo "fetching ${name}.pdf ..."
  curl -fsSL --retry 3 -o "${work}/${name}.pdf" "${url}"
  pages="$(pdfinfo "${work}/${name}.pdf" | awk '/^Pages:/{print $2}')"

  echo "rasterizing ${pages} pages ..."
  mkdir -p "${work}/${name}"
  pdftoppm -jpeg -jpegopt quality=82,optimize=y \
           -scale-to-x 1920 -scale-to-y -1 \
           "${work}/${name}.pdf" "${work}/${name}/p"
  uvx img2pdf "${work}/${name}"/p-*.jpg -o "${out}"

  [[ "$(pdfinfo "${out}" | awk '/^Pages:/{print $2}')" == "${pages}" ]] \
    || { echo "page-count mismatch for ${name}" >&2; exit 1; }
  echo "built ${out#"${root}"/} ($(du -h "${out}" | cut -f1), ${pages} pages)"
  built=$((built + 1))
done < <(jq -r '.[].pdf' "${talks}")

echo "talk PDFs: ${built} built, ${kept} already present in ${dest#"${root}"/}"
