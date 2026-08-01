---
title: "Qualified.at Is Live: When You Over-Engineer a Form, the Least You Can Do is Launch the Damn Site..."
date: "2026-07-29"
permalink: "/2026/07/29/qualified-at-is-live.html"
category: "AI"
tags: ["ai", "llm", "inquirex", "forms", "lead-qualification", "saas", "rails", "javascript", "ruby", "launch"]
description: "The three-gems + one npmjs package form engine from my SF Ruby talk grew a SaaS site with a pricing page. Qualified.at gives you tools to create multi-branching forms, extract answers from free-form text using LLM, and ultimately it qualifies your leads while you sleep, and, importantly, refuses to store anybody's SSN. Come poke at it, hopefully you'll like it. Up to 1000 leads is free forever."
heroImage: "/assets/images/posts/qualified/qualified-home.jpg"
comments: true
draft: false
author: kig
headScripts:
  - "/assets/js/qualified-blog-intake.js"
  - src: "https://qualified.at/embed/9a4eb508fd392c3bd05a11fad4f1bd35?origin=https%3A%2F%2Fkig.re%2F&sig=135c3df529de50306ec631a103ddc41278e397cb225a7469567abcdd9185ec90"
    data-trigger: "element"
    data-element: "#qualified-blog-intake"
---

## Previously, on "How Hard Can a Form Be"

[Last time](/2026/07/11/ruby-talk-about-deterministic-meets-probablistic.html), my wife asked for "a little form" on her tax site, and I responded the way any reasonable engineer would: four interconnected Ruby gems, a typed directed graph, an LLM extraction layer, and a talk at SF Ruby about it. Her form worked. My weekends did not.

There is exactly one dignified exit from a hole like that. You do not climb out. You install plumbing, put up a sign, and start charging admission.

So: **[qualified.at](https://qualified.at)** is live. It's the hosted version of the Inquirex engine, and its entire job is to make sure you never again spend 30 minutes on the phone asking a prospect whether they're married.

But not to undersell my own first SaaS product, I realized that nobody except developers will bother writing a form definition in a DSL, even if it's easy, because for long forms it's not that easy to be completely honest.

So, I decided to bite the bullet, and after a day of me and Claude fighting between each other and with the world of JavaScript, we got the Visual Editor that can build the DSL for you. And that, my friends, is a game changer.

## Visual Editor FTW

Here are two screenshots of a Visual Editor building the form that takes name and email, but only if you first consent to it:

![visual-editor](/assets/images/posts/qualified/qualified-at-gui-inspector.png)

Here you see the editor in full glory: one of the questions is selected, and the inspector window on the right alows you to configure in its entirety: where we go from there based on answers, and so on.

At any moment, you can hit the DSL menu link up top, and it will show you the auto-generated DSL.

![visual-editor](/assets/images/posts/qualified/qualified-at-gui-dsl.png)

And what this post truly lacked is a screenshot of the actual copilot window in action:

<p align="center">
  <img src="/assets/images/posts/qualified/copilot.png" width="300"/>
</p>


## Pricing

There really are three levels of accounts:

1. **Free Forever** accounts are limited to up to two sites, and up to the total of 1,000 leads across the two. Once you reach that number, your account continues taking leads, but until you upgrade they are not visible to you.

<br />

2. "Basic" is the $29/month account with practically every feature enabled. Not onlh it includes 1,000 leads, but since it's paid account — it's 1,000 leads **per month**. Any extra leads in any given month cost additional $10 per 1,000. Only the paid accounts have the `extract` LLM-based keyword, and a few other nice features. For details, please checkout the [pricing pages](https://qualified.at/#pricing).

<br />

3. "Pro" is the top tier, at $49/month, and this account includes up to 5,000 leads per month, with the same $10 per extra 1,000 overages as the Basic. But, being a Pro account, it includes some real Pro features such as:
   - White-label branding
   - Automatic Theme Creator based on your site look and feel
   - Your own Google Analytics ID
   - CRM webhooks after completion of the form, and email sending within the form.
   - 24-hour turnaround support

<br />

4. And finally, there is an "Enterprise" level, which is negotiated case by case basis, with businesses whose volume is significantly higher than that, and that might need additional features developed.

> [!TIP]
>
> Once again, the pricing and the features are [available here](https://qualified.at/#pricing).

## What It Actually Is

Qualified.at is lead qualification for professional services: tax preparers, financial advisors, attorneys, consultants. Anyone whose first call with every prospect starts with the same ten questions, asked by a human, billed to nobody.

You define your questions once, in the Inquirex Ruby DSL or plain JSON (the `inquirex` CLI converts between the two without losing anything, because of course it does). Qualified.at turns that into a multi-step widget that sits on your site and interviews visitors around the clock. Branching, typed answers, running fee estimates via `cost_per_item` and `cost_formula`, the whole graph-theory circus from the talk, except now somebody else runs the servers. That somebody is me. Pray for me.

What lands in your inbox is not "name and email," which is what most contact forms proudly deliver after 25 years of web innovation. It's the answers: filing status, dependents, income sources, case type, whatever your flow asks. A lead that is already qualified before anyone picks up a phone.

## The Party Trick or a Killer Feature? T he `extract` Keyword

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

<!-- <div id="qualified-blog-intake" style="text-align:center; margin: 36px 0 30px 0; padding: 5px; background-color: #FFB020; color: black; font-weight: 800; font-size: 1.3em; border-radius: 10px; cursor: hand;">
  Start the Intake
</div> -->

> [!NOTE]
>
> Full disclosure: the widget embed for this post is being wired up as we speak. If the button opens the qualified.at homepage instead of a modal, I haven't flipped the switch yet. Come back tomorrow, or heckle me in the comments — both motivate me equally.

<!-- Try to break it. Ramble at the text box. Describe your situation in the style of a 19th-century Russian novel. Paste in your grocery list and see what it extracts (a lead with `dependents: 0` and a concerning quantity of cheese, probably). The regex guard will bounce anything that looks like an SSN, so don't bother — several of you were absolutely going to try. -->

## The Honest Pitch

If you run a tax practice, a law office, an advisory shop, or any business where the first conversation is an unpaid interrogation: [qualified.at](https://qualified.at) will do that interrogation for you, politely, at 2 AM, in your brand colors. The first thousand leads are free. My wife is the alpha customer, which means the bug reports arrive at dinner.

And if you're an engineer and all of this smells suspiciously like a directed graph wearing a business suit — correct. The [talk and the four gems](/2026/07/11/ruby-talk-about-deterministic-meets-probablistic.html) are still open source. The SaaS is just the part where I finally listened to everyone who said "you should charge for this."

Go on. The button's right there.
