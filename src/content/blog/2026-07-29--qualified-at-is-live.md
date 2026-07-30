---
title: "Qualified.at Is Live: When You Over-Engineer a Form, the Least You Can Do Is Charge for It"
date: "2026-07-29"
permalink: "/2026/07/29/qualified-at-is-live.html"
category: "AI"
tags: ["ai", "llm", "inquirex", "forms", "lead-qualification", "saas", "rails", "javascript", "ruby", "launch"]
description: "The four-gem form engine from my SF Ruby talk grew a pricing page. Qualified.at qualifies your leads while you sleep, extracts structured answers from human rambling, and refuses to store anybody's SSN. Come poke it."
heroImage: "/assets/images/posts/qualified/qualified-home.jpg"
comments: true
draft: false
author: kig
headScripts: ["/assets/js/qualified-blog-intake.js"]
---

## Previously, on "How Hard Can a Form Be"

[Last time](/2026/07/11/ruby-talk-about-deterministic-meets-probablistic.html), my wife asked for "a little form" on her tax site, and I responded the way any reasonable engineer would: four interconnected Ruby gems, a typed directed graph, an LLM extraction layer, and a talk at SF Ruby about it. Her form worked. My weekends did not.

There is exactly one dignified exit from a hole like that. You do not climb out. You install plumbing, put up a sign, and start charging admission.

So: **[qualified.at](https://qualified.at)** is live. It's the hosted version of the Inquirex engine, and its entire job is to make sure you never again spend 30 minutes on the phone asking a prospect whether they're married.

## What It Actually Is

Qualified.at is lead qualification for professional services: tax preparers, financial advisors, attorneys, consultants. Anyone whose first call with every prospect starts with the same ten questions, asked by a human, billed to nobody.

You define your questions once, in the Inquirex Ruby DSL or plain JSON (the `inquirex` CLI converts between the two without losing anything, because of course it does). Qualified.at turns that into a multi-step widget that sits on your site and interviews visitors around the clock. Branching, typed answers, running fee estimates via `cost_per_item` and `cost_formula`, the whole graph-theory circus from the talk, except now somebody else runs the servers. That somebody is me. Pray for me.

What lands in your inbox is not "name and email," which is what most contact forms proudly deliver after 25 years of web innovation. It's the answers: filing status, dependents, income sources, case type, whatever your flow asks. A lead that is already qualified before anyone picks up a phone.

## The Party Trick: the `extract` Keyword

Here is the part I actually care about, and the reason the previous post existed. Nobody wants to click through 17 form controls. People do, however, love telling you their life story. So the widget leads with one big text box: *describe your situation*.

The visitor types something like:

> "We're married, two kids, I have a W-2 from a biotech, my husband drives for Uber on weekends, we sold some ESPP shares in March, and there may or may not be a small Etsy store selling alpaca-wool socks."

The `extract` keyword hands that ramble to an LLM along with a strict JSON schema derived from your deterministic flow definition. Temperature zero. No poetry. Out comes:

```json
{
  "filing_status": "married_jointly",
  "dependents": 2,
  "income_types": ["w2", "self_employment", "stock_sales"],
  "small_business": true
}
```

The engine validates the types, marks those questions answered, and then asks **only what's still missing**. The visitor answered eight questions by typing one honest paragraph, and the form appears to have read their mind. It did not read their mind. It read their paragraph. Lower your standards for miracles and the miracles show up on time.

![Qualified.at — AI does the heavy lifting](/assets/images/posts/qualified/qualified-ai-extract.jpg)

Two details here that I refuse to be modest about:

1. **PII protection runs before the AI does.** Regex-based detection catches SSNs, ITINs, and similar radioactive material and rejects the submission before it ever reaches the server, let alone a model. The stats bar on the homepage says "0 PII stored or transmitted," and it's not marketing bravado, it's a hard filter written by a man whose wife handles other people's tax documents for a living.
1. **The extraction is schema-bound.** The LLM cannot invent a question, hallucinate a dependent, or free-associate about the alternative minimum tax. It fills slots the deterministic graph defined, or it fills nothing. Deterministic skeleton, probabilistic muscle. That division of labor is the entire thesis, and it's why this works when "just let the chatbot handle intake" ends in tears and a compliance meeting.

## Integration for People Who Have Better Things to Do

The embed is a few lines of JavaScript. The widget opens in an iframe, triggered by any element's DOM id, or on a timer if you enjoy ambushing your visitors after five seconds. WordPress, Squarespace, static HTML, your artisanal hand-rolled SPA — it doesn't care. No backend changes, no build step, no npm dependency tree arriving like a Trojan horse.

![Qualified.at — one snippet integration](/assets/images/posts/qualified/qualified-one-snippet.jpg)

White-labeling is included: your colors, your fonts, your domain. The lead never learns they left your site, and you never have to explain what a "qualified.at" is to a client who still prints their emails.

There's a free tier — a thousand leads, no credit card — though the AI `extract` keyword lives in the paid plans, because the tokens it burns are, regrettably, denominated in my actual money. The bigger tiers the pricing page labels "coming soon," which is startup for "I am one Rails migration away."

## Poke It From This Very Post

Now, the fun part. This blog post is not just an announcement, it's a test bench. The button below starts an intake flow built specifically for this blog. Not a tax flow. Think of it as me qualifying *you*, dear reader, which seems only fair after everything we've been through together.

<p style="text-align:center; margin: 36px 0 30px 0;">
  <a class="intake-cta" id="qualified-blog-intake" href="https://qualified.at" target="_blank" rel="noopener">Start the intake — right here →</a>
</p>

> [!NOTE]
>
> Full disclosure: the widget embed for this post is being wired up as we speak. If the button opens the qualified.at homepage instead of a modal, I haven't flipped the switch yet. Come back tomorrow, or heckle me in the comments — both motivate me equally.

Try to break it. Ramble at the text box. Describe your situation in the style of a 19th-century Russian novel. Paste in your grocery list and see what it extracts (a lead with `dependents: 0` and a concerning quantity of cheese, probably). The regex guard will bounce anything that looks like an SSN, so don't bother — several of you were absolutely going to try.

## The Honest Pitch

If you run a tax practice, a law office, an advisory shop, or any business where the first conversation is an unpaid interrogation: [qualified.at](https://qualified.at) will do that interrogation for you, politely, at 2 AM, in your brand colors. The first thousand leads are free. My wife is the alpha customer, which means the bug reports arrive at dinner.

And if you're an engineer and all of this smells suspiciously like a directed graph wearing a business suit — correct. The [talk and the four gems](/2026/07/11/ruby-talk-about-deterministic-meets-probablistic.html) are still open source. The SaaS is just the part where I finally listened to everyone who said "you should charge for this."

Go on. The button's right there.
