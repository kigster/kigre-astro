---
title: "dry-cli extensions: Three Gems that extend your dry-cli based tools with some snazzy features."
date: "2026-09-17"
permalink: "/2026/09/17/dry-cli-tools-launch.html"
category: "Open Source"
tags: ["ruby", "dry-cli", "aruba", "rspec", "testing", "dry-rb", "hanami", "cli", "gems", "open-source", "launch", "claude-code"]
description: "dry-cli is a lovely way to build a Ruby CLI, and it prints help screens like it's 1994. I wrote three gems to fix that: dry-cli-help for colored, wrapped help, dry-cli-ui for spinners and progress bars, and dry-cli-autocomplete for native bash and zsh completion. They now have a home at dry-cli.tools. The announcement was promptly flagged as spam."
heroImage: "/assets/images/posts/dry-cli-tools/agentilda-new-help.avif"
comments: true
draft: true
author: kig
---

This is a plain Ruby CLI built on [dry-cli](https://github.com/dry-rb/dry-cli), downloading 64 IRS forms six at a time:

![dry-cli-ui downloading 64 IRS forms with six concurrent progress bars](/assets/images/posts/dry-cli-tools/download-urls.gif)

`mycli download-urls -o irs-forms -p -c 6 -u irs.txt` reads 64 PDF links from a file and saves them into `irs-forms/`. Each download gets its own bar, a headline bar counts all 64, and when they're done a box lists every file written. The command itself is ordinary Ruby: the progress display comes from one `include`, and it's what this post is about.

## A CLI Is a User Interface. Act Like It.

I have written a lot of command-line tools in Ruby. Some of them were even [blogged about](/2020/09/07/writing-cli-tools-ruby-migrating-github-issues-to-pivotal-tracker.html). And for a while now my framework of choice has been [dry-cli](https://github.com/dry-rb/dry-cli): commands are classes, options are declared, nested subcommands are a `register` call away, and nothing magical happens behind your back. It's the CLI engine behind Hanami, and it's excellent.

What it isn't is *pretty*. Out of the box, dry-cli gives you:

- a help screen with no title, no description of the program, no color, and every description on one line no matter how long;
- commands sorted alphabetically, whether or not that makes any sense;
- no shell completion, so `mycli db <TAB>` helpfully offers you the files in your current directory;
- and for long-running commands, `puts`. Good luck.

That first one, in a gem I shipped six years ago. This is `githuh -h` on a 90-column terminal: the description runs past the edge and the terminal breaks it mid-word, dumping the remainder against the left margin.

![githuh help output wrapping mid-word on a 90-column terminal](/assets/images/posts/dry-cli-tools/githuh-wrapping.avif)

None of this is a bug. dry-cli deliberately does one job. But I kept re-implementing the same polish in every CLI I wrote, and after the third copy-paste I did what any reasonable engineer does: I extracted it into gems. Three of them.

They now have a home: **[dry-cli.tools](https://dry-cli.tools)**.

## The Three Gems

All three are at `v0.5.0`, MIT-licensed, require Ruby 4.0+, and plug into an existing dry-cli app **without changing your commands**.

### 1. `dry-cli-help` — help screens a human wants to read

`require "dry/cli/help"` and your help output goes from this:

![Standard dry-cli help screen](/assets/images/posts/dry-cli-tools/without-dry-cli-help.avif)

to this:

![Help screen with dry-cli-help](/assets/images/posts/dry-cli-tools/with-dry-cli-help.avif)

Bold yellow headings, green commands, cyan options, and every description wrapped to the terminal width with a hanging indent. You get a title, a description, an epilogue, command grouping and ordering you control:

```ruby
require "dry/cli/help"

Dry::CLI::Help.configure do
  title "MyCLI"
  description "Compile, validate, and evaluate rules."
  color :auto
  wrap true
end
```

Here is the same thing on a real app rather than an example. `tilda -h`, the CLI of my [agentilda](https://github.com/kigster/agentilda-ai-setup) gem, on stock dry-cli — 20-odd commands, one flat alphabetical list, and descriptions wrapping mid-word at 90 columns:

![agentilda's tilda -h on stock dry-cli, descriptions wrapping mid-word](/assets/images/posts/dry-cli-tools/agentilda-default-dry-cli.avif)

And the same registry with `dry-cli-help` loaded — a title, a description, commands in named groups with their aliases, and descriptions that wrap under themselves:

![agentilda's tilda -h with dry-cli-help: grouped commands and wrapped descriptions](/assets/images/posts/dry-cli-tools/agentilda-new-help.avif)

Same commands, same code. More on agentilda at the end.

### 2. `dry-cli-ui` — spinners, progress bars, and not lying to CI

A long-running command has more to say than `puts` can say well: what it's doing now, how far along it is, and what went wrong. Include one module and your command gets a `ui`:

```ruby
class Import < Dry::CLI::Command
  include Dry::CLI::UI

  def call(**)
    rules = ui.spinner("Loading tax rules") { load_rules }

    ui.progress("Importing rules", total: rules.size) do |bar|
      rules.each { |rule| import(rule); bar.advance }
    end

    ui.success "Imported #{rules.size} rules"
  rescue => e
    ui.error("Import failed", e.message)
  end
end
```

Spinners with elapsed time, progress bars with ETA, concurrent multi-job progress, task trees, a status bar, boxes, tables and prompts. The rendering stands on the shoulders of Piotr Murach's wonderful [TTY Toolkit](https://ttytoolkit.org).

The part I care about most: **it degrades gracefully**. On a terminal, everything animates in place. Piped to a file or a CI log, the same code prints plain, readable lines — no ANSI confetti, no 4,000 carriage returns:

```text
Loading tax rules...
✓ Loading tax rules (0.3s)
Importing rules...
𝘅 Importing rules 1482/1900 (4.1s)
```

You saw one real run at the top of the post. Here's another.

**Scanning the local network.** `mycli find-hosts -c 10` probes every address on the local /24 on common TCP ports, ten at a time. One bar tracks the addresses that answered and another the ones that didn't, and then it lists what it found.

![dry-cli-ui scanning a local /24 network with concurrent progress bars](/assets/images/posts/dry-cli-tools/find-hosts.gif)

Both demos were recorded against dry-cli-ui's `main` branch, where `-c` (concurrency) is new since 0.5.0. The originals are on asciinema.org: [download-urls](https://asciinema.org/a/Il7LOQSahRD1ZhHV) and [find-hosts](https://asciinema.org/a/gBU8BS3KCRp97FX1).

### 3. `dry-cli-autocomplete` — TAB completion with no Ruby in the TAB path

Your CLI knows its commands, options, aliases, and enum values. The shell does not. This gem walks your registry **once**, emits a bash or zsh script, and you source it:

```ruby
require "dry/cli/autocomplete/command"
register "completion", Dry::CLI::Autocomplete::Command[MyCLI]
```

```bash
mycli completion bash > /usr/local/etc/bash_completion.d/mycli
```

After that, pressing TAB spawns nothing and costs nothing, because every completion the script will ever offer is already inside it.

To be fair, [`rngtng/dry-cli-completion`](https://github.com/rngtng/dry-cli-completion) existed first and is worth a look. I wrote a new one because I kept tripping over four things:

- **A group with both a command and children lost its children.** Register `db` (to explain the group) plus `db migrate`, and `mycli db <TAB>` offered only `--help`.
- **File arguments didn't complete.** Which is the single most common thing you want from a CLI.
- **The require wasn't free.** It added ~30ms to *every* invocation of the host CLI, for a command that runs once per shell.
- **zsh was a bash shim.** No per-option descriptions.

`dry-cli-autocomplete` generates a native `#compdef` for zsh (with descriptions), works with bash 3.2+ (hello, macOS), keeps hidden commands hidden, completes enum `values:` for free, and depends on `dry-cli` and `dry-inflector`. That's it.

## Install

```bash
gem install dry-cli-help dry-cli-ui dry-cli-autocomplete
```

Or pick the one you need — they're independent of each other.

> [!NOTE]
> These gems are **not** part of dry-rb and are not endorsed by its maintainers. They are my extensions, living next to the original gem, not inside it.

> [!WARNING]
> All three were written in collaboration with Claude Code. Most of the Ruby is mine; Claude reviewed it, wrote the commit messages (does anyone *like* writing those?), and authored most of the zsh completion code, since zsh is not my native tongue. Every line was reviewed by a human. If that's a deal-breaker for you, no hard feelings.

## Six Years Later: Does It Still Test With Aruba?

Back in 2020 I wrote [How to Write Awesome CLI tools in Ruby and test them with RSpec and Aruba](/2020/09/07/writing-cli-tools-ruby-migrating-github-issues-to-pivotal-tracker.html), about the `githuh` gem. Two of its arguments have aged well enough to be worth repeating here:

1. **dry-cli is the CLI framework I'd start with today.** Six years and several tools later, I still think so.
1. **Test your CLI with [Aruba](https://github.com/cucumber/aruba), in-process.** Aruba's default mode forks a UNIX process per example, which is correct and slow. Its in-process mode reuses the current one, resetting `stdout`, `stderr` and `stdin` around each run — provided your app is wrapped in a launcher class that takes those streams as arguments and never touches the `STDOUT` constant directly.

That last caveat is the whole game, and it's exactly where a TUI library can wreck you. A gem that writes to `STDOUT`, checks `STDOUT.tty?`, or pokes the cursor with escape codes it addresses to the real terminal will leak past Aruba's capture, and your beautiful progress bars become unassertable garbage in `last_command_started.output`.

So `dry-cli-ui` is built around the stream, not the constant:

- **`ui` writes to the command's own `out` and `err`** — the ones dry-cli passes into `Dry::CLI#call(out:, err:)` — and falls back to `$stdout`/`$stderr` only when nothing was given. This is the same discipline the 2020 post asked of your `Launcher` class, and it's what makes in-process Aruba work: point dry-cli at Aruba's captured streams and everything the UI prints lands in them.
- **Every decision is per-stream.** Colour and animation are decided from the stream being written to, not from a global. A stream that isn't a TTY (or runs under `TERM=dumb`) gets no colour, no cursor movement, and an assumed width of 80 columns.
- **Piped output is line-oriented and final.** A spinner prints `Importing rules...` when it starts and one outcome line when it ends. A progress bar prints no bar at all. A task tree prints each row once, when that row is decided. There are no partial redraws to strip and no 4,000 `\r`s to regex away — the piped output is text you can assert on:

```ruby
expect(last_command_started).to have_output(/✓ Loading tax rules/)
```

- **Prompts read lines when input isn't a terminal**, so an example can pipe answers in instead of driving an arrow-key menu, and they never block on an exhausted input.
- **`dry-cli-help` is deterministic too.** With `color :auto`, help screens are plain text when captured, so comparing a help screen against a fixture doesn't mean comparing ANSI codes.

None of which is a coincidence: "must not break in-process Aruba" was a requirement I wrote down before the first spinner, because I'd already learned that lesson, in public, six years ago.

## Meanwhile, on the Forum: I Am a Spammer Now

Naturally, the first place I announced this was the dry-rb Discourse forum, where people who use dry-cli actually hang out.

Discourse took one look at my post — an infrequent poster, back after a long absence, with a message full of links — and concluded, with the confidence only a heuristic can muster, that I was selling crypto. The post was hidden and I was silenced.

I'll admit my first reaction was not zen. Being muted for announcing a gem that extends *their* gem felt a bit like getting kicked out of a party for bringing a casserole. So I [posted about it on the Hanakai forum](https://discourse.hanakai.org/t/false-positive-spam-detection-on-dry-forum-for-post-about-dry-cli-tools/1536).

Seventeen minutes later, [Tim Riley](https://github.com/timriley) replied, explained exactly why the filter fired (it's the classic spam shape, and honestly — fair), marked the post as not spam, and restored it. Then he did something better: he said he liked the extensions and invited me to send pull requests bringing the colorized, wrapped help output into **dry-cli 2.0** itself.

So the story arc went from "silenced" to "want to upstream this?" in under half an hour, at 1am. That is what a healthy open-source community looks like, and a good reminder that a false positive from a robot says nothing about the humans behind it. Thanks, Tim.

The lesson for the rest of us: if you've been lurking for a year and your comeback post is a link-heavy announcement, expect the robot to squint at you. Say hi first.

## Why Now? Coming Next: `agentilda`

These gems didn't come from nowhere. I extracted them while building a considerably larger CLI — `tilda`, from the [agentilda](https://github.com/kigster/agentilda-ai-setup) project — which drives an agentic, specification-driven development flow: *spec → plan → build → review → tune/fix → approve*, keeping `.plans` folders in sync with GitHub pull requests and Linear issues.

That's the help screen at the top of this post: grouped commands, aliases, wrapped descriptions, and a `completion` command — all three gems pulling their weight in a real app.

The full story of agentilda is the next post. For now, go make your CLI pretty: **[dry-cli.tools](https://dry-cli.tools)**.
