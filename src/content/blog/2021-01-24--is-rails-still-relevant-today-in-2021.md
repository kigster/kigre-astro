---
title: "Yes! It's 2021, and Ruby 3.0, and Ruby on Rails 6.1 are alive and thriving. Are you?"
date: 2021-01-24
permalink: "/2021/01/24/is-rails-still-relevant-today-in-2021.html"
category: "programming"
tags: ["ruby", "rails", "software", "ruby on rails"]
heroImage: "/assets/images/posts/rails/ruby-on-rails.png"
comments: true
author: kig
---
The decision of which framework or language to choose from is not a simple one and rests on both the company values and project values. For simplicity's sake, we can refer to values or priorities.

## What's more important?

Velocity:: Speed of feature development?
Scalability:: Can the app support hundreds of thousands of users concurrently without major redesign?
Maintainability:: How easy is it to change application features down the road?
Staffing:: How easy is it to hire people with the right skillset
Community:: The community behind the framework/language?
Community values:: The values behind the framework/language, and do they match projects?

In my experience, Ruby/Rails software engineers tend to be good at:

Velocity:: that's why [Pivotal Labs consultancy](/2020/09/11/turbo-agile-simplified-scrum-pivotal-process.html) chose Rails as their primary framework
Automated-testing:: which means — maintainability in the future
Onboarding:: rails apps are laid out very similarly and most rails devs know where to look for configuration
Object-oriented design:: The community has very strong OOP design principles, and some of the best books on the subject, such as [POODR](https://www.poodr.com/)

Other languages don't have a single comprehensive web dev framework that automates everything from DB migrations, to secrets encryption, sending/receiving of email, in addition to the MVC, etc.

### Hiring for Rails

> [!NOTE]
> Rails today is used to power nearly 3M websites worldwide according to the website https://trends.builtwith.com/.

Where do all of these engineers go? They will all be available for hire for decades to come.

### Recent Rails Apps

New Rails sites come online all the time. 37Signals just recently launched a redesigned email service provider — https://hey.com  which DHH [described](https://mobile.twitter.com/dhh/status/1275901955995385856) as follows:

#### The HEY stack:

* Vanilla Ruby on Rails on the backend, running on the edge
* Stimulus, Turbolinks, Trix + NEW MAGIC on the front end
* MySQL for DB (Vitess for sharding)
* Redis for short-lived data + caching
* ElasticSearch for indexing
* AWS/K8S

> [!NOTE]
> Personally, I would never use MySQL — I am a big PostgreSQL proponent for various reasons, from licensing to features, to [scaling it](/2014/03/21/12-step-program-for-scaling-web-applications-on-postgresql.html). So that this blog post is my take on web development and Rails.

## Summary

[CAUTION]
So, NO — **I don't think it's dying, if anything it changed from being the cool new kid on the block to a "pro" athlete that nobody can beat at the game. Yet.**

Look, people thought that [NodeJS](/2016/04/07/mixmax-and-my-first-nodejs-app.html) would beat Rails, but the poor value system in Javascript, a heavily fragmented ecosystem, poor testing practices, and the async hell leads to unreliable code throughout. I've seen this again and again.

Django is probably 2nd best choice of all shown, but it was always copying Rails' features to Python, and always a step behind, but never ahead. If you have a lot of people with Python knowledge, then, by all means, Django is a good choice. But that applies equally to Go and Rust. If you are outsourcing these apps, you want to optimize the cost of development, which is likely to be the cheapest with Rails and the fastest with Rails.

— Konstantin

February 1st, 2021.
