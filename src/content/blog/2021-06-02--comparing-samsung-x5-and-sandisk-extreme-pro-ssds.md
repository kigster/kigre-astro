---
title: "Ultra-Fast External SSD Drives: Samsung X5 vs SanDisk Extreme Pro V2"
date: 2021-06-02
permalink: "/2021/06/02/comparing-samsung-x5-and-sandisk-extreme-pro-ssds.html"
category: "consumer-electronics"
tags: ["usb", "thunderbolt", "ssd", "write speed", "read speed", "performance"]
description: "Real-world read/write benchmarks pitting the Samsung X5 against the SanDisk Extreme PRO V2 — nearly 2x the price, but is it actually twice as fast? Testing against a sample-library workflow that punishes slow drives."
heroImage: "/assets/images/posts/ssds/ssds-side-by-side.png"
comments: true
author: kig
---
In this post I wanted to document a comparison between two of the leading fastest external SSD drives I could find on Amazon -- with a price difference of nearly 2X! I wanted to see if, perhaps, the two drives were similar in performance, which would mean that I could get away with buying the much more cost-effective SanDisk.

> [!NOTE]
> Please don't pay attention to the "rated up to" numbers quoted here — we are going to get to the real world results shortly...

[SanDisk 2TB Extreme PRO Portable SSD](https://www.amazon.com/gp/product/B08GV4YYV7/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B08GV4YYV7&linkCode=as2&tag=kigster-20&linkId=b4abbdcb3ccd850191894c35911202f5) for **$339**:: Rated up to 2000MB/s  USB-C, USB 3.2 Gen 2x2 - External Solid State Drive - SDSSDE81-2T00-G25

[SAMSUNG X5 2TB Portable SSD](https://www.amazon.com/gp/product/B07GBTY82P/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B07GBTY82P&linkCode=as2&tag=kigster-20&linkId=d4933b99078333b918855ff1fa5c831c) for **$594**:: Rated up to 2800MB/s -Thunderbolt 3 NVMe External Solid State Drive, Gray/Red (MU-PB2T0B/AM)

---

## Why Does Anyone Need an External SSD?

I recently upgraded my [Native Instruments Komplete](https://www.native-instruments.com/en/products/komplete/bundles/komplete-13/compare/) to the collector's edition,  which comes with 1.1TB of audio sample libraries.

My music computer is a recent iMac, with a 2TB internal drive, which, on my tests the internal SSD drive is very fast, about 2.1GB/sec write speed.

I decided I wanted to move my Native Instruments collection library out to the external drive, and for that I needed something that can be read and written very quickly, otherwise changing instruments takes forever. And I mean it -- on a non-SSD mirrored G5 thunderbolt drive, I could only get maximum of about 150MB/sec write speeds, and loading patches from this drive was a nightmare: 30 seconds to load a grand piano patch for Native Instruments Kontakt.

Granted, their patches have become increasingly large, because they now contain transients and all sorts of additional metadata that makes them sound so rich and so full of harmonics. Which means -- we really do want to be able to load these guys on and off quickly.

### TL;DR

> Alas, the result is -- you get what you pay for — if it is the speed you crave, Samsung X5 is a clear winner.

* Indeed, the ultra-fast Samsung X5 is an **absolute beast when it comes to raw read/write performance**, and is more than twice faster than SanDisk, which is somehow rated similarly - at 2GB/sec (but don't be fooled, it's not even close, at 929MB/sec).

* Samsung's drive fully supports [SMART Status Standard](https://bit.ly/3uJrWL3) — which is great for predicting failure, while SanDisk does not.

* Samsung's metal casing is both gorgeous and durable. It's red underbelly is made of such a rich red color, that I literally want to eat it! SanDisk is not a bad looking drive, but it's also somewhat generic looking. SanDisk has been making these disks with identical form factor, and just different colors, for years.

As such, I decided that I will be returning the SanDisk, and plan on using the Samsung X5 with my iMac as the ultra-fast storage compliment to my built-in 2Tb drive, with G5 (a mirrored hard drive array) will be used as a backup.

## The Details

In this section, I'll share what I've done and my methodology for testing.

For each drive:

* I reformatted it as:
 **ExFAT (Win/Mac)
 ** FAT32 (Win/Mac)
 ** AFPS Volume (Mac only)
* Noted the _block size_ of each file system
* Captured the output of `diskutil info <device>` command
* Performed a copy test of a 53GB folder, containing 111 binary files sized around 0.5GB each.
* Ran a [Disk Speed Test App](https://apps.apple.com/us/app/blackmagic-disk-speed-test/id425264550?mt=12) by BlackMagicDesign.

### Example

> [!NOTE]
> _For example -- here is one test of transferring my 53Gb folder to the SanDisk:_
>
> ```bash
> ❯ du -hs 2D67DF30/
> 53G 2D67DF30/
> ❯ sudo time cp -rp 2D67DF30/ /Volumes/Extreme\ Pro/
> 58.51 real         0.08 user        30.59 sys
> ```
>
> This tells us that the command tool a total of 58.5 seconds, of which 30.6 seconds were spent in "system", i.e. Kernel -- doing the IO of copying blocks.

### What The ... is Block Size?

If this term confuses you, don't worry. It's pretty nerdy thing to pay attention to.

You see, computers can write data to a disk in so-called "pages" or "blocks".

For example, if you create a text file containing a single letter "a" and a newline, you would expect this file to take up 2 bytes, right?

While the operating system may show you this file as being 2 bytes only, on the physical disk it will take up at minimum one disk block. [Thats because file system blocks can not be shared between multiple files](https://stackoverflow.com/questions/30133149/can-multiple-files-be-stored-in-the-same-block). So if you have many small files, and the block size is 128KB, like it is on ExFAT file system, you use a lot more space than your files actually use. A good solution for backing up a folder with thousands of files is archiving it -- creating a single file that contains many smaller files inside. That way you are not paying the block size penalty.

Anyway, we digress.

### Testing SanDisk Extreme Pro Portable SSD, 2TB

![SanDisk](/assets/images/posts/ssds/sandisk-pro-v2.jpg)


| Property   | Spec |
|:---------------|:---------------|
| Capacity        | 2TB           |
| Weight          | 84g           |
| Protocol        | USB           |
| SMART Status&nbsp;    | Not Supported &nbsp;|
| Price           | $339           |

#### Read/Write Speeds

| Test Type            | Read Speed (MB/sec) | Write Speed (MB/sec) |
|----------------------|---------------------|----------------------|
| Rated                | 2000                | 2000                 |
| Actual (Disk Speed Test) | 936              | 954                  |
| UNIX `cp` test       |                     | 929                  |

#### Write Speed by File System

This test is based on the time it took to copy 53GB folder using `cp -rp` in the Terminal Window.

| File System | Write Speed (MB/sec) | Block Size (Kb) |
|-------------|----------------------|-----------------|
| FAT32       | 929                  | 0.5             |
| AFP         | 905                  | 0.5             |
| ExFAT       | 900                  | 128.0           |

#### Disk Speed App Rating

![diskspeed](/assets/images/posts/ssds/diskspeed-sandisk-pro-v2.png)

'''

### Testing Samsung X5 Thunderbolt 3 Portable SSD 2TB

![](/assets/images/posts/ssds/samsung-x5.png)

| Specification     | Value                   |
|-------------------|------------------------|
| Weight            | 144g                   |
| Capacity          | 2TB                    |
| Protocol          | PCI-Express (Thunderbolt) |
| SMART Status      | Verified               |
| Price (Amazon)    | $594                   |

#### Read/Write Speeds

| Test Type              | Read Speed (GB/sec) | Write Speed (GB/sec) |
|------------------------|---------------------|----------------------|
| Rated                  | 2.89                | 2.30                 |
| Actual (Disk Speed Test)| 2.41               | 2.14                 |
| UNIX `cp` test         |                     | 1.76                 |

#### Write Speed by File System

| File System                  | Write Speed (GB/sec) | Block Size (Kb) |
|------------------------------|---------------------|-----------------|
| AFPS                         | 2.14                | 4               |
| ExFAT                        | 1.76                | 128             |
| Mac OS Extended (Journaled)  | 1.65                | 4               |

#### Disk Speed App Rating

![diskspeed](/assets/images/posts/ssds/diskspeed-samsung-x5.png)

## Conclusion

I summarized the results and pricing in the table below:

| Product                 | Write Speed    | Price    | Speed $/MB/sec | Storage $/TB |
|-------------------------|---------------|----------|----------------|--------------|
| SanDisk Extreme-Pro V2  | 0.93 GB/sec   | $339.90  | $0.36          | $169         |
| Samsung X5              | 2.14 GB/sec   | $594.00  | $0.27          | $297         |

But what does it all mean?

### You should buy a Samsung X5, if…

**Buy this drive if**:

* You are looking to buy an external drive for very high I/O performance applications: such as [Native Instruments Komplete](https://www.native-instruments.com/en/products/komplete/bundles/komplete-13/compare/) plugin collection (720GB), or if you are working with video. +

*

For these applications Samsung is a clear winner here. The transfer speed of 2.14GB/sec is absolutely stunning. To be able to copy a 53GB folder in 30 seconds is phenomenal. But this comes with a hefty price tag of nearly $600.

* This drive also supports [S.M.A.R.T.](https://bit.ly/3uJrWL3) protocol, and therefore may benefit from early warning systems, and [Apple's SMART integration](https://osxdaily.com/2018/05/31/how-check-smart-status-mac-hard-disk/).

**Cons**:

* This drive's major con is its price tag: at $600 it's not going to be a runaway hit.

* The second issue with this drive is that it tends to get really warm, even hot. Not sure how this will affect durability,  but this is something to keep in mind.

As most SSD drives in its class, this is a completely quiet, motionless drive powered entirely via USB-C connector (which is Thunderbolt underneath).

### You should buy SanDisk Extreme Pro, if…

Hmm, I've thought about this and I can't think why you'd want to buy this drive — here is why:

* If your goal is the ultimate speed, this drive is simply not as fast as Samsung, and not even close to its own rating. +
  +
It claims to be more than double it's actual real life performance. This type of sleazy marketing tactic earns zero points in my book.

* If your goal is to increase storage, and the read/write speed is not as important to you, then you can buy a much cheaper 2TB drive that may be able to do 500MB/sec at half price.

Don't get me wrong, it's not a bad drive, and it _is fast_, clocking max write test at 929MB/sec. It's lighter than Samsung, because it's made of plastic and it doesn't seem to be getting as hot as the Samsung.

## Appendix

### Diskutil Info about SanDisk Extreme Pro

```yaml
Volume Name:               Extreme Pro
Mounted:                   Yes
Mount Point:               /Volumes/Extreme Pro

Partition Type:            Microsoft Basic Data
File System Personality:   ExFAT
Type Bundle:               exfat
Name User Visible:         ExFAT

OS Can Be Installed:       No
Media Type:                Generic
Protocol:                  USB
SMART Status:              Not Supported

Disk Size:                 2.0 TB (2000364240896 Bytes)
Device Block Size:         512 Bytes

Volume Total Space:        2.0 TB (2000301326336 Bytes)
Volume Used Space:         56.2 GB (56229625856 Bytes)
Volume Free Space:         1.9 TB (1944071700480 Bytes)
Allocation Block Size:     131072 Bytes

Device Location:           External
Removable Media:           Fixed

Solid State:               Yes
```

### Diskutil Info about Samsung X5

(After reformatting as AFPS volume on a Mac OS-X Big Sur)

```yaml
Volume Name:               Samsung X5
Mounted:                   Yes
Mount Point:               /Volumes/Samsung X5

File System Personality:   APFS
Type Bundle:               apfs
Name User Visible:         APFS
Owners:                    Disabled

OS Can Be Installed:       Yes
Media Type:                Generic
Protocol:                  PCI-Express
SMART Status:              Verified

Disk Size:                 2.0 TB (2000084316160 Bytes)
Device Block Size:         4096 Bytes

Container Total Space:     2.0 TB (2000084316160 Bytes)
Container Free Space:      2.0 TB (1999783776256 Bytes)
Allocation Block Size:     4096 Bytes

Device Location:           External
Removable Media:           Fixed

Solid State:               Yes
Hardware AES Support:      No
```
