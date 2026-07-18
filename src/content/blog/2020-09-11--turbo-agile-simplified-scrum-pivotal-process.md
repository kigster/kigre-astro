---
title: "Turbo Agile™: Optimizing Efficiency of the Engineering Process for Maximum Velocity."
date: 2020-09-11
permalink: "/2020/09/11/turbo-agile-simplified-scrum-pivotal-process.html"
category: "Essays"
tags: ["pivotal", "tracker", "project-management", "agile", "process", "engineering-management"]
description: "A simplified, story-estimation-centric take on Agile/SCRUM distilled from five-plus years running engineering at Wanelo — sprint planners, design breakouts, daily stand-ups, retros, a consistent point system, and the common planning mistakes that sink most teams."
heroImage: "/assets/images/posts/agile/process-00.jpg"
comments: true
author: kig
---
This post is about a software engineering process most similar to what is practiced by Pivotal Labs consultancy, with some SCRUM sprinkled in, and with some tweaks and adjustments applied.

## Introduction

The name "Turbo Agile™" is a derivative of "Aggro Agile™" — what we've been calling it at [Wanelo](/2012/09/14/the-big-switch-how-we-rebuilt-wanelo-from-scratch-and-lived-to-tell-about-it.html). Personally, I don't love the word "Aggro", but "Turbo" makes sense to me — hence the name change.

My former colleagues — several senior engineers with whom I practiced the process described in this post, later referred to it as *"The dictionary definition of efficient, and well oiled engineering practice."*

Why would they think so, and why so many other companies are struggling with a "Heavy Weight Agile" process, that puts together teams of 2-3 developers against 1 project manager, 1 PM, 2 QA, and 1 Ops person? No wonder absolutely nothing gets done!

It's taken me five years to distill the Agile Process to its core, and another give years to actually put this in writing, because there are lots of nuances. My hope is that you, dear reader, will see the light and apply this process judiciously,

> [!NOTE]
> Estimated reading time: *10mins.*

### SCRUM: Unnecessarily Complicated Process

If you look at this diagram of a typical "SCRUM" process, it's no wonder that nobody bloody understands it.

![Complicado](/assets/images/posts/agile/process-01.jpg)

I mean, "Respect"? "Focus"?

Those are all nice things, but guys — can we please simplify the process down to the bone, and remove any obstacles?

### An Ideal Engineering Process, Who Are You?

Before we dive in, lets first agree on what is considered a "good" process -- i.e. what are the desirable tenets of an ideal software development process?

<dl>
  <dt>Transparent</dt>
  <dd>Any team member, a manager, or an executive can get a clear picture of where the development is at at any given time. Everyone knows roughly what others are working on.</dd>

  <dt>Predictable</dt>
  <dd>Based on story estimations, product and executives are able to get relatively accurate predictions of the completion dates of various projects.</dd>

  <dt>Prioritized</dt>
  <dd>Engineers coming to work in the morning should have no confusion as to what to work on and what NOT to work on. The stories should be prioritized in a linear fashion, so that once one is finished, another can be started.</dd>

  <dt>Inclusive</dt>
  <dd>All engineers on the team feel that they are able to contribute to their fullest potential, consistently feel heard, and are able to effectively participate in all design discussions and debates.</dd>

  <dt>Low Overhead</dt>
  <dd>Software engineering and design take up the vast majority of the time, while planning, discussing, and managing the process is a tiny fraction of time in comparison.</dd>

  <dt>Synchronous</dt>
  <dd>Both the PMs and the engineers are constantly in sync by way of daily stand-ups, and everyone is clear what to work on. Project management tool shows all "in progress" stories at the top.</dd>

  <dt>Adaptive</dt>
  <dd>Unforeseen circumstances happen, and sometimes they introduce change at the last minute, or alter the priorities. A good process can absorb a reasonable number of pivots without too much overhead.</dd>

  <dt>Supportive</dt>
  <dd>The team members know they can reach out for help when needed. There is an easy way to communicate any blocking issues and get help as quickly as possible.</dd>

  <dt>Collaborative</dt>
  <dd>New engineers onboard via pairing with a rotating schedule of experienced engineers. They are able to learn the ropes and get up to speed quickly.</dd>
</dl>

In general pair-programming is encouraged and is well supported by the company, in terms of the tools (such as TeamViewer)

![Agile](/assets/images/posts/agile/process-02.png)

### Structure of Turbo Agile™

The process described below addresses all of the above goals, and we will point out which of the goals is specifically provided by each process feature.

At the heart of this is a process known as a "Story Writing and Estimation". There are [numerous resources](https://www.thoughtworks.com/insights/blog/how-estimating-story-counts-worked-us) on the subject.

### Why Estimate Stories?

If you never participated in a well-oiled story estimation meeting, you may be thinking that this is an unnecessary overhead, or even a bureaucracy. If you are coding alone and your work does not affect anyone, then perhaps you are right. And yet, most of the time engineers working in teams, or groups, i.e. not in isolation -- must constantly communicate. For the team to be effective everyone needs to be on the same page. Which in turn requires an effort of some sort -- sprint planner just happens to be one of the most effective ways to address multiple desires and goals listed above at the same time.

With everyone working remotely during the COVID pandemic, it becomes even harder to keep everyone on the same page. Working remotely requires an additional effort to keep everyone in sync, which makes this already very important meeting absolutely critical to the overall success.

Lets review how this works, and why it solves several of our goals mentioned above.

In order to properly estimate a story, software engineers must:

. Understand all of the requirements (both explicitly mentioned, and implicit)
. Raise and discuss any undocumented corner cases, and document them
. Review any non-user facing requirements, such as deployment and infrastructure needs
. Raise any concerns regarding scalability, security, stability of the overall system
. Be able to create a "back of the napkin" version of the design they will implement in order to size it accurately.
. Be able to push back and offer alternative solutions or shortcuts that may be unknown to the stakeholders

The planner not only puts everyone on the same page with respect to the above points, but also lets the team members validate the chosen implementation approach, whereby avoiding unpleasant surprises later. And it works, most of the time 😂

With this in mind, let's get to it -- in the next section we'll describe this process in detail.

## Turbo Agile in a Nutshell

The Turbo Agile is really just *a software engineering process focused on constant collaboration, continuous and incremental updates and deployments, rigorous automated testing, CI/CD pipelines, and a set of very specific meetings + tools + practices.*

The goal of this process is to *increase the overall team productivity* as well as the each developer's *happiness and job satisfaction*. It accomplishes this by empowering the right individuals with making decisions -- such as story implementation, problem solving, software design, and story estimates. It creates transparency by having a predictable prioritized backlog of fully estimated stories to work on.

## Meetings Overview

**Sprint Planner**

> This is typically a weekly (or bi-weekly) meeting where story estimation happens with the entire team present, plus a PM and any other stakeholders. In some companies, folks representing Security, DevOps, Legal or Marketing may also be present at their choosing.  *This meeting is the most important key element of Turbo Agile, and we'll discuss it in details below.*

**Design Breakout**

> This is another important meeting that often happens as a result of identifying complex requirements during the planner. This meeting should be small, with the least number of engineers required to approve the implementation path.
A requirement for this meeting is a whiteboard, although virtual collaborative diagramming tools are just as good.

**Daily Stand-Up**

> This is the second most important meeting that should only last about 15 minutes max. During this meeting a moderator asks each engineer to report on three questions only:
>
> - What you did yesterday (or the last business day)?
> - What are you planning on doing today?
> - Is there anything blocking you?

---

If someone reports a blocking situation, **standup is NOT the place to resolve it**, but it IS a place to acknowledge it and setup a quick follow-up *Design Breakout* with interested parties, often immediately following the standup.

For those who engage in pair-programming, daily stand-ups also serve as the time and place to choose or "rotate out" your pairing partner, and decide what to work on next.

**Retrospective**

> Another very important (weekly or bi-weekly) meeting, retrospective is moderated by either a manager or someone on the team (can be on rotation). During the retro people are encouraged to write their impressions of the previous week on the white board, into three columns: Happy, Sad and Neutral. Others can add +1 to items already written. This goes on for about 15 minutes.
> After that, the moderator reads each item, typically starting with the Sad column, and finishing with the Happy column to celebrate the wins and acknowledge the high performers.
The point of a retrospective is to give everyone, even the most introverted folks, an opportunity to be heard -- i.e. raise issues and concerns in a non-judgmental and friendly setting.

**Demo**

> Optional or eg. Monthly -- this is an meeting where developers are encouraged to demo their work. While useful and good for morale, this meeting can sometimes feel like a drag when delivered stories have no visual context, such as backend changes. If any meeting has to be dropped from the schedule, it would be this one.

## Design Breakout

As was mentioned earlier, this is a break-out meeting that often gets called out during the planner, when a complicated story is discovered that needs further digging.

Typically one person is elected as the Lead, and their job is to aggregate, process, and classify everyone's ideas on the white board. The discussion revolves around diagramming components, documenting goals and non-goals, concerns, risks and eventually -- all moving parts needed to complete it.

When each item can be independently estimated, they are entered into the Tracker as stories, and estimated either right at the Design Meeting, or in a follow-up Planner.

> [!TIP]
> *If design breakout was a function, it's output would be the list of estimated and well documented stories.*

## Sprint Planner

**Spring Planner** is a meeting with one simple goal:

> [!TIP]
>
> *If sprint planner was a function, it's output would be a list of fully estimated and agreed upon stories, that collectively take up more than a week of time to implement (or whatever the sprint length is).*

In reality there should be more pre-estimated stories than just one sprint's worth, because if someone gets done early they need to know what to be working on next.

### Feature Breakdown & Story Estimation

We start by digesting often ambiguous requirements in a form of user stories written by a PM or someone within the Product Organization. It is critical that all stakeholders and ticket authors are present at the planner and can answer questions and negotiate solutions.

While generally Planner is NOT a design meeting, in reality quite a bit of ad-hoc design does happen during story estimation. *This is because engineers must visualize the implementation in order to be able to accurately estimate a story. This is OK.*

But sometimes the story can be so complex that it is not possible to come up with a quick "back of the napkin" design. In such cases the action item from the planner is a "design meeting" where engineers collaborate on a solution, and when finished -- enter it into the ticketing system as one or more implementable and already-estimated stories.

The identified need for a design breakout can be represented in the Tracker by a "chore" -- eg "Break down approach to building a Flux Capacitor".

#### Sprint Moderator

Spring Planner, much like other meetings, requires a moderator. Ideally, *this is the technical lead of the team,* or any other engineer, possibly on a rotating basis. The moderator has several key responsibilities and so its important that the moderator understands them.

For the list of common mistakes and pitfalls during the Planner, please refer to the section below.

Moderator's primary goal is ensure the following protocol occurs for each story.

### Story Estimation Protocol

- Moderator reads each un-estimated story starting at the top of the tracker. They read the summary, the description and add any necessary context.*
  - A product manager may offer an additional context. If important, it should be added to the story description.
  - The entire team listens, and attempts to understand each story as completely as possible.
  - This is an opportunity for engineers to raise any concerns, discuss and document any corner cases and error scenarios, and obtain any necessary clarifications from the product owners and stakeholders.
  - If feasible, it might be reasonable to quickly mock-up required pieces, such as any new DB tables, models, classes, services, etc. Any technical thinking that represents the consensus solution should be  added to the story in comments as part of the planner.
  - There is a fine line between sketching the implementation for estimation only, and going too deeply into the details.
    - Keeping the discussions from spiraling out of control is **one of the key responsibilities of the moderator.**
    - If a story is too complex, it gets broken down into several smaller implementable stories right there at the planner, unless...
    - A very complex story may require a separate breakout meeting for sketching a workable solution, which can then be properly estimated.
- Once the team agrees on the general implementation direction, its time to:
  - Estimate the story as a group. After the moderator says: "Ready?", and then "One, Two, Three"...
  - All engineers show the estimate using their fingers 😂
  - It's important that all engineers show their fingers at the same time, because in the otherwise scenario the later estimates get influenced by earlier ones.
  - If the difference between the highest estimate and the lowest is 2 or more points, then the moderator will ensure that the two engineers with min and max estimates discuss their differences and get on the same page.
    - If they can't agree after a couple of minutes, take the highest score and move on.
    - Eventually arrive at a consensus where everyone is within 1 point of each other.

> [!IMPORTANT]
>
> Keep most story-discussions strictly under 5 minutes, but aim for spending no more than 3 mins per story eventually.

Teams that are not very experienced in a group story estimation will need more time initially to get used to the process. After a few weeks they'll move a lot faster forward.

Here is an *infographic* that depicts the above described process:

### Story Estimation Protocol Infographic

!["Agile"](/assets/images/posts/agile/agile-01.png)
!["Agile"](/assets/images/posts/agile/agile-02.png)
!["Agile"](/assets/images/posts/agile/agile-03.png)
!["Agile"](/assets/images/posts/agile/agile-04.png)
!["Agile"](/assets/images/posts/agile/agile-05.png)

### Point System Explained

Estimating stories requires a consistent point system. Ultimately it doesn't matter what it is, as long as it follows two principles:

- It is **consistent** across all engineers and stories, and
- The scale is **additive*,* meaning that a story that takes twice as long as another story, should be twice as many points.

---

The point system that seems to work well is the following:

| Points | Is...                                              |
|--------|---------------------------------------------------|
| 0      | a task that takes up to 15 minutes to complete    |
| 1      | for up to 2 hours                                 |
| 2      | 2–5 hours                                         |
| 3      | roughly a day                                     |
| 6      | roughly 2 days                                    |
| 15     | roughly 1 week (5 days)                           |
| 60     | roughly 1 month for one engineer and/or pair      |

This point system generally implies that **a single engineer should have a velocity of 15 per week**. As the team works through sprint after spring, it's important to make sure that engineers are not too far apart based on their velocity because if they are, it means that estimations are likely inconsistent.

> [!IMPORTANT]
>
> **Quick Reality Check**...
>
> - In reality the average velocity of a single solo-ing engineer is roughly 5-10 points per week,
> - while two engineers engaged in the full-time pair-programming will typically yield 15 points per week.

---

> [!IMPORTANT]
>
> ## The Age of AI
>
> When this article was written, AI coding was not a thing. Today, of course, a single engineer armed with the army of agents can produce hundreds of points per week. ALl of the estimation is likely unnecessary and potentially harmful. What isn't harmful is the specification portion of the software process: where the product manager and engineers connect and sync on what needs to be built. Watch out for the next article about how to do this in the age of AI.

### Why Bother with Story Estimation?

Story estimation and the discussion it yields lead to a more *disciplined* and *rigorous* approach to software engineering, while a process that lacks this meeting tends to be more ad-hoc and less predictable.

Pivotal Tracker and other project management tools are able to compute an average velocity for individual engineers and the entire team as a whole, which translates to accurate scheduling of features based on the priorities, not on "can you please work faster" culture. Being able to see when each story is scheduled to be worked on facilitates the *transparency* listed as a goal, thus *building trust* between engineering and the rest of the organization.

It also implies *accountability* -- if someone under-estimated a story, or is falling behind for other reasons, the PM and project managers will see it sooner than later, making it possible to reprioritize other stories or adjust the resource allocation. In any case a potential slip in delivery can be remedied early enough in the process to be fully addressed.

### Can you change story estimates after it was started?

There are different schools of thought here, but in my opinion *it should be possible to retroactively update a story* that was *incorrectly estimated with the more accurate estimates*. This enables more accurate calculations and predictions.

However, its possible to allow or disallow this based on the reasons:

- if the story expanded in scope as the development began, the points should definitely be updated. This should be an exception, rather than the rule. If it becomes the rule, an adjustment to the process may be necessary.
- If, on the other hand, the scope remained the same, but the implementation was grossly underestimated, its reasonable to keep the story at its original points, and instead take a hit on velocity.

### Who should be Estimating Stories?

Group estimation practice encourages *individual accountability.*

Why? Because if I say that it takes me one day to complete given work, and then it takes me three days -- I am going to raise my hand and say that I made a mistake and underestimated the story. Because personal accountability and integrity is on the line.

If, however, the estimate was passed down from someone without my explicit participation, I am less motivated to commit to it, since I didn't sign off on it, and it was forced down on me. Because of that -- don't expect me to adhere to it. And this mentality breaks the velocity calculations and makes predicting deliverables difficult.

### Common Planning Mistakes

There is lots of good literature on this subject, [such as this one](https://www.scrum.org/resources/blog/5-common-planning-mistakes).

A very quick summary of common planning mistakes based on the personal experience:

*The below list of Anti-Patterns is perhaps one of the most valuable parts of this document.*

<dl>
  <dt><em>Not every engineer is present at the planner</em></dt>
  <dd>This results in a breakdown of communications or requires doing a separate planner later to discuss the missing engineer's stories.</dd>

  <dt><em>Team Lead, an Architect, or a Manager is doing story estimation instead of the group of engineers</em></dt>
  <dd>This, unfortunately, <em>is one of the most dangerous scenarios of all listed here</em>. Story estimates must come from engineers that code, and not from someone else, especially not from someone who is not coding daily.</dd>

  <dt><em>Moderator is going too fast, and not giving the engineers enough time to think through.</em></dt>
  <dd>This often happens when a non-engineer leads the planner, or when the team is under pressure, or when the folks on the team are too quiet to raise a concern. Don't let the planner get ahead of you -- speak up!</dd>

  <dt><em>Non-engineer is leading the planner, such as a Project Manager or a PM</em></dt>
  <dd>Sprint planner is for engineers. They should lead it and determine the pace for it. They must be able to document approximate implementation steps discussed at the planner.</dd>

  <dt><em>Not proactively asking every present engineer for their opinion.</em></dt>
  <dd>Some people are very shy and introverted. They will need to be asked directly if they do not volunteer any feedback, and for each story discussed. Every engineer must contribute something.</dd>

  <dt><em>Not estimating enough stories for the team to work one full sprint/week.</em></dt>
  <dd>There should be plenty of estimated stories in the backlog, spilling onto the next week, so that if someone is done early they can move onto the next story that was already discussed and agreed upon.</dd>

  <dt><em>Spending too much time on each story, and going into too many details.</em></dt>
  <dd>Planner should be run at a birds-eye context, with no more than five minutes per story. If you need more time than that, create a story for a Design Meeting instead. The output of the Design Meeting is estimated and implementable stories.</dd>

  <dt><em>Prioritizing un-estimated stories above estimated, after the planner (!!!)</em></dt>
  <dd>Some PMs love to mess with the backlog while engineers are working on it. Resist the temptation.</dd>

  <dt><em>Asking if an estimated story can be re-estimated to a lower number without changing the scope</em></dt>
  <dd>This is common with disorganized PM organizations or product owners working with consultants. No, story estimates do not change, but stories can be re-prioritized or simplified.</dd>

  <dt><em>Not including the necessary infrastructure automation work in story estimations.</em></dt>
  <dd>For organizations with DevOps practices, some features may require changes in the infrastructure. It should be the engineers working on the story that ideally make the necessary changes to the infrastructure code, as part of the story.</dd>
</dl>

## Pivotal Tracker -- *Overview*

> [!NOTE]
>
> [Pivotal Tracker](/2020/09/07/writing-cli-tools-ruby-migrating-github-issues-to-pivotal-tracker.html) is no more. It's been decomissioned, but the same point system could apply in [Linear](linear.app) or any other tool you might be using.

### *Blocking*

Linear.app and others supports cross-story references for stories blocked by other stories. This is a highly useful feature and should be used whenever appropriate.

## TL;DR

In this post I attempted to summarize the key components of the simplified Agile or SCRUM Process, into what I call "*Turbo Agile™*".

This process is based on five+ years of running engineering at [Wanelo.com](https://wanelo.com). See [Wanelo's Engineering Blog](https://building.wanelo.com) for more information on our team accomplishments.

And please leave your thoughts in the comments!

— Konstantin

| Versions | Date |
| ------- | --- |
| Written | September, 2020 |
| Updated | June 2026 |
