---
title: "Test your Understanding of Ruby Concurrency"
date: 2020-06-01
permalink: "/2020/06/01/ruby-concurrency-problems.html"
category: "programming"
tags: ["concurrency", "puma", "sidekiq", "multi-threading", "multi-process", "fibers", "parallelism"]
description: "Test your understanding of how Ruby Concurrency works with these two simple multiple-choice questions."
heroImage: "/assets/images/posts/concurrency/multi-process-3d.png"
comments: true
---
In one of the future blog posts, I plan on reviewing Ruby Concurrency as it stands in 2020. I have done several presentation on the subject, and what's most fascinating to me, is the wide variety of levels of understanding among engineers attending my talks. So I decided to put together this little "self-test": where you can figure out if you understand Ruby Concurrency well enough to plan a deployment for a very popular unnamed social network.

## Parallelize This!

The associated talk on Ruby Concurrency (to be published shortly after this one), was born out of hearing senior engineers discuss an out-of-place optimization of a business process, which demonstrated an obvious lack of understand of Ruby Concurrency. And no wonder — concurrency is hard. In any language. Ruby, actually, makes it pretty damn easy. And yet, just as it's easy to write `Thread.new { }` it is just as easy to shoot yourself in the __foot, foot, foo, ..t, fo, ooot ,....__

Did you get my joke? I know, I know. Very clever. HA!

Without further ado, let's get to it. Below you'll find two concurrency questions with multiple choice answers. Your answers are not recorded, so don't worry — try as many times as you like.

## Problem [A]: "Getting Ruby to Utilize all Cores"

![All Cores Maxed Out](/assets/images/posts/misc/8-cores.png)

Let's say we are running a Rails website on AWS, and we purchased a beefy multi-core server with 8 cores and lots of RAM. Our site is popular, and so we need to squeeze as much throughput from the server as possible.

If the server never exceeds 20% CPU we are wasting resources and money.
Ideally we want to run the server closer to 80% of the total CPU on average, so that we **utilize** the allocated resources well.

Assuming there is plenty of traffic available, we are trying to decide how to configure Puma on this server.
In particular we are looking to decide on two numbers for our 8-core server:

> [!TIP]
> NOTE that your responses are recorded anywhere, they are just for you to self-test.

### Question

1. **What's the ideal number of workers processes?** +
We'll call this number of workers — `W`. +
+
2. **What's the ideal number of threads per process?** — +
We'll call this number of threads — `T`.

Together, `W` and `T` define the number of processes and threads your application offers.
This type of information is critical when tuning a multi-threaded/multi-process app server such as Puma, or Thin, or even the popular background jobs framework `Sidekiq`.

### Multiple Choice Answers

Choose one answer.
If you select the wrong answer, it will turn red, while the correct answer will be green.
Press the button below the quiz to see the explanation and the reasoning.

**To fully saturate this 8-core server with a Ruby Application that runs on MRI Ruby (C-Ruby), and to drive server utilization as high as possible, we should set `W` and `T` as follows:**

> [!TIP]
> **Interactive quiz question** — try it on the live site.
> _(Originally an embedded HTML quiz; port to an Astro component if desired.)_

## Problem [B]: "Speeding up a Computation by Parallelization"

![Computing SHA256](/assets/images/posts/misc/sha256.png)

In this problem, we have a large queue (i.e. an Array) pre-filled with various objects, and we need to compute a SHA256 of each object using a SHA-function provided to us.  Memory is not an issue.

We know a few things about these objects, and in addition we've been given some important constraints by our Operations team, and we must follow them:

> [!NOTE]
> * All objects in the array are independent of each other, and so the SHA can be computed in any order, on any object.
> 
> * Computing SHA requiring no IO, just CPU.
> 
> * We are allowed one and only one active/running Ruby process at all times.
> 
> * We can choose any Ruby implementation for this task.
> 
> * We still have access to the same 8 cores from the previous section, since we are still running on the same hypothetical server.
> 
> * We can not modify the actual SHA routine — this is provided like a black box.

Well, we are unhappy with how long it takes to compute 10,000 SHA, and We would like to optimize this function and speed up the computation somehow.

### Question

**Will the overall operation be __faster__ if we created __8 threads within the single Ruby process we are allowed to start__, and then split the SHA256 computation across the eight running threads?**

### Answers

> [!TIP]
> **Interactive quiz question** — try it on the live site.
> _(Originally an embedded HTML quiz; port to an Astro component if desired.)_

## Conclusion

So, how did you do?

Hopefully, this was helpful to folks trying to tune Sidekiq and Puma for their multi-threaded environments.

Have any questions? Suggestions? Please leave a comment below!

Best regards,
Konstantin

San Francisco, CA, June 3, 2020.

## References

 * [Opening The Ruby Concurrency Toolbox](https://www.honeybadger.io/blog/ruby-concurrency-parallelism) from Honeybadger

 * [Ruby Concurrency and Parallelism: A Practical Tutorial](https://www.toptal.com/ruby/ruby-concurrency-and-parallelism-a-practical-primer) first of the two TopTal blog posts I highly recommend.

 * [The Many Interpreters and Runtimes of the Ruby Programming Language](https://www.toptal.com/ruby/the-many-shades-of-the-ruby-programming-language) from the fantastic TopTal blog

 * [Scalable Ruby — Concurrency and Parallelism Explained](https://medium.com/better-programming/scalable-ruby-concurrency-and-parallelism-explained-68b09a7aeb53)

And if you are looking for something a bit off Topic, checkout this somewhat controversial talk by Dave Thomas — [The Future is Function, or, OO is Dead](https://www.youtube.com/watch?v=3TlEqzptWr0) from 2017 RubyHACK Conference.
