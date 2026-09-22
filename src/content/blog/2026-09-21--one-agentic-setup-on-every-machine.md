---
title: "One agentic setup, every machine, every project"
date: "2026-09-21"
permalink: "/2026/09/21/one-agentic-setup-on-every-machine.html"
category: "AI"
tags: ["ai", "agents", "claude-code", "ruby", "gems", "cli", "skills", "plugins", "workflow", "locking", "agentilda", "agent-lock", "open-source"]
description: "Three repos that keep my coding agents consistent on every computer, turn an ideal into spec, spec into a plan, plan into PRs, reviewed and passing on CI, and how to stop thirty agents from stepping on each each other's toes."
heroImage: "/assets/images/posts/factory/software-factory.avif"
comments: true
draft: false
author: kig
---

There is a particular flavor of sadness that comes from sitting down at your laptop instead of your desktop and discovering that half your skills are missing, your slash commands do not exist, and the agent you just asked to do a thing has never heard of the thing.

I had that problem for months. My `~/.claude` folder was a museum: skills installed by hand in February from a repo I could no longer name, plugins that somebody on Twitter recommended, a `CLAUDE.md` that had drifted apart on three machines like continents. Every new computer was an archaeology project.

So I did what any reasonable person does after the third archaeology project. I wrote three repos.

## The problem is not the agents, it's the sameness

Claude Code is great. Codex is fine. Cursor does things. That is not where the pain is. The pain is that a coding agent is only as good as the context it loads, and the context lives in a pile of dotfiles that no package manager owns.

Nobody publishes `my-skills-as-of-tuesday` to a registry. You clone a repo, you copy a folder, you forget where it came from, and six weeks later the skill is stale and there is no way to tell which upstream it drifted from. Multiply by two laptops and a desktop.

What I wanted was boring: one file that declares what my agentic environment is, and one command that makes any machine look like that.

## Repo one: `agentilda-ai-setup`

> [!IMPORTANT]
> 
> This repo, is, perhaps, the most important one of the three. This is because if you run it's installer, it will also install the other two gems I talk about below. Together with the consistent set of skills, plugins, coding agents, and the global AGENTS.md and CLAUDE.md. To have it be your way, just fork the repo, make your own changes, and run it on any new computer you plan to do AI-assisted development. It's that simple.

[`agentilda-ai-setup`](https://github.com/kigster/agentilda-ai-setup) is the boring one, which means it's the one that actually solves the problem.

It has a `configuration.yml`. The file lists which coding agents you want installed (with the vendor's own install line, because I am not in the business of reimplementing `npm i -g`), which extra executables should be on PATH, and then any number of GitHub repos to pull skills and plugins from.

```yaml
  - name: pstack
    type: plugin
    repo: git@github.com:cursor/plugins.git
    path: pstack
    include_skills: /\A(architect|unslop|why)\z/
```

That last line is the part I use constantly. Most skill repos ship forty skills and I want three. Regular expression, matched against the name the skill installs as, done. There is `exclude_skills` too, and the same pair for plugins, and an `agents:` key so a Claude-only source never gets installed for an agent that cannot read it.

Then:

```bash
gem install agentilda agent-lock
bin/install
```

Three steps happen. `scripts/install-sources` builds `skills/` and `plugins/` in the checkout from the config. `bin/install` copies that into `~/.agents` with every symlink resolved, so `~/.agents` holds real files. `bin/setup` links `~/.agents` into `~/.claude`.

Nothing under `skills/` or `plugins/` is committed. They are fully regenerable from the config, which is the whole idea. The moment a skill exists in git with no record of where it came from, you are back in the museum.

My favorite property: tightening a filter takes skills *away*. Next run unlinks whatever it installed last time and no longer wants. The tree converges on what the file says instead of accumulating like a Downloads folder.

Deliberate trade: editing `src/skills/foo` does not reach `~/.claude` until you run install again. Installed tree that keeps, rather than a live symlink into a checkout you might rename on a Tuesday.

## Repo two: `agentilda`, or the part that does the work

They say "picture is worth a thousand words" so here it is, in action:


![in-action](/assets/images/posts/factory/agentilda-two-plan-work.avif)

> [!NOTE]
>
> The screenshot above is `tilda run` with agents working on two plans at once. Left plan has backend and frontend both building. Right plan is still at research. Nobody is merging anything, which is the point.

[`agentilda`](https://github.com/kigster/agentilda) is a Ruby gem with one command, installed as both `agentilda` and `tilda`. It has a [ratatui](https://github.com/kigster/ratatui_ruby)-based dashboard, which is a Rust extension, which means installing it needs `cargo` and `clang`. Sorry. It looks good though.

What it actually does is manage a `.plans` folder and drive a team of specialist agents over it. You write a short brief. Seven agents research it, spec it, plan it, build it, review it. You merge. They never merge.

The folder name is the state, which sounds like a gimmick until you have used it for a week:

```text
.plans/000.00-✅ → dev-foundation
       001.00-🟡 → tenancy-households
       002.00-⚪️ → tax-rule-dsl
```

Number is permanent, branches and PR titles join on it. Emoji is the state. And a folder may only claim a state its files can prove: no `plan.md`, no ⭐️. Agents lie about having finished things. Disk does not.

The cast, roughly:

| Agent | Does |
| :--- | :--- |
| `leah-researcher` | researches the brief in parallel, appends a Research chapter |
| `yoda-writer` | writes the real spec, or `blocked.md` when a human has to decide |
| `palpatine-planner` | splits the spec into independently buildable work units |
| `luke-backend` | data, domain, API, tests |
| `rey-frontend` | the interface against Luke's API, and proof the halves fit |
| `hansolo-reviewer` | reviews the diff against the plan, rejects at most twice |
| `lando-broker` | folds your answers to blocked questions back into spec and plan |

Yes, the names are what you think they are. No, I will not be taking questions.

Luke and Rey work at the same time, in the same worktree, toward one PR, and talk to each other through a `mailbox.md`. Which is exactly the situation that requires repo three, so hold that thought.

Two safety rails matter more than the rest. **Agents cannot publish.** They write source, tests and their plan documents, and that is it. The tool withholds git commands from them and then checks afterwards that `HEAD` did not move, because trusting an agent's own report about whether it committed is how you end up with a very confident pile of nothing. The harness commits, pushes and opens the PR. And every command that writes is a dry run until you add `--commit`.

```bash
tilda create tax rule dsl      # writes the brief skeleton, opens it
tilda run                      # who would take what, touching nothing
tilda run --commit -j 4        # four agents at a time, worktree each
tilda list-plans               # state and PRs for everything
```

When an agent crashes, times out, or you press `q`, it writes a `RESUME:` note into the plan's mailbox and signs itself `Interrupted`. Every agent reads its mail before starting. A later run picks up instead of redoing fifteen minutes of research you already paid for.

## Repo three: `agent-lock`, the unglamorous one

Here is the thing nobody tells you about running several agents in one checkout: git will not save you.

Two agents on one branch and one working tree do not produce a merge conflict. There is nothing to conflict. The second writer just wins, the first one's work is gone, and no error appears anywhere. You find out later, from a file that is mysteriously shorter than you remember.

[`agent-lock`](https://github.com/kigster/agent-lock) ships `alock`, which is advisory locking on globs:

```bash
alock acquire "lib/billing/**" "rewriting the invoices"
alock check   "lib/billing/tax.rb"
alock note    "lib/billing/**" "totals done, specs red"
alock release-all
```

A refusal tells you who, since when, and what they are doing, not merely that you lost:

```
$ alock acquire lib/billing/tax.rb
REFUSED, do not write here
HELD  lib/billing/**  by luke-backend  since 2026-09-09T21:04:11Z
      intent: rewriting the invoices
```

The lock is a markdown document with frontmatter and a progress log, not a flag file. Agent that runs into one learns enough to decide whether to wait or go elsewhere. Human that runs into one can open it in an editor.

Locks live in `$(git rev-parse --git-common-dir)/agent-locks`, which is a quietly excellent choice: git cannot track it, `git clean -xdf` cannot reach it, every worktree resolves to the same store, and it dies with the checkout instead of accumulating in your home directory forever.

The hard part was never the locking. It was **identity**. An agent harness runs every command in a brand new shell, so `export AGENT_ID=...` from the previous call is gone. Worse, Claude Code runs sub-agents inside the parent's own process and sets nothing that tells them apart, so by default all eight of your sub-agents share one fingerprint, sign every lock as the parent, and block absolutely nobody.

So a sub-agent names itself on every single call:

```bash
AGENT_ID=luke-backend alock acquire lib/billing/** "invoices"
```

And the model is a family rather than a single holder. Your parent's scope does not block you; you claim something narrower inside it, and *that* is what keeps your siblings out. Your own `release-all` takes your locks and your children's, never your parent's. Asking for exactly your parent's scope is refused, since that leaves nothing for a sibling to be excluded from.

Crash handling has a detail I like. When a holder is provably dead, a lock with no notes is deleted, because there is nothing to come back to. A lock *with* notes is orphaned instead: claim void, record kept, and `acquire` refuses to silently paper over it.

```
$ alock acquire workflow/**
INTERRUPTED WORK on workflow/**, left by luke-backend
  alock resume workflow/**   # take it back, notes and all
  alock break workflow/**    # throw it away and start over
```

Backend is Redis if one answers locally, file system otherwise. Choice is recorded once in a marker file and every later process in that tree is bound to it, claimed atomically with `O_CREAT|O_EXCL`. Because the genuinely dangerous failure is not "no lock", it is two agents taking locks in two different stores, seeing nothing of each other, and both reporting success.

And critically, the gem ships a skill that teaches agents the rules, so they live where agents read them instead of in a README nobody loads. Advisory locks only work because everybody checks.

## The part I actually care about

Any of these three alone is a moderately useful utility. Together they are the thing I wanted: a machine I can hand a config file and get my exact working environment back, a workflow that turns a paragraph into reviewed PRs across any repo, and enough coordination that running eight agents at once is a Tuesday rather than an incident.

The honest caveats. It is my setup, opinionated in ways that are about my taste and not a law of nature. The `.plans` emoji naming makes shell quoting mandatory, forever. Ratatui needs a Rust toolchain. And the agents still produce PRs that need real review, which is precisely why nothing merges itself.

I wrote a bit before about [condensing twenty years of opinions into one markdown file](/2026/08/19/condensing-twenty-years-of-wisdom-in-one-markdown.html). This is the sequel: making sure that file, and everything around it, is the same on every machine I sit down at.

```bash
gem install agentilda agent-lock -N
git clone https://github.com/kigster/agentilda-ai-setup
cd agentilda-ai-setup && cp configuration.example.yml configuration.yml
# read it before you run it, seriously
bin/install --dry-run
```

All three are MIT. If you run more than one agent at a time, at minimum steal `alock`. Ask me how I learned that one.
