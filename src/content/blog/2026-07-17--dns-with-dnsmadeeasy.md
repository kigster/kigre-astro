---
title: "When the cost of building incredible tooling is so low, how (and should you) resist the urge?"
date: 2026-07-17
permalink: "/2026/07/17/dns-with-dnsmadeeasy.html"
category: "devops"
tags: ["ai", "claude", "codex", "dnsmadeeasy", "dns", "zone", "cli", "rfc1035"]
description: "There are hundreds of DNS provider companies, most do it because they also sell domains, but a select few do it because it is notoriously difficult problem to solve well (emphasis on 'well'). When I discovered just how much poor DNS service performance affects your user's experience, I realized I had to pick one at the top of the range. My other mantra for choosing vendors is always picking the 'underdog': they are still innovating and may surprise you. Among the underdogs I've selected over the years are: NewRelic, Datadog, Fastly, Joyent, and a boutique DNS service provider DNSMadeEasy (now merged with DigiCert). This is a story about DNSMadeEasy, and a Ruby gem that I inherited and now maintain, that makes working with them programmatically a breeze. It is also about the latest release of this gem with a radically different brand new feature set."
heroImage: "/assets/images/posts/dns/dme-2022.png"
comments: true
draft: false
author: kig
---

## A Bit of a Back Story

I started my software career in Melbourne Australia in the mid-nineties, and was immediately fascinated by the fact that while Australia's two dozen existing websites at the time all had the extension that ended with one of `.com.au` or `org.au` or `.net.au`, and of course — the `.edu.au`, specifically [my university](https://monash.edu) where I graduated from with the Mathematics degree, only to promptly abandon pure mathematics in favor of the oh — so much more exciting computer engineering. Anyway, it bothered me deeply that while Australian sites had to live with that `com.au` extension, sites in the US did not! They just ended with `.com` as if it was the center of Earth and that's all the cables lead to. And as a matter of a fact, they did! DARPA (the US defense organization) is credited with the "invention" of the Internet (sorry , Al Gore!). So I guess it made sense that the US would get the privilege of not having to append `*.us` to their own sites. But back then, I must admit I was feeling a bit of of a begrudgery, or a simmering resentment mixed with envy directed at US's (however earned) superiority.

I had a 14.4Kb/s modem (which was the _shit_ at the time) and as I was already 21 and lived separately from my parents, so I got a second telephone line so I don't have to compete with my wife's phone calls. The stage was set me to be permanently connected to the completely new and uncharted world of the World Wide Web, news groups, ftp sites, gopher servers (gosh, that was one ugly thing). Anyhow, having the second line allowed me (or more precisely — my PC) to be online 24/7 and (.... gasp) run a freaking _server_ off my PC that was like all constantly available and shit. Over the 14.4Kb/sec line. So forget huge images. Hope that your pure text page loads before you finish your coffee.

> [!NOTE]
>
> A few years later, this "envy" would manifest itself into me leaving Melbourne, and moving to San Francisco to see if I could "make it" in this self-declared utterly superior center of the Internet World, which at the time was filled with folks warmly welcoming people from other countries, with a crazy story, an accent, and some wild ideas in my head, which I did in 1998, and, for time being I got stuck ever since.

We had a PC at our house —my parents me one, with a 200Mb hard drive.  Which was huge at the time.

For some reason, DSL Internet back then paired your MAC address with an IP address they issued your modem, so my IP never changed in the three years I ran this server.  It was all incredibly exciting, **and it was then that I decided I needed to run my own website.**

And that, of course, required a few things:

1. Non Windows OS (i.e. pre 1.0 Linux Server)
2. Apache Web Server
3. An idea for the website!
4. And a fitting Domain Name registered properly through the *.com.au registrar.
5. A couple of HTML pages hand-coded to return something that was readable and useful.

### The Year Was: End of 1995, Start of 1996

#### So, let's travel back just a bit more than 30 Years (or roughly 11K days)

I just had graduated with Honours from [Monash University](https://monash.edu) in Melbourne Australia, which today proudly presents itself as [monash.edu](https://monash.edu), but back then it was the unnecessarily elongated `www.monash.edu.au`. Still, none of it mattered because the Internet was so exciting and new, and so I dove head first into the weeds of programming, networking, DNS, HTTP, and before too long, 30 years ago, me and my close friend Vitaly launched together one of the first official public websites that today you'd probably call a "craigslist for a local russian-speaking community". Although even that would be a huge stretch.

> [!IMPORTANT]
>
> We take for granted so much today, but during the early days of the Internet you coded the websites in pure HTML, page by page, and run it on the Apache server which was a sort of a pinnacle of human invention at the time, and it was one of the first big projects that was open source and free to use, change, etc.
>
> I do remember thinking to myself that how nice would it be if we didn't need to retype the HTML page headers on every page, and roughly around the same time Apache released server-side includes and CGI came out, allowing for a truly dynamic sites to start popping up. I re-coded the entire site to leverage the new SSI feature in one evening, turning our code into much more DRY than it was before.
>
> As far as CGI — I did use it at a work project, which was a portal for insurance brokers, but the site we ran did not need much dynamic structure: it was literally like a yellow pages for the russian businesses in Melbourne, and more specifically — just one part of Melbourne where russian speakers lived: St Kilda & Balaklava Street.


You see, I was born and immigrated to Australia from the Ukraine, the city of Kharkiv that the closest largest city to the border. (I am not going to go there, but let's just say last four years weren't easy by any means).

So, paired up with my partner in crime Vitaly, and together we devised the plan to launch one of the first sites of that kind in the world — sort of a directory of Russian Speaking shops and services in Melbourne that wanted to be in our "database" (which at the time was an Excel Spreadsheet, if not a text file).

The community we arrived to was located in the area known as St Kilda and Balaklava Rd, and the immigration contingent there was relatively recent: folks who arrived in the 80s and early 90s we all densely packed there, mixed with another contingent that stood out: [hasidic jews](https://en.wikipedia.org/wiki/Hasidic_Judaism).

> [!NOTE]
>
> A slight tangent: I don't believe you could run any http server software for free on Microsoft Windows, so the only option was Linux, which was at that point pre-1.0 and installable via some 40+ floppy disks, each of which fit 1.4Mb. So let's just say getting Linux to boot on your PC, after inserting and swapping fourty disks while ensuring the right order, was pure magic. I purchased a book — still one of my favorite technical books to date: ["The Underground Guide to UNIX"]()(<https://www.amazon.com/Underground-Guide-UNIX-TM-Slightly/dp/0201406535>). This is one technical book that had me literally LOLing before LOL was a thing. It's funny as hell. And probably quite applicable still.


## All About the DNS

### How DNS Works

![how-it-works](/public/assets/images/posts/dns/how-dns-works.png)
	
### Moving Domains Between Providers

Moving a domain between DNS providers should be boring. Painfully boring.

It should rank somewhere between renewing your driver's license online and watching paint dry.

Instead, it's one of those engineering tasks where you confidently think, _"I'll knock this out before lunch,"_ and suddenly it's dark outside, you're surrounded by browser tabs, and you've learned more about one provider's CSV dialect than any human being should.

## Wait... doesn't DNS already have a standard?

Every DNS provider proudly advertises:

> "Export your DNS records!"

Fantastic.

Surely the next provider lets me import that same file?

No.

Instead, they would like a CSV.

Not **the** CSV.

**Their** CSV.

Every provider appears to have held the same product meeting sometime around 2006.

> "We should support imports."
> "Great idea."
> "Should we use the existing standard?"
> "....absolutely not."

---

The truly funny part is that DNS **already has a standard interchange format**.

_**Zone files.**_

They've existed forever.

They're compact.

They're human-readable.

They're battle-tested.

Most providers can export one.

Very few can import one.

Which is a little like every bank allowing you to withdraw money but insisting deposits arrive by carrier pigeon.

## The Copy/Paste Olympics

The alternative is familiar to anyone who's managed more than one domain.

- Open provider A
- Open provider B
- Copy one record.
- Paste.
- Rinse,
- Repeat.

Forty-three times.

Miss one TXT record.

Spend thirty minutes wondering why email stopped working.
Eventually discover the missing quotation mark.
Question your career choices.

---

I don't particularly enjoy repetitive work. I enjoy eliminating repetitive work.  Those are very different hobbies.

## Fine. I'll Write the Thing

So back in the day it started as a tiny script. I used one particular provider that was very reliable and fast — [DNSMadEasy.com](https://dnsmadeeasy.com) (which recently merged with [DigiCert](https://www.digicert.com/)). In my Wanelo days we used them as well, and took over a decently written and well tested API gem that had every operation that was exported as an API available as a gem operation, as well as the CLI operation that we added later.

But yesterday I had a different annoyance.

### Enter Email Configuration

For each email provider, to conigure a domain, one must these days add a slew of records: MX records, SPF/TXT, CNAME records for clicks and sending, and so on. After doing this once for one domain, and realizing I needed to do this five more times, I decided we live in an era when big dreams can be done by AI in a few hours. By the smart AI, in my case Claude.

Unfortunately, Claude decided to take a beating yesterday morning and was returning errors regardless of which model I chose.

So, with some curiosity I decided to try `codex`. I described the gem refactor, that I wanted to move to `dry-cli` model, that I so not succinctly describe in [on of my other posts](https://kig.re/2020/09/07/writing-cli-tools-ruby-migrating-github-issues-to-pivotal-tracker.htmls), and most important I wanted bulk operations that made sense. I wanted to be able to export domain's zone file, drop the records there, and have the thing merge it smartly with the existing ones.

As a strategy for doing this I chose the Terraform model: you change →  you plan  → you apply.

We split the work into nine distinct parts, and `codex` went to work. Sort of.

### Complaining about CODEX

What can I say. I felt I transported back nine moths. Codex constantly kept asking for permission, and no matter what I tried it kept asking for permission to run a command every thirty seconds. It was major annoyance.

In several hours it finally created nine stacked PRs that I merged and started testing. And what do you know. That shit had bugs up to wazoo.

Let's start with the double double quoting the TXT records. These come out of the provider already double quoted, and  yet Codex though it was necessary to single qu0te them around double quotes.

> Not necessary, and in fact harmful.

I had take care of my daughter, so I checked everything in, called it version 1.0, and left.

Upon my return I was glad to find out that Claude has been ressucitated, and functional again. Not wanting to waste any more time, I grabbed "fable" on "max effort", and started digging into the codebase.

### Summary of CLI changes

The gem prevously offered the `dme` executable that could be followed by one of the singular operation the provided supported, such as `update_record`, etc. I wanted to move it into a sub-command, `dme account <operation`> and add a new command `zone` that operated on the entire DNS zone files. Eg, `zone export`, `zone plan`, `zone apply`, and so on.

Let's just say when Claude started looking at that codebase it found countless bugs and I was relieved that I did not push it to rubygems.org in that 1.0.0. State.

### Implementation

The `zone` command required:

- a proper parser
- a proper serializer
- a proper diff-producing logic
- validation
- import/export support
- tests

Congratulations.

The quickly put together gem had become a real piece of software.

## DNSMadeEasy

The gem can read standard DNS zone files and convert them into a provider-independent model.

Today that means DNS Made Easy.

Tomorrow it could just as easily be Route53, Cloudflare, Porkbun, Namecheap, Gandi, or whichever provider catches my attention next.

The architecture was intentionally built around adapters because I'd much rather write _one_ parser than thirty-seven importers.

## Ruby Makes This Stuff Fun

This is one of those projects that reminds me why I still enjoy writing Ruby after all these years.

Parsing text.

Building tiny DSLs.

Expressive object models.

Writing tests that read like English.

Ruby remains unusually pleasant for this kind of software.

## ANAME

So after fixing all the parsing double double quoting, we ran into another issue: DnsMadeEasy supports one very useful extension to DNS records: `ANAME`. It's like a `CNAME` that returns IP address but changes if the `CNAME` changes.

So we had to handle that too.

## The Bigger Dream

I'd love to see a future where moving DNS providers looks like this:

```bash
dmez zone export example.com > example.zone
# edit the file
dmez zone plan example.zone --domain example.com
# see the diff
dmez zone apply example.zone
# have the diff shown actually applied to the provider via the APIs
```

No spreadsheets.

No copy and paste.

No mystery CSV formats.

No browser tabs multiplying like rabbits.

Just DNS records.

Exactly as the Internet intended.

⸻

If you’ve ever lost an afternoon migrating DNS records—or discovered at 2 A.M. that one forgotten TXT record quietly broke email—I hope this saves you a little frustration.

And if you’re building support for another provider, contributions are always welcome.

Sometimes the best open-source projects don’t begin with grand ambition.

Sometimes they begin with muttering:

“This is ridiculous. There has to be a better way.”
