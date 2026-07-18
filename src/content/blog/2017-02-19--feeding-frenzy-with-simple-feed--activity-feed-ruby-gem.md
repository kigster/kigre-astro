---
title: "Add a Social Activity Feed for your Site in Minutes with the simple-feed Ruby Gem"
date: 2017-02-19
permalink: "/2017/02/19/feeding-frenzy-with-simple-feed--activity-feed-ruby-gem.html"
category: "Open Source"
tags: ["ruby", "simple-feed", "concurrency", "activity-feed", "redis", "gem", "rubygems", "social-network", "twemproxy"]
description: "This gem implements a flexible time-ordered activity feeds commonly used within social networking applications. As events occur, they are pushed into the Feed and distributed to all users that need to see the event. Upon the user visiting their 'feed page', a pre-populated ordered list of events is returned by the library."
heroImage: "/assets/images/posts/misc/social-connections.png"
comments: true
author: kig
---
This post is the "official" announcement of the new open source [ruby gem](https://rubygems.org/gems/simple-feed) called [Simple Feed](https://github.com/kigster/simple-feed), released as a under the MIT License.

## What is an Activity Feed?

In the simplest, perhaps the most familiar form — you can think of an activity feed as your personal Twitter® or Facebook® feeds: only you get to see the unique combination of posts, based on who your friends are, or who you follow.

## SimpleFeed — Activity Feed Powering Social Sites

This library powers several feeds, notably one on Simbi.COM (the sponsor of this gem):

![Activity Feed](/assets/images/posts/misc/simple-feed-black.png)

The short-list of its features is:

* You can define any number of feeds per Ruby VM

* SimpleFeed stores pure strings associated with a floating point number (typically -- time), and so does not assume any particular format of the data

* The data is stored in pluggable backends, with `Redis` and `Hash` providers supplied.

 ** New providers can be easily built and used with the same API.

 ** Using [Twemproxy](https://github.com/twitter/twemproxy), the backend can be transparently sharded to support millions of users.

 ** Redis provider is optimized for multi-user batch operations, such as posting an event to many users at once using Redis `pipeline`.

* Rich API allowing both single-user (i.e., for reading the feed) and multi-user (i.e., for writing to feed) batch operations

* Powerful DSL

* Near 100% test coverage :)

For information on how to use, install and other technical details I refer you to [README](https://github.com/kigster/simple-feed) or the more detailed discussion below.

### Feeds 101

The word "feed" has a bit of a mythical origin, but what it describes is rather well understood at this point.  A related term *[Data Feed](https://en.wikipedia.org/wiki/Data_feed)* is defined by the Wikipedia as a _... mechanism for users to receive updated data from data sources._

Wikipedia then goes into describing various types of feeds, such as the RSS or News Feeds, The Web feeds, and even Product Feeds -- all of which I had to deal with extensively in my career.

This is why I feel that I have a particular responsibility to explain them to folks that may not fully get the concept, in a way that just makes sense. And there is no better place to start than to clarify that....

> [!TIP]
> A feed is just a _list_. An ordered list of things, and typically -- similar looking things.

-- Really? -- You might exclaim.

-- Yup. It's a list of things, but it does have some special properties.

You see, it's meant to be consumed (or read, loaded, imported) by the computers, not humans. At least this is how the word "feed" entered into the technical jargon in the late 90s.

If I _scribble_ you a shopping list on a piece of paper, -- that's just a *shopping list*.

But if I enter this list into an Excel, or into a database, then suddenly this list turns into a form that an average modern day computer can read. It can then "_do some awesome stuff_" with this list. Like -- in the case of a [product feed](https://www.shopify.com.au/resources/product-feed-management) -- it could search for products on the Internet, and compare prices, or verify product availability, etc. In fact, I built an app that did just that.

But what's true, is that only the web geeks like myself (and, perhaps, some very progressive teenagers) are going shopping with a [shopping feed](https://wanelo.co/trending). Most of us are still shopping with a simple list.

And so with the understanding that a *feed is just a list of things that is intended for a computer to ingest*, we can move forward, and talk about Social Feeds, which are, ironically, intended for humans.

In the world of World Wide Web, and in particular, in the world of the Social Web, when we mention the word "feed" when we talk about a time-ordered list of events that have occurred. We might even call this an "Activity Feed." And it makes sense: you the see activity that matters to you and the connections you created on the social network.

Importantly, _as the new activity occurs on the site, it is "fed" to you via this feed_. You could say that we are all being fed information that comes through a feed(-ing tube?[ -ED.]).

### Feed This

We see Activity Feeds everywhere these days: social networks such as FaceBook, Twitter, GitHub, LinkedIn -- they all have them.

It's common sense -- in addition to tailoring information to your interests, modern applications show you a highly personalized view into what is happening over time (including right now), and people love it. We all love it, and I love it too.

In fact, it bothers me when I signup or register for a new application only to realize that I can't easily see what's going on: what are my friends doing, what I am doing, what else is going on?

____
It feels awfully quiet on a social site without an activity feed.
____

And the number of apps that don't offer a social activity feed is still staggeringly large.

And so why is that?

Perhaps the reason is that *it's not that easy to build this feature from scratch* -- the activity feed is a moderately difficult software project. It's hard, because:

* The feed collects many different types of events from many users, and often has complicated rules as to what is shown to the user, and when.
* The feed must be updated nearly in real time, so as new events happen, they should immediately show up in user's feeds.
* the feed must be shown to each user quickly, or people get bored and leave. How many times have you quit an app that was stuck "spinning its wheels"?

The last two requirements -- being near real time, and being fast to render -- are in a conflict with each other. This is why it took Twitter so long to get this right at a massive scale. The renown ["Bieber" problem](https://www.wired.com/2015/11/how-instagram-solved-its-justin-bieber-problem/) which occurs when Justin Bieber tweets to his tens of millions of followers, generates enormous activity on Twitter's backend.

Luckily, most social sites aren't Twitter.

### Feed Simple

So why do I know so much about these feeds, you might ask?

Well, funny you should ask. You see, I built more than a few feeds for various social networks I worked for, and they are _all remarkably still live and in production_.

My previous employer -- [Wanelo.com](https://wanelo.co) -- uses activity feeds for both the "Magic" and "My Feed" features. In Wanelo's case, the feeds are populated with products, and the software powering these feeds did experience the "Bieber Problem," except not with Justin Bieber, but with the very popular store [Urban Outfitters](https://wanelo.co/urbanoutfitters), that amassed over 3M followers on that social network. Whenever the store would post a new product, [three million users must see that product in their feeds](/2013/02/05/the-case-for-vertical-sharding.html). That's no simple feat.

The company I work for now -- [Simbi](https://simbi.com) -- is a social network for a symbiotic economy: where people can barter services with each other. The social feed was a natural fit, if not a real necessity.

And it was Simbi that kindly supported the development of the open source library called [Simple Feed](https://github.com/kigster/simple-feed), which, belatedly,  I am stoked to announce to the world. And even though it has already been mentioned on the Peter Cooper's [Ruby Weekly](http://rubyweekly.com/issues/336) (thanks, Peter!), I always thought that it's better to be late than never.

*SimpleFeed* is a pure Ruby library that uses [Redis](http://redis.io) as a storage mechanism, and deals with storing pure strings in the feed, associated with the timestamp (or to be precise, with any floating point number that defaults to time).

____
Because SimpleFeed only stores string data type using Redis, it is left to the developer that integrates the library to decide how exactly to serialize their data in the feed.
____

### Feeding The Frenzy

If you are a site owner, and you've always wanted to add a social feed, or a news feed to your site today -- there are several pretty good options.

A couple of them are written in Ruby. Unfortunately, many of the options are either Rails-specific, or they are rather extensive in what they offer and how much code and functionality they load into your Ruby VM when used.

That's not to say these options aren't good, and perhaps if you were to consider building one, I'd recommend that you reviewed them all.

Here are the ones I found:

* [GetStream.io](https://getstream.io/) is a commercial solution with clients in many languages, as well as the REST API. This option is free under 3M updates per months, and so if you are someone with a very low site traffic, this might be one of the easiest options, as it does not require any backend programming. That said, you must be comfortable relying on a 3rd party for uptime and reliability.
* [activity_feed](https://github.com/agoragames/activity_feed) -- is an open source Ruby gem that's probably the closest one to _SimpleFeed_, but unfortunately it lacks some pretty basic features: for example, it assumes you want to define one and only one activity feed in your application: you configure your feed at the global level. In SimpleFeed you can configure as many specialized feeds as you like. Also, it offers some strong opinions about what is stored in the feed, i.e., the data structure of the feed item. SimpleFeed does no such thing, and stores pure strings, leaving it up to you to decide how to serialize your data.
* [public_activity](https://github.com/chaps-io/public_activity) -- is another open source ruby gem that's quite a bit out of date.

Having discussed other options for completeness, I encourage you to give [SimpleFeed](https://github.com/kigster/simple-feed) a proper test-drive.  Perhaps then you may find that it fills the sweet spot, by being both _rich in functionality required to implement an activity feed_, and yet _simple enough_ that it takes a short time and a small effort to integrate with it.

And, of course, I will always be here to help. For any problems -- please [create a GitHub issue](https://github.com/kigster/simple-feed/issues), and I will address it as soon as I can. Better yet -- submit a pull request!

Happy Feeding!

-- Konstantin.

### References

* ["How would you go about building an activity feed like Facebook?"](https://hashnode.com/post/architecture-how-would-you-go-about-building-an-activity-feed-like-facebook-cioe6ea7q017aru53phul68t1/answer/ciol0lbaa02q52s530vfqea0t) by [Lee Byron](https://hashnode.com/@leebyron).
* ["Feeding Frenzy: Selectively Materializing Users`' Event Feeds"](http://jeffterrace.com/docs/feeding-frenzy-sigmod10-web.pdf) (Yahoo! Research paper).`
