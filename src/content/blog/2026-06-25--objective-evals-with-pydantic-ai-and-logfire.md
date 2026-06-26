---
title: "Objective Evals with the Pydantic Stack: PydanticAI, Logfire, and Choosing an Eval Framework"
date: 2026-06-25
permalink: "/2026/06/25/objective-evals-with-pydantic-ai-and-logfire.html"
category: "Applied AI"
tags: ["ai", "llm", "evals", "pydantic", "pydantic-ai", "logfire", "python", "testing"]
description: "A sequel to the evals post: when your output has real ground truth, you don't need an LLM judge — you need an objective eval. A tour of the Pydantic stack (PydanticAI, Logfire, pydantic-evals) plus a verified comparison of Python eval frameworks through the objective-eval lens."
draft: true
comments: true
---
<!--
  ==========================================================================================
  DRAFT — HOLDING STATE. The worked example is intentionally NOT written yet (see the
  "Worked example" placeholder below). This file currently carries the thesis, the verified
  Pydantic-stack reference, and the eval-framework comparison — the research backbone. A new
  worked example is being chosen and will be slotted in. The original paint/color/LAB/Delta-E
  example was pulled out and parked in notes/drafts/color-matching-post.md for its own future

Do NOT publish until the example lands and frontmatter (incl. heroImage) is finalized.
  ==========================================================================================
-->

In the [last post](/2026/06/21/writing-evals-for-ai-powered-apps.html) I made the case
for **evals** — the unit tests for the non-deterministic parts of your app — and when
the output got squishy (a free-text field), I reached for an **LLM-as-judge**: hire a
second model to grade the first. That works, but I buried a warning in there, and the
[research I dug up](/2026/06/21/writing-evals-for-ai-powered-apps.html) only sharpened
it: judges are biased, judges are expensive, and a panel of nine judges is worth about
two. The judge is the tool of last resort.

This post is about the tool of _first_ resort, the one I wish more people reached for
before defaulting to "ask a model": the **objective eval**. When your task has real
ground truth — a right answer you can compute, measure, or look up — you don't need a
judge's opinion. You need arithmetic. And arithmetic doesn't have a position bias,
doesn't cost a fraction of a cent per call, and never, ever flatters its own work.

We'll build it in Python this time (a change of scenery from the Ruby last post, and the
natural home for the stack I want to show you): the **Pydantic** trio I keep coming back
to — **Pydantic** for the types, **PydanticAI** for the agent, **Logfire** for seeing
what happened — and then we'll pick an eval framework with eyes open, because that
landscape moves fast and "use the one I used last year" is not a strategy.

## Pydantic: the typed contract that makes LLM output safe to act on

Before any AI, the types. A language model returns _text_; a hallucinated string in the
wrong place is how you end up passing `"warmish-ish"` into a function that expected a
float. Pydantic is the airlock between the model's imagination and your real code — you
declare the shape you require, and anything that doesn't fit bounces off with a
`ValidationError` _before_ it reaches logic that trusts it.

```python
from pydantic import BaseModel, Field

class ExtractedInvoice(BaseModel):
    vendor: str
    total_cents: int = Field(ge=0)            # a negative invoice total is a bug, not a value
    currency: str = Field(pattern=r"^[A-Z]{3}$")
```

That `Field(...)` is not decoration. **Validation is your first line of defense**, and
it's free. PydanticAI even feeds these constraints to the model and, on a validation
failure, hands the error back so it can retry. The schema does double duty: it documents
the contract _and_ enforces it.

## PydanticAI: the agent that produces a typed result

PydanticAI's whole pitch is "FastAPI for GenAI" — declare an `Agent`, give it an
`output_type`, and it returns a validated instance of your model or dies trying. The
current, verified minimal shape (from the official docs):

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class CityLocation(BaseModel):
    city: str
    country: str

agent = Agent('anthropic:claude-opus-4-8', output_type=CityLocation)  # any provider:model string
result = agent.run_sync('Where were the olympics held in 2012?')
print(result.output)
#> city='London' country='United Kingdom'
```

The model string is `'provider:model'`. Run synchronously with `agent.run_sync(...)` or
async with `await agent.run(...)`; either way the validated value is `result.output`.
System guidance goes in `instructions=` (or `system_prompt=` if you want it to persist
across message history).

> [!NOTE]
> **A versioning landmine, since this stuff moves fast.** PydanticAI renamed
> `result_type` → `output_type` and `result.data` → `result.output` on the road to 1.0
> (the deprecated old names were removed in **v0.6.0**, before the 1.0 release). If a
> tutorial you're reading uses `result.data`, it's pre-1.0. On any current install
> (`pydantic-ai` is well past 1.0 now) it's `output_type` and `result.output`. I verified
> this against the current docs while writing — but pin your versions, because the docs'
> own examples already use model IDs that didn't exist last quarter.

## Logfire: seeing the whole pipeline (and why evals need observability)

A pipeline with a fuzzy front end (the model) and a deterministic back end (your logic)
has a debugging problem: when a result looks wrong, _which half broke?_ Without
visibility you're guessing, and guessing about a non-deterministic component is a special
kind of misery.

**Logfire** is Pydantic's observability layer — an opinionated wrapper around
OpenTelemetry — with first-class hooks for this stack. One call instruments every
PydanticAI agent run; a `with` block wraps anything else you care about:

```python
import logfire

logfire.configure()                 # no token -> local OTel only; add one to ship to the UI
logfire.instrument_pydantic_ai()    # every agent run is now a span

with logfire.span('do_the_work', request=user_text):
    ...                             # agent runs and your own steps nest as child spans
```

Run a request and Logfire shows you a span tree: the outer operation, a nested LLM call
(prompt, model, token counts, the parsed output), then whatever deterministic steps you
wrapped. **This isn't a nice-to-have for evals — it's load-bearing.** When an eval case
fails, the score tells you _that_ it failed; the trace tells you _why_. The two are a
pair, which is why the eval framework I reach for first is the one that speaks the same
tracing language as the rest of the stack.

> [!NOTE]
> Logfire is OpenTelemetry under the hood, so "no Logfire account" doesn't mean "no
> observability" — point it at any OTel-compatible backend, or just run it locally. The
> hosted UI is the nice-to-have; the instrumentation is the thing. (I verified the method
> names against the current docs: `logfire.instrument_pydantic_ai()` and
> `logfire.instrument_anthropic()` are both real. The exact `configure()` kwarg for
> forcing local-only — `send_to_logfire="if-token-present"` — I'm relaying from the docs
> rather than from a page I could pin, so treat that one literal as "check before you lean
> on it.")

## pydantic-evals: an objective eval in the same stack

When we get to the worked example, the eval itself will live in **pydantic-evals** —
Pydantic's own eval framework — because it expresses an objective scorer natively and
sends its traces to the same Logfire pane as everything else. The verified building
blocks (from the official docs):

```python
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext, IsInstance

case1 = Case(
    name='simple_case',
    inputs='What is the capital of France?',
    expected_output='Paris',
)

class MyEvaluator(Evaluator[str, str]):
    def evaluate(self, ctx: EvaluatorContext[str, str]) -> float:
        return 1.0 if ctx.output == ctx.expected_output else 0.0   # return bool=assert, float=score

dataset = Dataset(cases=[case1], evaluators=[IsInstance(type_name='str'), MyEvaluator()])

async def task(question: str) -> str:
    return 'Paris'

report = dataset.evaluate_sync(task)
report.print(include_input=True, include_output=True)
```

A custom **objective** scorer is just an `Evaluator` subclass whose `evaluate(self, ctx)`
returns a `bool` (pass/fail) or a `float` (score); `ctx.output`, `ctx.expected_output`,
and `ctx.inputs` are the fields you score against. Built-ins like `EqualsExpected` and
`IsInstance` cover the common objective checks; `Dataset.evaluate_sync(task)` runs it and
returns an `EvaluationReport`. No judge in sight — and the run shows up as spans in
Logfire next to the agent calls.

## Worked example — coming next

> [!IMPORTANT]
> **This section is intentionally blank for now.** I'm slotting in a worked example that
> shows the full pattern end to end: a PydanticAI agent producing a typed query, Logfire
> tracing the pipeline, and an **objective eval** scoring the deterministic part against a
> golden set with a real number and a real threshold — the rigorous, ground-truth
> counterpart to last post's LLM-as-judge. (An earlier draft used a paint-color /
> Delta-E matcher; that's been pulled out to become its own post.) The example lands here.

## Choosing an eval framework, through the objective-eval lens

"Just use pydantic-evals" is the answer if you're already in this stack, but it's not the
only good answer, and the landscape moves fast enough that I went and checked the current
docs rather than trusting my memory. Here's how the major players look specifically
through the **objective-eval** lens — can you write _custom deterministic scorers_, set
_numeric thresholds_, gate _CI_, and tie into _tracing_ — rather than the usual
LLM-judge-first framing. (Versions are what I read off the docs/PyPI in June 2026; pin
and re-check.)

<div class="zoom-table" tabindex="0">

| Framework | Lang | Custom deterministic scorer | Numeric threshold | CI gate | Tracing tie-in | Local / hosted |
|---|:-:|:-:|:-:|:-:|---|---|
| **pydantic-evals** | Python | `Evaluator` subclass; `evaluate()` returns `bool`/`float` | per-evaluator, in code | call from your own test, assert on report | **Logfire / OpenTelemetry, native** | open-source, local; UI optional |
| **DeepEval** | Python | `BaseMetric` subclass; `measure()` sets `self.score`/`self.success` | `self.threshold` in `__init__` | **first-class**: `assert_test` + `deepeval test run` (pytest-style) | `@observe`/`trace`; Confident AI dashboard | open-source, local-first; optional SaaS |
| **Inspect** (UK AISI) | Python | `@scorer` decorator returning a `Score`; rich built-ins (`exact`, `match`, `f1`, `pattern`…) | via metrics on the `Task` | CLI/`eval()` harness | own log viewer | **open-source, local-only** |
| **Promptfoo** | Node/YAML | `type: python\|javascript` assert returning bool/score/`GradingResult` | `threshold` + `weight` in YAML | strong: GitHub Action, `--fail-on-error` | own web viewer (no Logfire) | open-source, fully local |
| **Ragas** | Python | `@numeric_metric` / `@discrete_metric` decorators; non-LLM metrics (Exact Match, BLEU, ROUGE) | your own assertion on the score | none native | LangChain + observability hooks | open-source, local |
| **Braintrust** (`autoevals`) | Python/TS | scorer fn returns `{name, score}`; `autoevals` ships `ExactMatch`, `Levenshtein`, `NumericDiff`, `JSONDiff` | in your scorer | CI-supported; `bt eval` | **OpenTelemetry**; dashboards | SDK + `autoevals` open-source; **reports need the hosted platform** (local mode is terminal-only) |
| **LangSmith** | Python/TS | code evaluators = "deterministic rule-based fns"; `t.log_feedback(key, score)` | your assertions | **first-class pytest**: `@pytest.mark.langsmith` | own tracing dashboard | SDK open-source; **reporting expects the hosted platform** (pytest dry-run aside) |

</div>

A few honest reads from that table:

- **For this stack, pydantic-evals is the natural pick** — not because it has the most
  built-in scorers (it doesn't; Inspect's deterministic toolbox is richer), but because
  its custom-scorer model is dead simple and it's the _only_ one wired into Logfire
  natively, so your eval failures and your traces live in one place.
- **If you want pytest in your bones**, DeepEval and LangSmith have the most native
  test-runner integration; DeepEval keeps it local, LangSmith leans on its hosted platform
  for the reporting half.
- **If you want zero SaaS and a deep deterministic toolbox**, Inspect (from the UK AI
  Safety Institute) is the heavyweight — `exact`, `match`, `f1`, `pattern`, and custom
  `@scorer` functions, all local. It's built for model evaluations, but the scorer
  machinery is perfectly happy grading your app.
- **Promptfoo is the outlier**: it's Node/YAML, not Python, so it doesn't fit a Pydantic
  codebase as snugly — but its pile of built-in deterministic assertions (`equals`,
  `regex`, `is-json`, `levenshtein`, `cost`, `latency`) and its `--fail-on-error` CI story
  are genuinely excellent if you don't mind config-first and a separate runtime.
- **Braintrust and LangSmith** both let you _write_ objective scorers in plain Python and
  run them locally, but their value proposition is the hosted dashboard — the reporting and
  regression-comparison half lives behind an API key. `autoevals` (Braintrust's
  MIT-licensed scorer library) is the most reusable standalone piece if you just want
  `ExactMatch` and friends without buying in.

I left a few names off the table — Phoenix/Arize, Weave, TruLens, OpenAI Evals, Giskard —
not as a verdict on quality but because I couldn't verify their _current_ objective-eval
specifics to the standard I'd want before putting a checkmark in a grid. If you live in one
of those and it grades deterministic ground truth well, I'd genuinely like to hear it in
the comments.

## The takeaway: reach for the ruler before the judge

Last post left you with "measure the measurer." This one narrows it to a rule of thumb I'd
tattoo on a junior engineer if it were legal:

> **If you can compute the right answer, compute it. Hire a judge only for the questions
> that genuinely don't have one.**

So much of what we drape an LLM over has a checkable right answer hiding underneath the
natural-language wrapper — extraction (did you pull the right total?), classification (the
label is the label), routing, ranking, dedup, units, dates. For all of it, an objective
eval gives you a real number, a real threshold, and a red build, at zero marginal cost and
with none of a judge's biases. Save the judge for the genuinely squishy stuff — the tone,
the helpfulness, the prose. For everything else, there's a ruler. Use the ruler.

— Konstantin

San Francisco, CA, June 22, 2026.

## References

 * [PydanticAI documentation](https://pydantic.dev/docs/ai/) — the agent framework; see the structured-output page for `output_type` / `result.output`.
 * [pydantic-evals documentation](https://pydantic.dev/docs/ai/evals/evals/) — `Case`, `Dataset`, custom `Evaluator`, and the built-in evaluators.
 * [Logfire documentation](https://pydantic.dev/docs/logfire/) — OpenTelemetry-based observability; `instrument_pydantic_ai()` and friends.
 * [Pydantic](https://docs.pydantic.dev/) — the validation library the whole stack is built on.
 * [DeepEval](https://github.com/confident-ai/deepeval) · [Inspect (UK AISI)](https://inspect.aisi.org.uk/) · [Promptfoo](https://www.promptfoo.dev/) · [Ragas](https://docs.ragas.io/) · [Braintrust autoevals](https://github.com/braintrustdata/autoevals) · [LangSmith evaluation](https://docs.langchain.com/langsmith/) — the frameworks compared above.
 * My previous post — ["Evals: The Unit Tests for the Non-Deterministic Parts of Your App"](/2026/06/21/writing-evals-for-ai-powered-apps.html) — the subjective/LLM-as-judge half of this story.
