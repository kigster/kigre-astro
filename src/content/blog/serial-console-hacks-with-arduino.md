---
title: "Serial Console Hacks With Arduino"
date: 2015-11-22
permalink: "/2015/11/22/serial-console-hacks-with-arduino.html"
category: "programming"
tags: ["console", "hacks", "serial", "minicom"]
description: "In this post I'll share a method that I use to connect to a Serial port of any Arduino I am using at any given moment.  This method has a caveat, in that if you have more than one Arduino connected, it will pick one of them at random."
heroImage: "/assets/images/posts/arduino/arduino-board.jpg"
comments: true
author: kig
---
## Battling Console

### Motivation

I always hate Serial port windows.  They do not automatically reconnect, and if they try (Eclipse) they don't always work (Teensy). So I went searching for a reliable solution that will automatically reconnect after loosing a connection.

I found it! It's called minicom!

### Minicom

* If you are command-line savvy, then install or use [HomeBrew](http://brew.sh/), then `brew install minicom`
* Alternatively, [Download Minicom Here](http://mac.softpedia.com/get/Developer-Tools/Minicom.shtml#download)
* In Terminal (or iTerm2 if you are awesome) test running `minicom --version`

This is what I get:

```bash
minicom version 2.7 (compiled Oct 20 2014)
```

### BASH Magic

Now add the following [BASH function](http://tldp.org/LDP/abs/html/complexfunct.html) to your `~/.bashrc` or `~/.bash_profile` files:

```bash
function console {
  modem=`ls -1 /dev/cu.* | grep -vi bluetooth | tail -1`
  baud=${1:-9600}
  if [ ! -z "$modem" ]; then
    minicom -D $modem  -b $baud
  else
    echo "No USB modem device found in /dev"
  fi
}
```

Then you can use it as follows -- in Terminal type `console` and it will automatically launch minicom, on the first found USB port.

If you are using baud rate other than 9600, then you can pass the new baud rate as a second parameter, eg. `console 115200`

The function will find a serial device and connect MiniCom to it, which then automatically reconnects upon restart of your Arduino board.  Neat, eh?

To stop this monitor, close the Terminal Window.

Enjoy!
