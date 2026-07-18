---
title: "Mixmax And My First Nodejs App."
date: 2016-04-07
permalink: "/2016/04/07/mixmax-and-my-first-nodejs-app.html"
category: "Software"
tags: ["nodejs", "javascript", "mixmax", "gmail", "slash-commands", "calendar", "polls", "api"]
description: "MixMax enhances, enriches, extends (EEE!) the standard Gmail functionality with a lot of goodies, accessible from both the GUI as well as via the slash commands while composing an email."
heroImage: "/assets/images/posts/mixmax/mixmax.gif"
comments: true
author: kig
---
## Supercharge Your Gmail

A few days ago I was blown away but what a (still) little-known startup called [MixMax](http://mixmax.com) is doing with email --
nothing short of revolutionizing it! If you haven't see it yet, do check it out, especially if you often find yourself scheduling
meetings or lunches over email, asking for feedback, conducting polls or sharing rich media with others.

MixMax enhances, enriches, extends (EEE!) the standard Gmail functionality with a lot of goodies, accessible from
both the GUI as well as via the "slash" commands while composing an email.

![MixMax Slash Commands](/assets/images/posts/mixmax/mixmax-slash-commands.png)

Slash commands have been used for a very long time, to send "commands", like in age-old [IRC](http://www.irc.org), as well as the much more recent app [Slack](https://slack.com), or even, any multi-player online video games.

So imagine my joy, when I realized that with a simple `/cal` I can now insert a few
available time slot options in my email, and request the recipient to choose one.
Once they do, the event is inserted into my calendar right away. This is magic!

## Features

I haven't gone through an exhaustive list of the features MixMax offers at this time,
but a few stand out and are certainly going to be in my daily use.

### Calendar Integration

![MixMax Slash Commands](/assets/images/posts/mixmax/calendar_drag_preview.gif)

`/cal`

Like I said -- my favorite feature at the moment. I love how easy it is to pick the time slot, and how you can integrate with your calendar.

### Formatted Code

![MixMax Code Blocks](/assets/images/posts/mixmax/mixmax-code-blocks.png)

Another awesome feature -- how often have I gone to GitHub to create a temporary gist just to provide syntax highlighting in my emails? Not every day (thank god!) but quite often.

Just type `/code` and you can pick from a bunch of languages and themes.  What's great, is that they didn't skimp this feature -- both language and theme are remembered for the next time. Nice work!

### Groups

There are several very useful features for dealing with groups of folks. I've listed some of them here, but I've only tried the poll and yes/no.

* Yes/No (with an optional Maybe) are inserted into your email
* You create a poll, and the recipients vote
* Group scheduling / planning.
* Email open tracking

My one complaint with yes/no functionality, is that when someone clicks on the response, you simply get an email.  I would have loved to see a summarized results view, perhaps I am thinking of this more like a poll. Me receiving automatic emails is good for my group (less typing), but I still have to sort through a ton of email.

## Limitations and Feature Requests

Right now MixMax connects to one gmail account, so if you are using multiple, you'll need to setup and connect two separate MixMax accounts. Not a huge deal, but maybe it would been nicer to have a single "umbrella" account there, that can see all of your email accounts.

## Extending MixMax

Of course, one of the first things I did was to see if the tool is extensible, and
to my delight, [it sure was!](http://sdk.mixmax.com/)  So, with a bit of free time
on my hands, and a long standing desire to get a bit more Node.JS under my belt,
I embarked on an adventure of building a simple link resolver for [Wanelo](https://wanelo.com) --
the fantastic product discovery site, and a social network where I worked until
pretty recently.

## Using an IDE

I will admit that I am a big sucker for [JetBrains](http://jetbrains.net) series
of IDEs. Having learned one (the Java IDE [JetBrains IDEA](https://www.jetbrains.com/idea/)
a very long time ago, I feel that I pretty much know them all now, because of
how many similarities are between each IDE. JetBrains did a fantastic job at
abstracting out functionality of an IDE away from a specific language or a framework,
and thus building us a series of best of breed IDEs on the market.

I love them so much that I recently purchased a two-year long [All Products Pack](https://www.jetbrains.com/store/?fromMenu#edition=personal) that gives me
all of their IDEs! It's actually a pretty damn amazing deal. And no, I do not
receive commissions from JetBrains, I am simply a very enthusiastic user.

### WebStorm

![WebStorm IDE with MixMax project loaded](/assets/images/posts/mixmax/webstorm-mixmax-resolver.png)

The IDE for building JavaScript and node applications is [WebStorm](https://www.jetbrains.com/webstorm/).

If you like my environment below, I highly encourage you to link:/downloads/webstorm-2016.1-settings.jar[download and import my WebStorm Settings], as you'll get bunch of goodies with this settings file.

If you have never used JetBrains IDE -- just take a look at this screenshot, and
try to comprehend just how much is going on there on my screen, all within the
confines of my development environment.

## Project 'wanelo-mixmax-link-resolver'

To cut the long story pretty damn short, [I built a small project](https://github.com/kigster/wanelo-mixmax-link-resolver)
to resolve [Wanelo](/2012/09/14/the-big-switch-how-we-rebuilt-wanelo-from-scratch-and-lived-to-tell-about-it.html) product URLs into a small widget that looks like this:

![Preview of the Widget I built](/assets/images/posts/mixmax/mixmax-wanelo-preview.png)

Along the way I had to figure out how to

* actually organize code in a Node.JS projec
* how to add runtime and development dependencies
* how to setup automated unit testing
* and how to deploy it all on Heroku.

I will add all these details in a follow-up blog post, but for the time being,
[please checkout the GitHub Repo](https://github.com/kigster/wanelo-mixmax-link-resolver) -- note that it contains instructions, should
you choose to install this resolver for yourself.

Thanks for reading!
