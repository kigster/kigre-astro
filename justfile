# © 2026 Konstantin Gredeskoul 

set shell := ["bash", "-eu", "-o", "pipefail", "-c"] 

set dotenv-load

version := `jq '.version' package.json | tr -d '"'`

[no-exit-message]
recipes:
    @just --choose

# Install bun (if missing) and then install project dependencies
setup:
    @command -v bun >/dev/null || curl -fsSL https://bun.sh/install | bash
    @bun install

# Start the Astro dev server at http://localhost:4321 or https://dev.kig.re/
dev: setup build
    @bash -c "sleep 3 && open http://127.0.0.1:4321" &
    @bun run dev --host

# Mirror the talk-slide PDFs into public/ (gitignored; skips ones already present)
pdfs:
    @bin/fetch-talk-pdfs.sh

# Build production site into dist/
build: setup pdfs
    @bun run build

# Preview the production build locally
preview:
    @bun run preview

# Typecheck the tools/ TypeScript toolchain
typecheck:
    @bun run typecheck

permissions: clean
    /usr/bin/find src \! -path './node_modules/*' -and -type f -exec chmod 644 {} \; -print
    /usr/bin/find . \! -path './node_modules/*' -and \! -path './.claude/*' -and \! -path './.git/*' -and -type d -exec chmod 751 {} \; -print

deploy: build
    @rsync -Pavz -e "ssh" ./dist/ kig@fastly-backend.kig.re:~/workspace/kigre-astro/dist

test:
    @bun test tools/

check_all: build test typecheck digest

version: 
    @echo "Site version is {{ version }}"

release:
    @git tag -f 'v{{ version }}'
    @git push --tags
    @gh release create --generate-notes

#━━━━━━━━━━━━━━━ AI Content Generation ━━━━━━━━━━━━━━━━━━━━━━━━━

# Generate the weekly AI digest post locally (needs one provider API key)
digest *args:
    @bun run digest {{ args }}

clean:
    /usr/bin/find . -type f -name .DS_Store

