# A Dmix plugin for Volumio

## What is Dmix?

Dmix (see https://www.alsa-project.org/alsa-doc/alsa-lib/pcm_plugins.html#pcm_plugins_dmix) is a software mixer for ALSA. This means that it can combine audio from multiple sources into a single audio output.


## Why would I use this plugin?

Some sound devices include a hardware mixer, but others don't. If the DAC you use with Volumio doesn't have a hardware mixer then it will only be able to play one thing at a time. This isn't usually an issue, but if you start seeing "hardware busy" errors then the plugin may be for you.

Another problem that some DACs have (e.g. the Adafruit MAX98357A) is that they pop/click every time the audio starts up. A simple way to correct this is to play constant silence in the background (thus ensuring that the audio never stops). Obviously this is only possible if Dmix is used to mix the silence with the real audio!


## Requirements

This plugin relies on the prototype "modular ALSA configuration" feature, and will therefore only work if you have applied that patch to your Volumio instance.


## Installing the plugin

Follow the instructions at https://volumio.github.io/docs/Plugin_System/Plugin_System_Overview.html#page_How_to_install_an_unoffical_plugin


## Configuring the plugin

The default plugin configuration is great for CD quality audio. If you regularly listen to audio with a different sample rate or depth then you may wish to adjust the settings to match the audio you listen to most.


## Limitations of this plugin

Dmix is limited to mixing inputs at a fixed sample rate and depth, meaning that all audio which doesn't match this will need to be resampled. It's therefore best to set Dmix to match the audio type you play most (e.g. CD quality 16 bit 44.1 kHz).

The Dmix plugin adds some latency, typically less than 100 ms, to to your audio. You're unlikely to notice this unless:

* Your audio is synchronised to video that you watch
* Your audio is part of a multi-room environment where you can hear both rooms simultaneously.

In both these cases you may need to adjust player configuration to compensate for the delay. It is also possible to adjust the Dmix plugin configuration to decrease latency at the expense of higher CPU usage, and possible instability.

