---
title: "How I built three dry-cli extensions, then the forum's AI bot thought I was a spammer"
date: "2026-09-17"
permalink: "/2026/09/17/2026-09-17--how-i-build-three-gem-extensions-and-got-ai-banned.html"
category: "Open Source"
tags: ["ruby", "dry-cli", "dry-rb", "hanami", "cli", "gems", "open-source", "launch", "claude-code"]
description: "Three Ruby CLI annoyances became three gems. Then my announcement got caught by a spam filter, and a conversation I didn't expect followed. If you write CLI utilities, especially in Ruby, and in particular using dry-cli framework, you'll want to read this. Pinky promise."
heroImage: "/assets/images/posts/dry-cli-tools/agentilda-new-help.avif"
comments: true
draft: false
author: kig
---

> [!NOTE]
> 
> The image above shows the help screen of one of my CLI utilities, which will be the subject of a future post. Here it is shown to demonstrate the difference between what help screen looks like after requiring `dry-cli-help` gem, versus the default help screen shown <a href="#original-help">below</a>.

At about 1 a.m., I announced three new Ruby gems on the dry-rb forum. The forum hid the post and silenced my account.

I had spent weeks extracting the gems from a CLI I was building. I had written up examples, recorded demos, and put everything on [dry-cli.tools](https://dry-cli.tools). Then I posted the announcement where dry-cli users might actually see it. A spam filter saw an infrequent poster with a pile of links and made a fairly understandable guess about me.

That was not quite the launch I had pictured. Before I get to how it ended, here's why I built the gems in the first place.

## The same chores, one CLI after another

I've written a lot of command-line tools in Ruby. I like [dry-cli](https://github.com/dry-rb/dry-cli) because a command is a class, options are declared in plain sight, and nested commands are easy to register. Hanami uses it too. I can get on with writing the command instead of negotiating with the framework.

I [wrote about using dry-cli](/2020/09/07/writing-cli-tools-ruby-migrating-github-issues-to-pivotal-tracker.html) in [githuh](https://rubygems.org/gems/githuh) back in 2020. That tool can export GitHub issues, and its `issue export` command has enough options to make a cramped help screen annoying. Here's what that looks like when the descriptions wrap:

![Wrapped help output for the githuh CLI](/assets/images/posts/dry-cli-tools/githuh-wrapping.avif)

My [`dss` command](https://rubygems.org/gems/datadog-statsd-schema) analyzes metric schemas before they turn into a Datadog bill. [flowengine-cli](https://rubygems.org/gems/flowengine-cli) runs and validates flow definitions. More recently, [`dmez`](https://rubygems.org/gems/dnsmadeeasy) got an `export`, `plan`, and `apply` workflow for DNS zone files.

Different jobs, same pattern: once the command itself worked, I still had to make its help readable, show progress where the work took time, and teach the shell what could come next. By the time I started `tilda`, copying those pieces into one more project sounded less appealing than finally pulling them out.

Then I run the command and look at the help screen. There's no title or description for the program. Long descriptions run across the terminal on one line. Commands appear in alphabetical order, even when I would explain them in a different order. So I fix the help output for that project.

Next comes a command that takes more than a few seconds. I add a spinner or progress bar and make sure it doesn't print hundreds of carriage returns into a CI log. Then I add shell completion so `mycli db <TAB>` suggests a command instead of the files in my current directory. By the next CLI, I'm doing all of it again. Apparently I enjoy writing zsh completion just enough to forget how much I dislike writing it.

The help work became `dry-cli-help`. This is what it changes:

![Standard dry-cli help output](/assets/images/posts/dry-cli-tools/without-dry-cli-help.avif)

![The same help output with dry-cli-help](/assets/images/posts/dry-cli-tools/with-dry-cli-help.avif)

It wraps descriptions to the terminal width and adds color, a title, a description, and an epilogue. I can group commands and put them in an order that helps a person find the next step. The setup fits in a few lines:

```ruby
require "dry/cli/help"

Dry::CLI::Help.configure do
  title "MyCLI"
  description "Compile, validate, and evaluate rules."
  color :auto
  wrap true
end
```

<a name="original-help"></a>
  
The image at the top of the post is the new help screen from `tilda`, the CLI that started this whole exercise. Here is its original dry-cli help screen for comparison:

![Original dry-cli help output for agentilda's tilda command](/assets/images/posts/dry-cli-tools/agentilda-default-dry-cli.avif)

## When a command takes a while

For a slow command, I want to know what it's doing. If it's downloading 64 PDF files, I also want to know whether file 63 is still moving. That work became `dry-cli-ui`, which gives a dry-cli command a `ui` object:

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

The gem uses Piotr Murach's [TTY Toolkit](https://ttytoolkit.org) to draw spinners, bars, tables, and prompts. In a terminal, progress updates in place. In a file or CI log, it prints plain lines. I have stared at enough failed job logs to care deeply about that last part.

Here's a run that downloads 64 IRS forms, six at a time:

![Downloading IRS forms with concurrent progress bars](/assets/images/posts/dry-cli-tools/download-urls.gif)

And here's one that probes addresses on a local /24 network, ten at a time:

![Scanning a local network with concurrent progress bars](/assets/images/posts/dry-cli-tools/find-hosts.gif)

The [form download](https://asciinema.org/a/Il7LOQSahRD1ZhHV) and [host scan](https://asciinema.org/a/gBU8BS3KCRp97FX1) recordings are also on asciinema. They use the `main` branch. The `-c` concurrency option in the recordings arrived after version 0.5.0.

## The Tab key should know the commands

Shell completion was the third repeat offender. A dry-cli app already knows its commands, aliases, options, and enum values. I wanted to turn that information into a script once, install it, and stop thinking about completion every time I added a command.

`dry-cli-autocomplete` does that. Register a completion command:

```ruby
require "dry/cli/autocomplete/command"
register "completion", Dry::CLI::Autocomplete::Command[MyCLI]
```

Then generate a script for your shell:

```bash
mycli completion bash > /usr/local/etc/bash_completion.d/mycli
```

Now pressing Tab uses the generated script; it doesn't start Ruby each time. It supports bash 3.2 and newer and writes native zsh completion with option descriptions. Hidden commands stay hidden, and file arguments complete as files.

[`dry-cli-completion` already exists](https://github.com/rngtng/dry-cli-completion). I tried to use it. In my apps, I needed completion for file arguments and for child commands under a command group. I also didn't want the completion require adding time to every ordinary CLI run. That's why I wrote another gem instead of pretending I had invented the idea.

## Back to the forum

By this point, I had three independent gems, all at version 0.5.0, MIT licensed, and requiring Ruby 4.0 or newer. They plug into an existing dry-cli app without changing its commands. You can install all three or pick one:

```bash
gem install dry-cli-help dry-cli-ui dry-cli-autocomplete
```

I should also be clear about where they came from. These are my extensions, not dry-rb projects or gems endorsed by its maintainers. I built them with Claude Code involved. Most of the Ruby is mine; Claude reviewed code, wrote commit messages, and wrote much of the zsh completion code. I reviewed the result.

So there I was at 1 a.m. with a hidden announcement and a silenced account. I [wrote about it on the Hanakai forum](https://discourse.hanakai.org/t/false-positive-spam-detection-on-dry-forum-for-post-about-dry-cli-tools/1536), feeling pretty irritated. Seventeen minutes later, [Tim Riley](https://github.com/timriley) replied. He explained why the filter had fired, marked the post as legitimate, and restored it.

Then he invited me to send pull requests to bring the colored, wrapped help output into dry-cli 2.0 itself. I had gone from "the forum thinks I'm a spammer" to "would you like to contribute this upstream?" in less than half an hour. The filter made a mistake. The person behind it handled the mistake well. Thanks, Tim.

The CLI behind the screenshots is `tilda`, part of [agentilda](https://github.com/kigster/agentilda-ai-setup). I'll tell that story in another post. If you have a dry-cli app and one of these annoyances sounds familiar, the gems and examples are at [dry-cli.tools](https://dry-cli.tools).
