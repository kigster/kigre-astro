# © 2026 Konstantin Gredeskoul 

set shell := ["bash", "-eu", "-o", "pipefail", "-c"] 

set dotenv-load

version := `cat package.json | jq .version | tr -d '"'`


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

# Build production site into dist/
build: setup
    @bun run build

# Preview the production build locally
preview: build
    @bun run preview

# Convert AsciiDoc posts to Markdown
convert:
    @bun run convert

# Generate the weekly AI digest post locally (needs one provider API key)
digest:
    @bun run digest

# Typecheck the tools/ TypeScript toolchain
typecheck:
    @bun run typecheck

deploy: build
    @rsync -Pavz -e "ssh" ./dist/ kig@fastly-backend.kig.re:~/workspace/kigre-astro/dist

test:
    @bun test tools/

version: 
    @echo "Site version is {{ version }}"

release:
    @git tag -f 'v{{ version }}'
    @git push --tags
    @gh release create --generate-notes


