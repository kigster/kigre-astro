---
title: "Scaling Web Applications On Postgresql A Walkthrough Presentation"
date: 2015-11-28
permalink: "/2015/11/28/scaling-web-applications-on-postgresql-a-walkthrough-presentation.html"
category: "programming"
tags: ["scalability", "performance", "postgresql", "web-apps", "caching", "zfs", "haproxy"]
description: "In this exciting and informative talk, presented at PgConf Silicon Valley 2015, Konstantin cut through the theory to deliver a clear set of practical solutions for scaling applications atop PostgreSQL, eventually supporting millions of active users, tens of thousands concurrently, and with the application stack that responds to requests with a 100ms average."
heroImage: "/assets/images/posts/postgres/scaling-web-applications-on-postgresql.png"
comments: true
author: kig
---
## PostgreSQL Developer Conference

I was very happy to find out that my submission accepted at 2015 pgConfSV conference (where SV is for Silicone Valley) was accepted.

For various reasons I was unable to cover everything I wanted during the talk, which is a note to self for future public speaking engagements! Time your talk! :). Well, below is an updated version of that presentation, which shows an incremental and methodical path to scaling web applications to millions of users using PostgreSQL, all the while covering a very range of material.

### What was covered?

I wanted to share how the Wanelo team had solved one of the biggest challenges we faced:

 * How to effectively store and retrieve over 4B rows of 'saves' (a Wanelo equivalent of Instagram 'like' or Pinterest 'pin'), all in PostgreSQL, with highly concurrent random access.

In general, the ideal audience for this is operationally and architecturally minded full stack engineers, building web apps that either are already serving a ton of traffic, or will be soon.

But on the broader scale, I was intending for this presentation to be helpful to anyone trying to get a grasp on how to evolve their web application to where it's able to serve a rather high throughput of 5K-50K requests per second. This range is still far below what the internet 'giants' such as Facebook, Google, or Twitter get (if I had to guess, it would be in 1M/sec). But, it is also far from an early naive web application with just a few users.

Turns out it _is_ possible to achieve high scalability on the cheap, and using PostgreSQL, which is what we did at Wanelo, and it turned out great.

### The Presentation

You can view the presentation here:

image:{{ site.url }}/assets/images/posts/postgres/scaling-web-applications-on-postgresql.png[link="https://www.slideshare.net/kigster/from-obvious-to-ingenius-incrementally-scaling-web-apps-on-postgresql", 400, center]

Thanks!
