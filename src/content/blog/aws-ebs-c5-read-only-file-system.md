---
title: "C5 class instance on EC2: cannot create file: Read-only file system"
date: 2018-05-15
permalink: "/2018/05/15/aws-ebs-c5-read-only-file-system.html"
category: "devops"
tags: ["aws", "ec2", "ubuntu", "nvme", "nvme-io-timeout", "fsck"]
description: "In this short post I describe the read-only file system issue that happened to one of our C5 hosts, and how we fixed it."
heroImage: "/assets/images/posts/aws/nvme-disks.jpg"
comments: true
---
This post describes how I was able to fix the "read-only filesystem" issue on one of my C5 instances in AWS EC2.

## Read Only my Ass!

Let me tell you a story, which I like to call the "Read-Only" problem that happened to one of our C5 hosts. It cost me a few hours of head-scratching and after figuring it out, it would be a missed opportunity if I didn't blog about it.

But I have some alternative motives too: I'd love to rant to you about how incompetent AWS support staff is, and how their forums are completely _useless_, and frankly, _infuriating_.

### Does this problem look familiar?

You try to run commands on your machine, but all you get back is:

```bash
$ touch file
```

Error: read only file system

### What the hell is going on?

So here is what happened earlier today.

*One of our C5 instances suddenly became _read only_*.

Since most services write to disk, the instance essentially became completely useless.

I desperately searched for answer on AWS forums... to no avail.

Despite finding [several](https://forums.aws.amazon.com/post!post.jspa?forumID=30&threadID=269150&messageID=818393&reply=true) [threads](https://forums.aws.amazon.com/thread.jspa?messageID=818393#818393) describing my exact problem, I quickly realized that NONE of the threads contained a solution!!!!! Now single customer who reported the problem said on the forum -- "Yay!", it worked!

Because there were no suggestions besides increasing _nvme_ _io_timeout_ from 30 seconds to some arbitrary large number. I did that, rebooted the instance, and nothing changed. And the _io_timeout_ was reset back to 30 seconds.

Well, that was a flop. Nice try AWS. Next time -- try a bit harder, will you?

### The Solution

Now, if you are experiencing the same problem I suggest you run the following command:

```bash
 $ mount -l | grep nvme
```

 /dev/nvme0n1p1 on / type ext4 (ro,relatime,data=ordered) [cloudimg-rootfs]

The command which assumes your instance uses SSD local drives, which are typically provided by the NVME (Non-Volatile Memory Express) drives.

[NOTE]
NVMe (Non-Volatile Memory Express) is a communications interface and driver that defines a command set and feature set for PCIe-based SSDs
with the goals of increased and efficient performance and interoperability on a broad range of enterprise and client systems. NVMe was designed for SSD.

What you see here is that the primary EBS volume was mounted as `ro` -- meaning read only.

If you issue the same command on a healthy machine, you should see `rw`, instead of `ro`, meaning, of course, "read-write".

OK, so why would a file system on Linux become read-only? Could it be some data corruption? Bad blocks?

That's a possibility. Unlikely, since they are supposed to be using SSDs that are more reliable than HDDs. At least that's what SSD manufacturers want you to believe.

Anyway, from my early Linux days (I installed my first Linux in 1996, I think, from 80 floppy disks, really), I remember the über helpful `fsck` command. If you type `fsck<TAB><TAB>` you will see that there are a bunch of them:

```bash
$ fsck<TAB><TAB>
```

 fsck
 fsck.cramfs
 fsck.ext3
 fsck.ext4dev
 fsck.minix
 fsck.nfs
 fsck.fat
 fsck.msdos
 fsck.vfat
 fsck.xfs
 fsck.btrfs
 fsck.ext2
 fsck.ext4

OK, so we just need to figure out which file system we are running, and then run the appropriate `fsck` utility.

Right above, where we did `mount -l`, you may have noticed that the file system type is `ext4`. Alrighty then. Now we know which `fsck` to run!

Let's run it and see what options does it have:

```bash
$ fsck.ext4
Usage: fsck.ext4 [-panyrcdfvtDFV] [-b superblock] [-B blocksize]
		[-I inode_buffer_blocks] [-P process_inode_size]
		[-l|-L bad_blocks_file] [-C fd] [-j external_journal]
		[-E extended-options] device

Emergency help:
 -p                   Automatic repair (no questions)
 -n                   Make no changes to the filesystem
 -y                   Assume "yes" to all questions
 -c                   Check for bad blocks and add them to the badblock list
 -f                   Force checking even if filesystem is marked clean
 -v                   Be verbose
 -b superblock        Use alternative superblock
 -B blocksize         Force blocksize when looking for superblock
 -j external_journal  Set location of the external journal
 -l bad_blocks_file   Add to badblocks list
 -L bad_blocks_file   Set badblocks list
```

Alright -- I love seeing something called "automatic repair". Since this machine is dead in the water, what am I going to loose?

Let's run this sucker.

```bash
$ fsck.ext4 -p /dev/nvme0n1p1
cloudimg-rootfs contains a file system with errors, check forced.
cloudimg-rootfs: Deleted inode 1567791 has zero dtime.  FIXED.
cloudimg-rootfs: ***** REBOOT LINUX *****
cloudimg-rootfs: 568214/5120000 files (0.1% non-contiguous), 3412081/10485499 blocks
```

### OMG!! Something got fixed?

This command run very quickly and found a bad inode, apparently with zero dtime, whatever that means. I am not about to go into the details of file systems, but this output looks promising to me.

So fuck it, let's reboot. See what happens.

I type:

```bash
sync; sync; reboot
```

> [!NOTE]
> this how I recommend you always reboot you instances. Double `sync`, then `reboot`. Why this is so is outside the scope of this post.

### Result

The box rebooted very quickly, and some 30 seconds later I was able to SSH into the machine. Viola!

No more read-only root partition, all services boot, and everything is back to normal.

Fantastic.

### How Not to Run Support Forums

I could vent a lot about how horrible AWS forums are, but I'll just say that there were relevant questions, with no answers. Not only that, but I couldn't even register for the forums and post the question right away.

Perhaps some time has passed now and they've fixed that. But let's just say it left me infuriated and without any useful info whatsoever.
