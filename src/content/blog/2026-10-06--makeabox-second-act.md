---
title: "MakeABox.io - the second coming. After 1.3M templates were downloaded from the first."
date: 2026-10-06
permalink: "/2026/10/06/makeabox-second-act.html"
category: "Open Source"
tags: ["hardware", "laser-cutting", "makeabox.io", "laser-cutter", "svg", "release"]
description: "Over 1.3 million boxes later, MakeABox returns with SVG export, a box preview, two lid configurations, and a fix for that annoying floating-point bug."
heroImage: "/assets/images/posts/makeabox/makeabox-closed-box-preview.jpg"
comments: true
author: kig
draft: false
---

I wanted a box for my electronics. Naturally, I wrote a Ruby gem and built a website on top of the gem. A perfectly reasonable response to needing six pieces of plywood, if you ask absolutely nobody outside the software industry.

## Apparently, other people needed boxes

That was [back in 2014](/2014/11/21/announcing-laser-cutter-makeabox-dot-io.html). Since then, to my complete shock, the site has generated over **1.3M boxes**. Subtract 1.3M from the live counter at the top of [MakeABox.io](https://makeabox.io) to see how many have been generated since the update.

<figure>
  <a href="https://makeabox.io" aria-label="See the live download counter on MakeABox.io">
    <img src="/assets/images/posts/makeabox/makeabox-download-counter.jpg" alt="MakeABox's glowing download counter reading 1,300,309." width="861" height="219" />
  </a>
  <figcaption>1,300,309 templates and counting. This is a snapshot. Click through for the live counter.</figcaption>
</figure>

One point three MILLION. These are generated templates, so I cannot claim there are 1.3 million physical boxes out there. But even allowing for experiments, repeat downloads, and people who just enjoy typing dimensions into things, that is a ridiculous number for a project I started because I was unhappy with the other box generators.

Anyway, [MakeABox](https://makeabox.io) has had a substantial update. It exports SVG, shows you a preview of your box, offers two lid configurations, and fixes the floating-point bug that used to make the experience unnecessarily irritating. Apparently, my little box website has actual users, and I should probably look after them.

## SVG, at long last

The SVG part deserves some celebration. My old workflow involved generating a PDF, opening it in Illustrator, adding holes for switches, screens, and cables, then heading to TechShop to cut the thing while swearing profusely. I documented the swearing in the original post, so at least that part of the process was reproducible.

PDF is still available, but now you can download an SVG for LightBurn or Inkscape, too. Both files contain the same panels. Use whichever suits your setup, add the openings your project needs, and get to the cutting. I have nothing against PDF. I just do not believe every circuit board needs to involve Adobe.

## Breaking news: box website now shows boxes

You can also see the box you are designing. Enter the dimensions, and the preview shows you the assembled shape with its measurements. Look at that. An actual box! On the box website! Only took me twelve years to get around to this.

<figure>
  <video controls playsinline preload="metadata" width="480" poster="/assets/images/posts/makeabox/makeabox-closed-box-preview.jpg" aria-label="MakeABox box preview demonstration">
    <source src="/assets/videos/posts/makeabox/makeabox-preview.mp4" type="video/mp4" />
    <a href="/assets/videos/posts/makeabox/makeabox-preview.mp4">Download the MakeABox preview video.</a>
  </video>
  <figcaption>The preview in action. Yes, I made a video of a box. We are all very excited.</figcaption>
</figure>

<figure>
  <img src="/assets/images/posts/makeabox/makeabox-closed-box-preview.jpg" alt="MakeABox on mobile, showing a closed box measuring 5 by 4 by 3 inches and a live counter reading 1,300,290." width="480" loading="lazy" />
  <figcaption>The closed-box preview, with the live template counter at the top.</figcaption>
</figure>

## The lids

Now, about the lids. At the bottom of my 2014 announcement, I put lids on the list of "next steps." If you have ever wondered how much confidence to place in a programmer's use of the word "next," there is your answer.

They are here! Alongside the fully closed box, you can choose a lid with tabs along the back or a plain lid with no tabs. This is particularly useful for electronics enclosures, because you may eventually want to reach the electronics. Perhaps even before declaring the project finished. I am trying to develop this habit myself.

<figure>
  <img src="/assets/images/posts/makeabox/makeabox-plain-lid-preview.jpg" alt="MakeABox preview showing a plain lid with no tabs lifted above the box, with dimension and material controls below." width="480" loading="lazy" />
  <figcaption>The plain lid, shown above the box so you can see how it fits.</figcaption>
</figure>

## That floating-point bug was mine. It's fixed.

And the floating-point bug is gone. If it annoyed you in the old version, you were right to be annoyed. I wrote the thing. I get to put my name under the nice screenshots, and I also get to own the irritating bits.

I would love to make this sound like an exotic numerical-computing breakthrough, but the announcement is simply that a known, annoying bug is fixed. Sometimes that is the feature you care about most. Fair enough.

## Go make a box. It's still free.

The site is still free. Enter the inside dimensions, tell it your material thickness, choose the top, and generate your files. The underlying [laser-cutter gem](https://github.com/kigster/laser-cutter) is open source, too, for anyone whose reaction to all this is "I bet I could improve that." Welcome. That reaction is how I got into this mess.

[Go make a box](https://makeabox.io). Give that exposed circuit board a home. And if you have been waiting since 2014 for the lids, thank you for your patience. I recommend setting a slightly firmer deadline for my next feature request.

And please, be a champ and leave a comment by hitting ["Discussion"](https://makeabox.io/#discussion) in the menu on MakeABox.io. You'll need a GitHub login, but I figure most of you have one. Don't be shy!
