---
title: "How to configure PostgreSQL for very high read/write throughput"
date: 2013-02-13
permalink: "/2013/02/13/high-read-write-performance-postgres-on-joyent-cloud.html"
category: "programming"
tags: ["postgresql", "joyent", "cloud", "high-performance", "scaling", "wanelo", "zfs", "postgresql.conf"]
description: "In this post, I'll go over some of our settings in postgresql.conf, which have been adjusted for high-performance/throughput and large RAM sizes. I would like to credit Josh Berkus and his PGExperts consultancy for providing us with timely and necessary assistance in tuning PostgreSQL these last few months."
heroImage: "/assets/images/posts/postgres/animated-distributed-postgres.svg"
comments: true
---
## PostgreSQL All the Way

At Wanelo we are pretty ardent fans of PostgreSQL database server, but try not to be dogmatic about it.

I have personally used PostgreSQL since version 7.4, dating back to some time in 2003 or 4. I was always impressed with how easy it was to get PostgreSQL installed on a UNIX system, how quick it was to configure (only two config files to edit), and how simple it was to create and authenticate users.

Of course I also played with MySQL back then, and always found it a bit wanting. Its user authentication and password configuration made little sense to me, and I found myself constantly having to look it up just to _start using_ the database. MySQL won the battle during those early days by providing a native Windows one-click installer and good performance out of the box, but it seems to have lost ground in recent years as a growing number of high-profile companies (notably [Heroku](https://postgres.heroku.com/) and [Instagram](http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram)) adopt PostgreSQL, and as [fear and loathing](http://news.ycombinator.com/item?id=4400797) over the [fuzziness of MySQL's open source nature](http://techcrunch.com/2012/08/18/oracle-makes-more-moves-to-kill-open-source-mysql/) and Oracle's involvement increases.

Traditionally, PostgreSQL has had a richer feature set, better stability and higher scalability, but slightly poorer performance. I don't believe the performance difference is anywhere near what it used to be, if at all, but doing yet another benchmark is beyond the scope of this post. We the developers get to choose our tools from time to time, and my open source database of choice has always been PostgreSQL.

## Joyent Public Cloud

Wanelo was at the time hosted on a high-performance cloud -- [Joyent Cloud](http://joyent.com/products/joyent-cloud), something we've mentioned in previous posts. Joyent Cloud comes with close to native hardware RAID I/O performance, and as Wanelo has been scaling up rapidly, we've been taking advantage of that high I/O throughput. Even with that advantage though we recently [vertically sharded our database](http://building.wanelo.com/post/42361472646/the-case-for-vertical-sharding) in order to spread the write load across more than one RAID server.

In this post, I'll go over some of our settings in postgresql.conf, which have been adjusted for high-performance/throughput and large RAM sizes. I would like to credit Josh Berkus and his [PGExperts](http://www.pgexperts.com/) consultancy for providing us with timely and necessary assistance in tuning PostgreSQL these last few months.

### The Magic of `postgresql.conf`

Go ahead and grab the gist of our postgresql.conf file [here](https://gist.github.com/kigster/4751844). Keep in mind this is for PostgreSQL version 9.

Additionally, you can review our [open source Chef cookbook](https://github.com/wanelo-chef/postgres) for installing PostgreSQL on Joyent Cloud by compiling it from sources, which comes with some of those settings by default.

Finally, [this is an excellent resource for tuning PostgreSQL performance](http://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server).

### Tuning Server RAM

As we are running most of our databases on 80GB instances, we set shared_buffers to 12GB. We did this because PostgreSQL takes great advantage of file system caches. The related parameter effective_cache_size tells the PostgreSQL query planner exactly how much RAM is available for caching. On Joyent this cache is provided by the extremely efficient ZFS [ARC](http://en.wikipedia.org/wiki/Adaptive_replacement_cache) cache.

We've set work_mem to a somewhat large value of 65MB (per process) so that our SQL sorts don't go to disk.

### Tuning Server IO

We've set asynchronous commit to off, so that we can buffer several writes together. Commit delay is set to 100 microseconds, so that any commits arriving within that time are buffered and synced together. This provides benefit mostly during peak times, when write volume is very high. During other times it simply delays each commit by 100 microseconds, which is acceptable for us.

![image](http://media.tumblr.com/f8d00535aa1759fb037d32fc598f82d0/tumblr_inline_mihoqjKQOW1qz4rgp.png)

Please let us know if you have any questions about any of the values in this config file. Discussion welcome :)
