# © 2026 Konstantin Gredeskoul

set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

[no-exit-message]
recipes:
    @just --choose

# Install bun (if missing) and then install project dependencies
setup:
    @command -v bun >/dev/null || curl -fsSL https://bun.sh/install | bash
    @bun install

# Start the Astro dev server at http://localhost:4321 or https://dev.kig.re/
dev: setup
    @bun run dev

# Build production site into dist/
build: setup
    @bun run build

# Preview the production build locally
preview:
    @bun run preview

# Convert AsciiDoc posts to Markdown
convert:
    @bun run convert

# Generate the weekly AI digest post locally, needs ANTHROPIC_API_KEY
digest:
    @bun run digest
