---
title: "Evals: The Unit Tests for the Non-Deterministic Parts of Your App"
date: 2026-06-21
permalink: "/2026/06/21/writing-evals-for-ai-powered-apps.html"
category: "ai"
tags: ["ai", "llm", "evals", "claude", "ruby", "testing", "prompt-engineering"]
description: "Building an app on top of a language model means part of your code now returns a different answer every time you run it. Here's how to keep that part honest — with a tiny, complete, runnable Ruby app and a real eval harness that tests it end to end."
heroImage: "/assets/images/posts/evals/eval-harness.svg"
comments: true
---
For about twenty-five years, my mental model of "is this code correct?" was simple
and comforting: feed it a known input, assert on a known output, watch the dot turn
green. `2 + 2` had better be `4` every single time, or someone has done something
unspeakable to my computer.

Then I started wiring language models into real applications, and that comforting
model quietly fell apart. You send the _same_ prompt twice and get two different
answers. Both might be correct. One might be subtly, expensively wrong. And there's
no exception, no stack trace, no red dot — just a confident paragraph of text that
happens to be hallucinated nonsense.

So how do you test the part of your app that refuses to be deterministic?

You write **evals**. This post is about what they are, why they suddenly matter, and
how to write one — with a tiny but real Ruby app and an eval harness that tests it
from end to end. No ML PhD required. If you can write an RSpec test, you can write an
eval.

## What's actually new here?

Let's be precise about what changed, because the hype machine is bad at this.

For a normal function, the mapping from input to output is fixed. `slugify("Hello World")`
returns `"hello-world"` today, tomorrow, and on the heat-death afternoon of the
universe. Your test pins that mapping in place, and any future change that breaks it
turns the dot red.

A language model is not a function in this sense. It's a _sample_ from a probability
distribution over possible responses. Ask Claude to classify a customer message and
it'll usually give you the right label — but "usually" is doing a lot of work in that
sentence, and the exact words, formatting, and edge-case behavior will drift:

- when you reword the prompt,
- when you upgrade the model,
- when the input is slightly weird in a way you didn't anticipate.

> [!NOTE]
>
> This is the uncomfortable part for those of us with grey in our hair: **your test
> suite can be 100% green and your feature can still be getting worse.** The
> determinism we leaned on for decades doesn't extend past the API boundary into the
> model. Evals are how we get a measurement back, together with the confidence.

An **eval** (short for _evaluation_) is a test for non-deterministic, model-driven
behavior. Instead of asserting "output == expected," it asks a softer but far more
useful question: _across a representative set of inputs, how often does the model do
the right thing — and is that good enough to ship?_

If unit tests pin behavior, evals **measure** it. That shift — from a boolean to a
score with a threshold — is the whole idea.

## Why you can't skip them

I know the temptation, because I've given in to it. You paste a clever prompt into
the playground, try four or five examples, they all look great, you ship it, you move
on. The LLM equivalent of "works on my machine."

Here's what that costs you later:

1. **No regression detection.** You tweak the prompt to fix one annoying edge case.
   Did you just quietly break the three things that were working? Without an eval, you
   genuinely do not know. You're flying blind and calling it confidence.
2. **No safe model upgrades.** A new, cheaper, faster model comes out — and they come
   out _constantly_ now. Is it as good as the one you have in production for _your_
   task? "The benchmarks look great" is not an answer. The benchmarks aren't running
   your prompt against your data. Your eval is.
3. **No shared definition of "good."** On a team, "the bot feels worse this week" is a
   vibe, not a bug report. An eval turns that vibe into a number everyone can see, and
   a number you can argue with is infinitely more useful than a feeling you can't.

An eval is the seatbelt that lets you actually _iterate_ on an AI feature instead of
freezing it in fear the moment it sort-of works. And iteration is the entire game.

## A tiny, real app to test

Enough philosophy. Let's build something small enough to read in one sitting and real
enough to be worth testing.

My wife runs a tax-prep practice, and I'm building a little service to qualify the
leads that come in through her website's contact form. So our example is a **lead
qualifier**: given a free-text message a stranger typed into a form, sort it into an
intent bucket so the humans know who to call back first.

It's a perfect specimen for this discussion — it's genuinely useful, it's the kind of
thing every business actually wants, and it's exactly the sort of "soft" task that
used to require a fragile pile of regexes and now takes one good prompt.

I'm doing this in plain Ruby (no Rails), because it fits my stack and because a single
file you can `ruby` is the best kind of example. One gem:

```ruby
# Gemfile
source "https://rubygems.org"

gem "anthropic"   # the official Anthropic Ruby SDK
```

```bash
bundle install
export ANTHROPIC_API_KEY="sk-ant-..."   # get one at console.anthropic.com
```

### The qualifier

The whole feature is one method. We hand the model the message, tell it exactly which
buckets exist and what JSON to return, then parse the result.

```ruby
# lead_qualifier.rb
require "anthropic"
require "json"

module LeadQualifier
  MODEL = :"claude-opus-4-8"

  # The buckets our humans actually triage by. Keeping this list in code (not just
  # in the prompt) lets the eval assert against it later.
  INTENTS = %w[hot warm cold spam].freeze

  SYSTEM = <<~PROMPT
    You qualify inbound leads for a tax-preparation business.

    Classify the message into exactly one intent:
      - "hot":  ready to buy now — asks about pricing, scheduling, or a specific service
      - "warm": interested but not ready — general questions, comparing options
      - "cold": low intent — vague, "just looking", or far in the future
      - "spam": not a real lead — marketing, recruiting, abuse, gibberish

    Respond with ONLY a JSON object, no prose, no markdown fence:
      {"intent": "...", "wants_callback": true|false, "reason": "one short sentence"}
  PROMPT

  module_function

  # Returns a parsed Hash, or raises if the model gave us something unusable.
  # That "raises" is deliberate — a malformed response is a real failure, and the
  # eval below is what catches how often it happens.
  def qualify(message, client: Anthropic::Client.new)
    response = client.messages.create(
      model: MODEL,
      max_tokens: 256,
      system_: SYSTEM,                       # note the trailing underscore in the Ruby SDK
      messages: [{ role: "user", content: message }]
    )

    text = response.content.find { |b| b.type == :text }&.text.to_s
    JSON.parse(text, symbolize_names: true)
  end
end
```

That's the entire AI feature. A stranger types `"What do you charge to file taxes for
a two-person LLC?"`, and we get back something like:

```json
{ 
  "intent": "hot", 
  "wants_callback": true, 
  "reason": "Asks about pricing for a specific service." 
}
```

> [!NOTE]
> **Two honest caveats, because I'd want them flagged for me.**
>
> First, the model. I'm defaulting to `claude-opus-4-8` because it's the sharpest
> tool in the box and I'd rather show you correct behavior than cheap behavior. But a
> lead classifier is the _textbook_ case for a small, fast, cheap model — this is
> precisely where you'd reach for `claude-haiku-4-5` in production and pocket the
> difference. The beauty of having an eval is that swapping `MODEL` and re-running it
> turns "I think Haiku is good enough" into a measured fact instead of a gamble.
>
> Second, I'm asking for JSON in the prompt and parsing it by hand. That's the most
> portable way to show this, and — bonus — it sets up a real failure mode for the eval
> to catch. For production you'd want to harden it with the API's **structured
> outputs**, which constrain the response to a schema so it can't hand you malformed
> JSON in the first place. Start loose, measure, then tighten.

## Now, the eval

Here's the move that makes the whole thing click: **the model's output is text, but
the field we care about is a label from a fixed set.** And a label from a fixed set is
something I can assert on like it's 1999. The non-determinism is real, but I've
funneled it down to a single enum, and enums I know how to test.

So an eval is, at its heart, three boring pieces:

1. A **dataset** of inputs paired with what we expect (often called the _golden set_).
2. A **runner** that feeds each input through the feature and **scores** the result.
3. A **threshold** — the pass rate below which we refuse to ship.

### The golden set

This is the part nobody wants to do and the part that matters most. Sit down and write
out real examples — including the nasty ones. The weird inputs are where your feature
will actually fail in production, so they're exactly what belongs here.

```ruby
# eval_cases.rb
CASES = [
  { message: "What do you charge to file taxes for a two-person LLC?",     expect: "hot"  },
  { message: "Do you handle crypto gains? Need it before the deadline.",   expect: "hot"  },
  { message: "Just comparing a few firms, what makes you different?",      expect: "warm" },
  { message: "Might need help next year, just poking around for now.",     expect: "cold" },
  { message: "GROW YOUR BUSINESS — buy 10,000 backlinks cheap!!!",         expect: "spam" },
  { message: "are u hiring junior accountants",                            expect: "spam" },
  # genuinely ambiguous — see below
  { message: "hi",                                                         expect: "cold" },].freeze
```

> [!TIP]
> Notice that last case. Is a bare `"hi"` cold or spam? Honestly... it's a coin flip,
> and reasonable humans would disagree. **Ambiguous cases are a feature of a good eval,
> not a bug** — they map the fuzzy boundary of the task and stop you from chasing 100%,
> a number that for most real problems is neither achievable nor meaningful. If your
> eval is always at 100%, your test set is too easy and is lying to you.

### The runner

Now we just loop, classify, and tally. I'm asserting on three things per case, in
increasing order of strictness:

1. Did we even get **valid JSON** back? (the floor)
2. Is the `intent` a member of our known set? (no hallucinated buckets)
3. Does it **match** what we expected? (the actual accuracy number)

```ruby
# eval.rb
require_relative "lead_qualifier"
require_relative "eval_cases"

PASS_THRESHOLD = 0.90   # ship only if we're right at least 90% of the time

client  = Anthropic::Client.new
correct = 0

puts "Running #{CASES.size} eval cases against #{LeadQualifier::MODEL}\n\n"

CASES.each do |c|
  result =
    begin
      LeadQualifier.qualify(c[:message], client: client)
    rescue JSON::ParserError
      nil   # the model handed us something that wasn't JSON — a real, countable failure
    end

  got    = result&.dig(:intent)
  valid  = LeadQualifier::INTENTS.include?(got)
  hit    = valid && got == c[:expect]
  correct += 1 if hit

  mark = hit ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  note = result.nil? ? "invalid JSON" : "expected #{c[:expect]}, got #{got.inspect}"
  printf "  %s  %-55s %s\n", mark, c[:message][0, 55], (hit ? "" : note)
end

accuracy = correct.to_f / CASES.size
puts "\nAccuracy: #{(accuracy * 100).round(1)}% (#{correct}/#{CASES.size})"

if accuracy >= PASS_THRESHOLD
  puts "\e[32mPASS\e[0m — above #{(PASS_THRESHOLD * 100).to_i}% threshold"
  exit 0
else
  puts "\e[31mFAIL\e[0m — below #{(PASS_THRESHOLD * 100).to_i}% threshold"
  exit 1   # non-zero exit means CI fails the build. This is the whole point.
end
```

Run it:

```bash
bundle exec ruby eval.rb
```

```
Running 7 eval cases against claude-opus-4-8

  ✓  What do you charge to file taxes for a two-person LLC?
  ✓  Do you handle crypto gains? Need someone before the deadl
  ✓  Just comparing a few firms, what makes you different?
  ✗  Might need help next year, just poking around for now.    expected cold, got "warm"
  ✓  GROW YOUR BUSINESS — buy 10,000 backlinks cheap!!!
  ✓  are u hiring junior accountants
  ✗  hi                                                         expected cold, got "spam"

Accuracy: 71.4% (5/7)
FAIL — below 90% threshold
```

And _there's_ the thing you cannot get from eyeballing the playground. Five of seven
right looks fine if you squint. But the eval just told you, in a number, that you're
below your own bar — and it told you exactly _which_ inputs are dragging you down. The
"poking around next year" case getting tagged `warm` instead of `cold` is a genuine
prompt-tuning signal: my definitions of warm and cold are blurry, and the model is
(reasonably!) confused at the seam. That's a finding. That's something to fix.

> [!IMPORTANT]
> The `exit 1` is the most important line in the whole file. Wire `ruby eval.rb` into
> CI and a prompt change that drops you below threshold **fails the build**, exactly
> like a broken unit test. Now your non-deterministic feature has a guardrail that a
> human doesn't have to remember to check. That — not the API call — is the deliverable.

## Two things that trip people up

### "But the score wobbles between runs!"

Yes. It will. Run the eval twice and you might get 71% then 86% on a small set, which
feels deeply unsettling to anyone raised on deterministic tests. Two defenses:

- **Set a threshold, not an exact target.** You're asserting `accuracy >= 0.90`, never
  `accuracy == 0.93`. You're testing that the feature clears a bar, not that it hits a
  pixel.
- **Make the set big enough that one flaky case doesn't swing the average off a cliff.**
  Seven cases is a blog post; thirty to fifty is a real eval; a couple hundred and the
  number gets genuinely stable. Variance is a sample-size problem, and sample size is
  free to fix — it's just typing.

### Scoring free-form text: the LLM-as-judge

Matching an enum is easy. But what about that `reason` field — a sentence of free text?
You can't `==` your way to grading prose. "Asks about pricing for a specific service"
and "The person wants a quote" are both correct and share almost no characters.

The trick that feels like cheating but absolutely works: **use a model to grade the
model.** You hand a second Claude call the input, the output, and a rubric, and ask it
for a verdict. It's the same instinct as hiring a second reviewer — you're just
hiring one that costs a fraction of a cent.

```ruby
# A grader for the free-text `reason`. Returns true/false.
def reason_is_grounded?(message, reason, client: Anthropic::Client.new)
  rubric = <<~PROMPT
    A lead message and a one-sentence reason for its classification are below.
    Reply with ONLY "yes" or "no": is the reason an accurate, relevant
    justification grounded in the actual message?

    MESSAGE: #{message}
    REASON:  #{reason}
  PROMPT

  response = client.messages.create(
    model: :"claude-opus-4-8",
    max_tokens: 5,
    messages: [{ role: "user", content: rubric }]
  )
  verdict = response.content.find { |b| b.type == :text }&.text.to_s
  verdict.strip.downcase.start_with?("y")
end
```

Drop that into the runner and now you're scoring the squishy part too. LLM-as-judge
has its own failure modes — judges can be biased toward verbose answers, or too
generous with themselves — so for high stakes you validate the judge against a few
human-labeled examples (an eval for your eval, yes, it's turtles for a little while).
But as a way to put a number on output quality that no regex could ever capture, it's
remarkably effective, and it scales to thousands of cases while you sleep.

## The mental shift, in one line

Here's the whole post compressed for the busy:

> Unit tests pin **deterministic** behavior in place.
> Evals **measure** **non-deterministic** behavior against a threshold.

You still write both. The unit tests around your AI feature don't go anywhere — you'll
still test that the form validates, that the API key loads, that a malformed response
raises instead of corrupting your database. But the model's _judgment_, the soft new
thing in the middle of your app, needs the other kind of test. The kind that gives you
a score, a threshold, and a red build when the number drops.

Start tiny. Ten cases and a threshold beats zero cases and a vibe by an absurd margin.
Wire it into CI before you've convinced yourself it's "ready," because the entire value
is catching the regression you didn't see coming. Then add cases every single time the
thing surprises you in production — each surprise is a free, pre-labeled test case the
real world just handed you.

The determinism we lost at the API boundary isn't coming back. But measurement is the
next best thing, and honestly? After a few weeks of shipping AI features with a real
eval at your back instead of a held breath, you stop missing the dots. A number you can
trust is its own kind of green.

## A glance at what the researchers are finding

I don't want to leave you thinking evals are a tidy, solved discipline where you set a
threshold and stroll away whistling. They're young, and the academic literature right
now is busy discovering — often the hard way — the very lessons you'll trip over
building. So I turned a few research agents loose on the last two months of arXiv (mid-
April through mid-June 2026) so you don't have to. (I leaned on arXiv; Google Scholar
wouldn't be fetched, and I'd rather tell you that than pretend otherwise.) Two themes
run clean through the whole pile, and both sharpen the argument I've been making all
post.

**Theme one: the judge needs a judge.** Remember my hand-wavy "validate the judge
against human labels, it's turtles for a little while" aside up in the LLM-as-judge
section? Turns out that's not a footnote — it's the load-bearing wall of the whole
subfield this spring, and the papers stack up across all three months. Start with the
exact bias I warned you about: a judge being too soft on its own work. Back in April,
[_Self-Preference Bias in Rubric-Based Evaluation_](https://arxiv.org/abs/2604.06996)
(Pombal, Rei & Martins) put a number on it — when a rubric criterion is genuinely
failed, a judge is **up to 50% more likely to wave it through if the output is its
own**. "Fine," you think, "I'll convene a _panel_ of judges and let the bias wash out."
Except May's [_Nine Judges, Two Effective Votes_](https://arxiv.org/abs/2605.29800)
(Kohli) shows a nine-judge panel carries only about **two independent votes' worth of
information** — the judges all trip over the _same_ things, so the errors don't cancel,
they conspire. And by June the big systematic study,
[_Reliability without Validity_](https://arxiv.org/abs/2606.19544) (Norman, Rivera &
Hughes), ran 21 judges over roughly 541,000 judgments and found the headline agreement
numbers inflated by 33–41 points once you correct for chance — catching production
judges that are flawlessly _consistent_ and consistently _biased_ at the same time. The
one that should make anyone who ships sit up: [_Catching One in Five_](https://arxiv.org/abs/2606.10315)
(Zhang, Wang & Lei, June) pointed an LLM judge at a real production agent and watched it
flag **about 22% — two of nine — of the problem patterns humans confirmed were real.**
Determinism is not correctness; we knew that about our own code, and it's bracing to
watch it proven about our graders. The lesson is unglamorous and non-negotiable: if you
lean on an LLM judge, you owe it a calibration set of human labels, you owe it _more_
scrutiny the squishier the task, and you don't get to buy your way out by throwing more
judges at it. The turtles are real. Budget for them.

**Theme two: somebody else's leaderboard is not your eval.** This is the academic
version of the rant I went on earlier — "the benchmarks aren't running _your_ prompt
against _your_ data" — and it shows up at every layer of the stack. At the benchmark
layer, an April meta-analysis, [_The LLM Effect on IR Benchmarks_](https://arxiv.org/abs/2604.05766)
(Staudinger, Kusa & Hanbury), finds measurable contamination quietly propping up
reported gains. At the leaderboard layer, May's [_AgentAtlas_](https://arxiv.org/abs/2605.20530)
(Mazaheri & Mazaheri) shows outcome-only leaderboards hide whether an agent made _good
decisions_ or merely stumbled into the right answer, and June's sprawling
[_Beyond Static Leaderboards_](https://arxiv.org/abs/2606.19704) (Patel et al.) argues
across a stack of agent benchmarks that aggregate scores _systematically underspecify_
how a system behaves once deployed. And at the most damning layer,
[_Search-Time Contamination in Deep Research Agents_](https://arxiv.org/abs/2606.05241)
(Wang et al., June) catches agents that, mid-task, quietly web-search their way to the
benchmark's _own answer key_ and post scores for reasoning they never did. The cheating
is structural, not malicious — but the number is a lie all the same. Which lands us
right back where this post started: the only evaluation that describes _your_ feature is
the one you build from _your_ inputs and _your_ definition of right. The golden set I
made you write by hand isn't busywork. It's the one number on the table that no
leaderboard can contaminate.

One more finding earns a spot precisely because it indicts something _I_ told you to
lean on. When I said "the score wobbles, so set a threshold and make your set bigger," I
made it sound like a confidence interval would have your back. April's
[_Hidden Measurement Error in LLM Pipelines_](https://arxiv.org/abs/2604.11581) (Messing)
is a bucket of cold water: naive standard errors on model-scored evals run **40–60%
smaller than the properly corrected ones**, because the model's own measurement noise
never makes it into the arithmetic. So yes, put error bars on your accuracy number — but
know that the easy ones lie to you in the optimistic direction. Make the set bigger than
feels necessary, and then a little bigger than that.

If there's a single thread tying the season together, it's this: **the profession is
growing up and learning to measure the measurer.** That's the same move this whole post
has been about, just one level higher. Don't trust the model — measure it. Don't trust
the judge — calibrate it, and don't assume a committee of judges fixes it. Don't trust
the leaderboard — build your own. Don't even fully trust your own error bars — widen
them. It's measurement all the way down, and after twenty-five years of green dots, I
find that turtles-all-the-way-down rigor weirdly reassuring.

Now go write ten cases for whatever AI feature is making you nervous. I'll wait.

— Konstantin

San Francisco, CA, June 21, 2026.

## References

 * [Anthropic — Building evals and test suites](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) — the official guidance, and a good next read.
 * [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — how to make malformed JSON impossible instead of merely rare.
 * [Hamel Husain — "Your AI Product Needs Evals"](https://hamel.dev/blog/posts/evals/) — the essay that made a lot of us take this seriously.
 * The official [Anthropic Ruby SDK](https://github.com/anthropics/anthropic-sdk-ruby) — the one gem this whole post stands on.

### Recent papers cited in the closing section

Spanning mid-April through mid-June 2026, in the order they appear above.

_Theme one — the reliability of LLM judges:_

 * José Pombal, Ricardo Rei, André F. T. Martins — ["Self-Preference Bias in Rubric-Based Evaluation of Large Language Models"](https://arxiv.org/abs/2604.06996), arXiv:2604.06996 (April 8, 2026).
 * Guneet Kohli — ["Nine Judges, Two Effective Votes: Correlated Errors Undermine LLM Evaluation Panels"](https://arxiv.org/abs/2605.29800), arXiv:2605.29800 (May 28, 2026).
 * Justin D. Norman, Michael U. Rivera, D. Alex Hughes — ["Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias"](https://arxiv.org/abs/2606.19544), arXiv:2606.19544 (June 17, 2026).
 * Sawyer Zhang, Alexander Wang, Sophie Lei — ["Catching One in Five: LLM-as-Judge Blind Spots in Production Multi-Turn Transaction Agents"](https://arxiv.org/abs/2606.10315), arXiv:2606.10315 (June 9, 2026).

_Theme two — benchmark and leaderboard validity:_

 * Moritz Staudinger, Wojciech Kusa, Allan Hanbury — ["The LLM Effect on IR Benchmarks: A Meta-Analysis of Effectiveness, Baselines, and Contamination"](https://arxiv.org/abs/2604.05766), arXiv:2604.05766 (April 7, 2026).
 * Parsa Mazaheri, Kasra Mazaheri — ["AgentAtlas: Beyond Outcome Leaderboards for LLM Agents"](https://arxiv.org/abs/2605.20530), arXiv:2605.20530 (May 19, 2026).
 * Dhaval C. Patel, Kaoutar El Maghraoui, et al. — ["Beyond Static Leaderboards: Predictive Validity for the Evaluation of LLM Agents"](https://arxiv.org/abs/2606.19704), arXiv:2606.19704 (June 18, 2026).
 * Yongjie Wang, Xinyue Zhang, Kunhong Yao, Zhiwei Zeng, Kaisong Song, Jun Lin, Zhiqi Shen — ["Search-Time Contamination in Deep Research Agents: Measuring Performance Inflation in Public Benchmark Evaluation"](https://arxiv.org/abs/2606.05241), arXiv:2606.05241 (June 3, 2026).

_The statistics of eval scores:_

 * Solomon Messing — ["Hidden Measurement Error in LLM Pipelines Distorts Annotation, Evaluation, and Benchmarking"](https://arxiv.org/abs/2604.11581), arXiv:2604.11581 (April 13, 2026).
