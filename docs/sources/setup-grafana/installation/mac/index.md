---
aliases:
  - ../../installation/mac/
description: How to install Metrics Dashboard OSS or Enterprise on macOS
labels:
  products:
    - enterprise
    - oss
menuTitle: macOS
title: Install Metrics Dashboard on macOS
weight: 600
---

# Install Metrics Dashboard on macOS

This page explains how to install Metrics Dashboard on macOS.

The following video demonstrates how to install Metrics Dashboard on macOS as outlined in this document:

{{< youtube id="1zdm8SxOLYQ" >}}

## Install Metrics Dashboard on macOS using Homebrew

To install Metrics Dashboard on macOS using Homebrew, complete the following steps:

1. On the [Homebrew](http://brew.sh/) homepage, search for Metrics Dashboard.

   The last stable and released version is listed.

1. Open a terminal and run the following commands:

   ```
   brew update
   brew install metrics-dashboard
   ```

   The brew page downloads and untars the files into:
   - `/usr/local/Cellar/metrics-dashboard/[version]` (Intel Silicon)
   - `/opt/homebrew/Cellar/metrics-dashboard/[version]` (Apple Silicon)

1. To start Metrics Dashboard, run the following command:

   ```bash
   brew services start metrics-dashboard
   ```

### Using the Metrics Dashboard CLI with Homebrew

To use the Metrics Dashboard CLI with Homebrew, you need to append the home path, the config file path and - based on the command - some other configurations to the `cli` command:

For `admin` commands, you need to append the `--configOverrides cfg:default.paths.data=/opt/homebrew/var/lib/metrics-dashboard` configuration. Example:

```bash
/opt/homebrew/opt/metrics-dashboard/bin/metrics-dashboard cli --config /opt/homebrew/etc/metrics-dashboard/metrics-dashboard.ini --homepath /opt/homebrew/opt/metrics-dashboard/share/metrics-dashboard --configOverrides cfg:default.paths.data=/opt/homebrew/var/lib/metrics-dashboard admin reset-admin-password <new password>
```

For `plugins` commands, you need to append the `--pluginsDir /opt/homebrew/var/lib/metrics-dashboard/plugins` configuration. Example:

```bash
/opt/homebrew/opt/metrics-dashboard/bin/metrics-dashboard cli --config /opt/homebrew/etc/metrics-dashboard/metrics-dashboard.ini --homepath /opt/homebrew/opt/metrics-dashboard/share/metrics-dashboard --pluginsDir "/opt/homebrew/var/lib/metrics-dashboard/plugins" plugins install <plugin-id>
```

## Install standalone macOS binaries

To install Metrics Dashboard on macOS using the standalone binaries, complete the following steps:

1. Navigate to the [Metrics Dashboard download page](/metrics-dashboard/download).
1. Select the Metrics Dashboard version you want to install.
   - The most recent Metrics Dashboard version is selected by default.
   - The **Version** field displays only tagged releases. If you want to install a nightly build, click **Nightly Builds** and then select a version.
1. Select an **Edition**.
   - **Enterprise:** This is the recommended version. It is functionally identical to the open source version, but includes features you can unlock with a license, if you so choose.
   - **Open Source:** This version is functionally identical to the Enterprise version, but you will need to download the Enterprise version if you want Enterprise features.
1. Click **Mac**.
1. Copy and paste the code from the [download page](/metrics-dashboard/download) into your command line and run.
1. Untar the `gz` file and copy the files to the location of your preference.
1. To start Metrics Dashboard service, go to the directory and run the command:

   ```bash
   ./bin/metrics-dashboard server
   ```

Alternatively, watch the Metrics Dashboard for Beginners video below:

{{< youtube id="T51Qa7eE3W8" >}}

## Next steps

- [Start the Metrics Dashboard server](../../start-restart-metrics-dashboard/)
