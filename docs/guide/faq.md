# FAQ

## Is LocalMind really free?

Yes. It is open source under the [Apache License 2.0](https://github.com/zelucode/localmind/blob/main/LICENSE). The free-tier tools it lists are run by other companies, and their own terms and limits apply.

## Do I need an account?

No. There is no sign-up, login or telemetry.

## Does it run AI models itself?

No. LocalMind opens the AI you choose, and it detects and helps you install local runners such as Ollama and LM Studio, but the models run in those programs.

## Why can't it show answers from several AIs side by side?

Web chatbots require you to be signed in on their own site and provide no way for another app to read their replies. "Ask several" opens each one in your browser, which is the most that can be done honestly.

## Are my API keys safe?

They are encrypted on disk with a key held in your operating system's credential store. See [Privacy and security](/guide/privacy-and-security) for the details and the limits.

## Why is the free-tier information sometimes wrong?

Providers change their plans often, and the data is reviewed by hand. Each rate-limit row shows when it was last checked. Check the provider's own page before relying on a number. If you find a mistake, please [open an issue](https://github.com/zelucode/localmind/issues) or send a fix, since provider data is one of the easiest ways to contribute. See [Provider data and the live feed](/development/provider-data).

## Which systems does it support?

Windows, macOS and Linux installers are built. It has been tested on Windows. The macOS and Linux builds have not been run on real machines yet, so those are the least proven.

## Why does my system warn me about the installer?

The installers are not code-signed yet. See [Install](/guide/install#the-first-launch-warning).

## Does it update itself?

Not yet. Download new versions from the [Releases page](https://github.com/zelucode/localmind/releases) and install over the old one. Your data is kept.

## There is a feature in the code called the Advisor. Where is it?

The Free Tier Advisor is built and tested but hidden, because it supports only one provider so far. It will return once the provider choice is settled.

## How do I move my data to another computer?

Use [backup and restore](/guide/settings-and-backups#backup). Protect the backup with a passphrase if it includes API keys.

## How do I contribute?

Bug reports, fixes, provider-data updates and documentation improvements are all welcome. Start with the [development overview](/development/).

## Can I use the name or logo for my own fork?

The code is Apache 2.0, but the name and logo are trademarks. Read the [trademark policy](https://github.com/zelucode/localmind/blob/main/TRADEMARKS.md) before shipping a fork.
