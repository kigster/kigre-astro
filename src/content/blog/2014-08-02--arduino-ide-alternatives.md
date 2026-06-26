---
title: "Arduino IDE Alternatives"
date: 2014-08-02
permalink: "/2014/08/02/arduino-ide-alternatives.html"
category: "programming"
tags: ["ide", "c++", "visual studio", "xcode", "eclipse"]
description: "Review of Arduino IDE Alternatives."
heroImage: "/assets/images/posts/arduino/ide-arduino-arduino.jpg"
comments: true
author: kig
---
> [!NOTE]
> This article was originally written in 2014. It had recently been updated for 2020.

## Developing for Hardware using Arduino and Integrated Development Environmentss

As a relative late comer to the Arduino world, I went through the beginner tutorials and examples
using the provided Arduino IDE.  I faithfully downloaded it from the [arduino.cc](http://arduino.cc/en/Main/Software)
web site, took a quick tour and was pretty unimpressed with the set of features.  For one, I am
very particular about the color scheme of my programming editors, and not having a choice
was an immediate downer.

Arduino IDE is simple to use, and I think this was one of the key design goals for this software.
It is commonly used to introduce many folks to programming electronics, and just _programming_,
notably in [C/c++](/2018/09/20/c++-newbie-tour-how-to-get-started-with-c++-on-mac-osx.html).  As such, this tool is pretty limited, and limiting too. Very quickly I found
myself very stuck unable to browse through external symbols by clicking through them, using auto-complete
features, refactor code, and so on: all the "basic" features I so got spoiled with, by tools such as
JetBrain's [RubyMine](http://www.jetbrains.com/ruby/), [AppCode](http://www.jetbrains.com/objc/), [IDEA](http://www.jetbrains.com/idea/),
open source (but originally IBM's) [Eclipse](https://www.eclipse.org/), and not to
mention Apple's [XCode](https://developer.apple.com/xcode/).

After going through several example projects using the IDE I became more and more frustrated with
its limitations.  Programming hardware is hard enough (pun intended), and the IDE is supposed to
make life easier.

For example,

* How do I explore the source code of the included libraries that are being used by my sketch?
* Why does "Import Library" insert a new `#include` into my sketch when I already have one?
* Why is tab indentation not maintained as you move to the next line while editing?
* Why is the board and port selection remain global, and are not assigned to each sketch?  Can't I be working on multiple boards at the same time, especially, say, when they talk to each other?
* And of course... why can't I change the goddamn colors :)

So I became worried that my foray into electronics would die young if I didn't find a more capable
programming alternative, and so I started exploring.

## Arduino IDE Alternatives

First off -- a tiny disclaimer: this is not a feature by feature comparison of Arduino-capable IDEs.
It's a personal opinion of an experienced software engineer, who recently entered this domain. I work
on Mac OSX, and so I only briefly mention the Windows options. But on a Mac I did end up trying most of the options listed here.

When I talk about software IDE, I generally _do not_ mean a fancy text editor. While I know
that plenty of great developers love and use text editors on complicated software projects,
the convenience of a true IDE on a small to mid-sized software project is hard to dispute.
So while I do, when appropriate, use a combination of [VIM](http://www.vim.org) or [TextMate](http://macromates.com/) for exploring or quickly editing,
I prefer to actually _write code_ in a true IDE.  If I had to define what _true_ IDE means for
me, I would list the following features:

* full indexing with ability to click on a symbol or use a key shortcut to go to the definition or source file where that symbol is defined
* in-place documentation lookup for APIs
* code auto-complete (configurable, and not automatic -- key press invoked)
* code auto-format with automatic tab positioning while editing
* refactor (extract method, etc)
* symbol rename (automatic renaming of functions, class names with file name change, variables, etc across many files)
* built-in debugger
* automated test integration
* arguably less important are global project search, global find and replace, project-level symbol lookup.

My absolute favorite over the years have been the series of IDEs for all popular languages produced by
[JetBrains](http://www.jetbrains.com/idea/) ---- a company that singlehandedly dominated the IDE nitche
for over a decade now, including winning over droves of professional java programmers away from Eclipse.

But anyway, here is the list of what's available for proper software development of the code, with Arduino
as the final destination:

* [Arduino IDE for Microsoft Visual Studio (Windows Only)](http://www.visualmicro.com/) is free.
 ** Visual Micro also sells a commercial debugger for Arduino, which seems to be rather unique.  The
debugger uses serial port to allow some limited debugging functionality on the host computer.

![Arduino IDE for Visual Studio](/assets/images/posts/arduino/ide-arduino-visual-studio.jpg)

(_screenshot courtesy [VisualMicro](http://www.visualmicro.com/)_)

* [embedXCode](http://playground.arduino.cc/Main/EmbedXcode) -- use XCode 4 or XCode 5 to write
Arduino sketches.  I tried to install this, and was able to pretty quickly compile a sketch.
But to be honest, I never loved XCode to begin with. It's gotten infinitely better over the years,
but something about it's Preferences screens is so incredibly daunting, that I never got really
good at XCode.  Perhaps someday :)

![Arduino IDE for Visual Studio](/assets/images/posts/arduino/ide-arduino-xcode.jpg)

(_screenshot courtesy [StackOverflow](http://stackoverflow.com/questions/19605493/how-to-enable-intelligent-code-completion-in-embedxcode)_)

* This brings us to the last contender: [Eclipse](https://www.eclipse.org/ide/).  Eclipse has been
around for a long time, and is an amazing platform for so many things, including software development.
Having used Eclipse on several Java projects in the past, it seemed the most natural fit. So I
downloaded the [Eclipse Arduino Plugin](http://www.baeyens.it/eclipse/), and that's what the
rest of this post is about.

## Eclipse Arduino Plugin Saves the Day

Having now used this IDE for several weeks straight, I am pretty happy with the Eclipse Arduino Plugin.
The project is [pretty active on GitHub](https://github.com/jantje/arduino-eclipse-plugin), and the author is also
quite nice :)

### The Case for Open Source

One of the first things I bumped into, with the nightly build of the plugin and with my Arduino Esplora board,
was a pretty major problem: I couldn't upload any sketches.  So I posted a bug report on GitHub, and author replied with a quick note on how
to get the source of the plugin, and which class to look at, so that _I_ could fix the problem. It sounded
like a challenge. Of course I took it.

For the next few hours instead of working on my Arduino sketch I was fixing the Eclipse plugin.  To my surprise, it was
relatively easy to get setup with the environment where I imported the entire plugin source into JetBrains
IDEA (haha, sorry Eclipse! You are still number two :) and was able to diagnose and fix the issue with
the timing of opening serial port and uploading the sketch.  A few hours later [my pull request was
merged](https://github.com/jantje/arduino-eclipse-plugin/commit/fd0f6de12ebf41a0ba484d3007bfed77c67380ec),
and the nightly build of Eclipse Plugin started working for everyone with Arduino Esplora! That, my friends,
is the true power of open source.

While I was at it, I also [updated the README](https://github.com/jantje/arduino-eclipse-plugin/commit/ed794f8ed6d89a1a3c0cb0354bbc162de81bf821)
with proper markdown and (perhaps) slightly better English. And of course I couldn't stop there either,
and continued going slightly crazy, massively refactoring serial communications of the plugin deep into the night,
and then submitting a [beautiful pull request](https://github.com/jantje/arduino-eclipse-plugin/pull/179). However, at that
point the plugin author probably had gotten pretty annoyed that I was making his code look and work
a bit better, and sadly rejected the PR, explaining that another rewrite of serial comms is happening.
Oh well, at least I can keep using my fork on my own machine, where I get to see pretty error messages that actually
explain what's going on :)

But I digress.

### Installing Eclipse Plugin for Arduino

Option 1: probably the simplest way to get started is by [downloading the nightly build](http://www.baeyens.it/eclipse/download.php),
in my experience they've been pretty stable. The single-file download will already contain a compiled binary
(called something like "arduinoEclipse.app" or similar), and you can just run it.

Option 2: But my preferred way to install the plugin is to first install a full version of Eclipse Luna for C/c++,
and then add Arduino plugin to it via software installer.

____
[This blog post](http://trippylighting.com/teensy-arduino-ect/arduino-eclipse-plugin/arduino-eclipse-ide-and-plugin-v2-2-installation/)
does a really good job at describing installation of the plugin.  Skip to the section called _Arduino Eclipse Plugin V2.2_
and follow well written instructions with screenshots.
____

The only change to the above instructions I would like to mention, is that I used 64-bit version of Eclipse on the Mac, and did not
bump into any issues. It's possible I am not using any of the newest "Teensy" processors the author
was referring to, but with 64-bit address space Eclipse sure has a lot more RAM to work with. If you have
more than 8GB of RAM on your machine, you'll see pretty significant performance penalty when using 32-bit
version of Eclipse (or anything else for that matter).

### Taking Full Advantage of Eclipse for Arduino IDE

Here I'd like to share some simple but powerful tidbits about how I use Eclipse, and why I think it's so great.

* One of the nicest things about using Eclipse for Arduino is that you can explore (to study) as well as directly edit the source code
of the libraries. I've been developing my libraries this way -- as part of a sketch, I would first add the library to the
"Libraries" folder as a subfolder of my sketch, create class and header files there, and then
eventually move the entire folder out into the external "libraries" folder where all other 3rd party
libraries are located.  Then Eclipse allows me to edit files there too, and so I can be tweaking the same library
while working on multiple sketches (as you can see in the screenshot below).
* I can also assign different Arduino boards to each project, and it automatically switches when I switch projects.
* I configured Eclipse to use Command-R to compile, and Command-U to upload my sketches, just like Arduino IDE.
* I love the [Serial Console](/2015/11/22/serial-console-hacks-with-arduino.html) that stays open and reconnects between uploads.
* I constantly use the automatic rename feature, where I highlight a symbol and hit Option-Command-R, and just
type in the new name. Eclipse does the rest.
* Focus cursor on a symbol (like a function call) and press F2.  This will pop up a dialog that shows function
declaration. Super convenient!
* Instead of pressing F2, press F3 (or Command-Click) to go to the source file where the symbol is defined.
* Click on the tab above the editor window, and start dragging it around, creating split screen horizontally or vertically.
Grab another tab and split more tabs into two or throw the selected tab behind other tabs in a given window. How great is that?
* And I am not even mentioning (oh yes I am) the beautiful syntax highlighting, although I had to tweak this one
because none of the themes were good enough :)

____
If you are using Eclipse Plugin and would like to use my settings, please feel free to link:/images/eclipse-arduino-preferences.epf[download them].
____

These are some great features, and I am very glad that this plugin exists, because my Arduino development is
infinitely easier with it.

But this post has become way too long, and it's time to wrap up.  Next time I'll talk about my [robot movement library](/2014/07/18/back-seat-driver-autonomous-robot-maneuvering.html),
and discuss using Eclipse for it's development in more details.

I leave you with this beautiful screenshot of the Eclipse open with my library work in progress....

![Eclipse IDE (Luna) with C/C++ and Arduino Plugin](/assets/images/posts/arduino/ide-arduino-eclipse.jpg)
