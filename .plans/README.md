# `.plans/` — feature specs & plans for the kig.re toolchain

This directory holds the design record for the larger pieces of work on the
blog's TypeScript/AI toolchain (and anything else big enough to warrant a
written plan). It mirrors the 3-phase workflow we use elsewhere.

## Workflow

Each large chunk of related features lives in its own folder:

```text
.plans/
  NNN.<short-kebab-slug>/
    spec.md     — human-owned: what & why (the brief)
    plan.md     — AI-derived: how (architecture, schema, file-by-file tasks, tests)
```

- `NNN` is a zero-padded, monotonically increasing sequence (`001`, `002`, …).
  It never changes once assigned.
- The slug reads like a feature name, not a filename.

Three phases, with a human checkpoint between each:

1. **Spec.** A brief written for a smart colleague who hasn't seen the
   conversation: goal, users, requirements, quality bar, explicit non-goals,
   dependencies, open questions. Owned by Konstantin; the AI may draft it.
1. **Plan.** The AI turns an approved `spec.md` into a `plan.md`: architecture,
   data/file layout, ordered task list, and a test/verification plan.
1. **Implement.** Each approved plan is built in its **own git worktree** and
   lands as a **single PR**, branch named after the slug (`kig/<slug>`).

> Do not start planning until the relevant `spec.md` is approved, and do not
> start implementing until its `plan.md` is approved.

## Chunks

| NNN | Slug | One-liner | Depends on |
| --- | ---- | --------- | ---------- |
| 001 | `typescript-toolchain-and-layout` | A real home + tooling for TS/CLI code beside Astro | — |
| 002 | `genkit-multi-provider-engine` | One AI engine; Gemini / Anthropic / OpenAI at runtime | 001 |
| 003 | `dotprompt-prompt-library` | All prompts as `prompts/*.prompt`, loaded via Genkit | 002 |
| 004 | `digest-cli-and-content-modes` | `commander` CLI; `digest` / `article` / `news` + depth | 001–003 |
| 005 | `source-registry-and-discovery` | `--compile-sources` → git-committed YAML of sources | 004 |

The first slice the user wants built immediately — "migrate all prompts to
dotprompt, use genkit" — is the **002 + 003** pair.
