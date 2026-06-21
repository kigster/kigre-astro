---
title: "Building IntelliJ Bazel Plugin from Sources"
date: 2020-03-21
permalink: "/2020/03/21/building-intellij-bazel-plugin.html"
category: "programming"
tags: ["bazel", "intellij", "docker", "build-systems", "ide"]
description: "Overview of Bazel support in IntelliJ Family of products, and instructions on how to build the plugin from sources."
heroImage: "/assets/images/bazel/bazel-build.png"
comments: true
---
## What is Bazel?

**[Bazel](https://bazel.build)** is a powerful open-source build and test tool similar to Make, Maven, and Gradle. It uses a human-readable, high-level build language called Starlark, which is a strict subset of Python. Bazel can build projects in multiple languages and output results for multiple platforms. Bazel supports large code-bases across multiple repositories and large numbers of users. In fact, it is the build tool used by Google internally for all of their software.

Bazel was open-sourced by Google several years ago, and has since become a dominant build system across a large list of companies. Most of these companies have engineering teams that are larger than a couple hundred engineers. Such teams are adopting Bazel because it can handle very large multi-lingual multi-repo projects with ease. After all, supposedly Bazel handles most of Googles internal code.

Bazel comes with a CLI executable that is the interface to its commands and features, but using Bazel with a fully-featured IDE can be particularly enlightening and time-saving.

I got introduced to Bazel while at Coinbase, where I got to work on Bazel build rules for Ruby language, an open source project available on Github.

## Bazel IDE Support

![VSCode Bazel Plugin in Action](/assets/images/bazel/bazel-vscode.png)

### Visual Studio Code

Bazel is pretty well supported by the VSCode plugin [vscode-bazel](https://marketplace.visualstudio.com/items?itemName=BazelBuild.vscode-bazel). If you are using VSCode and Bazel, you should check this plugin out. Here is a screenshot of my Bazel-enabled Ruby Project, with various Bazel-specific UI elements in action:

### IntelliJ Bazel Plugin

However, the most fully featured IDE support for Bazel is offered by the [IntelliJ Bazel Plugin](https://ij.bazel.build/docs/bazel-plugin.html). It supports several IDEs in the the IntelliJ family. Here is a similar screenshot of the same project opened in IntelliJ IDEA Ultimate, with Ruby plugin installed:

It is the IntelliJ plugin that is the subject of this blog post.

![IntelliJ Bazel Plugin in Action](/assets/images/bazel/bazel-intellij.png)

You can install this plugin in the following IntelliJ products:

* IDEA Ultimate and Community Editions (excluding EAP) (Java)
* CLion (C/C++)
* Android Studio (Java / AndroidSDK)
* PyCharm (Python)
* GoLand (Go)
* WebStorm (JavaScript)

**NOTE: that the Ruby IDE (RubyMine) is not listed above. And yet, I am able to build and test Ruby Project with IntelliJ IDEA Ultimate, and Ruby + Bazel support installed. Once you get Bazel working in your project, it almost doesn't matter what language it's in. If Bazel can build it — so will the IDE.**

#### Compatibility Notes

![IntelliJ Bazel Compatibility Chart](/assets/images/bazel/bazel-support.png)

For information on which IntelliJ IDEs are compatible with the Bazel Plugin, please see the following diagram, borrowed from the [IntelliJ Bazel Support Page](https://ij.bazel.build/docs/bazel-support.html):

* There are some issues with the marketplace plugin version when used with the latest IDEA version. This is when you might need to build it from the sources, as described below.

* Even if you build the plugin from sources, it will NOT be compatible with the EAP (pre-release) version of IDEA.

#### Installing the Plugin

The simplest way to install the plugin is to [find it in the Plugin Marketplace](https://www.jetbrains.com/help/idea/2019.3/managing-plugins.html), and install from there.

However, sometimes the plugin is behind the most recent version of the IntelliJ IDE, and in these cases you have two choices:

 * Rollback IDE to a previous version
 * Or, build the plugin from sources.
 * Further below we'll show how to {{site.url}}{{page.url}}#building-the-plugin[how to build and install the plugin from sources]*

#### Plugin Functionality

The plugin offers Bazel support in the IDE, but in order to ena`ble it, a project must first be "imported" as a Bazel project, for some reason. To be honest, the way the plugin works in the IDE is far from ideal in our opinion, and may require a few tries before getting it right. We wish the plugin would just auto-detect the BUILD or WORKSPACE file in the root project folder, but alas, at least today, that's not the case.

The plugin allows you to:

* You can import BUILD files into the IDE.
* Compile your project and get navigatable compile errors in the IDE.
* Run lint from within the IDE with navigatable issues.
* Support for Bazel run configurations for certain rule classes.
* Run tests from within the IDE by right-clicking on methods/classes.
* [**BUILD file language support**](https://ij.bazel.build/docs/build-file-support.html).

#### What to do when you can't import Bazel Project...

There is currently an issue that may affect your ability to import Bazel Projects into the IDE. It seems to stem from a misconfiguration resulting in disabling some of the default IntelliJ plugins, although we never figured out which ones.

The issue manifest itself as follow:

* If you are unable to move past the last step in the Project Import Wizard, meaning — you click 'Next' button, but nothing happens, you should click 'Cancel', and then click on the flashing red bulb in your status bar: it will contain the exact error message.

* If the error message is something like this:

```bash
java.lang.IllegalStateException:

No SyncPlu1gin present which provides a
   default workspace type.
at com.google.common.base.
   Preconditions.checkState(Preconditions.java:508)
```

Then you need to do the following:

Reset your IDEA preferences folder. For instance, on a Mac OS-X, and using IntelliJ IDEA Ultimate, you could run the following command in the Terminal:

```bash
prefs=${HOME}/Library/Preferences
```

rm -rf ${prefs}/IntelliJIdea2019.3

After this, start IDEA and choose `Reset Default Plugins` on the first screen.

Once you reset your settings, you should once again be able to import Bazel Projects.

**References**:

For more information on this error, see the following:

<<building-the-plugin>>

 * [The original commit that introduced default workspace type check](https://bazel.googlesource.com/intellij/+/015973d885a258d9b3921e5c06572bb4e1b30045%5E1..015973d885a258d9b3921e5c06572bb4e1b30045/).

 * [Currently open issue on Bazel Plugin Issue Tracker](https://github.com/bazelbuild/intellij/issues/1693).

## Building the IntelliJ Plugin from Sources

The plugin can be built using Bazel and Docker on any platform.

Unfortunately, you can not build it directly on MacOS-X or Windows because `WORKSPACE` points to Linux-specific JDK dependencies.

### Prerequisites

You should have the following in order to build the plugin:

    * Working knowledge of your operating system shell and terminal app.

    * `git` installed locally

    * Docker installed and running — get it from [here](https://www.docker.com/products/docker-desktop).

    * One or more supported [IntelliJ IDEs installed](https://www.jetbrains.com/products.html).

### Build Steps
:sectnums!:

### Check out the Code

In this section, we'll show the script to build the plugin and explain the commands that need to be run.

First, we need to clone the repo locally:

```bash
git clone git@github.com:bazelbuild/intellij.git
```

cd intellij

### Pulling Docker Image

Next, we need to pull the docker image that we'll use for this.

However, we'll both pull and run the image in the same command:

```bash
docker run -it --rm -v $(pwd):/src/workspace \
```

    -v /tmp/build_output:/tmp/build_output \
    -w /src/workspace \
    --entrypoint=/bin/bash \
    l.gcr.io/google/bazel:latest

If the above command succeeded, you will be dropped in the root's prompt:

```bash
root@611dbf701d6d:/src/workspace#
```

### Pulling Latest Changes

But before we build the plugin, be sure to pull the latest changes, in case the Docker image is not the most up to date:

```bash
git remote add upstream https://github.com/bazelbuild/intellij.git
```

git pull --rebase upstream master

Now we can issue our `bazel build` command, which we describe in the next sections.

### Determining the IntelliJ Product Identifier — PRODUCT

The very last argument of the bazel build command must map to a product identifier string such as  `intellij-ue-2019.3`. This particular label is what you would specify for IntelliJ IDEA Ultimate Edition, Version okp `2019.3.\*`. For community edition, you'd use `intellij-2019.3` or `intellij-latest.`

For other IDEs and other versions, you should use the appropriate argument taken form the following list of all supported IDEs as of March 5th, 2020:

* `android-studio-3.6`
* `android-studio-4.0`
* `android-studio-4.1`
* `android-studio-beta`
* `android-studio-canary`
* `android-studio-latest`
* `clion-2019.2`
* `clion-2019.3`
* `clion-beta`
* `clion-latest`
* `intellij-2019.2`
* `intellij-2019.3`
* `intellij-2020.1`
* `intellij-beta`
* `intellij-canary`
* `intellij-latest`
* `intellij-ue-2019.2`
* `intellij-ue-2019.3`
* `intellij-ue-2020.1`
* `intellij-ue-beta`
* `intellij-ue-canary`
* `intellij-ue-latest`

[IMPORTANT]
If you read this blog post much later than March 2020, you can re-generate the above list of product labels using the following command, which you would run inside the Docker container:

```bash
root@611dbf701d6d:/src/workspace# grep define \
```

     intellij_platform_sdk/BUILD | \
     sed 's/[",]//g' | \
     awk '{print $2}' | \
     sort | \
     uniq | \
     sed 's/.*=//g'

Any value that appears in that list can then be used below.

### Preparing to Build the Plugin

With that out of the way, we should be able to construct our build command line.

To simplify the next step, we put together a [convenient shell script](https://gist.github.com/kigster/dc847d68aed71920e4bc902320c1188d) that you can download inside the container with the following command (run it inside the Docker container):

```bash
$ wget http://bit.ly/bazel-intellij-build -O build.sh
```

Now you should have a script `build.sh` ready to use.

### Building the Plugin

Note: we recommend that you **DO NOT EXIT** the container once the command below is finished. You will need the container running if you'd like to save its state as a new Docker image in order to speed up any future builds of that plugin. If that's not a priority for you, you can exit as soon as the morning script completes.

Change `intellij-ue-latest` below to the appropriate tag for your IntelliJ IDE, and run this command inside the Docker container as root:

```bash
$ bash build.sh intellij-ue-latest
```

Depending on the capabilities of your machine the build time may vary from anywhere around 3-5 minutes to 10 minutes.

After the build succeeds, you should be able to find the compiled zip file on your local machine under the `/tmp/build_output` folder (the folder was mapped to the container's `/tmp/build_output` in the original Docker command). You might want to copy it to your Desktop folder for convenience — the following command is performed on your local system and not inside the container:

```bash
$ cp -v \
```

     /tmp/build_output/*bazel.zip \
    ~/Desktop

Now the plugin zip file should reside on your Desktop.

### Saving Docker Container State for Future Builds

This step is optional — if you don't intend on building or rebuilding the plugin, skip to the next section.

While the Docker container window remains open after a successful build, go ahead and open a new Terminal window, and run the following command:

```bash
$ CONTAINER_ID=$(docker ps | grep l.gcr.io/google/bazel | awk '{print $1}')
```

# save the modified container as a new image
$ docker commit ${CONTAINER_ID} intellij-bazel-plugin-built

Once you've run this, you can exit the Docker Container, because your modified container image is now stored under the `intellij-bazel-plugin-built` label.

If you decide to rebuild the plugin in the future, simply run the following command instead of the original Docker command, which will retain Bazel cache from the previous build as well as th build script we downloaded:

```bash
$ docker run -it --rm -v $(pwd):/src/workspace \
```

    -v /tmp/build_output:/tmp/build_output \
    -w /src/workspace \
    --entrypoint=/bin/bash \
    intellij-bazel-plugin-built

Now you can just run `bash build.sh product-identifier` as the script we generated should still be present in your saved Docker image.

### Cleaning the Build Directory

If you do not need the Bazel Cache for future builds, run this command to reclaim disk space on your machine and to remove the unneeded images:

```bash
$ cp /tmp/build_output/*bazel.zip ~/Desktop
```

$ rm -rf /tmp/build_output
$ docker image --rm intellij-bazel-plugin-built

## Installing the Plugin

Once you've built the plugin, and plugin zip file is on your Desktop, you can open your IDE and install the plugin from Disk.

Open your IDE, press `⌘,` to open Preferences, click on Plugins, and then find the little vertical ellipsis "..." and click it to display the dropdown shown on the screenshot:

![Installing plugin from the disk](/assets/images/bazel/install-from-disk.png)

Select "Install Plugin from Disk", and choose the ZIP file on your Desktop, and once installed — restart your IDE.
And... Vola!

You should now have the latest Bazel plugin installed.

### Importing the Project

The next step is to import the project, which is described in detail on the [IntelliJ Bazel Plugin Home page](https://ij.bazel.build/docs/import-project.html).

Happy Building!

## Conclusion

We hope that you found this overview of Bazel IDE support, and specific instructions on building IntelliJ plugin from sources useful. As always, please leave your feedback in comments, and email me at kig AT reinvent.one.  Thanks!

## Acknowledgements

The author wishes to thank kind folks at [Flare.Build](https://flare.build) for contributing the Docker command line of the build script, and the encouragement.
