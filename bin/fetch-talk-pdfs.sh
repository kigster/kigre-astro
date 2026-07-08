#!/usr/bin/env bash
# Mirrors the talk-slide PDFs from reinvent.one into public/assets/talks/pdfs/
# so the /speaking page can render them same-origin with react-pdf (the origin
# server sends no CORS headers, and at ~218MB total the PDFs are too heavy to
# commit — the directory is gitignored and this script runs before each build:
# locally via `just pdfs`, in CI via .github/workflows/deploy.yml).
#
# Idempotent: PDFs already present (and non-empty) are skipped, so repeat runs
# only download what's missing.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="${root}/public/assets/talks/pdfs"
talks="${root}/src/data/talks.json"

mkdir -p "${dest}"

fetched=0 skipped=0
while IFS= read -r url; do
  file="${dest}/$(basename "${url}")"
  if [[ -s "${file}" ]]; then
    skipped=$((skipped + 1))
    continue
  fi
  echo "fetching $(basename "${url}") ..."
  curl -fsSL --retry 3 -o "${file}.tmp" "${url}"
  mv "${file}.tmp" "${file}"
  fetched=$((fetched + 1))
done < <(jq -r '.[].pdf' "${talks}")

echo "talk PDFs: ${fetched} fetched, ${skipped} already present in ${dest#"${root}"/}"
